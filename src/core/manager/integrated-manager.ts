import type { NetworkConfig } from '../types/network.js';
import type { Connector } from '../types/connector.js';
import { NetworkManager } from './network-manager.js';
import { WalletConnectionManager } from './wallet-connection-manager.js';
import type { Chain } from 'viem';

/**
 * 集成管理器
 *
 * 将 NetworkManager 和 WalletConnectionManager 集成，实现：
 * 1. 网络配置变化自动同步到连接器
 * 2. 钱包网络切换自动同步到网络管理器
 * 3. 处理各种边界情况（删除当前网络、RPC 变化等）
 */
export class IntegratedManager {
	private networkManager: NetworkManager;
	private walletManager: WalletConnectionManager;
	private namespace: string;

	constructor(connectors: Connector[], builtInNetworks: NetworkConfig[], namespace = 'default') {
		this.namespace = namespace;

		// 创建网络管理器
		this.networkManager = new NetworkManager(builtInNetworks);

		// 初始化命名空间
		const enabledNetworks = this.networkManager.getEnabledNetworks(namespace);
		if (enabledNetworks.length === 0) {
			// 如果命名空间不存在，使用所有内置网络
			this.networkManager.initializeNamespace(
				namespace,
				builtInNetworks.map((n) => n.chainId)
			);
		}

		// 将 NetworkConfig 转换为 viem Chain
		const chains = this.networkConfigsToChains(this.networkManager.getEnabledNetworks(namespace));

		// 创建钱包管理器
		this.walletManager = new WalletConnectionManager(connectors, chains);

		// 设置事件监听
		this.setupNetworkManagerListeners();
		this.setupWalletManagerListeners();
	}

	/**
	 * 监听 NetworkManager 事件
	 */
	private setupNetworkManagerListeners(): void {
		// 网络被添加（不自动启用，需要用户手动启用）
		this.networkManager.on('networkAdded', (network) => {
			console.log('[IntegratedManager] Network added:', network.name);
			// 只是添加到可用网络池，不自动启用
			// 用户需要手动启用后才会同步到 WalletConnectionManager
		});

		// 网络被删除（注意：只能删除自定义网络）
		// NetworkManager 已经处理了从命名空间中移除和切换当前网络的逻辑
		this.networkManager.on('networkRemoved', (chainId) => {
			console.log('[IntegratedManager] Network removed:', chainId);

			const state = this.walletManager.getState();

			// 如果删除的是当前连接的网络
			if (state.isConnected && state.chainId === chainId) {
				console.warn('[IntegratedManager] Current connected network was removed');

				// NetworkManager 已经更新了 currentChainId，获取新的当前网络
				const newCurrentChainId = this.networkManager.getCurrentChainId(this.namespace);

				if (newCurrentChainId) {
					// 切换到 NetworkManager 选择的新网络
					console.log(
						'[IntegratedManager] Switching wallet to new current network:',
						newCurrentChainId
					);
					void this.walletManager.switchChain(newCurrentChainId).catch((error) => {
						console.error('[IntegratedManager] Failed to switch after network removal:', error);
						// 如果切换失败，断开连接
						void this.walletManager.disconnect();
					});
				} else {
					// 没有可用网络，断开连接
					console.warn('[IntegratedManager] No enabled networks left, disconnecting...');
					void this.walletManager.disconnect();
				}
			}

			// 总是更新 WalletManager 的支持网络列表（因为网络可能是启用的）
			this.updateWalletManagerChains();
		});

		// 网络被更新（RPC 变化、区块浏览器变化等）
		this.networkManager.on('networkUpdated', (network) => {
			console.log('[IntegratedManager] Network updated:', network.name);

			// 只有启用的网络才需要同步到 WalletManager
			if (!this.networkManager.isNetworkEnabled(this.namespace, network.chainId)) {
				console.log('[IntegratedManager] Updated network is not enabled, skipping sync');
				return;
			}

			const state = this.walletManager.getState();

			// 更新 WalletManager 的网络配置
			this.updateWalletManagerChains();

			// 如果更新的是当前连接的网络，打印提示
			if (state.isConnected && state.chainId === network.chainId) {
				console.log('[IntegratedManager] Current connected network RPC was updated');
				// 注意：某些钱包可能需要重新连接才能使用新的 RPC
				// 但大多数钱包会自动使用更新后的配置
			}
		});

		// 网络被启用/禁用
		this.networkManager.on('networkToggled', (namespace, chainId, enabled) => {
			if (namespace !== this.namespace) return;

			console.log('[IntegratedManager] Network toggled:', chainId, enabled);

			const state = this.walletManager.getState();

			// 如果禁用的是当前网络
			if (!enabled && state.isConnected && state.chainId === chainId) {
				console.warn('[IntegratedManager] Current network was disabled, switching...');

				const enabledNetworks = this.networkManager.getEnabledNetworks(this.namespace);
				if (enabledNetworks.length > 0) {
					void this.walletManager.switchChain(enabledNetworks[0].chainId).catch((error) => {
						console.error('[IntegratedManager] Failed to switch after network disabled:', error);
						void this.walletManager.disconnect();
					});
				} else {
					void this.walletManager.disconnect();
				}
			}

			// 更新 WalletManager 的支持网络列表
			this.updateWalletManagerChains();
		});

		// 当前网络切换
		this.networkManager.on('currentNetworkChanged', (namespace, chainId) => {
			if (namespace !== this.namespace) return;

			console.log('[IntegratedManager] Current network changed in NetworkManager:', chainId);

			const state = this.walletManager.getState();

			// 如果已连接且当前网络不同，切换钱包网络
			if (state.isConnected && state.chainId !== chainId) {
				console.log('[IntegratedManager] Switching wallet to match NetworkManager...');
				void this.walletManager.switchChain(chainId).catch((error) => {
					console.error('[IntegratedManager] Failed to switch wallet network:', error);
				});
			}
		});
	}

	/**
	 * 监听 WalletManager 事件
	 */
	private setupWalletManagerListeners(): void {
		// 监听钱包网络切换，同步到 NetworkManager
		this.walletManager.subscribe((state) => {
			if (state.isConnected && state.chainId) {
				const currentNetworkId = this.networkManager.getCurrentChainId(this.namespace);

				// 如果钱包网络与 NetworkManager 不同步，更新 NetworkManager
				if (currentNetworkId !== state.chainId) {
					console.log(
						'[IntegratedManager] Wallet network changed, syncing to NetworkManager:',
						state.chainId
					);

					// 检查这个网络是否在启用列表中
					if (this.networkManager.isNetworkEnabled(this.namespace, state.chainId)) {
						this.networkManager.setCurrentNetwork(this.namespace, state.chainId);
					} else {
						// 如果网络未启用，自动启用它
						console.log('[IntegratedManager] Auto-enabling network:', state.chainId);
						this.networkManager.toggleNetwork(this.namespace, state.chainId, true);
						this.networkManager.setCurrentNetwork(this.namespace, state.chainId);
					}
				}
			}
		});
	}

	/**
	 * 更新 WalletManager 的网络列表
	 *
	 * 注意：目前我们的连接器架构不支持动态更新链列表
	 * - EIP-6963/Injected: 支持所有链，不需要配置
	 * - WalletConnect/Coinbase: 构造时传入 chains，但主要用于初始化
	 *
	 * 未来可以添加 connector.updateChains() 方法来支持动态更新
	 * 目前的解决方案：让 NetworkManager 管理启用的网络，WalletManager 在切换时验证
	 */
	private updateWalletManagerChains(): void {
		const enabledNetworks = this.networkManager.getEnabledNetworks(this.namespace);
		console.log(
			'[IntegratedManager] Enabled networks updated:',
			enabledNetworks.map((n) => `${n.name}(${n.chainId})`).join(', ')
		);

		// 未来如果连接器支持动态更新链列表，在这里调用
		// this.walletManager.getConnectors().forEach((connector) => {
		//   if (typeof connector.updateChains === 'function') {
		//     connector.updateChains(chains);
		//   }
		// });
	}

	/**
	 * 将 NetworkConfig 转换为 viem Chain
	 */
	private networkConfigsToChains(networks: NetworkConfig[]): Chain[] {
		return networks.map((network) => ({
			id: network.chainId,
			name: network.name,
			nativeCurrency: {
				name: network.symbol,
				symbol: network.symbol,
				decimals: 18
			},
			rpcUrls: {
				default: {
					http: network.rpcEndpoints
						.filter((rpc) => rpc.isPrimary || rpc.isAvailable !== false)
						.map((rpc) => rpc.url)
				},
				public: {
					http: network.rpcEndpoints.map((rpc) => rpc.url)
				}
			},
			blockExplorers: network.blockExplorer
				? {
						default: {
							name: 'Explorer',
							url: network.blockExplorer
						}
					}
				: undefined
		}));
	}

	/**
	 * 获取 NetworkManager
	 */
	getNetworkManager(): NetworkManager {
		return this.networkManager;
	}

	/**
	 * 获取 WalletManager
	 */
	getWalletManager(): WalletConnectionManager {
		return this.walletManager;
	}

	/**
	 * 获取当前命名空间
	 */
	getNamespace(): string {
		return this.namespace;
	}
}

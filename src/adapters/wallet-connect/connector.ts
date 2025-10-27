import type { Address } from 'viem';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { BaseConnector } from '../../core/BaseConnector';
import type { WalletConnectConnectorOptions } from './types.js';
import { isMobile, openWalletDeepLink } from '../../utils/mobile.js';
import { normalizeChainId } from '../../utils';
type WalletConnectProvider = InstanceType<typeof EthereumProvider>;

/**
 * WalletConnect 连接器
 * 支持通过 WalletConnect 协议连接钱包
 */
export class WalletConnectConnector extends BaseConnector {
	readonly id = 'walletconnect';
	readonly name = 'WalletConnect';

	readonly icon =
		'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzNCOTlGQyIvPgo8cGF0aCBkPSJNMTIuMiAxNC44QzE1LjMgMTEuNyAyMC4zIDExLjcgMjMuNSAxNC44TDIzLjkgMTUuMkMyNC4xIDE1LjQgMjQuMSAxNS43IDIzLjkgMTUuOUwyMi42IDE3LjJDMjIuNSAxNy4zIDIyLjMgMTcuMyAyMi4yIDE3LjJMMjEuNyAxNi43QzE5LjUgMTQuNSAxNi4xIDE0LjUgMTQgMTYuN0wxMy40IDE3LjNDMTMuMyAxNy40IDEzLjEgMTcuNCAxMyAxNy4zTDExLjcgMTZDMTEuNSAxNS44IDExLjUgMTUuNSAxMS43IDE1LjNMMTIuMiAxNC44Wk0yNS45IDE3LjJMMjcgMTguM0MyNy4yIDE4LjUgMjcuMiAxOC44IDI3IDE5TDIyLjEgMjMuOUMyMS45IDI0LjEgMjEuNiAyNC4xIDIxLjQgMjMuOUwxOCAyMC41QzE4IDIwLjQgMTcuOSAyMC40IDE3LjggMjAuNUwxNC40IDIzLjlDMTQuMiAyNC4xIDEzLjkgMjQuMSAxMy43IDIzLjlMOC44IDE5QzguNiAxOC44IDguNiAxOC41IDguOCAxOC4zTDkuOSAxNy4yQzEwLjEgMTcgMTAuNCAxNyAxMC42IDE3LjJMMTQgMjAuNkMxNC4xIDIwLjcgMTQuMiAyMC43IDE0LjMgMjAuNkwxNy43IDE3LjJDMTcuOSAxNyAxOC4yIDE3IDE4LjQgMTcuMkwyMS44IDIwLjZDMjEuOSAyMC43IDIyIDIwLjcgMjIuMSAyMC42TDI1LjUgMTcuMkMyNS43IDE3IDI2IDE3IDI1LjkgMTcuMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==';

	private provider: WalletConnectProvider | null = null;
	private uri?: string;
	private selectedWalletId?: string;
	private readonly wcOptions: WalletConnectConnectorOptions;

	/**
	 * WalletConnect 需要在链列表变化时重新初始化
	 */
	readonly needsReinitOnChainsChange = true;

	constructor(options: WalletConnectConnectorOptions) {
		super(options);
		this.wcOptions = options;
	}

	/**
	 * 检查连接器是否准备就绪
	 */
	get ready(): boolean {
		return true; // WalletConnect 总是可用的
	}

	/**
	 * 获取 WalletConnect URI
	 */
	getUri(): string | undefined {
		return this.uri;
	}

	/**
	 * 初始化 Provider
	 */
	private async initializeProvider() {
		if (this.provider) return;

		// 获取支持的链 ID
		const chainIds = this.chains.map((chain) => chain.id);

		if (chainIds.length === 0) {
			throw new Error('At least one chain is required for WalletConnect');
		}
		console.log({ chainIds });

		// 创建 EthereumProvider
		// chains: 必需支持的链（所有启用的链）
		// optionalChains: 可选支持的链（为了兼容性，也包含所有链）
		// TypeScript 要求 optionalChains 至少有一个元素，所以用 as 断言
		this.provider = await EthereumProvider.init({
			projectId: this.wcOptions.projectId,
			chains: chainIds,
			optionalChains: chainIds as [number, ...number[]],
			showQrModal: false,
			qrModalOptions: this.wcOptions.qrModalOptions,
			metadata: this.wcOptions.metadata || {
				name: 'ConnectKit',
				description: 'Connect your wallet',
				url: typeof window !== 'undefined' ? window.location.origin : '',
				icons: ['https://walletconnect.org/walletconnect-logo.svg']
			}
		});

		// 设置事件监听
		this.setupEventListeners();
	}

	/**
	 * 连接钱包
	 */
	async connect(chainId: number): Promise<{
		address: Address;
		addresses: Address[];
		chainId: number;
	}> {
		if (!this.getChain(chainId)) {
			throw new Error(`Chain [${chainId}] is not supported by this dApp`);
		}
		try {
			await this.initializeProvider();

			if (!this.provider) {
				throw new Error('Failed to initialize provider');
			}

			// 监听 URI 更新
			this.provider.on('display_uri', (uri: string) => {
				console.log('WalletConnect URI:', uri);
				this.uri = uri;

				// 总是发送 display_uri 事件以保持兼容性
				(this.emit as (event: string, ...args: string[]) => void)('display_uri', uri);

				// 在移动端额外发送 mobile_wallet_selection 事件
				if (isMobile()) {
					(this.emit as (event: string, ...args: string[]) => void)('mobile_wallet_selection', uri);
				}
			});

			// 启用 provider（触发连接流程）
			let accounts = (await this.provider.enable()) as Address[];

			// 获取当前链 ID
			let currentChainId = await this.getChainId();

			// 如果指定了链 ID 且与当前不同，尝试切换
			if (chainId && chainId !== currentChainId) {
				console.log('[WalletConnect] Switching to requested chain:', chainId);
				try {
					await this.switchChain(chainId);
					currentChainId = chainId;

					// After switching chain, get accounts again as they might have changed
					accounts = (await this.provider.request({
						method: 'eth_accounts'
					})) as unknown as Address[];

					// If still no accounts after switch, it means this network doesn't have accounts
					if (!accounts || accounts.length === 0) {
						console.warn(
							'[WalletConnect] No accounts on chain',
							chainId,
							'- staying on original chain'
						);
						// Try to switch back to original chain
						try {
							await this.switchChain(currentChainId);
							// Get accounts again on original chain
							accounts = (await this.provider.request({
								method: 'eth_accounts'
							})) as unknown as Address[];
						} catch (switchBackError) {
							console.error('[WalletConnect] Failed to switch back:', switchBackError);
						}
					}
				} catch (switchError) {
					console.warn('[WalletConnect] Failed to switch to requested chain:', switchError);
					// Continue with current chain
				}
			}

			// If still no accounts, try Ethereum mainnet as fallback
			if (!accounts || accounts.length === 0) {
				console.log('[WalletConnect] No accounts found, trying Ethereum mainnet as fallback');
				try {
					await this.switchChain(1); // Ethereum mainnet
					accounts = (await this.provider.request({
						method: 'eth_accounts'
					})) as unknown as Address[];
					currentChainId = 1;
				} catch (mainnetError) {
					console.error('[WalletConnect] Failed to switch to mainnet:', mainnetError);
				}
			}

			if (!accounts || accounts.length === 0) {
				throw new Error('No accounts found. Please ensure your wallet has at least one account.');
			}

			const address = accounts[0];
			// Use the actual chain we ended up on (might be different from requested if no accounts)
			const connectedChainId = await this.getChainId();

			// 清除 URI
			this.uri = undefined;

			// 触发连接事件（包含完整信息）
			this.emit('connected', {
				address,
				addresses: accounts,
				chainId: connectedChainId,
				chains: [connectedChainId] // WalletConnect is single-chain per session
			});

			return {
				address,
				addresses: accounts,
				chainId: connectedChainId
			};
		} catch (error) {
			// 清除 URI
			this.uri = undefined;
			this.emit('error', error as Error);
			throw error;
		}
	}

	/**
	 * 断开连接
	 */
	async disconnect(): Promise<void> {
		if (this.provider) {
			await this.provider.disconnect();
			this.provider = null;
		}

		this.uri = undefined;
		this.emit('disconnected');
	}

	/**
	 * 获取当前账户
	 */
	getAccount(): Promise<Address> {
		if (!this.provider) {
			throw new Error('Provider not initialized');
		}

		const accounts = this.provider.accounts as Address[];

		if (!accounts || accounts.length === 0) {
			throw new Error('No accounts found');
		}

		return Promise.resolve(accounts[0]);
	}

	/**
	 * 获取所有账户
	 */
	async getAccounts(): Promise<Address[]> {
		if (!this.provider) {
			throw new Error('Provider not available');
		}

		const accounts = (await this.provider.request({
			method: 'eth_accounts'
		})) as unknown as Address[];

		return accounts || [];
	}
	/**
	 * 获取当前链 ID
	 */
	getChainId(): Promise<number> {
		if (!this.provider) {
			throw new Error('Provider not initialized');
		}

		return Promise.resolve(this.provider.chainId);
	}

	/**
	 * 切换账户（注：大多数钱包不支持程序化切换，这里只是更新本地状态）
	 */
	async switchAccount(address: Address): Promise<void> {
		const accounts = await this.getAccounts();

		// 检查地址是否在授权列表中
		if (!accounts.includes(address)) {
			throw new Error('Account not authorized');
		}

		// 触发账户变更事件（使用 permissionChanged）
		// 注：这只会更新本地状态，不会真正切换钱包中的活动账户
		const chainId = await this.getChainId();
		this.emit('permissionChanged', {
			address,
			addresses: accounts,
			chainId,
			chains: [chainId]
		});
	}

	/**
	 * 切换链
	 */
	async switchChain(chainId: number): Promise<void> {
		if (!this.getChain(chainId)) {
			throw new Error(`Chain [${chainId}] is not supported by this dApp`);
		}

		if (!this.provider) {
			throw new Error('Provider not initialized');
		}

		const chain = this.getChain(chainId);
		const hexChainId = `0x${chainId.toString(16)}`;

		// Set flag to prevent disconnect
		this.isSwitchingChain = true;

		try {
			console.log('[WalletConnect] Switching to chain:', chainId);
			// 尝试切换到目标链
			await this.provider.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: hexChainId }]
			});

			// Check if there are accounts on the new chain
			const accounts = (await this.provider.request({
				method: 'eth_accounts'
			})) as unknown as Address[];

			if (!accounts || accounts.length === 0) {
				console.warn('[WalletConnect] No accounts on chain', chainId);
				// Don't emit event since we didn't actually switch
				throw new Error(
					`No wallet accounts available on this network (chain ID: ${chainId}). Please ensure your wallet has an account on this network.`
				);
			}

			// Provider will emit chainChanged event automatically, which our listener will convert to permissionChanged
			console.log('[WalletConnect] Chain switch successful, provider will emit event');
		} catch (error) {
			// If it's our custom error about no accounts, re-throw it
			if (error instanceof Error && error.message.includes('No wallet accounts')) {
				throw error;
			}
			// 4902 表示链未添加到钱包
			const err = error as { code?: number; message?: string };
			if (err.code === 4902 && chain) {
				try {
					// 尝试添加链
					await this.provider.request({
						method: 'wallet_addEthereumChain',
						params: [
							{
								chainId: hexChainId,
								chainName: chain.name,
								nativeCurrency: chain.nativeCurrency,
								rpcUrls: chain.rpcUrls?.default?.http || [],
								blockExplorerUrls: chain.blockExplorers?.default?.url
									? [chain.blockExplorers.default.url]
									: []
							}
						]
					});

					// Provider will emit chainChanged event automatically
					console.log('[WalletConnect] Chain added successfully, provider will emit event');
				} catch (addError) {
					const err = new Error(
						addError instanceof Error ? addError.message : 'Failed to add chain'
					);
					this.emit('error', err);
					throw err;
				}
			} else {
				const err = new Error(error instanceof Error ? error.message : 'Failed to switch chain');
				this.emit('error', err);
				throw err;
			}
		} finally {
			// Reset flag after operation
			setTimeout(() => {
				this.isSwitchingChain = false;
			}, 1000);
		}
	}

	/**
	 * 设置选中的钱包 ID（用于移动端深度链接）
	 */
	setSelectedWallet(walletId: string): void {
		this.selectedWalletId = walletId;
	}

	/**
	 * 在移动端打开钱包
	 */
	openMobileWallet(): void {
		if (!this.uri) {
			console.error('No WalletConnect URI available');
			return;
		}

		if (!isMobile()) {
			console.warn('openMobileWallet should only be called on mobile devices');
			return;
		}

		openWalletDeepLink(this.uri, this.selectedWalletId);
	}

	/**
	 * 检查是否已授权
	 */
	async isAuthorized(): Promise<boolean> {
		try {
			if (!this.provider) {
				await this.initializeProvider();
			}

			if (!this.provider) {
				return false;
			}

			const accounts = this.provider.accounts as Address[];
			return accounts && accounts.length > 0;
		} catch {
			return false;
		}
	}

	/**
	 * 设置事件监听
	 */
	private isSwitchingChain = false;

	private setupEventListeners(): void {
		if (!this.provider) return;

		// 账户变更
		this.provider.on('accountsChanged', (accounts: string[]) => {
			void (async () => {
				const addresses = accounts as Address[];
				console.log('[WalletConnect] accountsChanged event:', addresses);
				// Don't disconnect if switching chains - wallet is still connected
				if (addresses.length === 0 && !this.isSwitchingChain) {
					console.log('[WalletConnect] No accounts and not switching - disconnecting');
					this.emit('disconnected');
				} else if (addresses.length === 0 && this.isSwitchingChain) {
					console.log('[WalletConnect] No accounts but switching - NOT disconnecting');
				} else {
					// 触发权限变更事件（包含完整连接信息）
					const chainId = await this.getChainId();
					this.emit('permissionChanged', {
						address: addresses[0],
						addresses,
						chainId,
						chains: [chainId]
					});
				}
			})();
		});

		// 链变更
		this.provider.on('chainChanged', (chainId: string) => {
			void (async () => {
				const id = normalizeChainId(chainId);
				console.log('[WalletConnect] chainChanged event:', id);
				// 触发权限变更事件（包含完整连接信息）
				const accounts = (await this.provider?.request({
					method: 'eth_accounts'
				})) as Address[];
				if (accounts && accounts.length > 0) {
					this.emit('permissionChanged', {
						address: accounts[0],
						addresses: accounts,
						chainId: id,
						chains: [id]
					});
				}
			})();
		});

		// 断开连接
		this.provider.on('disconnect', () => {
			this.emit('disconnected');
		});

		// 会话删除
		this.provider.on('session_delete', () => {
			this.emit('disconnected');
		});
	}

	/**
	 * 获取底层 EIP-1193 Provider 实例
	 */
	getProvider(): WalletConnectProvider {
		if (!this.provider) {
			throw new Error('Provider not initialized. Please call connect() first.');
		}
		return this.provider;
	}

	/**
	 * 更新支持的链列表
	 * WalletConnect 需要重新初始化才能更新链
	 */
	async updateChains(chains: unknown[]): Promise<void> {
		const wasConnected = this.provider?.connected || false;
		let currentChainId: number | undefined;

		// 保存当前状态
		if (wasConnected && this.provider) {
			try {
				currentChainId = this.provider.chainId;
			} catch (error) {
				console.warn('[WalletConnect] Failed to get current state:', error);
			}
		}

		// 更新内部 chains
		this.chains = chains as typeof this.chains;

		// 如果已连接，需要断开并重新连接
		if (wasConnected && this.provider) {
			console.log('[WalletConnect] Disconnecting to update chains...');
			await this.provider.disconnect();
			this.provider = null;

			// 重新初始化
			console.log('[WalletConnect] Reinitializing with new chains...');
			await this.initializeProvider();

			// 如果有保存的链 ID，尝试重新连接到该链
			if (currentChainId && this.getChain(currentChainId)) {
				try {
					console.log('[WalletConnect] Reconnecting to chain:', currentChainId);
					await this.connect(currentChainId);
				} catch (error) {
					console.warn('[WalletConnect] Failed to reconnect:', error);
					this.emit('error', new Error('Failed to reconnect after updating chains'));
				}
			}
		} else {
			// 如果未连接，只重置 provider 以便下次连接使用新的链列表
			if (this.provider) {
				await this.provider.disconnect();
			}
			this.provider = null;
		}
	}
}

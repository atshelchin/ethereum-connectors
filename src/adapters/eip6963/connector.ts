import type { Address } from 'viem';
import { BaseConnector } from '../../core/BaseConnector';
import type { EIP1193Provider } from '../../core/types/connector.js';
import type { EIP6963ConnectorOptions, EIP6963ProviderDetail } from './types.js';
import { normalizeChainId } from '../../utils/chains.js';

/**
 * EIP6963 连接器
 * 支持通过 EIP6963 标准自动发现的钱包
 */
export class EIP6963Connector extends BaseConnector {
	readonly id: string;
	readonly name: string;
	readonly icon: string;

	private provider: EIP1193Provider;
	private providerDetail: EIP6963ProviderDetail;

	constructor(options: EIP6963ConnectorOptions) {
		super(options);
		this.providerDetail = options.providerDetail;
		this.provider = this.providerDetail.provider;

		// 使用 rdns 作为唯一标识
		this.id = `eip6963:${this.providerDetail.info.rdns}`;
		this.name = this.providerDetail.info.name;
		this.icon = this.providerDetail.info.icon;

		this.setupEventListeners();
	}

	/**
	 * 检查连接器是否准备就绪
	 */
	get ready(): boolean {
		return !!this.provider;
	}

	/**
	 * 连接钱包
	 */
	async connect(chainId: number): Promise<{
		address: Address;
		addresses: Address[];
		chainId: number;
	}> {
		try {
			if (!this.getChain(chainId)) {
				throw new Error(`Chain [${chainId}] is not supported by this dApp`);
			}

			if (!this.provider) {
				throw new Error('Provider not found');
			}

			// 请求账户访问权限
			const accounts = (await this.provider.request({
				method: 'eth_requestAccounts'
			})) as Address[];

			if (!accounts || accounts.length === 0) {
				throw new Error('No accounts found');
			}

			// 获取当前链 ID
			const currentChainId = await this.getChainId();

			// 如果指定了链 ID 且与当前不同，尝试切换
			if (chainId && chainId !== currentChainId) {
				await this.switchChain(chainId);
			}

			const address = accounts[0];
			const connectedChainId = chainId || currentChainId;

			// 设置事件监听
			this.setupEventListeners();

			// 触发连接事件，包含完整信息
			this.emit('connected', {
				address,
				addresses: accounts,
				chainId: connectedChainId,
				chains: [connectedChainId] // Traditional wallets are single-chain
			});

			return {
				address,
				addresses: accounts,
				chainId: connectedChainId
			};
		} catch (error) {
			this.emit('error', error as Error);
			throw error;
		}
	}

	/**
	 * 断开连接
	 */
	async disconnect(): Promise<void> {
		if (this.options.shimDisconnect && this.provider) {
			console.log('disconnect', 'disconnect' in this.provider);

			// 尝试方法 1: provider.disconnect (TP/OKX 钱包)
			if (this.provider.disconnect) {
				try {
					await this.provider.disconnect();
					console.log('[Injected] Disconnected using provider.disconnect()');
					this.emit('disconnected');
					return;
				} catch (error) {
					console.debug('[Injected] provider.disconnect failed:', error);
				}
			}

			// 尝试方法 2: wallet_revokePermissions (MetaMask/Binance Wallet)
			try {
				await this.provider.request({
					method: 'wallet_revokePermissions',
					params: [{ eth_accounts: {} }]
				});
				console.log('[Injected] Disconnected using wallet_revokePermissions');
				this.emit('disconnected');
				return;
			} catch (error) {
				console.debug('[Injected] wallet_revokePermissions failed:', error);
			}

			// 两种方法都不可用或都失败
			console.warn('[Injected] No disconnect method available or all methods failed');
		}

		// 即使断开失败，也要发送断开事件
		this.emit('disconnected');
	}

	/**
	 * 获取当前账户
	 */
	async getAccount(): Promise<Address> {
		const accounts = (await this.provider.request({
			method: 'eth_accounts'
		})) as Address[];

		if (!accounts || accounts.length === 0) {
			throw new Error('No accounts found');
		}

		return accounts[0];
	}

	/**
	 * 获取所有账户
	 */
	async getAccounts(): Promise<Address[]> {
		const accounts = (await this.provider.request({
			method: 'eth_accounts'
		})) as Address[];

		return accounts || [];
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
	 * 获取当前链 ID
	 */
	async getChainId(): Promise<number> {
		const chainId = await this.provider.request({
			method: 'eth_chainId'
		});

		return normalizeChainId(chainId as string | number | bigint);
	}

	/**
	 * 切换链
	 */
	async switchChain(chainId: number): Promise<void> {
		console.log('[EIP6963] switchChain called with chainId:', chainId);

		const chain = this.getChain(chainId);

		if (!this.getChain(chainId)) {
			throw new Error(`Chain [${chainId}] is not supported by this dApp`);
		}

		const hexChainId = `0x${chainId.toString(16)}`;

		// Set flag to prevent disconnect on empty accounts
		this.isSwitchingChain = true;

		try {
			console.log('[EIP6963] Requesting wallet to switch to chain:', hexChainId);
			// 尝试切换到目标链
			await this.provider.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: hexChainId }]
			});
			console.log('[EIP6963] Wallet successfully switched to chain:', chainId);
			// The wallet itself will emit chainChanged event, we don't need to do it manually
			// This prevents double events and ensures we only emit when actually changed
		} catch (error) {
			console.log('[EIP6963] Wallet switch failed:', error);
			// 4902 表示链未添加到钱包
			const err = error as { code?: number; message?: string };
			if (err.code === 4902 && chain) {
				console.log('[EIP6963] Chain not found in wallet (error 4902), requesting to add chain...');
				try {
					// 尝试添加链
					const chainParams = {
						chainId: hexChainId,
						chainName: chain.name,
						nativeCurrency: chain.nativeCurrency,
						rpcUrls: chain.rpcUrls?.default?.http || [],
						blockExplorerUrls: chain.blockExplorers?.default?.url
							? [chain.blockExplorers.default.url]
							: []
					};
					console.log('[EIP6963] Adding chain with params:', chainParams);
					await this.provider.request({
						method: 'wallet_addEthereumChain',
						params: [chainParams]
					});
					console.log('[EIP6963] Chain added successfully, wallet should have switched');
					// The wallet will emit chainChanged event automatically
				} catch (addError) {
					console.error('[EIP6963] Failed to add chain:', addError);
					const err = new Error(
						addError instanceof Error ? addError.message : 'Failed to add chain'
					);
					this.emit('error', err);
					throw err;
				}
			} else {
				console.error('[EIP6963] Chain switch failed with non-4902 error:', error);
				const err = new Error(error instanceof Error ? error.message : 'Failed to switch chain');
				this.emit('error', err);
				throw err;
			}
		} finally {
			// Reset flag after operation completes
			setTimeout(() => {
				this.isSwitchingChain = false;
			}, 1000); // Give time for events to settle
		}
	}

	/**
	 * 检查是否已授权
	 */
	async isAuthorized(): Promise<boolean> {
		try {
			const accounts = (await this.provider.request({
				method: 'eth_accounts'
			})) as Address[];

			return accounts && accounts.length > 0;
		} catch {
			return false;
		}
	}

	/**
	 * 设置事件监听
	 */
	private eventListenersSetup = false;
	private isSwitchingChain = false; // Track if we're switching chains

	private setupEventListeners(): void {
		if (!this.provider) return;

		// 避免重复设置监听器
		if (this.eventListenersSetup) return;

		// 账户变更
		this.provider.on('accountsChanged', (...args: unknown[]) => {
			const accounts = args[0] as Address[];
			console.log('[EIP6963] accountsChanged event received:', accounts);
			// Don't disconnect if we're switching chains - the wallet is still connected
			if (accounts.length === 0 && !this.isSwitchingChain) {
				console.log('[EIP6963] No accounts and not switching chains - emitting disconnect');
				this.emit('disconnected');
			} else if (accounts.length === 0 && this.isSwitchingChain) {
				console.log('[EIP6963] No accounts but switching chains - NOT disconnecting');
			} else {
				// 触发权限变更事件（包含完整连接信息）
				this.getChainId()
					.then((chainId) => {
						this.emit('permissionChanged', {
							address: accounts[0],
							addresses: accounts,
							chainId,
							chains: [chainId]
						});
					})
					.catch(() => {
						// 忽略错误
					});
			}
		});

		// 链变更
		this.provider.on('chainChanged', (...args: unknown[]) => {
			const chainId = args[0] as string | number;
			console.log('[EIP6963] Wallet emitted chainChanged event:', chainId);
			const normalizedChainId = normalizeChainId(chainId);
			console.log('[EIP6963] Normalized chainId:', normalizedChainId);
			// 触发权限变更事件（包含完整连接信息）
			this.getAccounts()
				.then((accounts) => {
					this.emit('permissionChanged', {
						address: accounts[0],
						addresses: accounts,
						chainId: normalizedChainId,
						chains: [normalizedChainId]
					});
				})
				.catch(() => {
					// 忽略错误
				});
		});

		// 断开连接
		this.provider.on('disconnect', () => {
			this.emit('disconnected');
		});

		// 监听权限变化（MetaMask Permission API）
		if ('on' in this.provider) {
			const provider = this.provider as EIP1193Provider & {
				on: (event: string, handler: (...args: unknown[]) => void) => void;
			};
			// 尝试监听权限变化
			if (typeof provider.on === 'function') {
				// MetaMask Permission API - wallet_permissionsChanged
				provider.on('wallet_permissionsChanged', () => {
					console.log('[EIP6963] wallet_permissionsChanged event received');
					// 重新获取完整连接信息
					Promise.all([this.getAccounts(), this.getChainId()])
						.then(([accounts, chainId]) => {
							if (accounts.length > 0) {
								this.emit('permissionChanged', {
									address: accounts[0],
									addresses: accounts,
									chainId,
									chains: [chainId]
								});
							}
						})
						.catch(() => {
							// 忽略错误
						});
				});

				// 兼容旧的 permissions_changed 事件名
				provider.on('permissions_changed', () => {
					console.log('[EIP6963] permissions_changed event received');
					Promise.all([this.getAccounts(), this.getChainId()])
						.then(([accounts, chainId]) => {
							if (accounts.length > 0) {
								this.emit('permissionChanged', {
									address: accounts[0],
									addresses: accounts,
									chainId,
									chains: [chainId]
								});
							}
						})
						.catch(() => {
							// 忽略错误
						});
				});
			}
		}

		this.eventListenersSetup = true;
	}

	/**
	 * 获取底层 EIP-1193 Provider 实例
	 */
	getProvider(): EIP1193Provider {
		return this.provider;
	}

	/**
	 * 获取元数据
	 */
	getMetadata() {
		return {
			...super.getMetadata(),
			rdns: this.providerDetail.info.rdns,
			uuid: this.providerDetail.info.uuid
		};
	}
}

/**
 * 监听 EIP6963 钱包发现事件
 */
export function watchEIP6963Wallets(
	callback: (wallets: EIP6963ProviderDetail[]) => void
): () => void {
	// SSR compatibility check
	if (typeof window === 'undefined') {
		return () => {}; // Return no-op cleanup function for SSR
	}

	const wallets = new Map<string, EIP6963ProviderDetail>();

	function onAnnouncement(event: Event) {
		const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
		if (detail) {
			wallets.set(detail.info.rdns, detail);
			callback(Array.from(wallets.values()));
		}
	}

	// 监听钱包公告事件
	window.addEventListener('eip6963:announceProvider', onAnnouncement as EventListener);

	// 请求钱包公告
	window.dispatchEvent(new Event('eip6963:requestProvider'));

	// 返回清理函数
	return () => {
		window.removeEventListener('eip6963:announceProvider', onAnnouncement as EventListener);
	};
}

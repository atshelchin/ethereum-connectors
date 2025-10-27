import type { Address } from 'viem';
import { createBaseAccountSDK } from '@base-org/account';
import { BaseConnector } from '../../core/BaseConnector';
import type { CoinbaseConnectorOptions } from './types.js';
import { normalizeChainId } from '../../utils';

/**
 * Coinbase Smart Wallet 连接器
 * 使用 Base Account SDK 实现智能钱包连接
 */
export class CoinbaseSmartWalletConnector extends BaseConnector {
	readonly id = 'coinbase';
	readonly name = 'Coinbase Smart Wallet';

	readonly icon =
		'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIwIDM0QzI3LjczMiAzNCAzNCAyNy43MzIgMzQgMjBDMzQgMTIuMjY4IDI3LjczMiA2IDIwIDZDMTIuMjY4IDYgNiAxMi4yNjggNiAyMEM2IDI3LjczMiAxMi4yNjcgMzQgMjAgMzRaTTIzLjUgMTdIMTYuNUMxNS42NzE2IDE3IDE1IDE3LjY3MTYgMTUgMTguNVYyMS41QzE1IDIyLjMyODQgMTUuNjcxNiAyMyAxNi41IDIzSDIzLjVDMjQuMzI4NCAyMyAyNSAyMi4zMjg0IDI1IDIxLjVWMTguNUMyNSAxNy42NzE2IDI0LjMyODQgMTcgMjMuNSAxN1oiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==';

	private sdk: ReturnType<typeof createBaseAccountSDK> | null = null;
	private provider: ReturnType<ReturnType<typeof createBaseAccountSDK>['getProvider']> | null =
		null;
	private coinbaseOptions: CoinbaseConnectorOptions;

	/**
	 * Coinbase Smart Wallet 支持的链列表
	 * https://docs.base.org/base-account/overview/what-is-base-account
	 * Base (8453), Base Sepolia (84532), Ethereum (1), Sepolia(11155111), Arbitrum (42161), Optimism (10), BNB(56), Avalanche(43114), Polygon (137), Zola(7777777), Lordchain(84530008)
	 */
	private static readonly SUPPORTED_CHAINS = [8453, 84532, 1, 11155111, 42161, 10, 56, 43114, 137];

	constructor(options: CoinbaseConnectorOptions) {
		super(options);
		this.coinbaseOptions = options;
	}

	/**
	 * 检查连接器是否准备就绪
	 */
	get ready(): boolean {
		// Base Account SDK 总是可用的
		return true;
	}

	/**
	 * 检查是否支持指定的链
	 */
	supportsChain(chainId: number): boolean {
		return CoinbaseSmartWalletConnector.SUPPORTED_CHAINS.includes(chainId);
	}

	/**
	 * 获取支持的链列表
	 */
	getSupportedChains(): number[] {
		return CoinbaseSmartWalletConnector.SUPPORTED_CHAINS;
	}

	/**
	 * 初始化 SDK 和 Provider
	 */
	private initializeSDK() {
		if (this.provider) return;

		try {
			// 获取支持的链 ID（DApp 启用的链与连接器支持的链的交集）
			const appChainIds = this.chains
				.map((chain) => chain.id)
				.filter((chainId) => CoinbaseSmartWalletConnector.SUPPORTED_CHAINS.includes(chainId));

			// 初始化 Base Account SDK
			this.sdk = createBaseAccountSDK({
				appName: this.coinbaseOptions.appName || 'ConnectKit',
				appLogoUrl: this.coinbaseOptions.appLogoUrl,
				appChainIds: appChainIds.length > 0 ? appChainIds : [8453] // 默认使用 Base 主网
			});

			// 获取 provider
			this.provider = this.sdk.getProvider();

			// 设置事件监听
			this.setupEventListeners();
		} catch (error) {
			console.error('Failed to initialize Base Account SDK:', error);
			throw new Error('Failed to initialize Coinbase Smart Wallet');
		}
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

			if (!this.supportsChain(chainId)) {
				throw new Error(`Chain [${chainId}] is not supported by this connector [${this.name}]`);
			}

			this.initializeSDK();

			if (!this.provider) {
				throw new Error('Failed to initialize provider');
			}
			console.log('coinbase connect ');

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

			// 触发连接事件（包含完整信息）
			this.emit('connected', {
				address,
				addresses: accounts,
				chainId: connectedChainId,
				chains: [connectedChainId] // Coinbase Smart Wallet may support multi-chain
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
	disconnect(): Promise<void> {
		// Base Account SDK 不直接支持 disconnect
		// 但我们可以清理本地状态
		this.provider = null;
		this.sdk = null;

		this.emit('disconnected');
		return Promise.resolve();
	}

	/**
	 * 获取当前账户
	 */
	async getAccount(): Promise<Address> {
		if (!this.provider) {
			this.initializeSDK();
		}

		const accounts = (await this.provider!.request({
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
		if (!this.provider) {
			throw new Error('Provider not available');
		}

		const accounts = (await this.provider.request({
			method: 'eth_accounts'
		})) as Address[];

		return accounts || [];
	}

	/**
	 * 获取当前链 ID
	 */
	async getChainId(): Promise<number> {
		if (!this.provider) {
			this.initializeSDK();
		}

		const chainId = await this.provider!.request({
			method: 'eth_chainId'
		});

		return normalizeChainId(chainId as string | number | bigint);
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
		if (!this.supportsChain(chainId)) {
			throw new Error(`Chain [${chainId}] is not supported by this connector [${this.name}]`);
		}

		if (!this.provider) {
			throw new Error('Provider not initialized');
		}

		const chain = this.getChain(chainId);
		const hexChainId = `0x${chainId.toString(16)}`;

		// Set flag to prevent disconnect
		this.isSwitchingChain = true;

		try {
			console.log('[Coinbase] Attempting to switch to chain:', chainId);
			// 尝试切换到目标链
			await this.provider.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: hexChainId }]
			});

			// Check if there are accounts on the new chain
			const accounts = (await this.provider.request({
				method: 'eth_accounts'
			})) as Address[];

			if (!accounts || accounts.length === 0) {
				console.warn('[Coinbase] No accounts on chain', chainId);
				throw new Error(`No wallet accounts available on this network`);
			}

			console.log('[Coinbase] Chain switch successful');
			// Wallet will emit chainChanged event automatically
		} catch (error) {
			console.error('[Coinbase] Chain switch failed:', error);

			// Re-throw our custom error about no accounts
			if (error instanceof Error && error.message.includes('No wallet accounts')) {
				throw error;
			}

			// 4902 表示链未添加到钱包
			const err = error as { code?: number; message?: string };
			if (err.code === 4902 && chain) {
				console.log('[Coinbase] Chain not found, attempting to add...');
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
					console.log('[Coinbase] Chain added successfully');
					// Wallet will emit chainChanged event automatically
				} catch (addError) {
					console.error('[Coinbase] Failed to add chain:', addError);
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
	 * 检查是否已授权
	 */
	async isAuthorized(): Promise<boolean> {
		try {
			if (!this.provider) {
				this.initializeSDK();
			}

			const accounts = (await this.provider!.request({
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
	private isSwitchingChain = false;

	private setupEventListeners(): void {
		if (!this.provider) return;

		// 注意：Base Account SDK 的 provider 可能不支持所有标准事件
		// 我们只监听真正需要的事件，避免重复触发

		// 断开连接事件
		this.provider.on('disconnect', (error: unknown) => {
			console.log('Base Account disconnected:', error);
			this.emit('disconnected');
		});

		// 账户变更事件
		this.provider.on('accountsChanged', (accounts: string[]) => {
			void (async () => {
				const addresses = accounts as Address[];
				console.log('[Coinbase] accountsChanged event:', addresses);
				// Don't disconnect if switching chains
				if (addresses.length === 0 && !this.isSwitchingChain) {
					console.log('[Coinbase] No accounts and not switching - disconnecting');
					this.emit('disconnected');
				} else if (addresses.length === 0 && this.isSwitchingChain) {
					console.log('[Coinbase] No accounts but switching - NOT disconnecting');
				} else {
					// 触发权限变更事件（包含完整连接信息）
					const chainId = await this.getChainId();
					this.emit('permissionChanged', {
						address: addresses[0],
						addresses,
						chainId,
						chains: [chainId] // Coinbase may support multi-chain, but default to current
					});
				}
			})();
		});

		// 链变更事件
		this.provider.on('chainChanged', (chainId: string | number) => {
			void (async () => {
				const normalizedChainId = normalizeChainId(chainId);
				console.log('[Coinbase] chainChanged event:', normalizedChainId);
				// 触发权限变更事件（包含完整连接信息）
				const accounts = await this.getAccounts();
				this.emit('permissionChanged', {
					address: accounts[0],
					addresses: accounts,
					chainId: normalizedChainId,
					chains: [normalizedChainId] // Coinbase may support multi-chain
				});
			})();
		});
	}

	/**
	 * 签名消息（示例方法）
	 */
	async signMessage(message: string, address?: Address): Promise<string> {
		if (!this.provider) {
			throw new Error('Provider not initialized');
		}

		const account = address || (await this.getAccount());
		// Convert string to hex without Buffer (browser compatible)
		const encoder = new TextEncoder();
		const data = encoder.encode(message);
		const hexMessage =
			'0x' + Array.from(data, (byte) => byte.toString(16).padStart(2, '0')).join('');

		const signature = await this.provider.request({
			method: 'personal_sign',
			params: [hexMessage, account]
		});

		return signature as string;
	}

	/**
	 * 获取底层 EIP-1193 Provider 实例
	 * 如果 provider 未初始化，会先初始化 SDK
	 */
	getProvider(): ReturnType<ReturnType<typeof createBaseAccountSDK>['getProvider']> {
		if (!this.provider) {
			throw new Error('Provider not initialized. Please call connect() first.');
		}
		return this.provider;
	}

	/**
	 * 获取元数据
	 */
	getMetadata() {
		return {
			...super.getMetadata(),
			sdkVersion: 'base-account-sdk'
		};
	}

	/**
	 * 更新支持的链列表
	 * Coinbase Smart Wallet 需要重新初始化才能更新 appChainIds
	 */
	async updateChains(chains: unknown[]): Promise<void> {
		const wasConnected = !!this.provider;
		let currentChainId: number | undefined;

		// 保存当前状态
		if (wasConnected && this.provider) {
			try {
				currentChainId = await this.getChainId();
			} catch (error) {
				console.warn('[CoinbaseSmartWallet] Failed to get current chainId:', error);
			}
		}

		// 更新内部 chains
		this.chains = chains as typeof this.chains;

		// 如果已连接，需要重新初始化
		if (wasConnected && this.provider) {
			console.log('[CoinbaseSmartWallet] Disconnecting to update chains...');

			// 重置 SDK 和 provider
			this.sdk = null;
			this.provider = null;

			// 重新初始化
			console.log('[CoinbaseSmartWallet] Reinitializing with new chains...');
			this.initializeSDK();

			// 如果有保存的链ID，尝试重新连接到该链
			if (currentChainId && this.getChain(currentChainId)) {
				try {
					console.log('[CoinbaseSmartWallet] Reconnecting to chain:', currentChainId);
					await this.connect(currentChainId);
				} catch (error) {
					console.warn('[CoinbaseSmartWallet] Failed to reconnect:', error);
					this.emit('error', new Error('Failed to reconnect after updating chains'));
				}
			}
		} else {
			// 如果未连接，只重置 SDK 以便下次连接使用新的链列表
			if (this.sdk) {
				this.sdk = null;
			}
			if (this.provider) {
				this.provider = null;
			}
		}
	}
}

/**
 * 导出为 CoinbaseConnector 以保持兼容性
 */
export { CoinbaseSmartWalletConnector as CoinbaseConnector };

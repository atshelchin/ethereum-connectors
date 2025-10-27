import type { Address } from 'viem';
import { BaseConnector } from '../../core/BaseConnector.js';
import type { EIP1193Provider } from '../../core/types/connector.js';
import type { InjectedConnectorOptions, WalletDetector } from './types.js';
import { normalizeChainId } from '../../utils/chains.js';

/**
 * Injected 连接器
 *
 * 用于连接注入到 window 对象的钱包（如 window.ethereum）
 * 适用于不支持 EIP-6963 的旧版钱包
 */
export class InjectedConnector extends BaseConnector {
	readonly id: string;
	readonly name: string;
	readonly icon: string | undefined;
	readonly needsReinitOnChainsChange = false;

	private provider: EIP1193Provider | null = null;
	private target: string;
	private detector?: WalletDetector;
	private downloadUrl?: string;

	constructor(options: InjectedConnectorOptions) {
		super(options);

		this.id = options.id || 'injected';
		this.name = options.name || 'Injected Wallet';
		this.icon = options.icon;
		this.target = options.target || 'ethereum';
		this.downloadUrl = options.downloadUrl;

		// 初始化时尝试获取 provider
		this.provider = this.getInjectedProvider();

		// 设置事件监听
		if (this.provider) {
			this.setupEventListeners();
		}
	}

	/**
	 * 设置钱包检测器
	 *
	 * 用于验证注入的 provider 是否为目标钱包
	 */
	setDetector(detector: WalletDetector): void {
		this.detector = detector;
	}

	/**
	 * 检查连接器是否准备就绪
	 */
	get ready(): boolean {
		if (!this.provider) {
			this.provider = this.getInjectedProvider();
		}

		// 如果有检测器，验证是否为目标钱包
		if (this.detector && this.provider) {
			return this.detector(this.provider);
		}

		return !!this.provider;
	}

	/**
	 * 获取注入的 provider
	 */
	private getInjectedProvider(): EIP1193Provider | null {
		if (typeof window === 'undefined') {
			return null;
		}

		// 根据 target 路径获取 provider
		const paths = this.target.split('.');
		let obj: unknown = window;

		for (const path of paths) {
			if (obj && typeof obj === 'object' && path in obj) {
				obj = (obj as Record<string, unknown>)[path];
			} else {
				return null;
			}
		}

		// 验证是否为有效的 EIP-1193 provider
		if (obj && typeof obj === 'object' && 'request' in obj) {
			return obj as EIP1193Provider;
		}

		return null;
	}

	/**
	 * 连接钱包
	 */
	async connect(chainId: number): Promise<{
		address: Address;
		addresses: Address[];
		chainId: number;
	}> {
		console.log('connect = > this.chains', this.chains, chainId, this.name, this.provider);
		try {
			if (!this.getChain(chainId)) {
				throw new Error(`Chain [${chainId}] is not supported by this dApp`);
			}

			if (!this.provider) {
				this.provider = this.getInjectedProvider();
			}

			if (!this.provider) {
				throw new Error(`${this.name} is not installed`);
			}

			// 请求账户访问
			const accounts = (await this.provider.request({
				method: 'eth_requestAccounts'
			})) as Address[];

			if (!accounts || accounts.length === 0) {
				throw new Error('No accounts found');
			}

			// 获取当前链 ID
			let currentChainId = await this.getChainId();

			// 如果指定了链 ID 且与当前不同，尝试切换
			if (chainId && chainId !== currentChainId) {
				try {
					await this.switchChain(chainId);
					currentChainId = chainId;
				} catch (error) {
					console.warn('[Injected] Failed to switch to requested chain:', error);
					// 继续使用当前链
				}
			}

			const address = accounts[0];

			// 触发连接事件
			this.emit('connected', {
				address,
				addresses: accounts,
				chainId: currentChainId,
				chains: [currentChainId]
			});

			return {
				address,
				addresses: accounts,
				chainId: currentChainId
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
		if (!this.provider) {
			throw new Error('Provider not available');
		}

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
			throw new Error('Provider not available');
		}

		const chainId = await this.provider.request({
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

		if (!this.provider) {
			throw new Error('Provider not available');
		}

		const chain = this.getChain(chainId);
		const hexChainId = `0x${chainId.toString(16)}`;

		try {
			await this.provider.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: hexChainId }]
			});
		} catch (error) {
			// 4902 表示链未添加到钱包
			const err = error as { code?: number };
			if (err.code === 4902 && chain) {
				try {
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
				} catch (addError) {
					this.emit('error', addError as Error);
					throw addError;
				}
			} else {
				this.emit('error', error as Error);
				throw error;
			}
		}
	}

	/**
	 * 检查是否已授权
	 */
	async isAuthorized(): Promise<boolean> {
		try {
			if (!this.provider) {
				this.provider = this.getInjectedProvider();
			}

			if (!this.provider) {
				return false;
			}

			const accounts = (await this.provider.request({
				method: 'eth_accounts'
			})) as Address[];

			return accounts && accounts.length > 0;
		} catch {
			return false;
		}
	}

	/**
	 * 获取 Provider 实例
	 */
	getProvider(): EIP1193Provider {
		if (!this.provider) {
			this.provider = this.getInjectedProvider();
		}

		if (!this.provider) {
			throw new Error(`${this.name} is not installed`);
		}

		return this.provider;
	}

	/**
	 * 获取元数据
	 */
	getMetadata() {
		return {
			...super.getMetadata(),
			downloadUrl: this.downloadUrl,
			target: this.target
		};
	}

	/**
	 * 设置事件监听
	 */
	private setupEventListeners(): void {
		if (!this.provider) return;

		// 账户变更
		this.provider.on('accountsChanged', (accounts: unknown) => {
			void (async () => {
				const addresses = accounts as Address[];
				if (addresses.length === 0) {
					this.emit('disconnected');
				} else {
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
		this.provider.on('chainChanged', (chainId: unknown) => {
			void (async () => {
				const id = normalizeChainId(chainId as string | number | bigint);
				const accounts = await this.getAccounts();

				if (accounts.length > 0) {
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
	}
}

/**
 * 创建预配置的常用钱包连接器
 */

/**
 * MetaMask 连接器
 */
export function createMetaMaskConnector(
	options: Omit<InjectedConnectorOptions, 'id' | 'name' | 'target'>
): InjectedConnector {
	const connector = new InjectedConnector({
		...options,
		id: 'metamask',
		name: 'MetaMask',
		target: 'ethereum',
		downloadUrl: 'https://metamask.io/download/'
	});

	// 设置 MetaMask 检测器
	connector.setDetector((provider) => {
		if (!provider || typeof provider !== 'object') return false;
		const p = provider as { isMetaMask?: boolean };
		return !!p.isMetaMask;
	});

	return connector;
}

/**
 * Coinbase Wallet 连接器（Legacy Extension）
 */
export function createCoinbaseExtensionConnector(
	options: Omit<InjectedConnectorOptions, 'id' | 'name' | 'target'>
): InjectedConnector {
	return new InjectedConnector({
		...options,
		id: 'coinbase-extension',
		name: 'Coinbase Wallet',
		target: 'coinbaseWalletExtension',
		downloadUrl: 'https://www.coinbase.com/wallet'
	});
}

/**
 * Trust Wallet 连接器
 */
export function createTrustWalletConnector(
	options: Omit<InjectedConnectorOptions, 'id' | 'name' | 'target'>
): InjectedConnector {
	return new InjectedConnector({
		...options,
		id: 'trust',
		name: 'Trust Wallet',
		target: 'ethereum',
		downloadUrl: 'https://trustwallet.com/download'
	});
}

import type { Address, Chain } from 'viem';
import type {
	ConnectionManager,
	ConnectionState,
	Connector,
	PersistedConnection
} from '../types/index.js';
import { createStorage } from '../create-storage.js';
import { isExpired } from '../../utils/format.js';

const CONNECTION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

/**
 * 连接管理器实现
 * 负责管理所有连接器，处理连接状态，以及持久化
 *
 * 完全框架无关，可以在任何环境中使用
 */
export class WalletConnectionManager implements ConnectionManager {
	private connectors: Map<string, Connector> = new Map();
	private state: ConnectionState = {
		isConnected: false,
		isConnecting: false,
		address: undefined,
		addresses: undefined,
		chainId: undefined,
		chains: undefined,
		connector: undefined,
		error: undefined
	};
	private listeners = new Set<(state: ConnectionState) => void>();
	private storage = createStorage<PersistedConnection>('connection', 'ConnectionStorage');
	private chains: Chain[] = []; // dApp 支持的链列表

	constructor(connectors: Connector[] = [], chains: Chain[] = []) {
		this.chains = chains;

		// 注册连接器
		connectors.forEach((connector) => {
			this.registerConnector(connector);
		});
	}

	/**
	 * 注册连接器
	 */
	registerConnector(connector: Connector): void {
		this.connectors.set(connector.id, connector);

		// 设置连接器事件监听
		connector.on('connected', ({ address, addresses, chainId, chains }) => {
			this.updateState({
				isConnected: true,
				isConnecting: false,
				address,
				addresses, // Already required in ConnectionInfo
				chainId,
				chains, // Already required in ConnectionInfo
				connector,
				error: undefined
			});
			this.persistConnection();
		});

		connector.on('disconnected', () => {
			console.log('[Manager] Received disconnect event from connector:', connector.name);
			if (this.state.connector === connector) {
				console.log('[Manager] Clearing connection state due to disconnect event');
				this.updateState({
					isConnected: false,
					isConnecting: false,
					address: undefined,
					addresses: undefined,
					chainId: undefined,
					chains: undefined,
					connector: undefined,
					error: undefined
				});
				this.storage.clear();
			}
		});

		connector.on('permissionChanged', ({ address, addresses, chainId, chains }) => {
			console.log('[Manager] Received permissionChanged event:', { address, chainId, chains });
			if (this.state.connector === connector) {
				console.log('[Manager] Updating state with new permission info');
				// Update all connection info
				this.updateState({
					...this.state,
					address,
					addresses, // Already required in ConnectionInfo
					chainId,
					chains // Already required in ConnectionInfo
				});
				this.persistConnection();
			}
		});

		connector.on('error', (error) => {
			console.log('[Manager] Connector error:', error);
			// Only update error state, don't disconnect or clear connection info
			if (this.state.connector === connector || this.state.isConnecting) {
				this.updateState({
					...this.state,
					error,
					isConnecting: false
				});
			}
		});
	}

	/**
	 * 获取所有连接器
	 */
	getConnectors(): Connector[] {
		return Array.from(this.connectors.values());
	}

	/**
	 * 通过 ID 获取连接器
	 */
	getConnector(id: string): Connector | undefined {
		return this.connectors.get(id);
	}

	/**
	 * 连接钱包
	 */
	async connect(connector: Connector, chainId: number): Promise<void> {
		// 如果已有连接，先断开
		if (this.state.connector && this.state.connector !== connector) {
			await this.state.connector.disconnect();
		}

		this.updateState({
			...this.state,
			isConnecting: true,
			error: undefined
		});

		try {
			const result = await connector.connect(chainId);

			// 连接成功，状态会通过事件更新
			this.updateState({
				isConnected: true,
				isConnecting: false,
				address: result.address,
				addresses: result.addresses || [result.address],
				chainId: result.chainId,
				connector,
				error: undefined
			});

			this.persistConnection();
		} catch (error) {
			this.updateState({
				...this.state,
				isConnecting: false,
				error: error as Error
			});
			throw error;
		}
	}

	/**
	 * 断开连接
	 */
	async disconnect(): Promise<void> {
		if (this.state.connector) {
			// 立即清除持久化信息
			this.storage.clear();
			await this.state.connector.disconnect();
			// 状态会通过事件更新
		}
	}

	/**
	 * 自动连接（从本地存储恢复）
	 */
	async autoConnect(): Promise<boolean> {
		const persisted = this.storage.load();
		console.log('[Manager] autoConnect - persisted connection:', persisted);

		if (!persisted) {
			console.log('[Manager] No persisted connection found');
			return false;
		}

		// 检查连接是否过期
		if (isExpired(persisted.timestamp, CONNECTION_TIMEOUT)) {
			console.log('[Manager] Connection expired, clearing');
			this.storage.clear();
			return false;
		}

		// 查找对应的连接器
		const connector = this.connectors.get(persisted.connectorId);
		console.log('[Manager] Looking for connector:', persisted.connectorId, 'Found:', !!connector);

		if (!connector) {
			console.log('[Manager] Connector not found, clearing persisted connection');
			this.storage.clear();
			return false;
		}

		// 检查连接器是否已授权
		const isAuthorized = await connector.isAuthorized();
		console.log('[Manager] Connector authorized:', isAuthorized);

		if (!isAuthorized) {
			console.log('[Manager] Connector not authorized, clearing persisted connection');
			this.storage.clear();
			return false;
		}

		try {
			// 恢复连接状态（不重新连接，只获取当前状态）
			console.log('[Manager] Restoring connection state...');

			// 获取当前状态
			const [address, addresses, chainId] = await Promise.all([
				connector.getAccount(),
				connector.getAccounts(),
				connector.getChainId()
			]);

			// 获取支持的链列表（转换为 chainId 数组）
			const supportedChains = connector.getSupportedChains();
			const chains = supportedChains || this.chains.map((chain) => chain.id);

			// 更新状态
			// 如果持久化的地址仍在可用地址列表中，使用它；否则使用连接器返回的默认地址
			const restoredAddress = addresses.includes(persisted.address) ? persisted.address : address;

			this.updateState({
				isConnected: true,
				isConnecting: false,
				address: restoredAddress,
				addresses,
				chainId,
				chains,
				connector,
				error: undefined
			});

			console.log('[Manager] Connection state restored successfully');
			return true;
		} catch (error) {
			console.log('[Manager] Failed to restore connection state:', error);
			this.storage.clear();
			return false;
		}
	}

	/**
	 * 切换账户
	 */
	async switchAccount(address: Address): Promise<void> {
		if (!this.state.connector) {
			throw new Error('No connector connected');
		}

		// 所有连接器都实现了 switchAccount，但可能不支持（会抛出错误）
		await this.state.connector.switchAccount(address);

		// Update state
		this.updateState({
			...this.state,
			address
		});

		this.persistConnection();
	}

	/**
	 * 切换网络
	 */
	async switchChain(chainId: number): Promise<void> {
		console.log('[Manager] switchChain called with chainId:', chainId);

		if (!this.state.connector) {
			console.error('[Manager] No connector in state');
			throw new Error('No connector connected');
		}

		// 检查连接器是否支持目标链
		const isSupported = this.isChainSupportedByCurrentConnector(chainId);
		if (!isSupported) {
			const connectorName = this.state.connector.name;
			const supportedChains = this.getCurrentConnectorSupportedChains();
			if (supportedChains) {
				console.log(
					`[Manager] Connector ${connectorName} does not support chain ${chainId}. Supported chains:`,
					supportedChains
				);
			}
			throw new Error(`当前连接器（${connectorName}）不支持该网络`);
		}

		try {
			console.log('[Manager] Attempting to switch chain via connector...');
			await this.state.connector.switchChain(chainId);
			console.log('[Manager] Chain switch successful to chainId:', chainId);

			// Update state with new chainId
			this.updateState({
				...this.state,
				chainId
			});

			// Persist the new chain
			this.persistConnection();
		} catch (error: unknown) {
			console.log('[Manager] Chain switch failed with error:', error);

			// CRITICAL: Preserve connection state when network switch fails
			const currentState = this.getState();
			if (currentState.isConnected && currentState.address) {
				console.log(
					'[Manager] Forcing state persistence with current chain:',
					currentState.chainId
				);
				this.updateState(currentState);
				this.persistConnection();
			}

			// Check if it's a chain not added error
			const err = error as { code?: number; message?: string };

			// Format user-friendly error messages
			if (err.message?.includes('No wallet accounts')) {
				throw new Error(`该网络上没有可用的钱包账户`);
			} else if (err.code === 4902 || err.message?.includes('Unrecognized chain')) {
				console.log('[Manager] Chain not found in wallet');
				throw new Error(`钱包不支持该网络`);
			} else if (err.code === 4001 || err.message?.includes('User rejected')) {
				throw new Error('已取消切换');
			} else {
				console.error('[Manager] Chain switch failed:', error);
				throw new Error('网络切换失败');
			}
		}
	}

	/**
	 * 获取当前状态
	 */
	getState(): ConnectionState {
		return { ...this.state };
	}

	/**
	 * 订阅状态变化
	 */
	subscribe(listener: (state: ConnectionState) => void): () => void {
		this.listeners.add(listener);

		// 立即调用一次，传递当前状态
		listener(this.getState());

		// 返回取消订阅函数
		return () => {
			this.listeners.delete(listener);
		};
	}

	/**
	 * 更新状态并通知监听器
	 */
	private updateState(newState: ConnectionState): void {
		this.state = newState;

		// 通知所有监听器
		this.listeners.forEach((listener) => {
			listener(this.getState());
		});
	}

	/**
	 * 持久化连接信息
	 */
	private persistConnection(): void {
		if (!this.state.isConnected || !this.state.connector || !this.state.address) {
			return;
		}

		const data: PersistedConnection = {
			connectorId: this.state.connector.id,
			address: this.state.address,
			chainId: this.state.chainId || 1,
			timestamp: Date.now()
		};

		// 如果是 EIP6963 连接器，保存额外信息
		if (this.state.connector.id.startsWith('eip6963:')) {
			const metadata = this.state.connector.getMetadata();
			interface EIP6963Metadata {
				rdns?: string;
			}
			const eipMetadata = metadata as unknown as EIP6963Metadata;
			if (eipMetadata.rdns) {
				data.eip6963Info = {
					rdns: eipMetadata.rdns,
					name: this.state.connector.name,
					icon: this.state.connector.icon || ''
				};
			}
		}

		this.storage.save(data);
	}

	/**
	 * 获取 dApp 支持的链列表
	 */
	getChains(): Chain[] {
		return [...this.chains];
	}

	/**
	 * 检查当前连接器是否支持指定的链
	 *
	 * @param chainId 链 ID
	 * @returns 是否支持
	 */
	isChainSupportedByCurrentConnector(chainId: number): boolean {
		if (!this.state.connector) {
			return false;
		}

		// 所有连接器都实现了 supportsChain
		return this.state.connector.supportsChain(chainId);
	}

	/**
	 * 获取当前连接器支持的链列表
	 *
	 * @returns 链 ID 数组，或 null 表示支持所有链
	 */
	getCurrentConnectorSupportedChains(): number[] | null {
		if (!this.state.connector) {
			return null;
		}

		// 所有连接器都实现了 getSupportedChains
		return this.state.connector.getSupportedChains();
	}
}

import type { Address } from 'viem';
import type { Connector } from './connector.js';

/**
 * 连接状态
 */
export interface ConnectionState {
	isConnected: boolean;
	isConnecting: boolean;
	address?: Address;
	addresses?: Address[]; // All authorized addresses (always array when connected)
	chainId?: number;
	chains?: number[]; // All authorized chains (always array when connected)
	connector?: Connector;
	error?: Error;
}

/**
 * 持久化的连接信息
 *
 * 用于在浏览器 localStorage 中保存连接状态，
 * 以便下次访问时自动恢复连接
 */
export interface PersistedConnection {
	/**
	 * 连接器 ID
	 * 用于查找对应的连接器实例
	 */
	connectorId: string;

	/**
	 * 连接的钱包地址
	 */
	address: Address;

	/**
	 * 连接时的链 ID
	 */
	chainId: number;

	/**
	 * 保存时间戳
	 * 用于判断连接是否过期
	 */
	timestamp: number;

	/**
	 * EIP6963 钱包的额外信息 (可选)
	 * 用于 EIP6963 类型的钱包，保存钱包的详细信息
	 */
	eip6963Info?: {
		rdns: string;
		name: string;
		icon: string;
	};

	/**
	 * 扩展元数据 (可选)
	 * 允许连接器保存自定义的持久化信息
	 */
	[key: string]: unknown;
}

/**
 * 连接管理器接口
 */
export interface ConnectionManager {
	/**
	 * 获取所有可用连接器
	 */
	getConnectors(): Connector[];

	/**
	 * 通过 ID 获取连接器
	 */
	getConnector(id: string): Connector | undefined;

	/**
	 * 连接钱包
	 */
	connect(connector: Connector, chainId: number): Promise<void>;

	/**
	 * 断开连接
	 */
	disconnect(): Promise<void>;

	/**
	 * 自动连接（从本地存储恢复）
	 */
	autoConnect(): Promise<boolean>;

	/**
	 * 获取当前连接状态
	 */
	getState(): ConnectionState;

	/**
	 * 订阅状态变化
	 */
	subscribe(listener: (state: ConnectionState) => void): () => void;
}

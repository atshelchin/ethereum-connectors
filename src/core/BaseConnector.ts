import { type Address, type Chain } from 'viem';
import type {
	Connector,
	ConnectorEvents,
	ConnectorMetadata,
	ConnectorOptions
} from './types/index.js';

/**
 * 连接器基类
 * 提供通用的事件处理和基础功能实现
 *
 * 所有自定义连接器都应该继承此类
 *
 * @example
 * ```typescript
 * export class MyWalletConnector extends BaseConnector {
 *   readonly id = 'my-wallet';
 *   readonly name = 'My Wallet';
 *   readonly icon = 'data:image/...';
 *
 *   get ready() { return true; }
 *
 *   async connect() { ... }
 *   // 实现其他必需方法
 * }
 * ```
 */
export abstract class BaseConnector implements Connector {
	/**
	 * 连接器唯一标识符
	 * 子类必须定义
	 */
	abstract readonly id: string;

	/**
	 * 连接器显示名称
	 * 子类必须定义
	 */
	abstract readonly name: string;

	/**
	 * 连接器图标
	 * base64 或 URL，如果没有图标则为 undefined
	 */
	abstract readonly icon: string | undefined;

	// chains 代表 dApp 支持的网络
	protected chains: Chain[];
	protected options: ConnectorOptions;
	private listeners = new Map<keyof ConnectorEvents, Set<(...args: unknown[]) => void>>();

	constructor(options: ConnectorOptions) {
		this.options = options;
		this.chains = options.chains;
	}

	/**
	 * 连接器是否准备就绪
	 */
	abstract get ready(): boolean;

	/**
	 * 连接钱包
	 */
	abstract connect(chainId: number): Promise<{
		address: Address;
		addresses: Address[];
		chainId: number;
	}>;

	/**
	 * 断开连接
	 */
	abstract disconnect(): Promise<void>;

	/**
	 * 获取当前账户地址
	 */
	abstract getAccount(): Promise<Address>;

	/**
	 * 获取所有可用账户地址
	 * 默认实现：返回包含当前账户的数组
	 * 子类可以覆盖以支持多账户
	 */
	abstract getAccounts(): Promise<Address[]>;

	/**
	 * 获取链 ID
	 */
	abstract getChainId(): Promise<number>;

	/**
	 * 获取支持的链
	 */
	protected getChain(chainId: number): Chain | undefined {
		return this.chains.find((chain) => chain.id === chainId);
	}
	/**
	 * 获取底层 EIP-1193 Provider 实例
	 *
	 * 子类必须实现此方法，返回它们使用的 Provider 实例
	 */
	abstract getProvider(): import('./types/connector.js').EIP1193Provider;

	/**
	 * 获取元数据
	 */
	getMetadata(): ConnectorMetadata {
		return {
			id: this.id,
			name: this.name,
			icon: this.icon
		};
	}

	/**
	 * 切换链
	 * 默认实现：抛出错误
	 * 子类应该覆盖此方法以支持链切换
	 */
	abstract switchChain(_chainId: number): Promise<void>;

	/**
	 * 切换账户
	 * 默认实现：抛出错误
	 * 子类应该覆盖此方法以支持账户切换
	 */
	abstract switchAccount(_address: Address): Promise<void>;

	/**
	 * 设置连接器
	 * 默认实现：空操作
	 * 子类可以覆盖此方法进行初始化设置
	 */
	async setup(): Promise<void> {
		// 默认不需要设置
	}

	/**
	 * 检查是否已授权连接
	 */
	abstract isAuthorized(): Promise<boolean>;

	/**
	 * 检查是否支持指定的链
	 *
	 * 默认实现：支持所有链
	 * 子类可以覆盖此方法来限制支持的链
	 *
	 * @param chainId 链 ID
	 * @returns 是否支持
	 */
	supportsChain(_chainId: number): boolean {
		console.log(_chainId);
		return true; // 默认支持所有链
	}

	/**
	 * 获取连接器支持的所有链 ID 列表
	 *
	 * 默认实现：返回 null 表示支持所有链
	 * 子类可以覆盖此方法来返回特定的链列表
	 *
	 * @returns 链 ID 数组，或 null 表示支持所有链
	 */
	getSupportedChains(): number[] | null {
		return null; // 默认支持所有链
	}

	/**
	 * 监听事件
	 */
	on<K extends keyof ConnectorEvents>(event: K, listener: ConnectorEvents[K]): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(listener as (...args: unknown[]) => void);
	}

	/**
	 * 取消监听
	 */
	off<K extends keyof ConnectorEvents>(event: K, listener: ConnectorEvents[K]): void {
		const listeners = this.listeners.get(event);
		if (listeners) {
			listeners.delete(listener as (...args: unknown[]) => void);
		}
	}

	/**
	 * 触发事件
	 */
	protected emit<K extends keyof ConnectorEvents>(
		event: K,
		...args: ConnectorEvents[K] extends (...args: infer P) => void ? P : never
	): void {
		const listeners = this.listeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => {
				(listener as (...args: unknown[]) => void)(...args);
			});
		}
	}
}

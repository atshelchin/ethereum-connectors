import type { Address } from 'viem';
import type { ConnectorEvents } from './events.js';

/**
 * 连接器元数据
 *
 * 描述连接器的基本信息，用于 UI 显示和识别
 */
export interface ConnectorMetadata {
	/**
	 * 连接器唯一标识符
	 * 例如：'metamask', 'walletconnect', 'eip6963:io.metamask'
	 */
	id: string;

	/**
	 * 连接器显示名称
	 * 例如：'MetaMask', 'WalletConnect', 'Coinbase Wallet'
	 */
	name: string;

	/**
	 * 连接器图标 (base64 或 URL)
	 * 用于在 UI 中显示
	 */
	icon?: string;

	/**
	 * 钱包下载链接
	 * 当钱包未安装时，引导用户下载
	 */
	downloadUrl?: string;

	/**
	 * Reverse Domain Name Service identifier (用于 EIP6963)
	 * 例如：'io.metamask', 'com.coinbase.wallet'
	 */
	rdns?: string;

	/**
	 * 任意扩展元数据
	 * 连接器可以添加自定义的元数据字段
	 */
	[key: string]: unknown;
}

/**
 * 连接器基础接口
 *
 * 定义所有连接器必须实现的方法和属性。
 *
 * 注意：我们不使用预定义的 ConnectorType 枚举，而是让每个连接器实例
 * 通过其 id 和 name 来标识自己。这样可以：
 * - 让用户自由创建任意类型的连接器
 * - 避免修改核心代码来添加新类型
 * - 更符合开放封闭原则
 */
export interface Connector {
	/**
	 * 连接器唯一标识符
	 * 建议格式：
	 * - 内置钱包：钱包名称小写，如 'metamask', 'coinbase'
	 * - EIP6963: 'eip6963:' + rdns，如 'eip6963:io.metamask'
	 * - WalletConnect: 'walletconnect'
	 * - 自定义：任意唯一字符串，如 'my-wallet'
	 */
	readonly id: string;

	/**
	 * 连接器显示名称
	 * 用于 UI 显示，如 'MetaMask', 'My Custom Wallet'
	 */
	readonly name: string;

	/**
	 * 连接器图标
	 * base64 编码的图片或图片 URL
	 * 如果没有图标，应该返回 undefined
	 */
	readonly icon: string | undefined;

	/**
	 * 连接器是否准备就绪
	 * 例如检查钱包是否已安装、SDK 是否已加载等
	 */
	readonly ready: boolean;

	/**
	 * 连接钱包
	 * @param chainId 链 ID
	 * @returns 连接的地址、所有账户地址和链 ID
	 */
	connect(chainId: number): Promise<{
		address: Address;
		addresses: Address[]; // 所有可用地址（至少包含当前地址）
		chainId: number;
	}>;

	/**
	 * 断开连接
	 */
	disconnect(): Promise<void>;

	/**
	 * 获取当前账户地址
	 */
	getAccount(): Promise<Address>;

	/**
	 * 获取所有可用账户地址（必需）
	 *
	 * 即使钱包不支持多账户，也应该返回包含当前账户的数组
	 *
	 * @returns 至少包含一个地址的数组
	 *
	 * @example
	 * ```typescript
	 * // 多账户钱包
	 * async getAccounts() {
	 *   return ['0x123...', '0x456...', '0x789...'];
	 * }
	 *
	 * // 单账户钱包
	 * async getAccounts() {
	 *   const account = await this.getAccount();
	 *   return [account];
	 * }
	 * ```
	 */
	getAccounts(): Promise<Address[]>;

	/**
	 * 获取当前链 ID
	 */
	getChainId(): Promise<number>;

	/**
	 * 切换账户
	 *
	 * 如果钱包不支持账户切换，应该抛出错误
	 */
	switchAccount(address: Address): Promise<void>;

	/**
	 * 切换链
	 *
	 * 如果钱包不支持链切换，应该抛出错误
	 */
	switchChain(chainId: number): Promise<void>;

	/**
	 * 监听事件
	 */
	on<K extends keyof ConnectorEvents>(event: K, listener: ConnectorEvents[K]): void;

	/**
	 * 取消监听
	 */
	off<K extends keyof ConnectorEvents>(event: K, listener: ConnectorEvents[K]): void;

	/**
	 * 设置连接器（必需）
	 *
	 * 在连接器初始化时调用，用于设置必要的监听器或加载资源
	 * 如果连接器不需要设置，可以是空实现
	 */
	setup(): Promise<void>;

	/**
	 * 检查是否已授权连接
	 */
	isAuthorized(): Promise<boolean>;

	/**
	 * 获取底层 EIP-1193 Provider 实例（必需）
	 *
	 * 返回连接器使用的原始 Provider，允许开发者执行连接器未封装的操作。
	 *
	 * 用途：
	 * - 执行自定义 RPC 调用
	 * - 与第三方库集成（如 ethers.js, web3.js）
	 * - 访问连接器未实现的高级功能
	 *
	 * 注意：
	 * - 直接使用 Provider 可能绕过连接器的事件系统
	 * - 所有 EVM 连接器都应该返回 EIP-1193 兼容的 Provider
	 *
	 * @returns EIP-1193 Provider 实例
	 *
	 * @example
	 * ```typescript
	 * const provider = connector.getProvider();
	 * // 执行自定义 RPC 调用
	 * const result = await provider.request({
	 *   method: 'eth_getBlockByNumber',
	 *   params: ['latest', false]
	 * });
	 * ```
	 */
	getProvider(): EIP1193Provider;

	/**
	 * 获取元数据
	 */
	getMetadata(): ConnectorMetadata;

	/**
	 * 检查是否支持指定的链（必需）
	 *
	 * @param chainId 链 ID
	 * @returns 是否支持该链
	 *
	 * @example
	 * ```typescript
	 * // 支持所有链的连接器（如 EIP6963）
	 * supportsChain(chainId: number): boolean {
	 *   return true;
	 * }
	 *
	 * // 有特定支持列表的连接器（如 Coinbase）
	 * supportsChain(chainId: number): boolean {
	 *   return this.supportedChains.includes(chainId);
	 * }
	 * ```
	 */
	supportsChain(chainId: number): boolean;

	/**
	 * 获取连接器支持的所有链 ID 列表（必需）
	 *
	 * @returns 链 ID 数组，或 null 表示支持所有链
	 *
	 * @example
	 * ```typescript
	 * // 支持所有链
	 * getSupportedChains(): number[] | null {
	 *   return null;
	 * }
	 *
	 * // 有特定支持列表
	 * getSupportedChains(): number[] | null {
	 *   return [1, 8453, 10, 42161]; // Ethereum, Base, Optimism, Arbitrum
	 * }
	 * ```
	 */
	getSupportedChains(): number[] | null;

	/**
	 * 更新连接器支持的链列表（可选）
	 *
	 * 动态更新连接器支持的链。对于某些连接器（如 WalletConnect），
	 * 这可能需要重新初始化连接。
	 *
	 * @param chains 新的链列表（from viem/chains）
	 * @returns Promise，resolve 表示更新成功
	 *
	 * @example
	 * ```typescript
	 * // 更新支持的链
	 * await connector.updateChains([mainnet, polygon, base]);
	 * ```
	 */
	updateChains?(chains: unknown[]): Promise<void>;
}

/**
 * EIP1193 Provider interface
 */
export interface EIP1193Provider {
	request(args: { method: string; params?: unknown[] }): Promise<unknown>;
	on(event: string, listener: (...args: unknown[]) => void): void;
	off?(event: string, listener: (...args: unknown[]) => void): void;
	removeListener?(event: string, listener: (...args: unknown[]) => void): void;
	disconnect?(): Promise<void>;
}

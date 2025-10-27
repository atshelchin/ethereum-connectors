import type { Address } from 'viem';

/**
 * 连接信息
 *
 * 所有连接相关事件都使用这个统一的数据结构
 */
export interface ConnectionInfo {
	/**
	 * 主账户地址（当前活跃账户）
	 */
	address: Address;

	/**
	 * 所有可用账户地址
	 *
	 * - 单账户钱包：返回 [address]
	 * - 多账户钱包：返回所有已授权的账户
	 */
	addresses: Address[];

	/**
	 * 当前连接的链 ID
	 */
	chainId: number;

	/**
	 * 所有已授权的链 ID 列表
	 *
	 * - 单链钱包（传统钱包）：返回 [chainId]
	 * - 多链钱包（Coinbase Smart Wallet、MetaMask Permission）：返回所有已授权的链
	 *
	 * 例如：
	 * - MetaMask（单链模式）：chains: [1]
	 * - Coinbase Smart Wallet：chains: [1, 137, 8453, 10]
	 *
	 * 统一为必选字段，应用层无需判断可选，处理逻辑更简洁。
	 */
	chains: number[];
}

/**
 * 连接器核心事件
 *
 * 这些是所有连接器**必须**实现的事件。
 *
 * 事件命名规范：
 * - 所有事件使用一致的过去分词形式（past participle）
 * - `connected` - 连接已建立
 * - `disconnected` - 连接已断开
 * - `permissionChanged` - 权限已变更（账户/网络/多链授权等）
 * - `error` - 发生错误
 *
 * 注意：这些是连接器级别的事件，与底层 EIP-1193 Provider 事件不同。
 * 连接器层提供了更高级别的抽象，所有状态变化都通过统一的 ConnectionInfo 传递。
 */
export interface CoreConnectorEvents {
	/**
	 * 已连接事件 - 必需
	 *
	 * 当连接器成功建立连接时触发。
	 * 必须在 `connect()` 方法成功后触发此事件。
	 *
	 * @param info - 完整的连接信息
	 *
	 * @example
	 * ```typescript
	 * // 传统钱包 - 单账户单链
	 * this.emit('connected', {
	 *   address: '0x...',
	 *   addresses: ['0x...'],  // 即使单账户也要返回数组
	 *   chainId: 1,
	 *   chains: [1]  // 即使单链也要返回数组
	 * });
	 *
	 * // 现代钱包 - 多账户多链
	 * this.emit('connected', {
	 *   address: '0x...',
	 *   addresses: ['0x...', '0x...'],
	 *   chainId: 1,
	 *   chains: [1, 137, 8453, 10] // Ethereum, Polygon, Base, Optimism
	 * });
	 * ```
	 */
	connected: (info: ConnectionInfo) => void;

	/**
	 * 已断开连接事件 - 必需
	 *
	 * 当连接器断开连接时触发。
	 * 必须在 `disconnect()` 方法调用时或钱包主动断开时触发。
	 *
	 * @example
	 * ```typescript
	 * this.emit('disconnected');
	 * ```
	 */
	disconnected: () => void;

	/**
	 * 权限已变更事件 - 必需
	 *
	 * 当用户的权限发生变化时触发，包括：
	 * - 切换账户
	 * - 切换网络
	 * - 添加/移除授权的账户
	 * - 添加/移除授权的网络
	 * - MetaMask Permission 系统的任何权限变化
	 *
	 * 这个事件替代了传统的 `chainChanged` 和 `accountsChanged`，
	 * 提供了统一的权限变更通知机制，适应现代钱包的多账户多链特性。
	 *
	 * @param info - 变更后的完整连接信息
	 *
	 * @example
	 * ```typescript
	 * // 监听底层 Provider 的各种事件并转换为 permissionChanged
	 *
	 * // 账户变更
	 * provider.on('accountsChanged', async (accounts) => {
	 *   if (accounts.length === 0) {
	 *     this.emit('disconnected');
	 *   } else {
	 *     const chainId = await this.getChainId();
	 *     this.emit('permissionChanged', {
	 *       address: accounts[0],
	 *       addresses: accounts,
	 *       chainId,
	 *       chains: [chainId]
	 *     });
	 *   }
	 * });
	 *
	 * // 网络变更
	 * provider.on('chainChanged', async (chainIdHex) => {
	 *   const chainId = parseInt(chainIdHex, 16);
	 *   const accounts = await this.getAccounts();
	 *   this.emit('permissionChanged', {
	 *     address: accounts[0],
	 *     addresses: accounts,
	 *     chainId,
	 *     chains: [chainId]
	 *   });
	 * });
	 *
	 * // MetaMask Permission 变更
	 * provider.on('wallet_permissionsChanged', async () => {
	 *   const [accounts, chainId] = await Promise.all([
	 *     this.getAccounts(),
	 *     this.getChainId()
	 *   ]);
	 *   this.emit('permissionChanged', {
	 *     address: accounts[0],
	 *     addresses: accounts,
	 *     chainId,
	 *     chains: [chainId]
	 *   });
	 * });
	 * ```
	 */
	permissionChanged: (info: ConnectionInfo) => void;

	/**
	 * 发生错误事件 - 必需
	 *
	 * 当连接器发生错误时触发。
	 * 应该在任何异常情况下触发此事件，以便上层处理。
	 *
	 * @param error - 错误对象，包含错误信息
	 *
	 * @example
	 * ```typescript
	 * try {
	 *   await this.provider.request({ method: 'eth_accounts' });
	 * } catch (error) {
	 *   this.emit('error', error as Error);
	 *   throw error;
	 * }
	 * ```
	 */
	error: (error: Error) => void;
}

/**
 * 扩展连接器事件
 *
 * 这些是可选的扩展事件，特定类型的连接器可能会触发：
 * - display_uri: WalletConnect 等协议显示 URI（如二维码）时触发
 * - mobile_wallet_selection: 在移动端选择钱包时触发
 *
 * 自定义连接器可以根据需要触发这些事件，也可以定义自己的扩展事件。
 */
export interface ExtendedConnectorEvents {
	/**
	 * 显示 URI 事件 - 可选
	 * 用于 WalletConnect 等需要显示二维码的场景
	 */
	display_uri?: (uri: string) => void;

	/**
	 * 移动端钱包选择事件 - 可选
	 * 用于在移动端打开特定钱包应用
	 */
	mobile_wallet_selection?: (uri: string) => void;
}

/**
 * 连接器事件完整定义
 * 包含所有核心事件和可选的扩展事件
 */
export interface ConnectorEvents extends CoreConnectorEvents, ExtendedConnectorEvents {}

/**
 * 自定义事件示例：
 *
 * 如果你的连接器需要触发自定义事件，可以扩展 ConnectorEvents：
 *
 * ```typescript
 * interface MyConnectorEvents extends ConnectorEvents {
 *   customEvent: (data: CustomData) => void;
 * }
 *
 * export class MyConnector extends BaseConnector {
 *   // 在需要的地方触发自定义事件
 *   this.emit('customEvent', customData);
 * }
 * ```
 */

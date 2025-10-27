import type { Chain } from 'viem';

/**
 * 连接器通用配置选项
 *
 * 这是所有连接器的基础选项，包含通用的配置参数。
 * 每个具体的连接器实现可以扩展这个接口，添加自己特定的选项。
 */
export interface ConnectorOptions {
	/**
	 * 支持的区块链网络列表（必需）
	 *
	 * 连接器会使用这个列表来：
	 * - 初始化 Provider（例如 WalletConnect 需要指定支持的链）
	 * - 验证用户选择的网络是否支持
	 * - 提供网络切换功能
	 * - 在 UI 中显示支持的网络
	 *
	 * 网络管理机制：
	 * - 当 dApp 通过 ConnectionManager.addChain() 添加网络时，
	 *   所有连接器会收到 updateChains() 调用
	 * - 连接器实例保持不变，但内部状态会更新
	 * - 对于需要重新初始化的连接器（needsReinitOnChainsChange = true），
	 *   如 WalletConnect，会在下次操作时重新初始化 Provider
	 * - 对于浏览器注入钱包（如 EIP6963），不需要重新初始化
	 * - 切换到新网络时，会先验证连接器是否支持该网络
	 */
	chains: Chain[];

	/**
	 * 是否模拟断开连接功能（必需）
	 *
	 * 某些钱包（如 MetaMask）不支持程序化断开连接。
	 * 启用此选项后，连接器会尝试调用钱包的权限撤销 API。
	 */
	shimDisconnect: boolean;
}

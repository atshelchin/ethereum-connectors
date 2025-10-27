import type { ConnectorOptions } from '../../core/types/options.js';

/**
 * WalletConnect 连接器选项
 *
 * WalletConnect v2 协议的特定配置选项
 * @see https://docs.walletconnect.com/
 */
export interface WalletConnectConnectorOptions extends ConnectorOptions {
	/**
	 * WalletConnect Cloud 项目 ID（必需）
	 *
	 * 从 https://cloud.walletconnect.com/ 获取
	 */
	projectId: string;

	/**
	 * 是否显示内置的二维码模态框
	 *
	 * @default false
	 */
	showQrModal?: boolean;

	/**
	 * 二维码模态框的主题配置
	 */
	qrModalOptions?: {
		/**
		 * 主题模式
		 */
		theme?: 'dark' | 'light';

		/**
		 * 自定义主题变量
		 */
		themeVariables?: Record<string, string>;
	};

	/**
	 * 应用元数据
	 *
	 * 用于在钱包中显示连接请求的应用信息
	 */
	metadata?: {
		/**
		 * 应用名称
		 */
		name: string;

		/**
		 * 应用描述
		 */
		description: string;

		/**
		 * 应用 URL
		 */
		url: string;

		/**
		 * 应用图标列表
		 */
		icons: string[];
	};
}

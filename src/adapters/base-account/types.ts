import type { ConnectorOptions } from '../../core/types/options.js';

/**
 * Coinbase Smart Wallet 连接器选项
 *
 * Coinbase Smart Wallet 基于 Account Abstraction (ERC-4337)
 * @see https://www.smartwallet.dev/
 */
export interface CoinbaseConnectorOptions extends ConnectorOptions {
	/**
	 * 应用名称
	 *
	 * 显示在 Coinbase Wallet 中的应用标识
	 */
	appName?: string;

	/**
	 * 应用 Logo URL
	 *
	 * 显示在 Coinbase Wallet 中的应用图标
	 */
	appLogoUrl?: string;

	/**
	 * 钱包偏好设置
	 *
	 * - `smartWalletOnly`: 仅使用 Smart Wallet
	 * - `all`: 允许使用所有 Coinbase 钱包类型
	 *
	 * @default 'all'
	 */
	preference?: 'smartWalletOnly' | 'all';
}

import type { ConnectorOptions } from '../../core/types/options.js';

/**
 * Injected 连接器选项
 *
 * 用于连接注入到 window 对象的钱包（如 window.ethereum）
 */
export interface InjectedConnectorOptions extends ConnectorOptions {
	/**
	 * 连接器的唯一标识符
	 * @default 'injected'
	 */
	id?: string;

	/**
	 * 连接器的显示名称
	 * @default 'Injected Wallet'
	 */
	name?: string;

	/**
	 * 连接器图标
	 */
	icon?: string;

	/**
	 * 注入对象的路径（在 window 上）
	 * @default 'ethereum'
	 * @example
	 * ```typescript
	 * // MetaMask: window.ethereum
	 * target: 'ethereum'
	 *
	 * // Phantom (if injected): window.phantom.ethereum
	 * target: 'phantom.ethereum'
	 *
	 * // Coinbase (legacy): window.coinbaseWalletExtension
	 * target: 'coinbaseWalletExtension'
	 * ```
	 */
	target?: string;

	/**
	 * 下载链接（当钱包未安装时）
	 */
	downloadUrl?: string;
}

/**
 * 检测特定钱包的函数
 *
 * 返回 true 表示这是目标钱包
 */
export type WalletDetector = (provider: unknown) => boolean;

/**
 * 预定义的钱包检测器
 */
export const WalletDetectors = {
	/**
	 * 检测是否为 MetaMask
	 */
	isMetaMask: (provider: unknown): boolean => {
		if (!provider || typeof provider !== 'object') return false;
		const p = provider as { isMetaMask?: boolean };
		return !!p.isMetaMask;
	},

	/**
	 * 检测是否为 Coinbase Wallet
	 */
	isCoinbaseWallet: (provider: unknown): boolean => {
		if (!provider || typeof provider !== 'object') return false;
		const p = provider as { isCoinbaseWallet?: boolean };
		return !!p.isCoinbaseWallet;
	},

	/**
	 * 检测是否为 Trust Wallet
	 */
	isTrust: (provider: unknown): boolean => {
		if (!provider || typeof provider !== 'object') return false;
		const p = provider as { isTrust?: boolean };
		return !!p.isTrust;
	},

	/**
	 * 检测是否为 Phantom
	 */
	isPhantom: (provider: unknown): boolean => {
		if (!provider || typeof provider !== 'object') return false;
		const p = provider as { isPhantom?: boolean };
		return !!p.isPhantom;
	},

	/**
	 * 检测是否为 Brave Wallet
	 */
	isBraveWallet: (provider: unknown): boolean => {
		if (!provider || typeof provider !== 'object') return false;
		const p = provider as { isBraveWallet?: boolean };
		return !!p.isBraveWallet;
	}
};

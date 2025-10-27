/**
 * 移动设备检测工具
 */

/**
 * 检测是否为移动设备
 */
export function isMobile(): boolean {
	if (typeof window === 'undefined') return false;
	return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * 检测是否为 iOS 设备
 */
export function isIOS(): boolean {
	if (typeof window === 'undefined') return false;
	return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * 检测是否为 Android 设备
 */
export function isAndroid(): boolean {
	if (typeof window === 'undefined') return false;
	return /Android/i.test(navigator.userAgent);
}

/**
 * 获取移动操作系统
 */
export function getMobileOS(): 'ios' | 'android' | 'unknown' {
	if (isIOS()) return 'ios';
	if (isAndroid()) return 'android';
	return 'unknown';
}

/**
 * 钱包深度链接配置
 */
export interface WalletDeepLink {
	name: string;
	ios: string;
	android: string;
	universal?: string;
	icon?: string;
}

/**
 * 支持的钱包深度链接
 */
export const WALLET_DEEP_LINKS: Record<string, WalletDeepLink> = {
	// 最常用的钱包
	metamask: {
		name: 'MetaMask',
		ios: 'metamask://wc?uri=',
		android: 'metamask://wc?uri=',
		universal: 'https://metamask.app.link/wc?uri=',
		icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0Y2ODUxQiIvPgo8cGF0aCBkPSJNMzAuNCAxMS42TDIxLjYgMTguMUwyMy4zIDE0LjFMMzAuNCAxMS42WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTkuNiAxMS42TDE4LjMgMTguMkwxNi43IDE0LjFMOS42IDExLjZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4='
	},
	okx: {
		name: 'OKX Wallet',
		ios: 'okx://main/wc?uri=',
		android: 'okx://main/wc?uri=',
		universal: 'https://www.okx.com/download/wc?uri=',
		icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTIzLjYgMTZINEgxNi40VjIzLjZIMjMuNlYxNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg=='
	},
	binance: {
		name: 'Binance Web3 Wallet',
		ios: 'bnc://app/wc?uri=',
		android: 'bnc://app/wc?uri=',
		universal: 'https://www.binance.com/en/wallet-direct/wc?uri=',
		icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0YzQkEyRiIvPgo8cGF0aCBkPSJNMjAgOEwxMi45IDE1LjFMMTYuNSAxMS41TDIwIDhMMjMuNSAxMS41TDI3LjEgMTUuMUwyMCA4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+'
	},
	trust: {
		name: 'Trust Wallet',
		ios: 'trust://wc?uri=',
		android: 'trust://wc?uri=',
		universal: 'https://link.trustwallet.com/wc?uri=',
		icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzMzNzVCQiIvPgo8cGF0aCBkPSJNMjAgOEMxNS41OCA4IDEyIDExLjU4IDEyIDE2VjI0QzEyIDI4LjQyIDE1LjU4IDMyIDIwIDMyQzI0LjQyIDMyIDI4IDI4LjQyIDI4IDI0VjE2QzI4IDExLjU4IDI0LjQyIDggMjAgOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg=='
	},
	rainbow: {
		name: 'Rainbow',
		ios: 'rainbow://wc?uri=',
		android: 'rainbow://wc?uri=',
		universal: 'https://rnbwapp.com/wc?uri=',
		icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icmFpbmJvdyI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRjAwMDAiLz4KPHN0b3Agb2Zmc2V0PSIyMCUiIHN0b3AtY29sb3I9IiNGRkZGMDAiLz4KPHN0b3Agb2Zmc2V0PSI0MCUiIHN0b3AtY29sb3I9IiMwMEZGMDAiLz4KPHN0b3Agb2Zmc2V0PSI2MCUiIHN0b3AtY29sb3I9IiMwMEZGRkYiLz4KPHN0b3Agb2Zmc2V0PSI4MCUiIHN0b3AtY29sb3I9IiMwMDAwRkYiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjOUIwMEZGIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0idXJsKCNyYWluYm93KSIvPgo8L3N2Zz4='
	},
	coinbase: {
		name: 'Coinbase Wallet',
		ios: 'cbwallet://wc?uri=',
		android: 'cbwallet://wc?uri=',
		universal: 'https://go.cb-w.com/wc?uri=',
		icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBkPSJNMjAgOEMxMy4zNzMgOCA4IDEzLjM3MyA4IDIwQzggMjYuNjI3IDEzLjM3MyAzMiAyMCAzMkMyNi42MjcgMzIgMzIgMjYuNjI3IDMyIDIwQzMyIDEzLjM3MyAyNi42MjcgOCAyMCA4Wk0xNy41IDE3LjVIMjIuNVYyMi41SDE3LjVWMTcuNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg=='
	},
	uniswap: {
		name: 'Uniswap Wallet',
		ios: 'uniswap://wc?uri=',
		android: 'uniswap://wc?uri=',
		universal: 'https://wallet.uniswap.org/wc?uri=',
		icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0ZGMDA3QSIvPgo8cGF0aCBkPSJNMjAgMTBDMjAgMTAgMjQgMTIgMjQgMTZDMjQgMjAgMjAgMjIgMjAgMjJDMjAgMjIgMTYgMjAgMTYgMTZDMTYgMTIgMjAgMTAgMjAgMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4='
	},
	zerion: {
		name: 'Zerion',
		ios: 'zerion://wc?uri=',
		android: 'zerion://wc?uri=',
		universal: 'https://app.zerion.io/wc?uri=',
		icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzI5NjJFRiIvPgo8cGF0aCBkPSJNMjggMTJMMTIgMTJWMTZIMjRWMjRIMTJWMjhIMjhWMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4='
	},

	// Layer 2 和特定链钱包
	argent: {
		name: 'Argent',
		ios: 'argent://app/wc?uri=',
		android: 'argent://app/wc?uri=',
		universal: 'https://argent.link/app/wc?uri='
	},
	gnosis: {
		name: 'Gnosis Safe',
		ios: 'gnosissafe://wc?uri=',
		android: 'gnosissafe://wc?uri=',
		universal: 'https://gnosis-safe.io/wc?uri='
	},

	// 亚洲流行钱包
	imtoken: {
		name: 'imToken',
		ios: 'imtokenv2://wc?uri=',
		android: 'imtokenv2://wc?uri=',
		universal: 'https://mobileapp.imtoken.com/wc?uri='
	},
	tokenpocket: {
		name: 'TokenPocket',
		ios: 'tpoutside://wc?uri=',
		android: 'tpoutside://wc?uri=',
		universal: 'https://tokenpocket.pro/wc?uri='
	},
	bitkeep: {
		name: 'BitKeep (Bitget)',
		ios: 'bitkeep://wc?uri=',
		android: 'bitkeep://wc?uri=',
		universal: 'https://bkapp.link/wc?uri='
	},
	onekey: {
		name: 'OneKey',
		ios: 'onekey-wallet://wc?uri=',
		android: 'onekey-wallet://wc?uri=',
		universal: 'https://onekey.so/wc?uri='
	},

	// DeFi 专注钱包
	inch: {
		name: '1inch Wallet',
		ios: 'oneinch://wc?uri=',
		android: 'oneinch://wc?uri=',
		universal: 'https://wallet.1inch.io/wc?uri='
	},
	unstoppable: {
		name: 'Unstoppable',
		ios: 'unstoppable://wc?uri=',
		android: 'unstoppable://wc?uri=',
		universal: 'https://unstoppable.money/wc?uri='
	},

	// 硬件钱包配套应用
	ledger: {
		name: 'Ledger Live',
		ios: 'ledgerlive://wc?uri=',
		android: 'ledgerlive://wc?uri=',
		universal: 'https://ledger.com/wc?uri='
	},
	keystone: {
		name: 'Keystone',
		ios: 'keystone://wc?uri=',
		android: 'keystone://wc?uri=',
		universal: 'https://keyst.one/wc?uri='
	},

	// 多链钱包
	exodus: {
		name: 'Exodus',
		ios: 'exodus://wc?uri=',
		android: 'exodus://wc?uri=',
		universal: 'https://exodus.io/wc?uri='
	},
	atomic: {
		name: 'Atomic Wallet',
		ios: 'atomicwallet://wc?uri=',
		android: 'atomicwallet://wc?uri=',
		universal: 'https://atomicwallet.io/wc?uri='
	},
	mathwallet: {
		name: 'MathWallet',
		ios: 'mathwallet://wc?uri=',
		android: 'mathwallet://wc?uri=',
		universal: 'https://www.mathwallet.org/wc?uri='
	},

	// 其他流行钱包
	safepal: {
		name: 'SafePal',
		ios: 'safepalwallet://wc?uri=',
		android: 'safepalwallet://wc?uri=',
		universal: 'https://link.safepal.io/wc?uri='
	},
	crypto: {
		name: 'Crypto.com DeFi',
		ios: 'dfw://wc?uri=',
		android: 'dfw://wc?uri=',
		universal: 'https://wallet.crypto.com/wc?uri='
	},
	pillar: {
		name: 'Pillar',
		ios: 'pillarwallet://wc?uri=',
		android: 'pillarwallet://wc?uri=',
		universal: 'https://pillarproject.io/wc?uri='
	},
	spot: {
		name: 'Spot',
		ios: 'spot://wc?uri=',
		android: 'spot://wc?uri=',
		universal: 'https://spot.so/wc?uri='
	},
	omni: {
		name: 'Omni',
		ios: 'omni://wc?uri=',
		android: 'omni://wc?uri=',
		universal: 'https://omni.app/wc?uri='
	},
	onto: {
		name: 'ONTO',
		ios: 'onto://wc?uri=',
		android: 'onto://wc?uri=',
		universal: 'https://onto.app/wc?uri='
	},
	alphawallet: {
		name: 'AlphaWallet',
		ios: 'alphawallet://wc?uri=',
		android: 'alphawallet://wc?uri=',
		universal: 'https://alphawallet.com/wc?uri='
	},
	dcent: {
		name: "D'CENT",
		ios: 'dcent://wc?uri=',
		android: 'dcent://wc?uri=',
		universal: 'https://dcentwallet.com/wc?uri='
	},
	zelcore: {
		name: 'ZelCore',
		ios: 'zelcore://wc?uri=',
		android: 'zelcore://wc?uri=',
		universal: 'https://zel.network/wc?uri='
	},
	nash: {
		name: 'Nash',
		ios: 'nash://wc?uri=',
		android: 'nash://wc?uri=',
		universal: 'https://nash.io/wc?uri='
	},
	huobi: {
		name: 'Huobi Wallet',
		ios: 'huobiwallet://wc?uri=',
		android: 'huobiwallet://wc?uri=',
		universal: 'https://www.huobiwallet.io/wc?uri='
	},
	eidoo: {
		name: 'Eidoo',
		ios: 'eidoo://wc?uri=',
		android: 'eidoo://wc?uri=',
		universal: 'https://eidoo.io/wc?uri='
	},
	mykey: {
		name: 'MYKEY',
		ios: 'mykey://wc?uri=',
		android: 'mykey://wc?uri=',
		universal: 'https://mykey.org/wc?uri='
	},
	loopring: {
		name: 'Loopring',
		ios: 'loopring://wc?uri=',
		android: 'loopring://wc?uri=',
		universal: 'https://loopring.io/wc?uri='
	},

	// Generic fallback
	generic: {
		name: 'Other Wallet',
		ios: 'wc:',
		android: 'wc:',
		universal: 'wc:'
	}
};

/**
 * 生成钱包深度链接
 */
export function generateDeepLink(uri: string, walletId?: string): string {
	const wallet = walletId ? WALLET_DEEP_LINKS[walletId] : WALLET_DEEP_LINKS.generic;
	const os = getMobileOS();
	const encodedUri = encodeURIComponent(uri);

	// 优先使用通用链接
	if (wallet.universal) {
		return `${wallet.universal}${encodedUri}`;
	}

	// 根据操作系统选择对应的深度链接
	if (os === 'ios') {
		return `${wallet.ios}${encodedUri}`;
	} else if (os === 'android') {
		return `${wallet.android}${encodedUri}`;
	}

	// 默认使用通用 WalletConnect 协议
	return uri;
}

/**
 * 打开钱包深度链接
 */
export function openWalletDeepLink(uri: string, walletId?: string): void {
	if (!isMobile()) {
		console.warn('Deep links are only supported on mobile devices');
		return;
	}

	const deepLink = generateDeepLink(uri, walletId);

	// 尝试打开深度链接
	window.location.href = deepLink;

	// 备用方案：如果深度链接失败，可以在几秒后显示备用选项
	setTimeout(() => {
		// 如果用户还在页面上，说明深度链接可能失败了
		// 可以显示一个手动选择钱包的列表
		console.log('Deep link might have failed, showing fallback options');
	}, 3000);
}

/**
 * 带 ID 的钱包深度链接
 */
export interface WalletDeepLinkWithId extends WalletDeepLink {
	id: string;
}

/**
 * 获取推荐的移动钱包列表
 */
export function getRecommendedMobileWallets(): WalletDeepLinkWithId[] {
	const recommended = [
		'metamask',
		'okx',
		'binance',
		'trust',
		'rainbow',
		'coinbase',
		'uniswap',
		'zerion',
		'argent',
		'imtoken',
		'tokenpocket',
		'onekey'
	];

	return recommended.map((id) => ({
		...WALLET_DEEP_LINKS[id],
		id
	}));
}

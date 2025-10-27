import type { EIP6963ProviderDetail } from './types.js';

/**
 * 监听 EIP6963 钱包发现事件
 * 完全框架无关，可在任何浏览器环境中使用
 */
export function watchEIP6963Wallets(
	callback: (wallets: EIP6963ProviderDetail[]) => void
): () => void {
	// SSR compatibility check
	if (typeof window === 'undefined') {
		return () => {}; // Return no-op cleanup function for SSR
	}

	const wallets = new Map<string, EIP6963ProviderDetail>();

	function onAnnouncement(event: Event) {
		const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
		if (detail) {
			wallets.set(detail.info.rdns, detail);
			callback(Array.from(wallets.values()));
		}
	}

	// 监听钱包公告事件
	window.addEventListener('eip6963:announceProvider', onAnnouncement as EventListener);

	// 请求钱包公告
	window.dispatchEvent(new Event('eip6963:requestProvider'));

	// 返回清理函数
	return () => {
		window.removeEventListener('eip6963:announceProvider', onAnnouncement as EventListener);
	};
}

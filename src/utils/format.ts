import type { Address } from 'viem';

/**
 * 格式化地址用于显示（缩短中间部分）
 */
export function formatAddress(address: Address, length: number = 4): string {
	if (!address) return '';
	if (address.length <= length * 2 + 2) return address;
	return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

/**
 * 检查是否为有效的以太坊地址
 */
export function isAddress(address: string): address is Address {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isExpired(timestamp: number, timeout: number = 24 * 60 * 60 * 1000): boolean {
	return Date.now() - timestamp > timeout;
}

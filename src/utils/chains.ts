import type { Chain } from 'viem';
import type { NetworkConfig, RpcEndpoint } from '../core/types/network';

/**
 * 根据链 ID 获取链配置
 */
export function getChainById(chains: Chain[], chainId: number): Chain | undefined {
	return chains.find((chain) => chain.id === chainId);
}

/**
 * 格式化链名称用于显示
 */
export function formatChainName(chainId: number, chains?: Chain[]): string {
	if (chains) {
		const chain = getChainById(chains, chainId);
		if (chain) return chain.name;
	}
	return `Chain ${chainId}`;
}

/**
 * 标准化链 ID（处理十六进制、字符串等格式）
 */
export function normalizeChainId(chainId: string | number | bigint): number {
	if (typeof chainId === 'string') {
		// 处理十六进制字符串
		if (chainId.startsWith('0x')) {
			return parseInt(chainId, 16);
		}
		return parseInt(chainId, 10);
	}
	if (typeof chainId === 'bigint') {
		return Number(chainId);
	}
	return chainId;
}

/**
 * 将 NetworkConfig 转换为 viem Chain
 */
export function networkConfigToChain(config: NetworkConfig): Chain {
	return {
		id: config.chainId,
		name: config.name,
		nativeCurrency: {
			name: config.symbol,
			symbol: config.symbol,
			decimals: 18
		},
		rpcUrls: {
			default: {
				http: config.rpcEndpoints
					.filter((endpoint) => endpoint.isPrimary)
					.map((endpoint) => endpoint.url)
			},
			public: {
				http: config.rpcEndpoints.map((endpoint) => endpoint.url)
			}
		},
		blockExplorers: config.blockExplorer
			? {
					default: {
						name: 'Explorer',
						url: config.blockExplorer
					}
				}
			: undefined
	};
}

/**
 * 将 viem Chain 转换为 NetworkConfig
 */
export function chainToNetworkConfig(chain: Chain, isCustom = false): NetworkConfig {
	const rpcUrls = chain.rpcUrls.default.http;
	const rpcEndpoints: RpcEndpoint[] = rpcUrls.map((url, index) => ({
		url,
		isPrimary: index === 0
	}));

	return {
		chainId: chain.id,
		name: chain.name,
		symbol: chain.nativeCurrency.symbol,
		rpcEndpoints,
		blockExplorer: chain.blockExplorers?.default?.url,
		isCustom,
		isBuiltIn: !isCustom,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
}

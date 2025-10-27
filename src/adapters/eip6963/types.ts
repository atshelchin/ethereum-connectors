import type { ConnectorOptions } from '../../core/types/options.js';
import type { EIP1193Provider } from '../../core/types/connector.js';

/**
 * EIP6963 Provider 详情
 *
 * 根据 EIP-6963 标准，钱包需要提供的元数据信息
 * @see https://eips.ethereum.org/EIPS/eip-6963
 */
export interface EIP6963ProviderDetail {
	info: {
		/**
		 * 钱包的唯一标识符（UUID）
		 */
		uuid: string;

		/**
		 * 钱包的显示名称
		 */
		name: string;

		/**
		 * 钱包的图标（base64 或 URL）
		 */
		icon: string;

		/**
		 * 反向域名标识符（Reverse DNS）
		 * 例如：'io.metamask', 'com.coinbase.wallet'
		 */
		rdns: string;
	};

	/**
	 * EIP-1193 兼容的 Provider 实例
	 */
	provider: EIP1193Provider;
}

/**
 * EIP6963 连接器选项
 *
 * EIP6963 连接器的特定配置选项
 */
export interface EIP6963ConnectorOptions extends ConnectorOptions {
	/**
	 * 通过 EIP-6963 发现的钱包 Provider 详情
	 *
	 * 通常通过监听 `window` 上的 `eip6963:announceProvider` 事件获取
	 */
	providerDetail: EIP6963ProviderDetail;
}

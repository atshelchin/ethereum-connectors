/**
 * EIP6963 Connector Module
 *
 * Supports wallets that implement the EIP6963 standard for wallet discovery
 * @see https://eips.ethereum.org/EIPS/eip-6963
 */

export { EIP6963Connector } from './connector.js';
export { watchEIP6963Wallets } from './discovery.js';
export type { EIP6963ConnectorOptions, EIP6963ProviderDetail } from './types.js';

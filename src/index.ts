// Core types
export type { Connector, ConnectorMetadata, EIP1193Provider } from './core/types/connector.js';
export type {
	ConnectionState,
	PersistedConnection,
	ConnectionManager
} from './core/types/connection.js';
export type { ConnectorEvents, ConnectionInfo } from './core/types/events.js';
export type { ConnectorOptions } from './core/types/options.js';
export type {
	NetworkConfig,
	RpcEndpoint,
	NamespaceConfig,
	StoredNetworkConfig,
	NetworkManagerEvents
} from './core/types/network.js';

// Base connector
export { BaseConnector } from './core/BaseConnector.js';

// Managers
export { NetworkManager } from './core/manager/network-manager.js';
export { WalletConnectionManager } from './core/manager/wallet-connection-manager.js';
export { IntegratedManager } from './core/manager/integrated-manager.js';

// Connectors
export { InjectedConnector } from './adapters/injected/connector.js';
export { WalletConnectConnector } from './adapters/wallet-connect/connector.js';
export { CoinbaseSmartWalletConnector } from './adapters/base-account/connector.js';
export { EIP6963Connector } from './adapters/eip6963/connector.js';

// EIP-6963 utilities
export type { EIP6963ProviderDetail } from './adapters/eip6963/types.js';
export { watchEIP6963Wallets } from './adapters/eip6963/discovery.js';

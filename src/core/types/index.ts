/**
 * Core Types Module
 *
 * 完全框架无关的类型定义
 * 可以在任何 TypeScript 项目中使用
 */

// Connector types
export type { Connector, ConnectorMetadata, EIP1193Provider } from './connector.js';

// Connection types
export type { ConnectionState, PersistedConnection, ConnectionManager } from './connection.js';

// Event types
export type { ConnectorEvents, ConnectionInfo } from './events.js';

// Options types (通用选项)
export type { ConnectorOptions } from './options.js';

// Network types
export type {
	NetworkConfig,
	RpcEndpoint,
	NamespaceConfig,
	StoredNetworkConfig,
	NetworkManagerEvents
} from './network.js';

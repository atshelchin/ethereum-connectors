/**
 * RPC 端点配置
 */
export interface RpcEndpoint {
	/** RPC URL */
	url: string;
	/** 是否为主端点 */
	isPrimary: boolean;
	/** 是否可用 */
	isAvailable?: boolean;
	/** 延迟（毫秒） */
	latency?: number;
	/** 最后检查时间 */
	lastChecked?: Date;
}

/**
 * 网络配置
 *
 * 扩展 viem 的 Chain 类型，添加额外的配置信息
 */
export interface NetworkConfig {
	/** 链 ID */
	chainId: number;
	/** 网络名称 */
	name: string;
	/** 原生代币符号 */
	symbol: string;
	/** RPC 端点列表 */
	rpcEndpoints: RpcEndpoint[];
	/** 区块浏览器 URL */
	blockExplorer?: string;
	/** 网络图标 URL */
	iconUrl?: string;
	/** 是否为用户自定义网络 */
	isCustom: boolean;
	/** 是否为内置网络 */
	isBuiltIn: boolean;
	/** 创建时间 */
	createdAt?: string;
	/** 更新时间 */
	updatedAt?: string;
}

/**
 * 命名空间网络配置
 *
 * 每个命名空间（如不同的 dApp）可以有自己的启用网络列表和当前网络
 */
export interface NamespaceConfig {
	/** 启用的链 ID 列表 */
	enabledChainIds: number[];
	/** 当前选中的链 ID */
	currentChainId?: number;
}

/**
 * 存储的网络配置
 */
export interface StoredNetworkConfig {
	/** 所有网络配置（按 chainId 索引） */
	networks: Record<number, NetworkConfig>;
	/** 命名空间配置 */
	namespaces: Record<string, NamespaceConfig>;
}

/**
 * 网络管理器事件
 */
export interface NetworkManagerEvents {
	/** 网络被添加 */
	networkAdded: (network: NetworkConfig) => void;
	/** 网络被移除 */
	networkRemoved: (chainId: number) => void;
	/** 网络被更新 */
	networkUpdated: (network: NetworkConfig) => void;
	/** 网络被启用/禁用 */
	networkToggled: (namespace: string, chainId: number, enabled: boolean) => void;
	/** 当前网络被切换 */
	currentNetworkChanged: (namespace: string, chainId: number) => void;
}

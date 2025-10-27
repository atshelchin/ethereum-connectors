import type {
	NetworkConfig,
	NetworkManagerEvents,
	RpcEndpoint,
	StoredNetworkConfig
} from '../types/network.js';
import { createStorage } from '../create-storage.js';

/**
 * 网络管理器（框架无关）
 *
 * 负责管理网络配置、命名空间、持久化等功能
 */
export class NetworkManager {
	private config: StoredNetworkConfig = {
		networks: {},
		namespaces: {}
	};

	private storage = createStorage<StoredNetworkConfig>('network-config', 'NetworkStorage');
	private listeners = new Map<keyof NetworkManagerEvents, Set<(...args: unknown[]) => void>>();

	constructor(builtInNetworks: NetworkConfig[] = []) {
		// 加载配置
		const stored = this.storage.load();
		if (stored) {
			this.config = stored;
			// 合并内置网络
			this.mergeBuiltInNetworks(builtInNetworks);
		} else {
			// 初始化默认网络
			this.initializeDefaults(builtInNetworks);
		}
	}

	/**
	 * 初始化默认网络
	 */
	private initializeDefaults(builtInNetworks: NetworkConfig[]): void {
		builtInNetworks.forEach((network) => {
			this.config.networks[network.chainId] = { ...network };
		});
		this.save();
	}

	/**
	 * 合并内置网络（处理版本更新）
	 * 注意：如果用户已经添加了相同 chainId 的自定义网络，保留用户的自定义网络
	 */
	private mergeBuiltInNetworks(builtInNetworks: NetworkConfig[]): void {
		let hasChanges = false;

		builtInNetworks.forEach((network) => {
			const existing = this.config.networks[network.chainId];

			// 如果该 chainId 不存在，添加预设网络
			if (!existing) {
				this.config.networks[network.chainId] = { ...network };
				hasChanges = true;
			}
			// 如果已存在且是用户自定义的网络，保留用户的网络，不覆盖
			else if (existing.isCustom) {
				console.log(
					`[NetworkManager] Skipping built-in network ${network.name} (chainId: ${network.chainId}) - user has custom network`
				);
			}
		});

		if (hasChanges) {
			this.save();
		}
	}

	/**
	 * 保存配置
	 */
	private save(): void {
		this.storage.save(this.config);
	}

	/**
	 * 获取所有网络
	 */
	getAllNetworks(): NetworkConfig[] {
		return Object.values(this.config.networks);
	}

	/**
	 * 获取单个网络
	 */
	getNetwork(chainId: number): NetworkConfig | undefined {
		return this.config.networks[chainId];
	}

	/**
	 * 获取某个命名空间下的启用网络列表
	 */
	getEnabledNetworks(namespace: string): NetworkConfig[] {
		const enabledIds = this.config.namespaces[namespace]?.enabledChainIds || [];
		return enabledIds.map((id) => this.config.networks[id]).filter(Boolean);
	}

	/**
	 * 添加或更新自定义网络
	 */
	addOrUpdateCustomNetwork(network: Omit<NetworkConfig, 'isCustom' | 'isBuiltIn'>): void {
		const existing = this.config.networks[network.chainId];
		const isNew = !existing;

		this.config.networks[network.chainId] = {
			...network,
			isCustom: true,
			isBuiltIn: false,
			createdAt: existing?.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		this.save();

		if (isNew) {
			this.emit('networkAdded', this.config.networks[network.chainId]);
		} else {
			this.emit('networkUpdated', this.config.networks[network.chainId]);
		}
	}

	/**
	 * 更新网络的 RPC 配置
	 */
	updateNetworkRpc(chainId: number, rpcEndpoints: RpcEndpoint[], blockExplorer?: string): void {
		const network = this.config.networks[chainId];
		if (!network) {
			console.warn('[NetworkManager] Network not found:', chainId);
			return;
		}

		network.rpcEndpoints = rpcEndpoints;
		if (blockExplorer !== undefined) {
			network.blockExplorer = blockExplorer;
		}
		network.updatedAt = new Date().toISOString();

		this.save();
		this.emit('networkUpdated', network);
	}

	/**
	 * 删除自定义网络
	 */
	removeCustomNetwork(chainId: number): void {
		const network = this.config.networks[chainId];
		if (!network?.isCustom) {
			console.warn('[NetworkManager] Cannot remove built-in network');
			return;
		}

		// 从所有命名空间中移除，并自动切换当前网络
		Object.keys(this.config.namespaces).forEach((ns) => {
			const namespace = this.config.namespaces[ns];
			const idx = namespace.enabledChainIds.indexOf(chainId);

			if (idx > -1) {
				namespace.enabledChainIds.splice(idx, 1);

				// 如果删除的是当前网络，切换到第一个启用的网络
				if (namespace.currentChainId === chainId) {
					namespace.currentChainId =
						namespace.enabledChainIds.length > 0 ? namespace.enabledChainIds[0] : undefined;
				}
			}
		});

		delete this.config.networks[chainId];
		this.save();
		this.emit('networkRemoved', chainId);
	}

	/**
	 * 启用/禁用网络（命名空间级别）
	 */
	toggleNetwork(namespace: string, chainId: number, enabled: boolean): boolean {
		if (!this.config.namespaces[namespace]) {
			this.config.namespaces[namespace] = {
				enabledChainIds: [],
				currentChainId: undefined
			};
		}

		const ns = this.config.namespaces[namespace];
		const idx = ns.enabledChainIds.indexOf(chainId);

		if (enabled && idx === -1) {
			// 启用网络
			ns.enabledChainIds.push(chainId);
			// 如果是第一个启用的网络，设置为当前网络
			if (ns.enabledChainIds.length === 1) {
				ns.currentChainId = chainId;
			}
		} else if (!enabled && idx > -1) {
			// 防止禁用最后一个网络
			if (ns.enabledChainIds.length === 1) {
				console.warn('[NetworkManager] Cannot disable the last enabled network');
				return false;
			}

			// 禁用网络
			ns.enabledChainIds.splice(idx, 1);

			// 如果禁用的是当前网络，切换到第一个启用的网络
			if (ns.currentChainId === chainId) {
				ns.currentChainId = ns.enabledChainIds.length > 0 ? ns.enabledChainIds[0] : undefined;
			}
		}

		this.save();
		this.emit('networkToggled', namespace, chainId, enabled);
		return true;
	}

	/**
	 * 检查网络是否在命名空间中启用
	 */
	isNetworkEnabled(namespace: string, chainId: number): boolean {
		return this.config.namespaces[namespace]?.enabledChainIds.includes(chainId) || false;
	}

	/**
	 * 设置当前网络
	 */
	setCurrentNetwork(namespace: string, chainId: number): void {
		if (!this.config.namespaces[namespace]) {
			this.config.namespaces[namespace] = {
				enabledChainIds: [],
				currentChainId: chainId
			};
		} else {
			// 只允许设置为已启用的网络
			if (this.config.namespaces[namespace].enabledChainIds.includes(chainId)) {
				this.config.namespaces[namespace].currentChainId = chainId;
			} else {
				console.warn(`[NetworkManager] Cannot set current network to disabled network: ${chainId}`);
				return;
			}
		}

		this.save();
		this.emit('currentNetworkChanged', namespace, chainId);
	}

	/**
	 * 获取当前网络
	 */
	getCurrentNetwork(namespace: string): NetworkConfig | null {
		const ns = this.config.namespaces[namespace];
		if (!ns || !ns.currentChainId) {
			return null;
		}
		return this.config.networks[ns.currentChainId] || null;
	}

	/**
	 * 获取当前网络 ID
	 */
	getCurrentChainId(namespace: string): number | undefined {
		return this.config.namespaces[namespace]?.currentChainId;
	}

	/**
	 * 初始化命名空间（如果不存在，使用默认启用的网络）
	 */
	initializeNamespace(namespace: string, defaultChainIds?: number[]): void {
		if (!this.config.namespaces[namespace]) {
			// 如果没有提供默认列表，使用所有已有网络
			const enabledIds =
				defaultChainIds || Object.keys(this.config.networks).map((id) => parseInt(id));

			this.config.namespaces[namespace] = {
				enabledChainIds: enabledIds.filter((id) => this.config.networks[id]),
				currentChainId: enabledIds[0]
			};
			this.save();
		}
	}

	/**
	 * 获取完整配置
	 */
	getConfig(): StoredNetworkConfig {
		return this.config;
	}

	/**
	 * 监听事件
	 */
	on<K extends keyof NetworkManagerEvents>(event: K, listener: NetworkManagerEvents[K]): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(listener as (...args: unknown[]) => void);
	}

	/**
	 * 取消监听
	 */
	off<K extends keyof NetworkManagerEvents>(event: K, listener: NetworkManagerEvents[K]): void {
		const listeners = this.listeners.get(event);
		if (listeners) {
			listeners.delete(listener as (...args: unknown[]) => void);
		}
	}

	/**
	 * 触发事件
	 */
	private emit<K extends keyof NetworkManagerEvents>(
		event: K,
		...args: NetworkManagerEvents[K] extends (...args: infer P) => void ? P : never
	): void {
		const listeners = this.listeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => {
				(listener as (...args: unknown[]) => void)(...args);
			});
		}
	}
}

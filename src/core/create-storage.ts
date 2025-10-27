/**
 * 通用存储接口
 */
export interface Storage<T> {
	/** 保存数据 */
	save(data: T): void;
	/** 加载数据 */
	load(): T | null;
	/** 清除数据 */
	clear(): void;
}

/**
 * 创建 localStorage 存储实例
 *
 * 这是一个通用的存储工厂函数，可以为任何类型创建持久化存储
 *
 * @param storageKey localStorage 的键名
 * @param logName 日志中显示的名称
 * @returns Storage 实例
 *
 * @example
 * ```typescript
 * // 创建连接存储
 * const connectionStorage = createStorage<PersistedConnection>(
 *   'connectkit.connection',
 *   'ConnectionStorage'
 * );
 *
 * // 创建网络配置存储
 * const networkStorage = createStorage<StoredNetworkConfig>(
 *   'connectkit-network-config',
 *   'NetworkStorage'
 * );
 * ```
 */
export function createStorage<T>(storageKey: string, logName = 'Storage'): Storage<T> {
	return {
		/**
		 * 保存数据到 localStorage
		 */
		save(data: T): void {
			// 检查浏览器环境
			if (typeof localStorage === 'undefined') {
				return;
			}

			try {
				localStorage.setItem(storageKey, JSON.stringify(data));
				console.log(`[${logName}] Data persisted`);
			} catch (error) {
				console.warn(`[${logName}] Failed to persist data:`, error);
			}
		},

		/**
		 * 从 localStorage 加载数据
		 */
		load(): T | null {
			// 检查浏览器环境
			if (typeof localStorage === 'undefined') {
				return null;
			}

			try {
				const stored = localStorage.getItem(storageKey);
				if (!stored) {
					return null;
				}

				const data = JSON.parse(stored) as T;
				console.log(`[${logName}] Data loaded`);
				return data;
			} catch (error) {
				console.warn(`[${logName}] Failed to load data:`, error);
				return null;
			}
		},

		/**
		 * 清除 localStorage 中的数据
		 */
		clear(): void {
			// 检查浏览器环境
			if (typeof localStorage === 'undefined') {
				return;
			}

			try {
				localStorage.removeItem(storageKey);
				console.log(`[${logName}] Data cleared`);
			} catch (error) {
				console.warn(`[${logName}] Failed to clear data:`, error);
			}
		}
	};
}

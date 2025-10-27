import { mainnet, polygon, base, bsc, arbitrum, optimism } from 'viem/chains';
import { IntegratedManager } from '../core/manager/integrated-manager';
import { InjectedConnector } from '../adapters/injected/connector';
import { WalletConnectConnector } from '../adapters/wallet-connect/connector';
import { CoinbaseSmartWalletConnector } from '../adapters/base-account/connector';
import { EIP6963Connector } from '../adapters/eip6963/connector';
import { watchEIP6963Wallets } from '../adapters/eip6963/discovery';
import type { NetworkConfig, RpcEndpoint } from '../core/types/network';
import type { EIP6963ProviderDetail } from '../adapters/eip6963/types';

/**
 * Network Manager 示例
 *
 * 展示如何使用 IntegratedManager 来管理网络和钱包连接
 */

// 支持的链列表
const supportedChains = [mainnet, polygon, base, bsc, arbitrum, optimism];

// 转换为 NetworkConfig
const builtInNetworks: NetworkConfig[] = supportedChains.map((chain) => ({
	chainId: chain.id,
	name: chain.name,
	symbol: chain.nativeCurrency.symbol,
	rpcEndpoints: [
		{
			url: chain.rpcUrls.default.http[0],
			isPrimary: true,
			isAvailable: true
		}
	],
	blockExplorer: chain.blockExplorers?.default.url,
	isCustom: false,
	isBuiltIn: true,
	createdAt: new Date().toISOString()
}));

// 创建连接器
const injectedConnector = new InjectedConnector({
	chains: supportedChains,
	shimDisconnect: true
});

const coinbaseConnector = new CoinbaseSmartWalletConnector({
	chains: supportedChains,
	shimDisconnect: true,
	appName: 'Network Manager Demo',
	appLogoUrl: 'https://example.com/logo.png'
});

const walletConnectConnector = new WalletConnectConnector({
	chains: supportedChains,
	shimDisconnect: true,
	projectId: 'e3928bd840eee588e157816acb2c8ad8',
	metadata: {
		name: 'Network Manager Demo',
		description: 'Demo for network management',
		url: typeof window !== 'undefined' ? window.location.origin : '',
		icons: ['https://walletconnect.com/walletconnect-logo.png']
	}
});

// 创建集成管理器
export const integratedManager = new IntegratedManager(
	[injectedConnector, coinbaseConnector, walletConnectConnector],
	builtInNetworks,
	'demo-app'
);

// 获取 NetworkManager 和 WalletManager
const networkManager = integratedManager.getNetworkManager();
const walletManager = integratedManager.getWalletManager();

/**
 * 更新所有网络列表 UI
 */
export function updateAllNetworksList(): void {
	const container = document.querySelector('#all-networks-list') as HTMLDivElement;
	if (!container) return;

	const allNetworks = networkManager.getAllNetworks();
	const currentChainId = networkManager.getCurrentChainId('demo-app');

	if (allNetworks.length === 0) {
		container.innerHTML = '<p style="color: var(--text-secondary);">No networks available</p>';
		return;
	}

	container.innerHTML = allNetworks
		.map((network) => {
			const isEnabled = networkManager.isNetworkEnabled('demo-app', network.chainId);
			const isCurrent = currentChainId === network.chainId;

			return `
				<div class="network-item ${isCurrent ? 'active' : ''} ${isEnabled ? 'enabled' : 'disabled'}">
					<div class="network-icon">${network.symbol.charAt(0)}</div>
					<div class="network-info">
						<div class="network-name">${network.name}</div>
						<div class="network-chain-id">Chain ID: ${network.chainId}</div>
					</div>
					<div style="display: flex; gap: 0.5rem; align-items: center;">
						${isCurrent ? '<span class="network-badge current">Current</span>' : ''}
						${network.isCustom ? '<span class="network-badge custom">Custom</span>' : ''}
					</div>
					<div class="button-group">
						<button class="toggle-network-btn small ${isEnabled ? 'danger' : ''}"
							data-chain-id="${network.chainId}"
							data-enabled="${isEnabled}">
							${isEnabled ? 'Disable' : 'Enable'}
						</button>
						${!network.isBuiltIn ? `<button class="delete-network-btn small danger" data-chain-id="${network.chainId}">Delete</button>` : ''}
						<button class="edit-network-btn small secondary" data-chain-id="${network.chainId}">Edit</button>
					</div>
				</div>
			`;
		})
		.join('');

	// 绑定按钮事件
	container.querySelectorAll('.toggle-network-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			const chainId = parseInt((btn as HTMLButtonElement).dataset.chainId || '0');
			const enabled = (btn as HTMLButtonElement).dataset.enabled === 'true';

			const success = networkManager.toggleNetwork('demo-app', chainId, !enabled);
			if (success) {
				updateAllNetworksList();
				updateEnabledNetworksList();
			}
		});
	});

	container.querySelectorAll('.delete-network-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			const chainId = parseInt((btn as HTMLButtonElement).dataset.chainId || '0');
			const network = networkManager.getNetwork(chainId);

			if (network && confirm(`Delete network "${network.name}"?`)) {
				networkManager.removeCustomNetwork(chainId);
				updateAllNetworksList();
				updateEnabledNetworksList();
			}
		});
	});

	container.querySelectorAll('.edit-network-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			const chainId = parseInt((btn as HTMLButtonElement).dataset.chainId || '0');
			const network = networkManager.getNetwork(chainId);

			if (network) {
				showEditNetworkModal(network);
			}
		});
	});
}

/**
 * 更新启用网络列表 UI
 */
export function updateEnabledNetworksList(): void {
	const container = document.querySelector('#enabled-networks-list') as HTMLDivElement;
	if (!container) return;

	const enabledNetworks = networkManager.getEnabledNetworks('demo-app');
	const currentChainId = networkManager.getCurrentChainId('demo-app');

	if (enabledNetworks.length === 0) {
		container.innerHTML = '<p style="color: var(--text-secondary);">No networks enabled</p>';
		return;
	}

	container.innerHTML = enabledNetworks
		.map((network) => {
			const isCurrent = currentChainId === network.chainId;

			return `
				<div class="network-item ${isCurrent ? 'active' : ''}">
					<div class="network-icon">${network.symbol.charAt(0)}</div>
					<div class="network-info">
						<div class="network-name">${network.name}</div>
						<div class="network-chain-id">Chain ID: ${network.chainId}</div>
					</div>
					<div>
						${isCurrent ? '<span class="network-badge current">Current</span>' : ''}
					</div>
					<button class="set-current-network-btn small ${isCurrent ? 'secondary' : ''}"
						data-chain-id="${network.chainId}"
						${isCurrent ? 'disabled' : ''}>
						${isCurrent ? 'Current' : 'Set Current'}
					</button>
				</div>
			`;
		})
		.join('');

	// 绑定设置当前网络按钮
	container.querySelectorAll('.set-current-network-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			const chainId = parseInt((btn as HTMLButtonElement).dataset.chainId || '0');
			networkManager.setCurrentNetwork('demo-app', chainId);
			updateEnabledNetworksList();
		});
	});
}

/**
 * 更新钱包状态 UI
 */
export function updateWalletStatus(): void {
	const statusElement = document.querySelector('#wallet-status') as HTMLDivElement;
	const networkElement = document.querySelector('#wallet-network') as HTMLDivElement;
	const addressElement = document.querySelector('#wallet-address') as HTMLDivElement;
	const disconnectBtn = document.querySelector('#disconnect-wallet-btn') as HTMLButtonElement;
	const switchBtn = document.querySelector('#switch-to-first-network-btn') as HTMLButtonElement;

	const state = walletManager.getState();

	if (statusElement) {
		statusElement.textContent = state.isConnected ? 'Connected' : 'Disconnected';
		statusElement.style.color = state.isConnected ? 'var(--success)' : 'var(--text-secondary)';
	}

	if (networkElement) {
		if (state.isConnected && state.chainId) {
			const network = networkManager.getNetwork(state.chainId);
			networkElement.textContent = network
				? `${network.name} (${state.chainId})`
				: `Chain ${state.chainId}`;
		} else {
			networkElement.textContent = '-';
		}
	}

	if (addressElement) {
		addressElement.textContent = state.address
			? `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
			: '-';
	}

	if (disconnectBtn) {
		disconnectBtn.disabled = !state.isConnected;
	}

	if (switchBtn) {
		switchBtn.disabled = !state.isConnected;
	}
}

/**
 * 更新连接器列表 UI
 */
export function updateConnectorsList(): void {
	const container = document.querySelector('#available-connectors-list') as HTMLDivElement;
	if (!container) return;

	const connectors = walletManager.getConnectors();
	const state = walletManager.getState();

	if (connectors.length === 0) {
		container.innerHTML = '<p style="color: var(--text-secondary);">No connectors available</p>';
		return;
	}

	container.innerHTML = connectors
		.map((connector) => {
			const metadata = connector.getMetadata();
			const isActive = state.connector?.id === connector.id;

			return `
				<div class="network-item ${isActive ? 'active' : ''}">
					<div class="network-icon" style="background: var(--accent); font-size: 0.75rem;">
						${metadata.icon ? `<img src="${metadata.icon}" style="width: 100%; height: 100%; border-radius: 50%;" />` : metadata.name.charAt(0)}
					</div>
					<div class="network-info">
						<div class="network-name">${metadata.name}</div>
						<div class="network-chain-id">${connector.id}</div>
					</div>
					<div>
						${isActive ? '<span class="network-badge current">Connected</span>' : ''}
						${!connector.ready ? '<span class="network-badge" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">Not Ready</span>' : ''}
					</div>
					<button class="connect-connector-btn small"
						data-connector-id="${connector.id}"
						${!connector.ready || isActive ? 'disabled' : ''}>
						${isActive ? 'Connected' : 'Connect'}
					</button>
				</div>
			`;
		})
		.join('');

	// 绑定连接按钮
	container.querySelectorAll('.connect-connector-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			const connectorId = (btn as HTMLButtonElement).dataset.connectorId;
			if (!connectorId) return;

			const connector = walletManager.getConnector(connectorId);
			if (!connector) return;

			void (async () => {
				try {
					const currentChainId = networkManager.getCurrentChainId('demo-app');
					if (!currentChainId) {
						alert('Please enable at least one network first');
						return;
					}

					await walletManager.connect(connector, currentChainId);
					console.log('[NetworkExample] Connected to:', connector.name);
				} catch (error) {
					console.error('[NetworkExample] Connection failed:', error);
					alert(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
				}
			})();
		});
	});
}

/**
 * 显示添加网络弹窗
 */
export function showAddNetworkModal(): void {
	const modal = document.querySelector('#add-network-modal') as HTMLDivElement;
	if (modal) {
		// 清空表单
		(document.querySelector('#network-name') as HTMLInputElement).value = '';
		(document.querySelector('#network-chain-id') as HTMLInputElement).value = '';
		(document.querySelector('#network-symbol') as HTMLInputElement).value = '';
		(document.querySelector('#network-rpc') as HTMLInputElement).value = '';
		(document.querySelector('#network-explorer') as HTMLInputElement).value = '';

		modal.style.display = 'flex';
	}
}

/**
 * 隐藏添加网络弹窗
 */
export function hideAddNetworkModal(): void {
	const modal = document.querySelector('#add-network-modal') as HTMLDivElement;
	if (modal) {
		modal.style.display = 'none';
	}
}

/**
 * 显示编辑网络弹窗
 */
function showEditNetworkModal(network: NetworkConfig): void {
	const modal = document.querySelector('#add-network-modal') as HTMLDivElement;
	if (modal) {
		// 填充表单
		(document.querySelector('#network-name') as HTMLInputElement).value = network.name;
		(document.querySelector('#network-chain-id') as HTMLInputElement).value =
			network.chainId.toString();
		(document.querySelector('#network-chain-id') as HTMLInputElement).disabled = true; // 不允许修改 chainId
		(document.querySelector('#network-symbol') as HTMLInputElement).value = network.symbol;
		(document.querySelector('#network-rpc') as HTMLInputElement).value =
			network.rpcEndpoints[0]?.url || '';
		(document.querySelector('#network-explorer') as HTMLInputElement).value =
			network.blockExplorer || '';

		modal.style.display = 'flex';
	}
}

/**
 * 保存网络
 */
export function saveNetwork(): void {
	const name = (document.querySelector('#network-name') as HTMLInputElement).value.trim();
	const chainIdStr = (document.querySelector('#network-chain-id') as HTMLInputElement).value.trim();
	const symbol = (document.querySelector('#network-symbol') as HTMLInputElement).value.trim();
	const rpcUrl = (document.querySelector('#network-rpc') as HTMLInputElement).value.trim();
	const explorer = (document.querySelector('#network-explorer') as HTMLInputElement).value.trim();

	// 验证
	if (!name || !chainIdStr || !symbol || !rpcUrl) {
		alert('Please fill in all required fields');
		return;
	}

	const chainId = parseInt(chainIdStr);
	if (isNaN(chainId) || chainId <= 0) {
		alert('Invalid chain ID');
		return;
	}

	// 检查是否已存在
	const existing = networkManager.getNetwork(chainId);
	const isEdit = !!existing;

	// 创建 RPC 端点
	const rpcEndpoints: RpcEndpoint[] = [
		{
			url: rpcUrl,
			isPrimary: true,
			isAvailable: true
		}
	];

	// 添加或更新网络
	networkManager.addOrUpdateCustomNetwork({
		chainId,
		name,
		symbol,
		rpcEndpoints,
		blockExplorer: explorer || undefined
	});

	// 更新 UI
	updateAllNetworksList();
	updateEnabledNetworksList();
	hideAddNetworkModal();

	// 重新启用 chainId 输入框（下次使用）
	(document.querySelector('#network-chain-id') as HTMLInputElement).disabled = false;

	console.log(`[NetworkExample] Network ${isEdit ? 'updated' : 'added'}:`, name);
}

/**
 * 断开钱包连接
 */
export function disconnectWallet(): void {
	void (async () => {
		try {
			await walletManager.disconnect();
			console.log('[NetworkExample] Disconnected');
		} catch (error) {
			console.error('[NetworkExample] Disconnect failed:', error);
		}
	})();
}

/**
 * 切换到第一个启用的网络
 */
export function switchToFirstNetwork(): void {
	const enabledNetworks = networkManager.getEnabledNetworks('demo-app');
	if (enabledNetworks.length === 0) {
		alert('No enabled networks available');
		return;
	}

	void (async () => {
		try {
			await walletManager.switchChain(enabledNetworks[0].chainId);
			console.log('[NetworkExample] Switched to:', enabledNetworks[0].name);
		} catch (error) {
			console.error('[NetworkExample] Switch failed:', error);
			alert(`Failed to switch network: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	})();
}

/**
 * 初始化示例
 */
export function initNetworkExample(): void {
	console.log('[NetworkExample] Initializing...');

	// 订阅钱包状态变化
	walletManager.subscribe((state) => {
		console.log('[NetworkExample] Wallet state updated:', state);
		updateWalletStatus();
		updateAllNetworksList();
		updateEnabledNetworksList();
	});

	// 监听 NetworkManager 事件
	networkManager.on('networkAdded', (network) => {
		console.log('[NetworkExample] Network added:', network.name);
		updateAllNetworksList();
	});

	networkManager.on('networkRemoved', (chainId) => {
		console.log('[NetworkExample] Network removed:', chainId);
		updateAllNetworksList();
		updateEnabledNetworksList();
	});

	networkManager.on('networkUpdated', (network) => {
		console.log('[NetworkExample] Network updated:', network.name);
		updateAllNetworksList();
		updateEnabledNetworksList();
	});

	networkManager.on('networkToggled', (_namespace, chainId, enabled) => {
		console.log('[NetworkExample] Network toggled:', chainId, enabled);
		updateAllNetworksList();
		updateEnabledNetworksList();
	});

	networkManager.on('currentNetworkChanged', (_namespace, chainId) => {
		console.log('[NetworkExample] Current network changed:', chainId);
		updateAllNetworksList();
		updateEnabledNetworksList();
	});

	// 启动 EIP-6963 钱包发现
	watchEIP6963Wallets((wallets: EIP6963ProviderDetail[]) => {
		console.log('[NetworkExample] Discovered EIP-6963 wallets:', wallets);

		wallets.forEach((wallet) => {
			const existingConnector = walletManager.getConnector(`eip6963:${wallet.info.rdns}`);
			if (existingConnector) {
				return;
			}

			const connector = new EIP6963Connector({
				chains: supportedChains,
				shimDisconnect: true,
				providerDetail: wallet
			});

			walletManager.registerConnector(connector);
			console.log('[NetworkExample] Registered wallet:', wallet.info.name);
		});

		updateConnectorsList();
	});

	// 初始化 UI
	updateAllNetworksList();
	updateEnabledNetworksList();
	updateWalletStatus();
	updateConnectorsList();

	console.log('[NetworkExample] Initialization complete');
}

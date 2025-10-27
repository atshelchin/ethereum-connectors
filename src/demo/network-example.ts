import { mainnet, polygon, base, bsc, arbitrum, optimism } from 'viem/chains';
import { IntegratedManager } from '../core/manager/integrated-manager';
import { InjectedConnector } from '../adapters/injected/connector';
import { WalletConnectConnector } from '../adapters/wallet-connect/connector';
import { CoinbaseSmartWalletConnector } from '../adapters/base-account/connector';
import { EIP6963Connector } from '../adapters/eip6963/connector';
import { watchEIP6963Wallets } from '../adapters/eip6963/discovery';
import type { NetworkConfig, RpcEndpoint } from '../core/types/network';
import type { EIP6963ProviderDetail } from '../adapters/eip6963/types';
import QRCodeStyling from 'qr-code-styling';

/**
 * Network Manager 示例
 *
 * 展示如何使用 IntegratedManager 来管理网络和钱包连接
 */

// 默认支持的链列表（仅在 localStorage 为空时使用）
const defaultChains = [mainnet, polygon, base, bsc, arbitrum, optimism];

// 转换为 NetworkConfig
const builtInNetworks: NetworkConfig[] = defaultChains.map((chain) => ({
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

// 先创建一个临时的 NetworkManager 来检查 localStorage
import { NetworkManager } from '../core/manager/network-manager';
const tempNetworkManager = new NetworkManager(builtInNetworks);

// 获取 localStorage 中保存的启用网络列表
const enabledNetworks = tempNetworkManager.getEnabledNetworks('demo-app');

// 如果 localStorage 为空，使用默认链列表初始化
if (enabledNetworks.length === 0) {
	console.log('[NetworkExample] No enabled networks in localStorage, initializing with defaults');
	tempNetworkManager.initializeNamespace(
		'demo-app',
		defaultChains.map((chain) => chain.id)
	);
}

// 获取最终的启用网络列表（从 localStorage 或默认值）
const finalEnabledNetworks = tempNetworkManager.getEnabledNetworks('demo-app');

// 将 NetworkConfig 转换为 viem Chain
const initialChains = finalEnabledNetworks.map((network) => ({
	id: network.chainId,
	name: network.name,
	nativeCurrency: {
		name: network.symbol,
		symbol: network.symbol,
		decimals: 18
	},
	rpcUrls: {
		default: {
			http: network.rpcEndpoints
				.filter((rpc) => rpc.isPrimary || rpc.isAvailable !== false)
				.map((rpc) => rpc.url)
		},
		public: {
			http: network.rpcEndpoints.map((rpc) => rpc.url)
		}
	},
	blockExplorers: network.blockExplorer
		? {
				default: {
					name: 'Explorer',
					url: network.blockExplorer
				}
			}
		: undefined
}));

console.log(
	'[NetworkExample] Initializing connectors with chains:',
	initialChains.map((c) => `${c.name}(${c.id})`).join(', ')
);

// 创建连接器（使用从 localStorage 加载的链列表）
const injectedConnector = new InjectedConnector({
	chains: initialChains,
	shimDisconnect: true
});

const coinbaseConnector = new CoinbaseSmartWalletConnector({
	chains: initialChains,
	shimDisconnect: true,
	appName: 'Network Manager Demo',
	appLogoUrl: 'https://example.com/logo.png'
});

const walletConnectConnector = new WalletConnectConnector({
	chains: initialChains,
	shimDisconnect: true,
	projectId: 'e3928bd840eee588e157816acb2c8ad8',
	metadata: {
		name: 'Network Manager Demo',
		description: 'Demo for network management',
		url: typeof window !== 'undefined' ? window.location.origin : '',
		icons: ['https://walletconnect.com/walletconnect-logo.png']
	}
});

// 创建集成管理器（会复用 localStorage 中的配置）
export const integratedManager = new IntegratedManager(
	[injectedConnector, coinbaseConnector, walletConnectConnector],
	builtInNetworks,
	'demo-app'
);

// 获取 NetworkManager 和 WalletManager
const networkManager = integratedManager.getNetworkManager();
const walletManager = integratedManager.getWalletManager();

// QR Code 实例
let qrCode: QRCodeStyling | null = null;

/**
 * 显示 QR Code
 */
function showQRCode(uri: string): void {
	const modal = document.querySelector('#qr-modal') as HTMLDivElement;
	const qrContainer = document.querySelector('#qr-code') as HTMLDivElement;

	if (!modal || !qrContainer) return;

	qrContainer.innerHTML = '';

	qrCode = new QRCodeStyling({
		width: 300,
		height: 300,
		data: uri,
		margin: 10,
		qrOptions: {
			typeNumber: 0,
			mode: 'Byte',
			errorCorrectionLevel: 'Q'
		},
		dotsOptions: {
			type: 'rounded',
			color: '#000000'
		},
		backgroundOptions: {
			color: '#ffffff'
		}
	});

	qrCode.append(qrContainer);
	modal.style.display = 'flex';
}

/**
 * 隐藏 QR Code
 */
function hideQRCode(): void {
	const modal = document.querySelector('#qr-modal') as HTMLDivElement;
	if (modal) {
		modal.style.display = 'none';
	}
}

/**
 * 更新支持的网络显示
 */
export function updateSupportedNetworksDisplay(): void {
	const container = document.querySelector('#supported-networks-display') as HTMLDivElement;
	if (!container) return;

	const enabledNetworks = networkManager.getEnabledNetworks('demo-app');

	if (enabledNetworks.length === 0) {
		container.innerHTML = '<span style="color: var(--text-secondary);">No networks enabled</span>';
		return;
	}

	container.innerHTML = enabledNetworks
		.map(
			(network) =>
				`<span style="display: inline-block; margin: 0.25rem; padding: 0.25rem 0.5rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.813rem;">${network.name}</span>`
		)
		.join('');
}

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
				updateSupportedNetworksDisplay();
			}
		});
	});

	container.querySelectorAll('.delete-network-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			const chainId = parseInt((btn as HTMLButtonElement).dataset.chainId || '0');
			const network = networkManager.getNetwork(chainId);

			if (network && confirm(`Delete network "${network.name}"?`)) {
				try {
					networkManager.removeCustomNetwork(chainId);
					updateAllNetworksList();
					updateEnabledNetworksList();
					updateSupportedNetworksDisplay();
				} catch (error) {
					alert(error instanceof Error ? error.message : 'Failed to delete network');
				}
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
	const connectorElement = document.querySelector('#wallet-connector') as HTMLDivElement;
	const networkElement = document.querySelector('#wallet-network') as HTMLDivElement;
	const addressElement = document.querySelector('#wallet-address') as HTMLDivElement;
	const disconnectBtn = document.querySelector('#disconnect-wallet-btn') as HTMLButtonElement;
	const switchBtn = document.querySelector('#switch-to-first-network-btn') as HTMLButtonElement;

	const state = walletManager.getState();

	if (statusElement) {
		statusElement.textContent = state.isConnected ? 'Connected' : 'Disconnected';
		statusElement.style.color = state.isConnected ? 'var(--success)' : 'var(--text-secondary)';
	}

	if (connectorElement) {
		if (state.isConnected && state.connector) {
			const metadata = state.connector.getMetadata();
			connectorElement.innerHTML = `
				<div style="display: flex; align-items: center; gap: 0.5rem;">
					${metadata.icon ? `<img src="${metadata.icon}" alt="${metadata.name}" style="width: 20px; height: 20px; border-radius: 4px;" />` : ''}
					<span>${metadata.name}</span>
				</div>
			`;
		} else {
			connectorElement.textContent = '-';
		}
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

// 存储当前编辑的 RPC 端点列表
let currentRpcEndpoints: RpcEndpoint[] = [];

/**
 * 渲染 RPC 端点列表
 */
function renderRpcEndpoints(): void {
	const container = document.querySelector('#rpc-endpoints-list') as HTMLDivElement;
	if (!container) return;

	if (currentRpcEndpoints.length === 0) {
		container.innerHTML =
			'<p style="color: var(--text-secondary); font-size: 0.875rem;">No RPC endpoints added yet</p>';
		return;
	}

	container.innerHTML = currentRpcEndpoints
		.map(
			(rpc, index) => `
			<div style="display: flex; gap: 0.5rem; align-items: center;">
				<input type="text" class="form-input" value="${rpc.url}"
					data-rpc-index="${index}"
					placeholder="https://..."
					style="flex: 1;" />
				<button type="button" class="set-primary-rpc-btn small ${rpc.isPrimary ? '' : 'secondary'}"
					data-rpc-index="${index}"
					${rpc.isPrimary ? 'disabled' : ''}>
					${rpc.isPrimary ? '✓ Primary' : 'Set Primary'}
				</button>
				<button type="button" class="remove-rpc-btn small danger"
					data-rpc-index="${index}"
					${currentRpcEndpoints.length === 1 ? 'disabled' : ''}>
					×
				</button>
			</div>
		`
		)
		.join('');

	// 绑定事件
	container.querySelectorAll('input[data-rpc-index]').forEach((input) => {
		input.addEventListener('input', (e) => {
			const index = parseInt((e.target as HTMLInputElement).dataset.rpcIndex || '0');
			currentRpcEndpoints[index].url = (e.target as HTMLInputElement).value;
		});
	});

	container.querySelectorAll('.set-primary-rpc-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			const index = parseInt((btn as HTMLButtonElement).dataset.rpcIndex || '0');
			// 取消所有primary
			currentRpcEndpoints.forEach((rpc) => {
				rpc.isPrimary = false;
			});
			// 设置当前为primary
			currentRpcEndpoints[index].isPrimary = true;
			renderRpcEndpoints();
		});
	});

	container.querySelectorAll('.remove-rpc-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			const index = parseInt((btn as HTMLButtonElement).dataset.rpcIndex || '0');
			const wasPrimary = currentRpcEndpoints[index].isPrimary;
			currentRpcEndpoints.splice(index, 1);
			// 如果删除的是主RPC，设置第一个为主RPC
			if (wasPrimary && currentRpcEndpoints.length > 0) {
				currentRpcEndpoints[0].isPrimary = true;
			}
			renderRpcEndpoints();
		});
	});
}

/**
 * 添加新的 RPC 端点
 */
export function addRpcEndpoint(): void {
	currentRpcEndpoints.push({
		url: '',
		isPrimary: currentRpcEndpoints.length === 0, // 第一个自动为主RPC
		isAvailable: true
	});
	renderRpcEndpoints();

	// 聚焦到新添加的输入框
	setTimeout(() => {
		const inputs = document.querySelectorAll('#rpc-endpoints-list input[data-rpc-index]');
		const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
		if (lastInput) {
			lastInput.focus();
		}
	}, 0);
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
		(document.querySelector('#network-explorer') as HTMLInputElement).value = '';

		// 重置 RPC 列表（添加一个空的）
		currentRpcEndpoints = [
			{
				url: '',
				isPrimary: true,
				isAvailable: true
			}
		];
		renderRpcEndpoints();

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
		(document.querySelector('#network-explorer') as HTMLInputElement).value =
			network.blockExplorer || '';

		// 加载现有的 RPC 端点
		currentRpcEndpoints = network.rpcEndpoints.map((rpc) => ({ ...rpc }));
		renderRpcEndpoints();

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
	const explorer = (document.querySelector('#network-explorer') as HTMLInputElement).value.trim();

	// 验证
	if (!name || !chainIdStr || !symbol) {
		alert('Please fill in all required fields');
		return;
	}

	// 验证 RPC 端点
	const validRpcs = currentRpcEndpoints.filter((rpc) => rpc.url.trim() !== '');
	if (validRpcs.length === 0) {
		alert('Please add at least one RPC endpoint');
		return;
	}

	// 确保有一个 primary RPC
	if (!validRpcs.some((rpc) => rpc.isPrimary)) {
		validRpcs[0].isPrimary = true;
	}

	const chainId = parseInt(chainIdStr);
	if (isNaN(chainId) || chainId <= 0) {
		alert('Invalid chain ID');
		return;
	}

	// 检查是否已存在
	const existing = networkManager.getNetwork(chainId);
	const isEdit = !!existing;

	// 添加或更新网络
	networkManager.addOrUpdateCustomNetwork({
		chainId,
		name,
		symbol,
		rpcEndpoints: validRpcs,
		blockExplorer: explorer || undefined
	});

	// 更新 UI
	updateAllNetworksList();
	updateEnabledNetworksList();
	updateSupportedNetworksDisplay();
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
			alert(
				`Failed to switch network: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	})();
}

/**
 * 初始化示例
 */
export function initNetworkExample(): void {
	console.log('[NetworkExample] Initializing...');

	// 监听 WalletConnect 的 display_uri 事件
	walletConnectConnector.on('display_uri', (uri) => {
		console.log('[NetworkExample] WalletConnect URI:', uri);
		showQRCode(uri);
	});

	// 订阅钱包状态变化
	walletManager.subscribe((state) => {
		console.log('[NetworkExample] Wallet state updated:', state);
		updateWalletStatus();
		updateAllNetworksList();
		updateEnabledNetworksList();

		// 连接成功后隐藏二维码
		if (state.isConnected) {
			hideQRCode();
		}
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
		updateSupportedNetworksDisplay();
	});

	networkManager.on('currentNetworkChanged', (_namespace, chainId) => {
		console.log('[NetworkExample] Current network changed:', chainId);
		updateAllNetworksList();
		updateEnabledNetworksList();
		updateSupportedNetworksDisplay();
	});

	// 标记是否已尝试自动连接
	let autoConnectAttempted = false;

	// 启动 EIP-6963 钱包发现
	watchEIP6963Wallets((wallets: EIP6963ProviderDetail[]) => {
		console.log('[NetworkExample] Discovered EIP-6963 wallets:', wallets);

		wallets.forEach((wallet) => {
			const existingConnector = walletManager.getConnector(`eip6963:${wallet.info.rdns}`);
			if (existingConnector) {
				return;
			}

			// 使用当前启用的网络列表来创建 EIP-6963 连接器
			const enabledNetworks = networkManager.getEnabledNetworks('demo-app');
			const chains = enabledNetworks.map((network) => ({
				id: network.chainId,
				name: network.name,
				nativeCurrency: {
					name: network.symbol,
					symbol: network.symbol,
					decimals: 18
				},
				rpcUrls: {
					default: {
						http: network.rpcEndpoints
							.filter((rpc) => rpc.isPrimary || rpc.isAvailable !== false)
							.map((rpc) => rpc.url)
					},
					public: {
						http: network.rpcEndpoints.map((rpc) => rpc.url)
					}
				},
				blockExplorers: network.blockExplorer
					? {
							default: {
								name: 'Explorer',
								url: network.blockExplorer
							}
						}
					: undefined
			}));

			const connector = new EIP6963Connector({
				chains,
				shimDisconnect: true,
				providerDetail: wallet
			});

			walletManager.registerConnector(connector);
			console.log('[NetworkExample] Registered wallet:', wallet.info.name);
		});

		updateConnectorsList();

		// EIP-6963 钱包发现完成后尝试自动连接
		if (!autoConnectAttempted) {
			attemptAutoConnect();
		}
	});

	// 自动连接函数
	const attemptAutoConnect = () => {
		autoConnectAttempted = true;
		void (async () => {
			console.log('[NetworkExample] Attempting auto-connect...');
			const success = await walletManager.autoConnect();
			console.log('[NetworkExample] Auto-connect result:', success);
		})();
	};

	// 给 EIP-6963 一些时间来发现钱包（500ms 超时）
	// 如果超时还没发现任何钱包，也尝试自动连接（可能使用内置连接器）
	setTimeout(() => {
		if (!autoConnectAttempted) {
			console.log('[NetworkExample] EIP-6963 timeout, attempting auto-connect anyway...');
			attemptAutoConnect();
		}
	}, 500);

	// 初始化 UI
	updateAllNetworksList();
	updateEnabledNetworksList();
	updateSupportedNetworksDisplay();
	updateWalletStatus();
	updateConnectorsList();

	console.log('[NetworkExample] Initialization complete');
}

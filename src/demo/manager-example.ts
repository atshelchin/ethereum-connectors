import { mainnet, polygon, base, bsc } from 'viem/chains';
import { WalletConnectionManager } from '../core/manager/wallet-connection-manager';
import { InjectedConnector } from '../adapters/injected/connector';
import { CoinbaseSmartWalletConnector } from '../adapters/base-account/connector';
import { WalletConnectConnector } from '../adapters/wallet-connect/connector';
import { EIP6963Connector } from '../adapters/eip6963/connector';
import { watchEIP6963Wallets } from '../adapters/eip6963/discovery';
import type { EIP6963ProviderDetail } from '../adapters/eip6963/types';
import type { ConnectionState } from '../core/types';
import QRCodeStyling from 'qr-code-styling';

/**
 * 连接管理器示例
 *
 * 展示如何使用 WalletConnectionManager 来管理多个钱包连接器：
 * - 同时只允许一个连接
 * - 自动重连（页面刷新后）
 * - 统一的状态管理
 * - 连接器切换
 */

// 支持的链列表
const supportedChains = [mainnet, polygon, base, bsc];

// 创建连接器
const injectedConnector = new InjectedConnector({
	chains: supportedChains,
	shimDisconnect: true
});

const coinbaseConnector = new CoinbaseSmartWalletConnector({
	chains: supportedChains,
	shimDisconnect: true,
	appName: 'Ethereum Connectors Demo',
	appLogoUrl: 'https://example.com/logo.png'
});

const walletConnectConnector = new WalletConnectConnector({
	chains: supportedChains,
	shimDisconnect: true,
	projectId: 'e68249e217c8793807b7bb961a2f4297',
	metadata: {
		name: 'Ethereum Connectors Demo',
		description: 'Demo for Ethereum wallet connectors',
		url: typeof window !== 'undefined' ? window.location.origin : '',
		icons: ['https://walletconnect.com/walletconnect-logo.png']
	}
});

// 创建连接管理器
export const connectionManager = new WalletConnectionManager(
	[injectedConnector, coinbaseConnector, walletConnectConnector],
	supportedChains
);

// QR Code 实例
let qrCode: QRCodeStyling | null = null;

// 显示 QR Code Modal
function showQRCode(uri: string) {
	const modal = document.querySelector('#qr-modal') as HTMLDivElement;
	const qrContainer = document.querySelector('#qr-code') as HTMLDivElement;

	if (!modal || !qrContainer) return;

	// 清空之前的二维码
	qrContainer.innerHTML = '';

	// 创建新的二维码
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
		imageOptions: {
			hideBackgroundDots: true,
			imageSize: 0.4,
			margin: 0
		},
		dotsOptions: {
			type: 'rounded',
			color: '#000000'
		},
		backgroundOptions: {
			color: '#ffffff'
		},
		cornersSquareOptions: {
			type: 'extra-rounded',
			color: '#000000'
		},
		cornersDotOptions: {
			type: 'dot',
			color: '#000000'
		}
	});

	qrCode.append(qrContainer);
	modal.classList.add('show');
}

// 隐藏 QR Code Modal
function hideQRCode() {
	const modal = document.querySelector('#qr-modal') as HTMLDivElement;
	if (modal) {
		modal.classList.remove('show');
	}
}

// 辅助函数：格式化地址
const formatAddress = (address: string) => {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 辅助函数：获取网络名称
const getChainName = (chainId: number) => {
	const chainMap: Record<number, string> = {
		1: 'Ethereum Mainnet',
		56: 'BSC',
		137: 'Polygon',
		42161: 'Arbitrum',
		10: 'Optimism',
		8453: 'Base'
	};
	return chainMap[chainId] || `Chain ${chainId}`;
};

/**
 * 更新 UI 以反映连接状态
 */
function updateConnectionUI(state: ConnectionState) {
	const statusElement = document.querySelector('#manager-status') as HTMLDivElement;
	const connectorElement = document.querySelector('#manager-connector') as HTMLDivElement;
	const addressElement = document.querySelector('#manager-address') as HTMLDivElement;
	const chainElement = document.querySelector('#manager-chain') as HTMLDivElement;
	const accountsElement = document.querySelector('#manager-accounts') as HTMLDivElement;

	if (!statusElement) return;

	// 更新连接状态
	if (state.isConnecting) {
		statusElement.innerHTML = '<span style="color: orange;">⏳ Connecting...</span>';
	} else if (state.isConnected) {
		statusElement.innerHTML = '<span style="color: #4caf50;">✓ Connected</span>';
	} else {
		statusElement.innerHTML = '<span style="color: #888;">○ Disconnected</span>';
	}

	// 更新连接器信息
	if (state.connector && connectorElement) {
		const metadata = state.connector.getMetadata();
		connectorElement.innerHTML = `
			<div style="display: flex; align-items: center; gap: 0.5rem;">
				<img src="${metadata.icon}" alt="${metadata.name}" style="width: 24px; height: 24px; border-radius: 4px;" />
				<span>${metadata.name}</span>
			</div>
		`;
	} else if (connectorElement) {
		connectorElement.innerHTML = '<span style="color: #888;">None</span>';
	}

	// 更新地址
	if (state.address && addressElement) {
		addressElement.innerHTML = `<code>${formatAddress(state.address)}</code>`;
	} else if (addressElement) {
		addressElement.innerHTML = '<span style="color: #888;">-</span>';
	}

	// 更新网络
	if (state.chainId && chainElement) {
		chainElement.innerHTML = `${getChainName(state.chainId)} (${state.chainId})`;
	} else if (chainElement) {
		chainElement.innerHTML = '<span style="color: #888;">-</span>';
	}

	// 更新账户列表
	if (state.addresses && state.addresses.length > 0 && accountsElement) {
		accountsElement.innerHTML = state.addresses
			.map((addr, idx) => {
				const isActive = addr === state.address;
				const clickable = !isActive && state.isConnected;
				return `
					<div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0;">
						<span>${idx + 1}.</span>
						<code style="flex: 1;">${formatAddress(addr)}</code>
						${isActive ? '<strong style="color: var(--success);">(Active)</strong>' : ''}
						${clickable ? `<button class="switch-account-btn" data-address="${addr}" style="padding: 0.25rem 0.75rem; font-size: 0.813rem;">Switch</button>` : ''}
					</div>
				`;
			})
			.join('');

		// 绑定切换账户按钮事件
		accountsElement.querySelectorAll('.switch-account-btn').forEach((btn) => {
			btn.addEventListener('click', () => {
				const address = (btn as HTMLButtonElement).dataset.address;
				if (!address) return;

				void (async () => {
					try {
						await connectionManager.switchAccount(address as `0x${string}`);
						console.log('[ManagerExample] Switched to account:', address);
					} catch (error) {
						console.error('[ManagerExample] Account switch failed:', error);
						alert(
							`Failed to switch account: ${error instanceof Error ? error.message : 'Unknown error'}`
						);
					}
				})();
			});
		});
	} else if (accountsElement) {
		accountsElement.innerHTML = '<span style="color: #888;">-</span>';
	}

	// 更新按钮状态
	updateButtonStates(state);
}

/**
 * 更新按钮的启用/禁用状态
 */
function updateButtonStates(state: ConnectionState) {
	const disconnectBtn = document.querySelector('#manager-disconnect') as HTMLButtonElement;
	const switchChainButtons = document.querySelectorAll('.manager-switch-chain');
	const switchAccountBtn = document.querySelector('#manager-switch-account') as HTMLButtonElement;

	if (disconnectBtn) {
		disconnectBtn.disabled = !state.isConnected;
	}

	switchChainButtons.forEach((btn) => {
		(btn as HTMLButtonElement).disabled = !state.isConnected;
	});

	if (switchAccountBtn) {
		switchAccountBtn.disabled =
			!state.isConnected || !state.addresses || state.addresses.length <= 1;
	}
}

/**
 * 初始化连接管理器示例
 */
export function initManagerExample() {
	console.log('[ManagerExample] Initializing...');

	// 订阅状态变化
	connectionManager.subscribe((state) => {
		console.log('[ManagerExample] State updated:', state);
		updateConnectionUI(state);

		// 如果连接成功，隐藏二维码
		if (state.isConnected) {
			hideQRCode();
		}
	});

	// 监听 WalletConnect 的 display_uri 事件
	walletConnectConnector.on('display_uri', (uri) => {
		console.log('[ManagerExample] WalletConnect URI:', uri);
		showQRCode(uri);
	});

	// 标记：EIP-6963 钱包发现是否完成
	// let eip6963Ready = false;
	let autoConnectAttempted = false;

	// 启动 EIP-6963 钱包发现
	watchEIP6963Wallets((wallets: EIP6963ProviderDetail[]) => {
		console.log('[ManagerExample] Discovered EIP-6963 wallets:', wallets);

		wallets.forEach((wallet) => {
			// 检查是否已注册
			const existingConnector = connectionManager.getConnector(`eip6963:${wallet.info.rdns}`);
			if (existingConnector) {
				console.log('[ManagerExample] Wallet already registered:', wallet.info.name);
				return;
			}

			// 创建并注册新的连接器
			const connector = new EIP6963Connector({
				chains: supportedChains,
				shimDisconnect: true,
				providerDetail: wallet
			});

			connectionManager.registerConnector(connector);
			console.log('[ManagerExample] Registered wallet:', wallet.info.name);
		});

		// 更新连接器列表 UI
		updateConnectorsList();

		// 如果还没尝试自动连接，现在尝试
		if (!autoConnectAttempted) {
			attemptAutoConnect();
		}
	});

	// 自动连接函数
	const attemptAutoConnect = () => {
		autoConnectAttempted = true;
		void (async () => {
			console.log('[ManagerExample] Attempting auto-connect...');
			const success = await connectionManager.autoConnect();
			console.log('[ManagerExample] Auto-connect result:', success);
		})();
	};

	// 给 EIP-6963 钱包一些时间来宣告自己（通常很快，但要容错）
	// 如果 500ms 后还没有发现任何钱包，也尝试自动连接（可能使用内置连接器）
	setTimeout(() => {
		if (!autoConnectAttempted) {
			console.log('[ManagerExample] EIP-6963 timeout, attempting auto-connect anyway...');
			attemptAutoConnect();
		}
	}, 500);
}

/**
 * 更新连接器列表 UI
 */
function updateConnectorsList() {
	const container = document.querySelector('#manager-connectors-list') as HTMLDivElement;
	if (!container) return;

	const connectors = connectionManager.getConnectors();
	const state = connectionManager.getState();

	container.innerHTML = connectors
		.map((connector) => {
			const metadata = connector.getMetadata();
			const isActive = state.connector?.id === connector.id;
			const isReady = connector.ready;

			return `
				<div class="connector-item ${isActive ? 'active' : ''}" data-connector-id="${connector.id}">
					<img src="${metadata.icon}" alt="${metadata.name}" style="width: 32px; height: 32px; border-radius: 4px;" />
					<div class="connector-info">
						<strong>${metadata.name}</strong>
						<small>${connector.id}</small>
					</div>
					<div class="connector-status">
						${isActive ? '<span style="color: #4caf50;">✓ Active</span>' : ''}
						${!isReady ? '<span style="color: #888;">Not Ready</span>' : ''}
					</div>
					<button
						class="connector-connect-btn"
						data-connector-id="${connector.id}"
						${!isReady || isActive ? 'disabled' : ''}
					>
						${isActive ? 'Connected' : 'Connect'}
					</button>
				</div>
			`;
		})
		.join('');

	// 绑定连接按钮事件
	container.querySelectorAll('.connector-connect-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			void (async () => {
				const connectorId = (btn as HTMLButtonElement).dataset.connectorId;
				if (!connectorId) return;

				const connector = connectionManager.getConnector(connectorId);
				if (!connector) return;

				try {
					// 连接到以太坊主网
					await connectionManager.connect(connector, 1);
					console.log('[ManagerExample] Connected to:', connector.name);
				} catch (error) {
					console.error('[ManagerExample] Connection failed:', error);
					alert(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
				}
			})();
		});
	});
}

/**
 * 设置断开连接按钮
 */
export function setupManagerDisconnect(element: HTMLButtonElement) {
	element.addEventListener('click', () => {
		void (async () => {
			try {
				await connectionManager.disconnect();
				console.log('[ManagerExample] Disconnected');
			} catch (error) {
				console.error('[ManagerExample] Disconnect failed:', error);
			}
		})();
	});
}

/**
 * 设置切换网络按钮
 */
export function setupManagerSwitchChain(element: HTMLButtonElement, chainId: number) {
	element.addEventListener('click', () => {
		void (async () => {
			const state = connectionManager.getState();
			console.log('[ManagerExample] Switch chain requested. Current state:', {
				isConnected: state.isConnected,
				currentChainId: state.chainId,
				targetChainId: chainId,
				connector: state.connector?.name
			});

			if (!state.connector) {
				alert('Please connect a wallet first');
				return;
			}

			try {
				console.log('[ManagerExample] Calling connectionManager.switchChain...');
				await connectionManager.switchChain(chainId);
				console.log('[ManagerExample] Successfully switched to chain:', chainId);
			} catch (error) {
				console.error('[ManagerExample] Chain switch failed:', error);
				alert(
					`Failed to switch chain to ${getChainName(chainId)}: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		})();
	});
}

/**
 * 设置切换账户按钮 (请求权限获取更多账户)
 */
export function setupManagerSwitchAccount(element: HTMLButtonElement) {
	element.addEventListener('click', () => {
		void (async () => {
			const state = connectionManager.getState();
			if (!state.connector) {
				alert('No connector connected');
				return;
			}

			try {
				// 请求钱包返回所有账户（某些钱包需要用户授权）
				const provider = state.connector.getProvider();
				const accounts = (await provider.request({
					method: 'eth_requestAccounts'
				})) as string[];

				console.log('[ManagerExample] Requested accounts:', accounts);

				if (accounts.length > 1) {
					alert(
						`Found ${accounts.length} accounts. You can now switch between them in the Accounts list above.`
					);
				} else {
					alert('Only one account available in this wallet');
				}
			} catch (error) {
				console.error('[ManagerExample] Failed to request accounts:', error);
				alert(
					`Failed to request accounts: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		})();
	});
}

/**
 * 设置清除持久化连接按钮（用于测试）
 */
export function setupManagerClearStorage(element: HTMLButtonElement) {
	element.addEventListener('click', () => {
		localStorage.removeItem('connection:ConnectionStorage');
		alert('Cleared persisted connection. Refresh the page to test auto-connect.');
	});
}

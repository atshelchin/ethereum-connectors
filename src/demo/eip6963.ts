import { mainnet, polygon } from 'viem/chains';
import { EIP6963Connector } from '../adapters/eip6963/connector';
import { watchEIP6963Wallets } from '../adapters/eip6963/discovery';
import type { EIP6963ProviderDetail } from '../adapters/eip6963/types';

// 存储 EIP-6963 发现的钱包连接器
export const eip6963Connectors = new Map<string, EIP6963Connector>();

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

// ==================== EIP-6963 Wallets Functions ====================

// 更新钱包列表 UI
export function updateWalletsList(wallets: EIP6963ProviderDetail[]) {
	const walletsContainer = document.querySelector<HTMLDivElement>('#eip6963-wallets');
	if (!walletsContainer) {
		console.error('Wallets container not found in DOM');
		return;
	}

	walletsContainer.innerHTML = '<h2>EIP-6963 Discovered Wallets</h2>';

	if (wallets.length === 0) {
		walletsContainer.innerHTML += '<p>No wallets detected. Please install a wallet extension.</p>';
		return;
	}

	wallets.forEach((wallet) => {
		const walletDiv = document.createElement('div');
		walletDiv.className = 'wallet-item-wrapper';
		walletDiv.innerHTML = `
			<div class="wallet-item">
				<div class="wallet-info">
					<img src="${wallet.info.icon}" alt="${wallet.info.name}" class="wallet-icon" />
					<div class="wallet-details">
						<strong>${wallet.info.name}</strong>
						<small>${wallet.info.rdns}</small>
						<div class="wallet-connection-info" style="display: none;">
							<span class="wallet-address"></span>
							<span class="wallet-network"></span>
						</div>
					</div>
				</div>
				<div class="wallet-actions">
					<button class="wallet-connect-btn" data-rdns="${wallet.info.rdns}">Connect</button>
					<button class="wallet-disconnect-btn" data-rdns="${wallet.info.rdns}" style="display: none;">Disconnect</button>
					<button class="wallet-switchchain-btn" data-rdns="${wallet.info.rdns}" style="display: none;">Switch to BSC</button>
					<button class="wallet-switchaccount-btn" data-rdns="${wallet.info.rdns}" style="display: none;">Switch Account</button>
				</div>
			</div>
			<div class="wallet-chains-info" style="display: none;">
				<div class="chains-section">
					<strong>Supported Chains (Connector):</strong>
					<div class="chains-list connector-chains"></div>
				</div>
				<div class="chains-section">
					<strong>Supported Chains (DApp):</strong>
					<div class="chains-list dapp-chains"></div>
				</div>
			</div>
		`;
		walletsContainer.appendChild(walletDiv);

		// 获取按钮和信息元素
		const connectBtn = walletDiv.querySelector('.wallet-connect-btn') as HTMLButtonElement;
		const disconnectBtn = walletDiv.querySelector('.wallet-disconnect-btn') as HTMLButtonElement;
		const switchChainBtn = walletDiv.querySelector('.wallet-switchchain-btn') as HTMLButtonElement;
		const switchAccountBtn = walletDiv.querySelector(
			'.wallet-switchaccount-btn'
		) as HTMLButtonElement;
		const connectionInfo = walletDiv.querySelector('.wallet-connection-info') as HTMLDivElement;
		const addressSpan = walletDiv.querySelector('.wallet-address') as HTMLSpanElement;
		const networkSpan = walletDiv.querySelector('.wallet-network') as HTMLSpanElement;
		const chainsInfo = walletDiv.querySelector('.wallet-chains-info') as HTMLDivElement;
		const connectorChains = walletDiv.querySelector('.connector-chains') as HTMLDivElement;
		const dappChains = walletDiv.querySelector('.dapp-chains') as HTMLDivElement;

		// 绑定连接按钮事件
		connectBtn.addEventListener('click', () => {
			void (async () => {
				const walletConnector = eip6963Connectors.get(wallet.info.rdns);
				if (walletConnector && walletConnector.ready) {
					try {
						const result = await walletConnector.connect(1);
						const chainId = await walletConnector.getChainId();
						const account = await walletConnector.getAccount();
						const metadata = walletConnector.getMetadata();

						console.log(`[${wallet.info.name}] Connected:`, {
							result,
							chainId,
							account,
							metadata
						});

						// 更新连接信息显示
						addressSpan.textContent = `Address: ${formatAddress(account)}`;
						networkSpan.textContent = `Network: ${getChainName(chainId)}`;
						connectionInfo.style.display = 'block';

						// 显示网络信息
						const supportedChains = walletConnector.getSupportedChains();
						connectorChains.innerHTML = supportedChains
							? supportedChains
									.map((id) => `<span class="chain-badge">${getChainName(id)} (${id})</span>`)
									.join('')
							: '<span>All chains supported</span>';

						const dappChainsList = [mainnet, polygon];
						dappChains.innerHTML = dappChainsList
							.map((chain) => `<span class="chain-badge">${chain.name} (${chain.id})</span>`)
							.join('');

						chainsInfo.style.display = 'block';

						// 切换按钮显示状态
						connectBtn.style.display = 'none';
						disconnectBtn.style.display = 'inline-block';
						switchChainBtn.style.display = 'inline-block';
						switchAccountBtn.style.display = 'inline-block';
					} catch (error) {
						console.error(`[${wallet.info.name}] Connection failed:`, error);
						alert(`Failed to connect to ${wallet.info.name}`);
					}
				}
			})();
		});

		// 绑定断开连接按钮事件
		disconnectBtn.addEventListener('click', () => {
			void (async () => {
				const walletConnector = eip6963Connectors.get(wallet.info.rdns);
				if (walletConnector && walletConnector.ready) {
					try {
						await walletConnector.disconnect();
						console.log(`[${wallet.info.name}] Disconnected`);

						// 隐藏连接信息和网络信息
						connectionInfo.style.display = 'none';
						chainsInfo.style.display = 'none';

						// 切换按钮显示状态
						connectBtn.style.display = 'inline-block';
						disconnectBtn.style.display = 'none';
						switchChainBtn.style.display = 'none';
						switchAccountBtn.style.display = 'none';
					} catch (error) {
						console.error(`[${wallet.info.name}] Disconnect failed:`, error);
						alert(`Failed to disconnect from ${wallet.info.name}`);
					}
				}
			})();
		});

		// 绑定切换链按钮事件
		switchChainBtn.addEventListener('click', () => {
			void (async () => {
				const walletConnector = eip6963Connectors.get(wallet.info.rdns);
				if (walletConnector && walletConnector.ready) {
					try {
						// 示例：切换到 BSC (chainId: 56)
						await walletConnector.switchChain(56);
						const newChainId = await walletConnector.getChainId();
						const account = await walletConnector.getAccount();

						console.log(`[${wallet.info.name}] Switched to chain:`, newChainId);

						// 更新网络信息显示
						networkSpan.textContent = `Network: ${getChainName(newChainId)}`;
						addressSpan.textContent = `Address: ${formatAddress(account)}`;
					} catch (error) {
						console.error(`[${wallet.info.name}] Switch chain failed:`, error);
						alert(`Failed to switch chain in ${wallet.info.name}`);
					}
				}
			})();
		});

		// 绑定切换账户按钮事件
		switchAccountBtn.addEventListener('click', () => {
			void (async () => {
				const walletConnector = eip6963Connectors.get(wallet.info.rdns);
				if (walletConnector && walletConnector.ready) {
					try {
						const accounts = await walletConnector.getAccounts();
						if (accounts.length > 1) {
							await walletConnector.switchAccount(accounts[1]);
							console.log(`[${wallet.info.name}] Switched to account:`, accounts[1]);

							// 更新地址显示
							addressSpan.textContent = `Address: ${formatAddress(accounts[1])}`;
						} else {
							alert(`Only one account available in ${wallet.info.name}`);
						}
					} catch (error) {
						console.error(`[${wallet.info.name}] Switch account failed:`, error);
						alert(`Failed to switch account in ${wallet.info.name}`);
					}
				}
			})();
		});
	});
}

// 启动 EIP-6963 钱包自动发现
export function startWalletDiscovery() {
	watchEIP6963Wallets((wallets: EIP6963ProviderDetail[]) => {
		console.log('Discovered EIP-6963 wallets:', wallets);

		// 为每个钱包创建连接器
		wallets.forEach((wallet) => {
			const walletConnector = new EIP6963Connector({
				chains: [mainnet, polygon],
				shimDisconnect: true,
				providerDetail: wallet
			});
			eip6963Connectors.set(wallet.info.rdns, walletConnector);
		});

		// 更新钱包列表 UI
		updateWalletsList(wallets);
	});
}

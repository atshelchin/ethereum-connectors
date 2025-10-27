import './style.css';
import { mainnet, polygon } from 'viem/chains';
import { InjectedConnector } from './adapters/injected/connector';
import { EIP6963Connector } from './adapters/eip6963/connector';
import { watchEIP6963Wallets } from './adapters/eip6963/discovery';
import type { EIP6963ProviderDetail } from './adapters/eip6963/types';

// 创建 Injected 连接器（传统方式）
const connector = new InjectedConnector({
	chains: [mainnet, polygon],
	shimDisconnect: true
});

// 存储 EIP-6963 发现的钱包连接器
const eip6963Connectors = new Map<string, EIP6963Connector>();

connector.on('connected', (info) => {
	console.log('connected', { info });
});
connector.on('disconnected', () => {
	console.log('disconnected');
});
connector.on('permissionChanged', (info) => {
	console.log('permissionChanged', { info });
});
connector.on('error', (error: Error) => {
	console.log('error', { error });
});

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

// 连接
export function setupInjected(element: HTMLButtonElement) {
	const legacyInfo = document.querySelector('#legacy-info') as HTMLDivElement;
	const connectionInfo = document.querySelector('#legacy-connection-info') as HTMLDivElement;
	const connectorChains = document.querySelector('#legacy-connector-chains') as HTMLDivElement;
	const dappChains = document.querySelector('#legacy-dapp-chains') as HTMLDivElement;
	const disconnectBtn = document.querySelector('#disconnect') as HTMLButtonElement;
	const switchChainBtn = document.querySelector('#switchchain') as HTMLButtonElement;
	const switchAccountBtn = document.querySelector('#switchaccount') as HTMLButtonElement;

	const handle = async () => {
		console.log('injected button clicked', connector);
		if (connector.ready) {
			const result = await connector.connect(1);
			const chainId = await connector.getChainId();
			const account = await connector.getAccount();
			const accounts = await connector.getAccounts();
			const metadata = connector.getMetadata();
			const supportedChains = connector.getSupportedChains();

			console.log({ result, chainId, account, accounts, metadata, supportedChains });

			// 显示连接信息
			connectionInfo.innerHTML = `
				<div>Address: <span style="color: #646cff; font-family: monospace;">${formatAddress(account)}</span></div>
				<div>Network: <span style="color: #4caf50;">${getChainName(chainId)}</span></div>
				<div>Chain ID: ${chainId}</div>
			`;

			// 显示连接器支持的链
			connectorChains.innerHTML = supportedChains
				? supportedChains
						.map((id) => `<span class="chain-badge">${getChainName(id)} (${id})</span>`)
						.join('')
				: '<span>All chains supported</span>';

			// 显示 DApp 配置的链
			const dappChainsList = [mainnet, polygon]; // 使用导入的链配置
			dappChains.innerHTML = dappChainsList
				.map((chain) => `<span class="chain-badge">${chain.name} (${chain.id})</span>`)
				.join('');

			// 显示信息区域和其他按钮
			legacyInfo.style.display = 'block';
			element.style.display = 'none';
			disconnectBtn.style.display = 'inline-block';
			switchChainBtn.style.display = 'inline-block';
			switchAccountBtn.style.display = 'inline-block';
		}
	};
	element.addEventListener('click', () => void handle());
}

export function setupDisconect(element: HTMLButtonElement) {
	const legacyInfo = document.querySelector('#legacy-info') as HTMLDivElement;
	const connectBtn = document.querySelector('#injected') as HTMLButtonElement;
	const switchChainBtn = document.querySelector('#switchchain') as HTMLButtonElement;
	const switchAccountBtn = document.querySelector('#switchaccount') as HTMLButtonElement;

	const handle = async () => {
		console.log('setupDisconect button clicked', connector, 66, connector.getProvider());
		if (connector.ready) {
			const result = await connector.disconnect();
			console.log({ result });

			// 隐藏信息区域，显示连接按钮
			legacyInfo.style.display = 'none';
			connectBtn.style.display = 'inline-block';
			element.style.display = 'none';
			switchChainBtn.style.display = 'none';
			switchAccountBtn.style.display = 'none';
		}
	};
	element.addEventListener('click', () => void handle());
}

export function switchchain(element: HTMLButtonElement) {
	const connectionInfo = document.querySelector('#legacy-connection-info') as HTMLDivElement;

	const handle = async () => {
		console.log('switchchain button clicked', connector, 66, connector.getProvider());
		if (connector.ready) {
			const result = await connector.switchChain(56);
			const newChainId = await connector.getChainId();
			const account = await connector.getAccount();

			console.log({ result, newChainId });

			// 更新连接信息显示
			connectionInfo.innerHTML = `
				<div>Address: <span style="color: #646cff; font-family: monospace;">${formatAddress(account)}</span></div>
				<div>Network: <span style="color: #4caf50;">${getChainName(newChainId)}</span></div>
				<div>Chain ID: ${newChainId}</div>
			`;
		}
	};
	element.addEventListener('click', () => void handle());
}

export function switchaccount(element: HTMLButtonElement) {
	const connectionInfo = document.querySelector('#legacy-connection-info') as HTMLDivElement;

	const handle = async () => {
		console.log('switchaccount button clicked', connector, 66, connector.getProvider());
		if (connector.ready) {
			const accounts = await connector.getAccounts();
			if (accounts.length > 1) {
				const result = await connector.switchAccount(accounts[1]);
				const chainId = await connector.getChainId();

				console.log({ result });

				// 更新连接信息显示
				connectionInfo.innerHTML = `
					<div>Address: <span style="color: #646cff; font-family: monospace;">${formatAddress(accounts[1])}</span></div>
					<div>Network: <span style="color: #4caf50;">${getChainName(chainId)}</span></div>
					<div>Chain ID: ${chainId}</div>
				`;
			} else {
				alert('Only one account available. Please add more accounts in your wallet.');
			}
		}
	};
	element.addEventListener('click', () => void handle());
}

// 更新钱包列表 UI
function updateWalletsList(wallets: EIP6963ProviderDetail[]) {
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
					<button class="wallet-switchchain-btn" data-rdns="${wallet.info.rdns}" style="display: none;">Switch Chain</button>
					<button class="wallet-switchaccount-btn" data-rdns="${wallet.info.rdns}" style="display: none;">Switch Account</button>
				</div>
			</div>
			<div class="wallet-chains-info" style="display: none;">
				<div class="chains-section">
					<strong>Connector Supported:</strong>
					<div class="wallet-connector-chains"></div>
				</div>
				<div class="chains-section">
					<strong>DApp Configured:</strong>
					<div class="wallet-dapp-chains"></div>
				</div>
			</div>
		`;

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
		const connectorChains = walletDiv.querySelector('.wallet-connector-chains') as HTMLDivElement;
		const dappChains = walletDiv.querySelector('.wallet-dapp-chains') as HTMLDivElement;

		// 辅助函数：格式化地址
		const formatAddress = (address: string) => {
			return `${address.slice(0, 6)}...${address.slice(-4)}`;
		};

		// 辅助函数：获取网络名称
		const getChainName = (chainId: number) => {
			const chainMap: Record<number, string> = {
				1: 'Ethereum',
				56: 'BSC',
				137: 'Polygon',
				42161: 'Arbitrum',
				10: 'Optimism',
				8453: 'Base'
			};
			return chainMap[chainId] || `Chain ${chainId}`;
		};

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

						// 更新网络显示
						networkSpan.textContent = `Network: ${getChainName(newChainId)}`;

						console.log(`[${wallet.info.name}] Switched to chain ${newChainId}`);
					} catch (error) {
						console.error(`[${wallet.info.name}] Switch chain failed:`, error);
						alert(`Failed to switch chain for ${wallet.info.name}`);
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
						// 获取所有账户并切换到第二个（如果有）
						const accounts = await walletConnector.getAccounts();
						if (accounts.length > 1) {
							await walletConnector.switchAccount(accounts[1]);

							// 更新地址显示
							addressSpan.textContent = `Address: ${formatAddress(accounts[1])}`;

							console.log(`[${wallet.info.name}] Switched to account:`, accounts[1]);
						} else {
							alert('Only one account available. Please add more accounts in your wallet.');
						}
					} catch (error) {
						console.error(`[${wallet.info.name}] Switch account failed:`, error);
						alert(`Failed to switch account for ${wallet.info.name}`);
					}
				}
			})();
		});

		walletsContainer.appendChild(walletDiv);
	});
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
  
    <h1>Ethereum Connectors Demo</h1>

    <!-- EIP-6963 钱包列表 -->
    <div id="eip6963-wallets" class="wallets-container">
      <h2>EIP-6963 Discovered Wallets</h2>
      <p>Detecting wallets...</p>
    </div>

    <!-- 传统 Injected 连接器测试 -->
    <div class="card legacy-connector">
      <h3>Legacy Injected Connector</h3>

      <div id="legacy-info" style="display: none;" class="connector-info">
        <div class="info-section">
          <strong>Connection Info:</strong>
          <div id="legacy-connection-info"></div>
        </div>
        <div class="info-section">
          <strong>Supported Chains (Connector):</strong>
          <div id="legacy-connector-chains"></div>
        </div>
        <div class="info-section">
          <strong>Supported Chains (DApp):</strong>
          <div id="legacy-dapp-chains"></div>
        </div>
      </div>

      <div class="button-group">
        <button id="injected" type="button">Connect</button>
        <button id="disconnect" type="button" style="display: none;">Disconnect</button>
        <button id="switchchain" type="button" style="display: none;">Switch Chain</button>
        <button id="switchaccount" type="button" style="display: none;">Switch Account</button>
      </div>
    </div>

    <p class="read-the-docs">
      EIP-6963 enables automatic wallet discovery
    </p>
  </div>
`;

setupInjected(document.querySelector<HTMLButtonElement>('#injected')!);
setupDisconect(document.querySelector<HTMLButtonElement>('#disconnect')!);

switchchain(document.querySelector<HTMLButtonElement>('#switchchain')!);
switchaccount(document.querySelector<HTMLButtonElement>('#switchaccount')!);

// 启动 EIP-6963 钱包自动发现（必须在 DOM 渲染之后）
watchEIP6963Wallets((wallets: EIP6963ProviderDetail[]) => {
	console.log('Discovered EIP-6963 wallets:', wallets);

	// 为每个钱包创建连接器
	wallets.forEach((wallet) => {
		if (!eip6963Connectors.has(wallet.info.rdns)) {
			const walletConnector = new EIP6963Connector({
				chains: [mainnet, polygon],
				shimDisconnect: true,
				providerDetail: wallet
			});

			// 设置事件监听
			walletConnector.on('connected', (info) => {
				console.log(`[${wallet.info.name}] connected`, { info });
			});
			walletConnector.on('disconnected', () => {
				console.log(`[${wallet.info.name}] disconnected`);
			});
			walletConnector.on('permissionChanged', (info) => {
				console.log(`[${wallet.info.name}] permissionChanged`, { info });
			});
			walletConnector.on('error', (error: Error) => {
				console.log(`[${wallet.info.name}] error`, { error });
			});

			eip6963Connectors.set(wallet.info.rdns, walletConnector);
		}
	});

	// 更新 UI 显示钱包列表
	updateWalletsList(wallets);
});

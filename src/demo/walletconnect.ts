import { mainnet, polygon, base, bsc } from 'viem/chains';
import { WalletConnectConnector } from '../adapters/wallet-connect/connector';

// 创建 WalletConnect 连接器
export const walletConnectConnector = new WalletConnectConnector({
	chains: [mainnet, polygon, base, bsc],
	shimDisconnect: true,
	projectId: 'e68249e217c8793807b7bb961a2f4297',
	metadata: {
		name: 'Ethereum Connectors Demo',
		description: 'Demo for Ethereum wallet connectors',
		url: typeof window !== 'undefined' ? window.location.origin : '',
		icons: ['https://walletconnect.com/walletconnect-logo.png']
	}
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

// ==================== WalletConnect Functions ====================

export function setupWalletConnect(element: HTMLButtonElement) {
	const walletConnectInfo = document.querySelector('#walletconnect-info') as HTMLDivElement;
	const connectionInfo = document.querySelector('#walletconnect-connection-info') as HTMLDivElement;
	const connectorChains = document.querySelector(
		'#walletconnect-connector-chains'
	) as HTMLDivElement;
	const dappChains = document.querySelector('#walletconnect-dapp-chains') as HTMLDivElement;
	const qrDisplay = document.querySelector('#walletconnect-qr') as HTMLDivElement;
	const disconnectBtn = document.querySelector('#walletconnect-disconnect') as HTMLButtonElement;
	const switchChainBtn = document.querySelector('#walletconnect-switchchain') as HTMLButtonElement;
	const switchAccountBtn = document.querySelector(
		'#walletconnect-switchaccount'
	) as HTMLButtonElement;

	// Listen for display_uri event to show QR code
	walletConnectConnector.on('display_uri', (uri: string) => {
		qrDisplay.innerHTML = `
			<div style="padding: 1rem; background: white; border-radius: 8px; display: inline-block;">
				<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}" alt="WalletConnect QR Code" />
				<p style="color: #000; margin-top: 0.5rem; font-size: 0.8em;">Scan with your wallet</p>
			</div>
		`;
		qrDisplay.style.display = 'block';
	});

	const handle = async () => {
		console.log('WalletConnect connect button clicked');
		if (walletConnectConnector.ready) {
			const result = await walletConnectConnector.connect(1);
			const chainId = await walletConnectConnector.getChainId();
			const account = await walletConnectConnector.getAccount();
			const accounts = await walletConnectConnector.getAccounts();
			const metadata = walletConnectConnector.getMetadata();
			const supportedChains = walletConnectConnector.getSupportedChains();

			console.log({ result, chainId, account, accounts, metadata, supportedChains });

			// 隐藏 QR 码
			qrDisplay.style.display = 'none';

			// 显示连接信息
			connectionInfo.innerHTML = `
				<div>Address: <span style="color: #646cff; font-family: monospace;">${formatAddress(account)}</span></div>
				<div>Network: <span style="color: #4caf50;">${getChainName(chainId)}</span></div>
				<div>Chain ID: ${chainId}</div>
				<div>Accounts: ${accounts.length}</div>
			`;

			// 显示网络信息
			connectorChains.innerHTML = supportedChains
				? supportedChains
						.map((id) => `<span class="chain-badge">${getChainName(id)} (${id})</span>`)
						.join('')
				: '<span>All chains supported</span>';

			const dappChainsList = [mainnet, polygon, base, bsc];
			dappChains.innerHTML = dappChainsList
				.map((chain) => `<span class="chain-badge">${chain.name} (${chain.id})</span>`)
				.join('');

			walletConnectInfo.style.display = 'block';

			// 切换按钮显示状态
			element.style.display = 'none';
			disconnectBtn.style.display = 'inline-block';
			switchChainBtn.style.display = 'inline-block';
			switchAccountBtn.style.display = 'inline-block';
		} else {
			alert('WalletConnect is not ready');
		}
	};
	element.addEventListener('click', () => void handle());
}

export function setupWalletConnectDisconnect(element: HTMLButtonElement) {
	const walletConnectInfo = document.querySelector('#walletconnect-info') as HTMLDivElement;
	const connectBtn = document.querySelector('#walletconnect-connect') as HTMLButtonElement;
	const switchChainBtn = document.querySelector('#walletconnect-switchchain') as HTMLButtonElement;
	const switchAccountBtn = document.querySelector(
		'#walletconnect-switchaccount'
	) as HTMLButtonElement;

	const handle = async () => {
		console.log('WalletConnect disconnect button clicked');
		await walletConnectConnector.disconnect();

		walletConnectInfo.style.display = 'none';
		connectBtn.style.display = 'inline-block';
		element.style.display = 'none';
		switchChainBtn.style.display = 'none';
		switchAccountBtn.style.display = 'none';
	};
	element.addEventListener('click', () => void handle());
}

export function setupWalletConnectSwitchChain(element: HTMLButtonElement) {
	const connectionInfo = document.querySelector('#walletconnect-connection-info') as HTMLDivElement;

	const handle = async () => {
		console.log('WalletConnect switch chain button clicked');
		// Switch to BSC (chainId: 56)
		await walletConnectConnector.switchChain(56);
		const chainId = await walletConnectConnector.getChainId();
		const account = await walletConnectConnector.getAccount();

		console.log({ chainId });

		// 更新连接信息显示
		connectionInfo.innerHTML = `
			<div>Address: <span style="color: #646cff; font-family: monospace;">${formatAddress(account)}</span></div>
			<div>Network: <span style="color: #4caf50;">${getChainName(chainId)}</span></div>
			<div>Chain ID: ${chainId}</div>
		`;
	};
	element.addEventListener('click', () => void handle());
}

export function setupWalletConnectSwitchAccount(element: HTMLButtonElement) {
	const connectionInfo = document.querySelector('#walletconnect-connection-info') as HTMLDivElement;

	const handle = async () => {
		console.log('WalletConnect switch account button clicked');
		const accounts = await walletConnectConnector.getAccounts();
		if (accounts.length > 1) {
			await walletConnectConnector.switchAccount(accounts[1]);
			const chainId = await walletConnectConnector.getChainId();

			// 更新连接信息显示
			connectionInfo.innerHTML = `
				<div>Address: <span style="color: #646cff; font-family: monospace;">${formatAddress(accounts[1])}</span></div>
				<div>Network: <span style="color: #4caf50;">${getChainName(chainId)}</span></div>
				<div>Chain ID: ${chainId}</div>
			`;
		} else {
			alert('Only one account available. Please add more accounts in your wallet.');
		}
	};
	element.addEventListener('click', () => void handle());
}

// WalletConnect 连接器事件监听
walletConnectConnector.on('connected', (info) => {
	console.log('[WalletConnect] connected', { info });
});
walletConnectConnector.on('disconnected', () => {
	console.log('[WalletConnect] disconnected');
});
walletConnectConnector.on('permissionChanged', (info) => {
	console.log('[WalletConnect] permissionChanged', { info });
});
walletConnectConnector.on('error', (error: Error) => {
	console.log('[WalletConnect] error', { error });
});
walletConnectConnector.on('display_uri', (uri: string) => {
	console.log('[WalletConnect] display_uri', uri);
});

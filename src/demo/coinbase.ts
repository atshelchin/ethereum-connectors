import { mainnet, polygon, base, bsc } from 'viem/chains';
import { CoinbaseSmartWalletConnector } from '../adapters/base-account/connector';

// 创建 Coinbase Smart Wallet 连接器
export const coinbaseConnector = new CoinbaseSmartWalletConnector({
	chains: [mainnet, polygon, base, bsc],
	shimDisconnect: true,
	appName: 'Ethereum Connectors Demo',
	appLogoUrl: 'https://example.com/logo.png'
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

// ==================== Coinbase Smart Wallet Functions ====================

export function setupCoinbase(element: HTMLButtonElement) {
	const coinbaseInfo = document.querySelector('#coinbase-info') as HTMLDivElement;
	const connectionInfo = document.querySelector('#coinbase-connection-info') as HTMLDivElement;
	const connectorChains = document.querySelector('#coinbase-connector-chains') as HTMLDivElement;
	const dappChains = document.querySelector('#coinbase-dapp-chains') as HTMLDivElement;
	const disconnectBtn = document.querySelector('#coinbase-disconnect') as HTMLButtonElement;
	const switchChainBtn = document.querySelector('#coinbase-switchchain') as HTMLButtonElement;
	const switchAccountBtn = document.querySelector('#coinbase-switchaccount') as HTMLButtonElement;

	const handle = async () => {
		console.log('Coinbase connect button clicked');
		if (coinbaseConnector.ready) {
			const result = await coinbaseConnector.connect(8453); // Connect to Base by default
			const chainId = await coinbaseConnector.getChainId();
			const account = await coinbaseConnector.getAccount();
			const accounts = await coinbaseConnector.getAccounts();
			const metadata = coinbaseConnector.getMetadata();
			const supportedChains = coinbaseConnector.getSupportedChains();

			console.log({ result, chainId, account, accounts, metadata, supportedChains });

			// 显示连接信息
			connectionInfo.innerHTML = `
				<div>Address: <span style="color: #646cff; font-family: monospace;">${formatAddress(account)}</span></div>
				<div>Network: <span style="color: #4caf50;">${getChainName(chainId)}</span></div>
				<div>Chain ID: ${chainId}</div>
				<div>Accounts: ${accounts.length}</div>
			`;

			// 显示网络信息
			connectorChains.innerHTML = supportedChains
				.map((id) => `<span class="chain-badge">${getChainName(id)} (${id})</span>`)
				.join('');

			const dappChainsList = [mainnet, polygon, base, bsc];
			dappChains.innerHTML = dappChainsList
				.map((chain) => `<span class="chain-badge">${chain.name} (${chain.id})</span>`)
				.join('');

			coinbaseInfo.style.display = 'block';

			// 切换按钮显示状态
			element.style.display = 'none';
			disconnectBtn.style.display = 'inline-block';
			switchChainBtn.style.display = 'inline-block';
			switchAccountBtn.style.display = 'inline-block';
		} else {
			alert('Coinbase Smart Wallet is not ready');
		}
	};
	element.addEventListener('click', () => void handle());
}

export function setupCoinbaseDisconnect(element: HTMLButtonElement) {
	const coinbaseInfo = document.querySelector('#coinbase-info') as HTMLDivElement;
	const connectBtn = document.querySelector('#coinbase-connect') as HTMLButtonElement;
	const switchChainBtn = document.querySelector('#coinbase-switchchain') as HTMLButtonElement;
	const switchAccountBtn = document.querySelector('#coinbase-switchaccount') as HTMLButtonElement;

	const handle = async () => {
		console.log('Coinbase disconnect button clicked');
		await coinbaseConnector.disconnect();

		coinbaseInfo.style.display = 'none';
		connectBtn.style.display = 'inline-block';
		element.style.display = 'none';
		switchChainBtn.style.display = 'none';
		switchAccountBtn.style.display = 'none';
	};
	element.addEventListener('click', () => void handle());
}

export function setupCoinbaseSwitchChain(element: HTMLButtonElement) {
	const connectionInfo = document.querySelector('#coinbase-connection-info') as HTMLDivElement;

	const handle = async () => {
		console.log('Coinbase switch chain button clicked');
		// Switch to BSC (chainId: 56)
		await coinbaseConnector.switchChain(56);
		const chainId = await coinbaseConnector.getChainId();
		const account = await coinbaseConnector.getAccount();

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

export function setupCoinbaseSwitchAccount(element: HTMLButtonElement) {
	const connectionInfo = document.querySelector('#coinbase-connection-info') as HTMLDivElement;

	const handle = async () => {
		console.log('Coinbase switch account button clicked');
		const accounts = await coinbaseConnector.getAccounts();
		if (accounts.length > 1) {
			const result = await coinbaseConnector.switchAccount(accounts[1]);
			const chainId = await coinbaseConnector.getChainId();

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
	};
	element.addEventListener('click', () => void handle());
}

// Coinbase 连接器事件监听
coinbaseConnector.on('connected', (info) => {
	console.log('[Coinbase] connected', { info });
});
coinbaseConnector.on('disconnected', () => {
	console.log('[Coinbase] disconnected');
});
coinbaseConnector.on('permissionChanged', (info) => {
	console.log('[Coinbase] permissionChanged', { info });
});
coinbaseConnector.on('error', (error: Error) => {
	console.log('[Coinbase] error', { error });
});

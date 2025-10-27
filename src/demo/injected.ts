import { mainnet, polygon, bsc } from 'viem/chains';
import { InjectedConnector } from '../adapters/injected/connector';

// Ethereum icon (generic for injected wallets)
const ETHEREUM_ICON =
	'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzYyN0VFQSIvPgo8cGF0aCBkPSJNMjAgOEwxMi41IDIwLjVMMjAgMjQuNUwyNy41IDIwLjVMMjAgOFoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNiIvPgo8cGF0aCBkPSJNMjAgMjZMMTIuNSAyMi41TDIwIDMyTDI3LjUgMjIuNUwyMCAyNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==';

// 创建 Injected 连接器（传统方式）
export const injectedConnector = new InjectedConnector({
	chains: [mainnet, polygon, bsc],
	shimDisconnect: true
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

// ==================== Injected Connector Functions ====================

export function setupInjected(element: HTMLButtonElement) {
	const legacyInfo = document.querySelector('#legacy-info') as HTMLDivElement;
	const connectionInfo = document.querySelector('#legacy-connection-info') as HTMLDivElement;
	const connectorChains = document.querySelector('#legacy-connector-chains') as HTMLDivElement;
	const dappChains = document.querySelector('#legacy-dapp-chains') as HTMLDivElement;
	const disconnectBtn = document.querySelector('#disconnect') as HTMLButtonElement;
	const switchChainBtn = document.querySelector('#switchchain') as HTMLButtonElement;
	const switchAccountBtn = document.querySelector('#switchaccount') as HTMLButtonElement;

	const handle = async () => {
		console.log('injected button clicked', injectedConnector);
		if (injectedConnector.ready) {
			const result = await injectedConnector.connect(1);
			const chainId = await injectedConnector.getChainId();
			const account = await injectedConnector.getAccount();
			const accounts = await injectedConnector.getAccounts();
			const metadata = injectedConnector.getMetadata();
			const supportedChains = injectedConnector.getSupportedChains();

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
				? supportedChains
						.map((id) => `<span class="chain-badge">${getChainName(id)} (${id})</span>`)
						.join('')
				: '<span>All chains supported</span>';

			const dappChainsList = [mainnet, polygon, bsc];
			dappChains.innerHTML = dappChainsList
				.map((chain) => `<span class="chain-badge">${chain.name} (${chain.id})</span>`)
				.join('');

			legacyInfo.style.display = 'block';

			// 切换按钮显示状态
			element.style.display = 'none';
			disconnectBtn.style.display = 'inline-block';
			switchChainBtn.style.display = 'inline-block';
			switchAccountBtn.style.display = 'inline-block';
		} else {
			alert('MetaMask is not installed!');
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
		console.log('disconnect button clicked');
		await injectedConnector.disconnect();

		legacyInfo.style.display = 'none';
		connectBtn.style.display = 'inline-block';
		element.style.display = 'none';
		switchChainBtn.style.display = 'none';
		switchAccountBtn.style.display = 'none';
	};
	element.addEventListener('click', () => void handle());
}

export function switchchain(element: HTMLButtonElement) {
	const connectionInfo = document.querySelector('#legacy-connection-info') as HTMLDivElement;

	const handle = async () => {
		console.log('switchchain button clicked');
		// Switch to BSC (chainId: 56)
		await injectedConnector.switchChain(56);
		const chainId = await injectedConnector.getChainId();
		const account = await injectedConnector.getAccount();

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

export function switchaccount(element: HTMLButtonElement) {
	const connectionInfo = document.querySelector('#legacy-connection-info') as HTMLDivElement;

	const handle = async () => {
		console.log('switchaccount button clicked');
		const accounts = await injectedConnector.getAccounts();
		if (accounts.length > 1) {
			const result = await injectedConnector.switchAccount(accounts[1]);
			const chainId = await injectedConnector.getChainId();

			console.log({ result });

			// 更新连接信息显示
			connectionInfo.innerHTML = `
				<div>Address: <span style="color: #646cff; font-family: monospace;">${formatAddress(accounts[1])}</span></div>
				<div>Network: <span style="color: #4caf50;">${getChainName(chainId)}</span></div>
				<div>Chain ID: ${chainId}</div>
			`;
		} else {
			alert('Only one account available. Please add more accounts in MetaMask.');
		}
	};
	element.addEventListener('click', () => void handle());
}

// 事件监听
injectedConnector.on('connected', (info) => {
	console.log('connected', { info });
});
injectedConnector.on('disconnected', () => {
	console.log('disconnected');
});
injectedConnector.on('permissionChanged', (info) => {
	console.log('permissionChanged', { info });
});
injectedConnector.on('error', (error: Error) => {
	console.log('error', { error });
});

export { ETHEREUM_ICON };

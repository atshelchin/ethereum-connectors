import './style.css';
import typescriptLogo from './typescript.svg';
import viteLogo from '/vite.svg';
import { mainnet, polygon } from 'viem/chains';
import { InjectedConnector } from './adapters/injected/connector';

// 创建连接器
const connector = new InjectedConnector({
	chains: [mainnet, polygon],
	shimDisconnect: true
});

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

// 连接

export function setupInjected(element: HTMLButtonElement) {
	const handle = async () => {
		console.log('injected button clicked', connector);
		if (connector.ready) {
			const result = await connector.connect(1);
			const getChainId = await connector.getChainId();

			const getAccount = await connector.getAccount();
			const getAccounts = await connector.getAccounts();

			const getMetadata = connector.getMetadata();
			const getSupportedChains = connector.getSupportedChains();

			console.log({ result, getChainId, getAccount, getAccounts, getMetadata, getSupportedChains });
		}
	};
	element.addEventListener('click', () => void handle());
}

export function setupDisconect(element: HTMLButtonElement) {
	const handle = async () => {
		console.log('setupDisconect button clicked', connector, 66, connector.getProvider());
		if (connector.ready) {
			const result = await connector.disconnect();

			console.log({ result });
		}
	};
	element.addEventListener('click', () => void handle());
}

export function switchchain(element: HTMLButtonElement) {
	const handle = async () => {
		console.log('switchchain button clicked', connector, 66, connector.getProvider());
		if (connector.ready) {
			const result = await connector.switchChain(56);

			console.log({ result });
		}
	};
	element.addEventListener('click', () => void handle());
}

export function switchaccount(element: HTMLButtonElement) {
	const handle = async () => {
		console.log('switchaccount button clicked', connector, 66, connector.getProvider());
		if (connector.ready) {
			const result = await connector.switchAccount('0x7a44ed93abf665df2aa6c20915e86f9d40276501');

			console.log({ result });
		}
	};
	element.addEventListener('click', () => void handle());
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
 
      <button id="injected" type="button"> connect </button>
        <button id="disconnect" type="button"> disconnect </button>
	<button id="switchchain" type="button"> switchchain </button>
	<button id="switchaccount" type="button"> switchaccount </button>

    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

setupInjected(document.querySelector<HTMLButtonElement>('#injected')!);
setupDisconect(document.querySelector<HTMLButtonElement>('#disconnect')!);

switchchain(document.querySelector<HTMLButtonElement>('#switchchain')!);
switchaccount(document.querySelector<HTMLButtonElement>('#switchaccount')!);

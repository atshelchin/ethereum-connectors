import './style.css';

// Import demo modules
import {
	setupInjected,
	setupDisconect,
	switchchain,
	switchaccount,
	ETHEREUM_ICON
} from './demo/injected';
import {
	coinbaseConnector,
	setupCoinbase,
	setupCoinbaseDisconnect,
	setupCoinbaseSwitchChain,
	setupCoinbaseSwitchAccount
} from './demo/coinbase';
import {
	walletConnectConnector,
	setupWalletConnect,
	setupWalletConnectDisconnect,
	setupWalletConnectSwitchChain,
	setupWalletConnectSwitchAccount
} from './demo/walletconnect';
import { startWalletDiscovery } from './demo/eip6963';

// 渲染 HTML
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Ethereum Connectors Demo</h1>

    <!-- EIP-6963 钱包发现区域 -->
    <div id="eip6963-wallets" class="wallets-container">
      <h2>EIP-6963 Discovered Wallets</h2>
      <p>Detecting wallets...</p>
    </div>

    <!-- WalletConnect 连接器 -->
    <div class="card legacy-connector">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
        <img src="${walletConnectConnector.icon}" alt="WalletConnect" style="width: 48px; height: 48px; border-radius: 8px;" />
        <h3 style="margin: 0;">WalletConnect</h3>
      </div>

      <div id="walletconnect-qr" style="display: none; text-align: center; margin: 1rem 0;"></div>

      <div id="walletconnect-info" style="display: none;" class="connector-info">
        <div class="info-section">
          <strong>Connection Info:</strong>
          <div id="walletconnect-connection-info"></div>
        </div>
        <div class="info-section">
          <strong>Supported Chains (Connector):</strong>
          <div id="walletconnect-connector-chains"></div>
        </div>
        <div class="info-section">
          <strong>Supported Chains (DApp):</strong>
          <div id="walletconnect-dapp-chains"></div>
        </div>
      </div>

      <div class="button-group">
        <button id="walletconnect-connect" type="button">Connect</button>
        <button id="walletconnect-disconnect" type="button" style="display: none;">Disconnect</button>
        <button id="walletconnect-switchchain" type="button" style="display: none;">Switch Chain (BSC)</button>
        <button id="walletconnect-switchaccount" type="button" style="display: none;">Switch Account</button>
      </div>
    </div>

    <!-- Coinbase Smart Wallet 连接器 -->
    <div class="card legacy-connector">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
        <img src="${coinbaseConnector.icon}" alt="Coinbase Smart Wallet" style="width: 48px; height: 48px; border-radius: 8px;" />
        <h3 style="margin: 0;">Coinbase Smart Wallet</h3>
      </div>

      <div id="coinbase-info" style="display: none;" class="connector-info">
        <div class="info-section">
          <strong>Connection Info:</strong>
          <div id="coinbase-connection-info"></div>
        </div>
        <div class="info-section">
          <strong>Supported Chains (Connector):</strong>
          <div id="coinbase-connector-chains"></div>
        </div>
        <div class="info-section">
          <strong>Supported Chains (DApp):</strong>
          <div id="coinbase-dapp-chains"></div>
        </div>
      </div>

      <div class="button-group">
        <button id="coinbase-connect" type="button">Connect</button>
        <button id="coinbase-disconnect" type="button" style="display: none;">Disconnect</button>
        <button id="coinbase-switchchain" type="button" style="display: none;">Switch Chain (BSC)</button>
        <button id="coinbase-switchaccount" type="button" style="display: none;">Switch Account</button>
      </div>
    </div>

    <!-- 传统 Injected 连接器测试 -->
    <div class="card legacy-connector">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
        <img src="${ETHEREUM_ICON}" alt="Injected Wallet" style="width: 48px; height: 48px; border-radius: 8px;" />
        <h3 style="margin: 0;">Legacy Injected Connector</h3>
      </div>

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
        <button id="switchchain" type="button" style="display: none;">Switch Chain (BSC)</button>
        <button id="switchaccount" type="button" style="display: none;">Switch Account</button>
      </div>
    </div>

    <p class="read-the-docs">
      Test WalletConnect, Coinbase Smart Wallet, and EIP-6963 wallet discovery
    </p>
  </div>
`;

// Setup WalletConnect Connector
setupWalletConnect(document.querySelector<HTMLButtonElement>('#walletconnect-connect')!);
setupWalletConnectDisconnect(
	document.querySelector<HTMLButtonElement>('#walletconnect-disconnect')!
);
setupWalletConnectSwitchChain(
	document.querySelector<HTMLButtonElement>('#walletconnect-switchchain')!
);
setupWalletConnectSwitchAccount(
	document.querySelector<HTMLButtonElement>('#walletconnect-switchaccount')!
);

// Setup Coinbase Smart Wallet Connector
setupCoinbase(document.querySelector<HTMLButtonElement>('#coinbase-connect')!);
setupCoinbaseDisconnect(document.querySelector<HTMLButtonElement>('#coinbase-disconnect')!);
setupCoinbaseSwitchChain(document.querySelector<HTMLButtonElement>('#coinbase-switchchain')!);
setupCoinbaseSwitchAccount(document.querySelector<HTMLButtonElement>('#coinbase-switchaccount')!);

// Setup Legacy Injected Connector
setupInjected(document.querySelector<HTMLButtonElement>('#injected')!);
setupDisconect(document.querySelector<HTMLButtonElement>('#disconnect')!);
switchchain(document.querySelector<HTMLButtonElement>('#switchchain')!);
switchaccount(document.querySelector<HTMLButtonElement>('#switchaccount')!);

// 启动 EIP-6963 钱包自动发现（必须在 DOM 渲染之后）
startWalletDiscovery();

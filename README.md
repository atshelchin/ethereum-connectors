# Ethereum Connectors

A comprehensive TypeScript library for connecting to Ethereum wallets with support for multiple connection methods including EIP-6963 wallet discovery, WalletConnect, Coinbase Smart Wallet, and traditional injected providers.

## ✨ Features

### 🔌 Multiple Connector Types

- **EIP-6963 Wallet Discovery** - Automatic detection and connection to multiple browser extension wallets
- **WalletConnect v2** - Cross-platform wallet connections with QR code support
- **Coinbase Smart Wallet** - Integration with Coinbase's Base Account SDK
- **Injected Provider** - Traditional `window.ethereum` support for MetaMask and other wallets

### 🎯 Key Capabilities

- ✅ **Multi-wallet Support** - Connect to multiple wallets simultaneously
- ✅ **Chain Switching** - Seamlessly switch between different blockchain networks
- ✅ **Account Management** - Handle multiple accounts per wallet
- ✅ **Event System** - Real-time connection, disconnection, and permission change events
- ✅ **TypeScript First** - Full type safety with TypeScript support
- ✅ **Mobile Ready** - Deep linking support for mobile wallet apps

## 📦 Installation

```bash
# Using pnpm
pnpm add @shelchin/ethereum-connectors viem

# Using npm
npm install @shelchin/ethereum-connectors viem

# Using yarn
yarn add @shelchin/ethereum-connectors viem
```

## 🚀 Quick Start

### EIP-6963 Wallet Discovery

```typescript
import { watchEIP6963Wallets, EIP6963Connector } from '@shelchin/ethereum-connectors';
import { mainnet, polygon } from 'viem/chains';

// Discover all available wallets
watchEIP6963Wallets((wallets) => {
  console.log('Discovered wallets:', wallets);

  wallets.forEach((wallet) => {
    const connector = new EIP6963Connector({
      chains: [mainnet, polygon],
      shimDisconnect: true,
      providerDetail: wallet
    });

    // Connect to wallet
    connector.connect(1).then((result) => {
      console.log('Connected:', result);
    });
  });
});
```

### WalletConnect

```typescript
import { WalletConnectConnector } from '@shelchin/ethereum-connectors';
import { mainnet, polygon, base } from 'viem/chains';

const connector = new WalletConnectConnector({
  chains: [mainnet, polygon, base],
  shimDisconnect: true,
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  metadata: {
    name: 'My DApp',
    description: 'My awesome DApp',
    url: 'https://my-dapp.com',
    icons: ['https://my-dapp.com/icon.png']
  }
});

// Listen for QR code URI
connector.on('display_uri', (uri) => {
  console.log('Scan this QR code:', uri);
  // Display QR code to user
});

// Connect
await connector.connect(1);
```

### Coinbase Smart Wallet

```typescript
import { CoinbaseSmartWalletConnector } from '@shelchin/ethereum-connectors';
import { mainnet, base } from 'viem/chains';

const connector = new CoinbaseSmartWalletConnector({
  chains: [mainnet, base],
  shimDisconnect: true,
  appName: 'My DApp',
  appLogoUrl: 'https://my-dapp.com/logo.png'
});

// Connect to Base chain by default
await connector.connect(8453);
```

### Traditional Injected Provider

```typescript
import { InjectedConnector } from '@shelchin/ethereum-connectors';
import { mainnet, polygon } from 'viem/chains';

const connector = new InjectedConnector({
  chains: [mainnet, polygon],
  shimDisconnect: true
});

if (connector.ready) {
  await connector.connect(1);
}
```

## 🎨 Event System

All connectors support a consistent event system:

```typescript
// Connection established
connector.on('connected', (info) => {
  console.log('Connected:', info);
  // { address, addresses, chainId, chains }
});

// Disconnected
connector.on('disconnected', () => {
  console.log('Disconnected');
});

// Chain or account changed
connector.on('permissionChanged', (info) => {
  console.log('Permission changed:', info);
  // { address, addresses, chainId, chains }
});

// Error occurred
connector.on('error', (error) => {
  console.error('Error:', error);
});
```

## 🔧 API Reference

### BaseConnector Methods

All connectors inherit from `BaseConnector` and provide these methods:

```typescript
// Connect to a specific chain
await connector.connect(chainId: number): Promise<{ address, addresses, chainId }>

// Disconnect from wallet
await connector.disconnect(): Promise<void>

// Get current account
await connector.getAccount(): Promise<Address>

// Get all accounts
await connector.getAccounts(): Promise<Address[]>

// Get current chain ID
await connector.getChainId(): Promise<number>

// Switch to different chain
await connector.switchChain(chainId: number): Promise<void>

// Switch to different account
await connector.switchAccount(address: Address): Promise<void>

// Get EIP-1193 provider
connector.getProvider(): EIP1193Provider

// Check if wallet is ready
connector.ready: boolean

// Get connector metadata
connector.getMetadata(): { id, name, icon }

// Get supported chains
connector.getSupportedChains(): number[] | null
```

## 📚 Supported Chains

Works with any EVM-compatible chain. Common chains from `viem/chains`:

- Ethereum Mainnet (`mainnet`)
- Polygon (`polygon`)
- Base (`base`)
- BSC (`bsc`)
- Arbitrum (`arbitrum`)
- Optimism (`optimism`)
- And many more...

## 🎯 Use Cases

### DApp Wallet Connection

Perfect for decentralized applications that need to support multiple wallet types:

```typescript
import {
  watchEIP6963Wallets,
  WalletConnectConnector,
  CoinbaseSmartWalletConnector
} from '@shelchin/ethereum-connectors';

// Support browser extension wallets
watchEIP6963Wallets(handleDiscoveredWallets);

// Support mobile wallets via WalletConnect
const wcConnector = new WalletConnectConnector({ ... });

// Support Coinbase Smart Wallet
const cbConnector = new CoinbaseSmartWalletConnector({ ... });
```

### Multi-Chain DApp

Switch between different blockchain networks seamlessly:

```typescript
const connector = new EIP6963Connector({
  chains: [mainnet, polygon, arbitrum, optimism]
});

// Connect to Ethereum
await connector.connect(1);

// Switch to Polygon
await connector.switchChain(137);

// Switch to Arbitrum
await connector.switchChain(42161);
```

### Wallet-Agnostic Interface

Build once, support all wallets:

```typescript
async function connectWallet(connector: BaseConnector) {
  const result = await connector.connect(1);
  const balance = await getBalance(connector.getProvider());
  return { ...result, balance };
}

// Works with any connector type
connectWallet(eip6963Connector);
connectWallet(walletConnectConnector);
connectWallet(coinbaseConnector);
```

## 🛠️ Development

### Project Structure

```
src/
├── adapters/           # Connector implementations
│   ├── eip6963/       # EIP-6963 wallet discovery
│   ├── wallet-connect/ # WalletConnect v2
│   ├── base-account/  # Coinbase Smart Wallet
│   └── injected/      # Traditional injected provider
├── core/              # Base connector and types
├── demo/              # Demo examples
└── utils/             # Utility functions
```

### Build

```bash
# Install dependencies
pnpm install

# Build library
pnpm build

# Build demo
pnpm build:demo

# Run development server
pnpm dev

# Run linting
pnpm lint

# Run tests
pnpm test
```

## 🌐 Live Demo

Check out the live demo at: [https://shelchin.github.io/ethereum-connectors/](https://shelchin.github.io/ethereum-connectors/)

The demo showcases:
- EIP-6963 automatic wallet discovery
- WalletConnect QR code connections
- Coinbase Smart Wallet integration
- Traditional injected wallet support
- Chain switching and account management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Documentation](./src/demo/README.md) - Detailed connector examples
- [EIP-6963 Specification](https://eips.ethereum.org/EIPS/eip-6963)
- [WalletConnect](https://walletconnect.com/)
- [Coinbase Smart Wallet](https://www.coinbase.com/wallet/smart-wallet)
- [Viem](https://viem.sh/)

## ⚠️ Important Notes

### WalletConnect Project ID

To use WalletConnect, you need to obtain a project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).

### Browser Compatibility

- EIP-6963: Requires modern browsers with wallet extensions that support the standard
- WalletConnect: Works on all modern browsers
- Coinbase Smart Wallet: Requires modern browsers
- Injected: Requires MetaMask or compatible wallet extension

### Mobile Support

- WalletConnect provides the best mobile experience with deep linking
- Coinbase Smart Wallet supports mobile browsers
- EIP-6963 and Injected are desktop-only

## 🙏 Acknowledgments

Built with:
- [Viem](https://viem.sh/) - TypeScript EVM library
- [WalletConnect](https://walletconnect.com/) - Wallet connection protocol
- [Coinbase Base Account SDK](https://github.com/base-org/account) - Smart wallet SDK
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

---

Made with ❤️ by [@shelchin](https://github.com/atshelchin)

# Connector Demo Examples

This directory contains demo implementations for each connector type. Each file demonstrates how to integrate and use a specific wallet connector.

## Files

### `injected.ts`

**Legacy Injected Connector Example**

Demonstrates the traditional way of connecting to browser extension wallets (like MetaMask) using the injected `window.ethereum` provider.

**Features:**

- Direct access to `window.ethereum`
- Account management
- Chain switching
- Disconnect functionality
- Custom Ethereum icon

**Usage:**

```typescript
import { injectedConnector, setupInjected } from './demo/injected';
```

---

### `eip6963.ts`

**EIP-6963 Wallet Discovery Example**

Implements automatic discovery and connection to multiple wallets using the EIP-6963 standard.

**Features:**

- Automatic wallet detection
- Multi-wallet support
- Dynamic UI generation
- Per-wallet connection state
- Full wallet lifecycle management

**Usage:**

```typescript
import { startWalletDiscovery } from './demo/eip6963';

// Start discovery after DOM is ready
startWalletDiscovery();
```

---

### `coinbase.ts`

**Coinbase Smart Wallet Example**

Demonstrates integration with Coinbase Smart Wallet using the Base Account SDK.

**Features:**

- Smart wallet connection
- Base chain (8453) as default
- Multi-chain support
- Account switching
- Built-in Coinbase branding (icon)

**Supported Chains:**

- Base (8453)
- Ethereum Mainnet (1)
- Polygon (137)
- BSC (56)
- Arbitrum, Optimism, and more

**Usage:**

```typescript
import { coinbaseConnector, setupCoinbase } from './demo/coinbase';
```

---

### `walletconnect.ts`

**WalletConnect Example**

Implements WalletConnect v2 protocol for mobile and cross-platform wallet connections.

**Features:**

- QR code generation for mobile wallets
- Deep linking support
- Multi-chain support
- Real-time connection status
- WalletConnect branding

**Project ID:** Uses the configured WalletConnect Cloud project ID

**Usage:**

```typescript
import { walletConnectConnector, setupWalletConnect } from './demo/walletconnect';
```

---

## Integration in main.ts

The `main.ts` file imports and uses all these demo modules to create a complete demo application:

```typescript
import { setupInjected } from './demo/injected';
import { setupCoinbase } from './demo/coinbase';
import { setupWalletConnect } from './demo/walletconnect';
import { startWalletDiscovery } from './demo/eip6963';

// Setup connectors after DOM is rendered
setupWalletConnect(...);
setupCoinbase(...);
setupInjected(...);
startWalletDiscovery();
```

## Common Patterns

All demo files follow these patterns:

1. **Export connector instance** for external access
2. **Export setup functions** for button event binding
3. **Include event listeners** for connector lifecycle events
4. **Provide utility functions** for formatting addresses and chain names
5. **Handle errors gracefully** with user-friendly alerts

## Helper Functions

Each demo file includes:

- `formatAddress(address: string)`: Truncates Ethereum addresses for display
- `getChainName(chainId: number)`: Maps chain IDs to human-readable names

## UI Requirements

Each connector expects specific HTML elements with predefined IDs:

### WalletConnect

- `#walletconnect-connect`
- `#walletconnect-disconnect`
- `#walletconnect-info`
- `#walletconnect-qr` (for QR code display)

### Coinbase

- `#coinbase-connect`
- `#coinbase-disconnect`
- `#coinbase-info`

### Injected

- `#injected`
- `#disconnect`
- `#legacy-info`

### EIP-6963

- `#eip6963-wallets` (container for discovered wallets)

## Icons

- **WalletConnect**: Uses `walletConnectConnector.icon`
- **Coinbase**: Uses `coinbaseConnector.icon`
- **Injected**: Uses exported `ETHEREUM_ICON` constant

All icons are base64-encoded SVG data URIs for optimal performance and bundling.

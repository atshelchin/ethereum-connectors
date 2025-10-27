import { defineConfig } from 'vite';

export default defineConfig({
	base: '/ethereum-connectors/', // Update this to match your GitHub repo name
	build: {
		outDir: 'build', // GitHub Pages can serve from docs folder
		emptyOutDir: true,
		rollupOptions: {
			output: {
				manualChunks: {
					'vendor-viem': ['viem'],
					'vendor-walletconnect': ['@walletconnect/ethereum-provider'],
					'vendor-base': ['@base-org/account']
				}
			}
		},
		commonjsOptions: {
			include: [/node_modules/],
			transformMixedEsModules: true
		}
	},
	optimizeDeps: {
		exclude: [],
		esbuildOptions: {
			define: {
				global: 'globalThis'
			}
		}
	}
});

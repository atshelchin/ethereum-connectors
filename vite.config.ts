import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
	plugins: [
		dts({
			include: ['src'],
			rollupTypes: true
		})
	],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'EthereumConnectors',
			formats: ['es', 'cjs'],
			fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
		},
		minify: false, // 禁用压缩，保持代码可读性
		rollupOptions: {
			// 将依赖标记为 external，减少打包体积和提高可读性
			external: [
				'viem',
				'viem/chains',
				'@walletconnect/ethereum-provider',
				'@base-org/account',
				/^@walletconnect\//,
				/^@coinbase\//,
				/^@metamask\//
			],
			output: {
				// 保留模块结构，每个源文件生成对应的输出文件
				preserveModules: true,
				// 设置模块目录，避免深层嵌套
				preserveModulesRoot: 'src',
				// 使用更友好的变量名
				compact: false,
				// 保持代码格式化
				generatedCode: {
					constBindings: true
				}
			}
		}
	}
});

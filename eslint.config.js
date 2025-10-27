import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	prettier,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: {
			'@typescript-eslint/no-non-null-assertion': 'off'
		}
	},
	{
		ignores: ['dist/', 'node_modules/', '*.config.{js,ts}']
	}
);

/** @type {import("eslint").Linter.Config} */
const config = {
	extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "prettier"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: "./tsconfig.json",
	},
	plugins: ["@typescript-eslint"],
	root: true,
	ignorePatterns: ["node_modules", "src/hooks/useScrollBox.ts"],
	rules: {
		"@typescript-eslint/no-unsafe-argument": "off",
		"@typescript-eslint/restrict-template-expressions": "off",
		"react/no-unescaped-entities": "off",
		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/ban-ts-comment": "off",

		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{
				// ignore unused args that start with underscore
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
				caughtErrorsIgnorePattern: "^_",
			},
		],
	},
}

module.exports = config

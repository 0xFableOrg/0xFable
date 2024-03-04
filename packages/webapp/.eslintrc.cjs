/** @type {import("eslint").Linter.Config} */
const config = {
	extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "prettier"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
    project: "./tsconfig.json",
		"sourceType": "module",
    "ecmaVersion": "latest",
  },
	plugins: ["@typescript-eslint", "simple-import-sort"],
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
		"import/first": "error",
    "import/newline-after-import": "error",
    "import/no-duplicates": "error",
		"simple-import-sort/imports": [
			"error",
			{
				"groups": [
					// Packages. `react` related packages come first.
					[
						"^react",
						"^next",
					],
					// Internal packages.
					["^@?\\w"],
					// Parent imports. Put `..` last.
					["^\\.\\.(?!/?$)", "^\\.\\./?$"],
					// Other relative imports. Put same-folder imports and `.` last.
					["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
					// Style imports.
					["^.+\\.s?css$"],
					// Side effect imports.
					["^\\u0000"]
				]
			}
		]
	},
}

module.exports = config

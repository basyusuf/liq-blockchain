module.exports = {
    parser: '@typescript-eslint/parser', // Allows ESLint to lint TypeScript.
    extends: [
        'plugin:@typescript-eslint/recommended', // A plugin that contains a bunch of ESLint rules that are TypeScript specific.
        'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
        'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    env: {
        es6: true,
        browser: true,
        node: true,
    },
    rules: {
        'no-empty': 'error',
        'no-multiple-empty-lines': 'warn',
        'no-var': 'error',
        'no-unused-vars': 'warn',
        'arrow-spacing': 'warn',
        'arrow-parens': 'warn',
        'array-bracket-spacing': 'warn',
        'capitalized-comments': 'warn',
        'comma-spacing': 'warn',
        'key-spacing': 'warn',
        'require-await': 'warn',
        'prefer-const': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
    },
};

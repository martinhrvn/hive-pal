import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import pluginQuery from '@tanstack/eslint-plugin-query';
import i18next from 'eslint-plugin-i18next';

export default tseslint.config(
  {
    ignores: ['dist', '.react-router', 'src/components/ui/**'],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...pluginQuery.configs['flat/recommended'],
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // eslint-plugin-react-hooks 6+ ships the React Compiler rules in its
      // recommended preset. The codebase predates them and is not compiled, so
      // the ones that fire at volume are off for now; revisit when adopting the
      // compiler. rules-of-hooks / exhaustive-deps stay on.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // User-visible strings must go through t() (#152). Existing violations are
    // recorded in eslint-suppressions.json; after translating a file run
    // `pnpm lint:i18n:prune` so its entry is dropped and the baseline shrinks.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.story.tsx', '**/*.spec.{ts,tsx}', '**/*.test.{ts,tsx}'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-only',
          'jsx-attributes': {
            include: ['title', 'placeholder', 'alt', 'aria-label', 'label'],
          },
        },
      ],
      // no-literal-string only sees JSX; these catch the two common places
      // where English text is built outside it.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='toast'] > :matches(Literal[value=/[A-Za-z]{2}/], TemplateLiteral).arguments:first-child",
          message: 'Toast messages must be translated with t().',
        },
        {
          selector:
            'Property[key.name=/^(title|label|description|placeholder|message|fallback)$/] > Literal.value[value=/^[A-Z][a-z]+( |$)/]',
          message:
            'User-visible labels in config objects must be translated with t().',
        },
      ],
    },
  },
  {
    // React Router route modules export `meta`, `ErrorBoundary` etc. next to
    // the component by design; Fast Refresh handles them.
    files: ['src/root.tsx', 'src/route-modules/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
);

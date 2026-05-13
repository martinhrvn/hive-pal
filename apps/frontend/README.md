# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```

## Testing

This project uses two complementary testing frameworks:

### Vitest (Unit Tests)

Vitest is used for unit testing pure logic, utilities, hooks, and stores. Test files follow the pattern `**/*.{test,spec}.{ts,tsx}`.

**When to use Vitest:**
- Pure functions and utility modules
- Custom React hooks (without complex DOM interactions)
- State management stores (Zustand stores)
- Business logic and data transformations
- Type utilities and helper functions

**Running Vitest:**
```bash
pnpm test           # Run tests once
pnpm test:watch     # Watch mode for development
```

**Configuration:** `vitest.config.ts`
- Explicit imports required (`import { describe, it, expect } from 'vitest'`)
- JSDOM environment for DOM-dependent tests
- Inherits path aliases from Vite config

### Playwright Component Testing

Playwright Component Testing is used for testing React components with full DOM rendering and user interactions. Test files follow the pattern `**/*.ct.{ts,tsx}`.

**When to use Playwright CT:**
- React components requiring DOM rendering
- User interaction flows (clicks, form inputs, etc.)
- Visual regression testing
- Components with complex lifecycle behavior
- Integration tests between multiple components

**Running Playwright CT:**
```bash
pnpm test:ct        # Run component tests
```

### Testing Strategy

Choose the appropriate framework based on what you are testing:

- **Vitest**: Fast, lightweight tests for isolated logic
- **Playwright CT**: Comprehensive component tests with real browser behavior

Both frameworks coexist and complement each other to provide complete test coverage.


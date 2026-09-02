# React + TypeScript + Vite

## DINO-1575 book catalogue

The Books page reads `public/data/books.catalog.json`, a normalized static catalogue of the 3,358 source items represented in the frozen DINO-1575 crop dataset. It is deliberately generated ahead of deployment instead of making browsers download the eight private pipeline `books.jsonl` state files.

To rebuild the catalogue after a new detector run:

```bash
npm run catalogue:build -- \
  --books-root "/absolute/path/to/illustration_runs" \
  --crop-manifest "/absolute/path/to/crop_manifest.jsonl" \
  --output "public/data/books.catalog.json"
```

The deployed site retrieves representative crop images through a read-only Vercel function. Configure these server-side environment variables in Vercel:

- `SEARCH_BOTANY_CONTAINER_URL`: the container URL ending in `/search-botany`
- `SEARCH_BOTANY_SAS_TOKEN`: a read-only SAS query, with or without its leading `?`

Do not prefix either variable with `VITE_`. A `VITE_` variable is compiled into browser JavaScript and would expose the storage credential. For local development, `VITE_SEARCH_BOTANY_IMAGE_PROXY` may point at a compatible local proxy; otherwise the application uses `/api/search-botany-blob`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

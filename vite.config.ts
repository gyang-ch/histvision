import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'react-redux': path.resolve(__dirname, './node_modules/react-redux'),
      'styled-components': path.resolve(__dirname, './node_modules/styled-components'),
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000', // Points to Python backend
    },
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ['assert', 'events', 'util', 'buffer', 'stream'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
})

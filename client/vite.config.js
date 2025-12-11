import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // Listen on all addresses (0.0.0.0)
        port: 3001,
        strictPort: false,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
            },
        },
    },
})

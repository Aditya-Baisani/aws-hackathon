import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: 5173,
        allowedHosts: true,
        proxy: {
            '/aws-api': {
                target: 'https://d5laro127a.execute-api.ap-south-1.amazonaws.com',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/aws-api/, '/prod'),
            },
        },
    },
})

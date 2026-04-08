import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mochiCss } from '@mochi-css/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), mochiCss()],
})

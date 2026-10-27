import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// mkcert generates a locally-trusted HTTPS certificate automatically.
// WebXR requires a "secure context" (HTTPS or localhost) to access the
// camera/AR session at all - without this plugin, testing on a real phone
// over your local network simply would not work.
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    host: true, // exposes the dev server on your local network, not just localhost
  },
})

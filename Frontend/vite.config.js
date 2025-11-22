import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// Check if SSL certificates exist
const certPath = path.resolve(__dirname, 'cert')
const certFile = path.join(certPath, 'localhost.crt')
const keyFile = path.join(certPath, 'localhost.key')
const hasSSL = fs.existsSync(certFile) && fs.existsSync(keyFile)

if (hasSSL) {
  console.log('✅ HTTPS enabled - Mobile microphone access will work')
} else {
  console.log('⚠️  HTTPS disabled - Run generate-cert.ps1 to enable HTTPS for mobile')
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    strictPort: false,
    // Enable HTTPS if certificates are available
    ...(hasSSL && {
      https: {
        key: fs.readFileSync(keyFile),
        cert: fs.readFileSync(certFile),
      }
    })
  }
})

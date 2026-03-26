import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // For static hosting under a sub-path (e.g. GitHub Pages), set VITE_BASE=/demoProjectG/
  base: process.env.VITE_BASE ?? '/',
});

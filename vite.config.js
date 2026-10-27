import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' membuat hasil build bisa dibuka dari folder mana pun (GitHub Pages, Netlify, hosting sekolah).
export default defineConfig({ plugins: [react()], base: './' });

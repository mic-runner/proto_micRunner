import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_PUBLIC_URL || '/',
  // other configurations...
});
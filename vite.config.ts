import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        watch: {
            // .vs फोल्डर आणि टेम्परी फाईल्स इग्नोर करा
            ignored: ['**/.vs/**', '**/node_modules/**'],
        },
    },
});
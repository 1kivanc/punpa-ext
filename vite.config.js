import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '');

  return {
    root: '.', 
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'popup.html')
        },
      },
    },
    define: {
      'process.env': JSON.stringify(env)
    },
    plugins: [
      {
        name: 'copy-manifest-assets',
        closeBundle() {
          fs.copyFileSync('manifest.json', 'dist/manifest.json');
          
          if (fs.existsSync('assets')) {
            fs.cpSync('assets', 'dist/assets', { recursive: true });
          }
          else if (fs.existsSync('public/assets')) {   
          }
          
        }
      }
    ]
  };
});

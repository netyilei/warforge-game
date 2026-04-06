import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import type { ProxyOptions } from 'vite';
import { setupVitePlugins } from './build/plugins';
import { createViteProxy, getBuildTime } from './build/config';

export default defineConfig(configEnv => {
  const viteEnv = loadEnv(configEnv.mode, process.cwd()) as unknown as Env.ImportMeta;

  const buildTime = getBuildTime();

  const enableProxy = configEnv.command === 'serve' && !configEnv.isPreview;

  return {
    base: viteEnv.VITE_BASE_URL,
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "@/styles/scss/global.scss" as *;`
        }
      }
    },
    plugins: setupVitePlugins(viteEnv, buildTime),
    define: {
      BUILD_TIME: JSON.stringify(buildTime)
    },
    server: {
      host: '0.0.0.0',
      port: 8203,
      open: true,
      proxy: {
        ...createViteProxy(viteEnv, enableProxy),
        '/api/v1': {
          target: 'http://localhost:8201',
          changeOrigin: true
        },
        '/api/v2': {
          target: 'http://localhost:8201',
          changeOrigin: true
        },
        '/nakama-api': {
          target: 'http://localhost:8202',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/nakama-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const authHeader = req.headers.authorization;
              if (!authHeader) {
                proxyReq.setHeader('Authorization', `Basic ${Buffer.from('dev_http_key_2026:').toString('base64')}`);
              }
            });
          }
        } as ProxyOptions
      }
    },
    preview: {
      port: 8206
    },
    build: {
      reportCompressedSize: false,
      sourcemap: viteEnv.VITE_SOURCE_MAP === 'Y',
      commonjsOptions: {
        ignoreTryCatch: false
      }
    }
  };
});

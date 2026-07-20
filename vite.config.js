import { defineConfig } from 'vitest/config';
import { build as viteBuild } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  copyFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync
} from 'node:fs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const fromRoot = (...parts) => resolve(ROOT, ...parts);

function copyStaticAssets() {
  return {
    name: 'siakadx-static-assets',
    async closeBundle() {
      for (const dir of ['dist/popup', 'dist/options', 'dist/styles', 'dist/icons']) {
        mkdirSync(fromRoot(dir), { recursive: true });
      }

      const copy = (source, destination) => {
        const src = fromRoot(source);
        if (existsSync(src)) copyFileSync(src, fromRoot(destination));
      };

      copy('src/popup/index.html', 'dist/popup/index.html');
      copy('src/popup/popup.css', 'dist/popup/popup.css');
      copy('src/options/index.html', 'dist/options/index.html');
      copy('src/options/options.css', 'dist/options/options.css');

      const styleDir = fromRoot('src/styles');
      if (existsSync(styleDir)) {
        for (const file of readdirSync(styleDir).filter((name) => name.endsWith('.css'))) {
          copyFileSync(resolve(styleDir, file), fromRoot('dist/styles', file));
        }
      }

      const iconDir = fromRoot('public/icons');
      if (existsSync(iconDir)) {
        for (const file of readdirSync(iconDir)) {
          const source = resolve(iconDir, file);
          if (statSync(source).isFile()) copyFileSync(source, fromRoot('dist/icons', file));
        }
      }

      await viteBuild({
        configFile: false,
        build: {
          outDir: fromRoot('dist'),
          emptyOutDir: false,
          minify: false,
          sourcemap: false,
          lib: {
            entry: fromRoot('src/content/index.js'),
            name: 'SiakadXContent',
            formats: ['iife'],
            fileName: () => 'content-script.js'
          },
          rollupOptions: {
            output: { inlineDynamicImports: true }
          },
          target: 'es2022'
        },
        logLevel: 'warn'
      });

      const manifest = JSON.parse(readFileSync(fromRoot('manifest.json'), 'utf8'));
      manifest.background.service_worker = 'background.js';
      manifest.content_scripts[0].js = ['content-script.js'];
      manifest.content_scripts[0].css = ['styles/attendance-unand.css'];
      manifest.action.default_popup = 'popup/index.html';
      manifest.options_ui.page = 'options/index.html';

      for (const size of ['16', '32', '48', '128']) {
        manifest.icons[size] = `icons/icon-${size}.png`;
        manifest.action.default_icon[size] = `icons/icon-${size}.png`;
      }

      manifest.web_accessible_resources[0].resources = [
        'styles/*',
        'icons/*',
        'assets/*'
      ];

      writeFileSync(
        fromRoot('dist/manifest.json'),
        JSON.stringify(manifest, null, 2) + '\n'
      );
    }
  };
}

export default defineConfig({
  build: {
    outDir: fromRoot('dist'),
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    rollupOptions: {
      input: {
        background: fromRoot('src/background/index.js'),
        popup: fromRoot('src/popup/popup.js'),
        options: fromRoot('src/options/options.js')
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background.js';
          if (chunk.name === 'popup') return 'popup/popup.js';
          if (chunk.name === 'options') return 'options/options.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        format: 'es'
      }
    },
    target: 'es2022'
  },
  plugins: [copyStaticAssets()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.js'],
    restoreMocks: true
  }
});

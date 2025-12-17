import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Gzip compression for production builds
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // Only compress files > 10KB
      algorithm: 'gzip',
      ext: '.gz'
    })
  ],
  
  resolve: {
    alias: {
      // Mirror tsconfig.json path mapping for @/* imports
      '@': resolve(__dirname, 'src')
    }
  },
  
  css: {
    preprocessorOptions: {
      scss: {
        // Auto-import variables.scss into all SCSS files
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  server: {
    port: 3000,
    open: true, // Auto-open browser on dev server start
    host: true, // Listen on all addresses (0.0.0.0)
    cors: true
  },
  
  build: {
    target: 'es2015', // Support modern browsers
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps for smaller bundle
    
    // Chunk splitting strategy for optimal caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate large visualization libraries
          'echarts': ['echarts', 'vue-echarts'],
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
          'antv': ['@antv/g6'],
          // Core framework bundle
          'vendor': ['vue', 'vue-router', 'pinia'],
          // Utilities
          'utils': ['dayjs', 'lodash-es']
        },
        // Consistent chunk naming for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000, // 1MB warning threshold
    
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      'echarts',
      'vue-echarts',
      '@antv/g6',
      'dayjs',
      'lodash-es'
    ]
  }
})

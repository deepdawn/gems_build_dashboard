import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Node.js의 assert 모듈을 브라우저 호환 shim으로 대체합니다.
      // Kepler.gl 내부에서 assert를 require()로 사용하는데,
      // Vite가 이를 externalize하면 빈 객체가 되어 런타임 에러가 발생합니다.
      'assert': path.resolve(__dirname, 'src/lib/assert-shim.js'),
    }
  },
  optimizeDeps: {
    include: [
      '@kepler.gl/components', 
      '@kepler.gl/actions', 
      '@kepler.gl/reducers',
      'react-map-gl'
    ]
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    }
  }
})

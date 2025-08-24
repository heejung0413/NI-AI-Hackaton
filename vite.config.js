import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.REACT_APP_AWS_ACCESS_KEY_ID': JSON.stringify(process.env.REACT_APP_AWS_ACCESS_KEY_ID),
    'process.env.REACT_APP_AWS_SECRET_ACCESS_KEY': JSON.stringify(process.env.REACT_APP_AWS_SECRET_ACCESS_KEY),
    'process.env.REACT_APP_S3_BUCKET_NAME': JSON.stringify(process.env.REACT_APP_S3_BUCKET_NAME),
    'process.env.REACT_APP_AWS_REGION': JSON.stringify(process.env.REACT_APP_AWS_REGION)
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: base must match your GitHub repo name for GitHub Pages to work,
// e.g. if your repo is https://github.com/yourname/my-vault, set base to '/my-vault/'.
// If you deploy to a user/org page (yourname.github.io repo), set base to '/'.
export default defineConfig({
  plugins: [react()],
  base: '/my-vault/',
})

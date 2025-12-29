# Deployment Guide

This guide covers how to deploy this React SPA to different hosting platforms.

## 📦 Build the Application

First, build the production bundle:

```bash
npm run build
```

The `dist` folder will contain all the static files ready for deployment.

## 🌐 Platform-Specific Configuration

### Vercel

✅ **Already configured!** The `vercel.json` file handles SPA routing automatically.

**Steps:**
1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Set environment variable `VITE_API_URL` in Vercel dashboard
4. Deploy!

**Environment Variables:**
- `VITE_API_URL` = `https://appedusolback.muntadaa.online`

---

### Netlify

✅ **Already configured!** The `public/_redirects` file handles SPA routing.

**Steps:**
1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Set environment variable `VITE_API_URL` in Netlify dashboard
6. Deploy!

**Environment Variables:**
- `VITE_API_URL` = `https://appedusolback.muntadaa.online`

---

### Apache Server

✅ **Already configured!** The `public/.htaccess` file handles SPA routing.

**Steps:**
1. Build: `npm run build`
2. Upload the entire `dist` folder contents to your Apache server
3. Make sure `.htaccess` is included (it's in `public/`, so copy it to `dist/`)
4. Ensure `mod_rewrite` is enabled on your Apache server
5. Set environment variables in your server configuration or `.env` file

**Note:** The `.htaccess` file will be copied to `dist/` during build if it's in `public/`.

---

### Nginx

Create an `nginx.conf` file on your server:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Steps:**
1. Build: `npm run build`
2. Upload `dist` folder contents to your server
3. Configure Nginx with the above settings
4. Restart Nginx: `sudo systemctl restart nginx`

---

### GitHub Pages

**Steps:**
1. Install gh-pages: `npm install -D gh-pages`
2. Add to `package.json` scripts:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```
3. Run: `npm run deploy`
4. Enable GitHub Pages in repository settings

**Note:** You'll need to set `base` in `vite.config.ts` if your repo is not at root:
```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ... rest of config
})
```

---

### Docker / Custom Server

If you're using a custom server or Docker:

**Option 1: Serve with a simple HTTP server**
```bash
npm run build
cd dist
npx serve -s .
```

**Option 2: Use Vite preview**
```bash
npm run build
npm run preview
```

**Option 3: Dockerfile example**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🔐 Environment Variables

**Important:** Set the `VITE_API_URL` environment variable for your backend API:

- **Local:** `http://localhost:3000`
- **Production:** `https://appedusolback.muntadaa.online`

**Note:** Don't include `/api` in the URL - it's added automatically by the app.

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Homepage loads correctly
- [ ] Direct URL access works (e.g., `/register`, `/dashboard`)
- [ ] No 404 errors on route navigation
- [ ] API calls work (check browser console for errors)
- [ ] Environment variables are set correctly

---

## 🐛 Troubleshooting

### 404 Errors on Direct URL Access

- **Vercel:** Check `vercel.json` exists
- **Netlify:** Check `public/_redirects` exists
- **Apache:** Check `.htaccess` exists and `mod_rewrite` is enabled
- **Nginx:** Check `try_files` directive in config

### API Not Working

- Check `VITE_API_URL` environment variable is set
- Verify the backend URL is correct (no `/api` suffix)
- Check browser console for CORS errors
- Verify backend is accessible from your domain

### Build Errors

- Run `npm install` to ensure dependencies are installed
- Check Node.js version (should be 18+)
- Clear cache: `rm -rf node_modules/.vite dist`


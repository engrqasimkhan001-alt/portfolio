# 🚀 Quick Deploy Guide - 5 Minutes

## Fastest Way: Vercel (Recommended)

### Option A: Deploy via GitHub (Best for Updates)

1. **Initialize Git** (if not done):
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Name it `portfolio`
   - **Don't** check "Initialize with README"
   - Click "Create repository"

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/portfolio.git
   git branch -M main
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` with your GitHub username)

4. **Deploy to Vercel**:
   - Go to https://vercel.com
   - Sign up with GitHub
   - Click "Add New Project"
   - Select your `portfolio` repository
   - Click "Deploy" (no configuration needed!)
   - Done! 🎉

**Your sites will be live at:**
- Main site: `https://your-project.vercel.app`
- Admin: `https://your-project.vercel.app/admin.html`

---

### Option B: Deploy via Drag & Drop (Fastest - No Git)

1. **Zip your project folder**:
   - Select all files in your portfolio folder
   - Right-click → "Compress" (Mac) or "Send to → Compressed folder" (Windows)

2. **Deploy to Netlify**:
   - Go to https://app.netlify.com/drop
   - Drag and drop your ZIP file
   - Wait 30 seconds
   - Done! 🎉

**Your sites will be live at:**
- Main site: `https://random-name-123.netlify.app`
- Admin: `https://random-name-123.netlify.app/admin.html`

⚠️ **Note**: Drag & drop is great for testing, but GitHub method is better for updates.

---

## After Deployment

1. **Test your website** - Visit the URL you got
2. **Test admin panel** - Visit `/admin.html`
3. **Update Supabase CORS** (if needed):
   - Go to Supabase Dashboard → Settings → API
   - Add your new domain to "Allowed Origins"
   - Example: `https://your-project.vercel.app`

---

## Need More Details?

See `DEPLOYMENT_GUIDE.md` for complete instructions.

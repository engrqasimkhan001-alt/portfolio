# 🚀 Deploy Your Portfolio - Step by Step

## Current Status
✅ You're logged into Vercel  
✅ You have a GitHub account (`engrqasimkhan001-alt`)

## Next Steps (Do This Now!)

### Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. **Repository name**: `portfolio` (or any name you like)
3. **Description**: "My professional portfolio website"
4. **Visibility**: Choose Public or Private
5. **IMPORTANT**: Do NOT check "Add a README file"
6. Click **"Create repository"**

---

### Step 2: Push Your Code to GitHub

Open your **Terminal** (or Command Prompt) and run these commands:

```bash
# Navigate to your portfolio folder
cd /Users/engrqasimkhan/portfolio

# Initialize Git (if not done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Portfolio website"

# Connect to GitHub (replace YOUR_USERNAME with: engrqasimkhan001-alt)
git remote add origin https://github.com/engrqasimkhan001-alt/portfolio.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

**Note**: GitHub will ask for your username and password. Use a **Personal Access Token** instead of password:
- Go to: https://github.com/settings/tokens
- Click "Generate new token (classic)"
- Give it a name like "Portfolio Deployment"
- Check "repo" scope
- Click "Generate token"
- Copy the token and use it as your password when pushing

---

### Step 3: Deploy on Vercel

1. Go back to your **Vercel dashboard** (you're already there!)
2. Click the **"Import"** button (under "Import Project")
3. You'll see a list of your GitHub repositories
4. Find and click on **"portfolio"** (the one you just created)
5. Click **"Import"**
6. On the next screen:
   - **Framework Preset**: Leave as "Other" (or auto-detected)
   - **Root Directory**: Leave as `./` (default)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
7. Click **"Deploy"**
8. Wait 1-2 minutes for deployment to complete

---

### Step 4: Get Your Live URLs

After deployment completes, you'll see:
- ✅ **Main Website**: `https://portfolio-xxxxx.vercel.app`
- ✅ **Admin Panel**: `https://portfolio-xxxxx.vercel.app/admin.html`

**Click on the URL to visit your live site!** 🎉

---

### Step 5: Update Supabase CORS (Important!)

Your site needs permission to connect to Supabase:

1. Go to your **Supabase Dashboard**
2. Click **Settings** → **API**
3. Scroll to **"Allowed Origins"**
4. Click **"Add origin"**
5. Add your Vercel URL: `https://portfolio-xxxxx.vercel.app`
6. Click **"Save"**

Now your contact form and admin panel will work! ✅

---

## Troubleshooting

### "Repository not found" error
- Make sure you created the repository on GitHub first
- Check the repository name matches exactly

### "Authentication failed" when pushing
- Use a Personal Access Token instead of password
- See Step 2 instructions above

### "CORS error" on live site
- Make sure you added your Vercel URL to Supabase allowed origins
- See Step 5 above

### Can't find repository in Vercel
- Make sure you pushed code to GitHub successfully
- Refresh the Vercel import page
- Check repository is public (or Vercel has access)

---

## 🎉 You're Done!

Once deployed:
- Share your portfolio URL with clients
- Access admin panel at `/admin.html`
- All future code changes: just push to GitHub, Vercel auto-deploys!

**Need help?** Let me know what step you're stuck on!

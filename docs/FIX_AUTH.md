# Fix GitHub Authentication Issue

## Problem
Git is trying to authenticate as `muhammadqasimsahab` but the repository belongs to `engrqasimkhan001-alt`.

## Solution Options

### Option 1: Use Personal Access Token (Recommended)

1. **Create a Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Name: "Portfolio Deployment"
   - Expiration: 90 days (or your preference)
   - Check: `repo` scope
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again!)

2. **Update remote URL with token:**
   ```bash
   git remote set-url origin https://YOUR_TOKEN@github.com/engrqasimkhan001-alt/portfolio.git
   ```
   Replace `YOUR_TOKEN` with the token you just created.

3. **Push again:**
   ```bash
   git push -u origin main
   ```

### Option 2: Update Remote URL with Username

```bash
# Remove current remote
git remote remove origin

# Add remote with correct username
git remote add origin https://engrqasimkhan001-alt@github.com/engrqasimkhan001-alt/portfolio.git

# Push (will prompt for password/token)
git push -u origin main
```

### Option 3: Use SSH (If you have SSH keys set up)

```bash
# Remove HTTPS remote
git remote remove origin

# Add SSH remote
git remote add origin git@github.com:engrqasimkhan001-alt/portfolio.git

# Push
git push -u origin main
```

---

## Quick Fix (Easiest)

Run these commands:

```bash
# Remove current remote
git remote remove origin

# Add remote with username
git remote add origin https://engrqasimkhan001-alt@github.com/engrqasimkhan001-alt/portfolio.git

# Push (when prompted for password, use Personal Access Token)
git push -u origin main
```

When prompted:
- **Username**: `engrqasimkhan001-alt`
- **Password**: Use your Personal Access Token (not your GitHub password)

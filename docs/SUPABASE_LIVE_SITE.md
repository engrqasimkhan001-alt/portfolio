# Complete Supabase Steps for Your Live Site

Your portfolio is live at **portfolio-eight-tawny-ajrh4tk6lm.vercel.app**. Follow these steps so the live site works with Supabase.

---

## 1. Add Your Vercel Domain to Supabase (Required)

Without this, the contact form, admin panel, team, and portfolio data will not work on the live site.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project (the one you use for this portfolio)
3. Click **Settings** (gear icon in the left sidebar)
4. Click **API**
5. Scroll to **"Allowed Origins"** (or "CORS Allowed Origins")
6. Click **Add origin** or **Add URL**
7. Add these URLs (one at a time if needed):
   - `https://portfolio-eight-tawny-ajrh4tk6lm.vercel.app`
   - `https://portfolio-eight-tawny-ajrh4tk6lm.vercel.app/`
   - If you add a custom domain later (e.g. `https://yourdomain.com`), add that too
8. Click **Save**

After this, your live site can talk to Supabase.

---

## 2. Verify Database Tables

If you haven’t run the full setup yet:

1. In Supabase, go to **SQL Editor**
2. Run the script in **`complete-database-setup.sql`** (creates `contact_messages`, `portfolio_projects`, `team_members`, and RLS)
3. If you use image uploads in the admin panel, run **`storage-setup.sql`** to create the `images` bucket and policies

If these are already done, skip this step.

---

## 3. Confirm API Keys in Your Code

Your Supabase URL and anon key are in **`index.html`** and **`admin.html`** (inline scripts). They are already in the repo, so the live Vercel site uses the same keys. No change needed unless you create a new Supabase project.

---

## 4. Test the Live Site

1. Open: https://portfolio-eight-tawny-ajrh4tk6lm.vercel.app  
2. **Contact form** – Send a test message, then check Supabase **Table Editor** → `contact_messages`  
3. **Admin panel** – Open https://portfolio-eight-tawny-ajrh4tk6lm.vercel.app/admin.html and log in  
4. **Team** – Check that the Team section loads members from Supabase  
5. **Portfolio** – Check that projects load from Supabase  

If anything fails, open the browser **Developer Tools** (F12) → **Console** and look for CORS or Supabase errors.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Add Vercel URL to Supabase **Settings → API → Allowed Origins** |
| 2 | Ensure DB tables (and storage) are set up via SQL scripts |
| 3 | No code change needed for API keys |
| 4 | Test contact form, admin, team, and portfolio on the live URL |

The step that makes the live site work with Supabase is **adding your Vercel domain to Allowed Origins**.

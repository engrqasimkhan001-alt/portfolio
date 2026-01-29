# How to Find CORS Settings in Supabase

## Where to Look

1. **Go to Settings** (not Authentication)
   - In your Supabase dashboard, look for the **gear icon** (⚙️) in the left sidebar
   - Click **Settings** (not "Authentication")

2. **Click on "API"**
   - In the Settings menu, click **"API"** (not "URL Configuration")
   - This is where API keys and CORS settings are located

3. **Look for CORS or Allowed Origins**
   - Scroll down in the API settings page
   - Look for sections like:
     - "Allowed Origins"
     - "CORS Configuration"
     - "Additional Allowed Origins"
     - Or similar wording

---

## Important: Supabase May Handle CORS Automatically

**Good news!** Modern Supabase projects often handle CORS automatically for public API endpoints. This means:

- ✅ Your site might work **without** manually adding CORS settings
- ✅ Supabase allows requests from any origin when using the `anon` key
- ✅ You only need to configure CORS if you see actual CORS errors

---

## Test First, Configure Later

**Before worrying about CORS settings:**

1. **Test your live site:**
   - Visit: https://portfolio-eight-tawny-ajrh4tk6lm.vercel.app
   - Try submitting the contact form
   - Open browser Developer Tools (F12) → Console tab
   - Look for any CORS errors

2. **If you see CORS errors:**
   - Then you need to find and configure CORS settings
   - The error message will tell you exactly what's wrong

3. **If everything works:**
   - ✅ No CORS configuration needed!
   - Supabase is handling it automatically

---

## Alternative: Check Project Settings

If you can't find "Allowed Origins" in Settings → API, try:

1. **Settings → General**
   - Some Supabase projects have CORS in general settings

2. **Project Settings → API**
   - Look for any section about "origins" or "domains"

3. **Check Supabase Documentation**
   - Visit: https://supabase.com/docs/guides/api
   - Search for "CORS" or "allowed origins"

---

## Quick Test

**Right now, test if CORS is even needed:**

1. Open your live site: https://portfolio-eight-tawny-ajrh4tk6lm.vercel.app
2. Open Developer Tools (Press F12)
3. Go to Console tab
4. Try submitting the contact form
5. Check for any red error messages about CORS

**If you see NO CORS errors → You're all set! No configuration needed!** 🎉

**If you DO see CORS errors → Then we'll help you find the settings.**

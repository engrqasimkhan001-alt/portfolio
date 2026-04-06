# Fix: "new row violates row-level security policy" on Image Upload

## Quick fix (SQL)

1. Open **Supabase Dashboard** → your project  
2. Go to **SQL Editor** (left sidebar)  
3. Click **New query**  
4. Open the file **`fix-storage-policies.sql`** in your project  
5. Copy its **entire** contents and paste into the SQL Editor  
6. Click **Run** (or Cmd/Ctrl + Enter)  
7. You should see "Success. No rows returned" or similar  
8. Try uploading an image again in the admin panel  

---

## If it still fails: create bucket and policies in the UI

### 1. Create the bucket

1. Go to **Storage** in the left sidebar  
2. If there is no **images** bucket:  
   - Click **New bucket**  
   - Name: `images`  
   - Turn **Public bucket** ON  
   - Click **Create bucket**  

### 2. Add policies

1. Open the **images** bucket  
2. Go to the **Policies** tab  
3. Click **New policy**  
4. Choose **For full customization**  

Create these **4 policies** (one at a time):

**Policy 1 – Read**

- Name: `images_select_public`  
- Allowed operation: **SELECT (read)**  
- Policy definition: **USING**  
- Expression: `bucket_id = 'images'`  
- Roles: leave default (or add `public` if your UI has it)  

**Policy 2 – Insert (anon)**

- Name: `images_insert_anon`  
- Allowed operation: **INSERT**  
- Policy definition: **WITH CHECK**  
- Expression: `bucket_id = 'images'`  
- Roles: **anon**  

**Policy 3 – Insert (authenticated)**

- Name: `images_insert_authenticated`  
- Allowed operation: **INSERT**  
- Policy definition: **WITH CHECK**  
- Expression: `bucket_id = 'images'`  
- Roles: **authenticated**  

**Policy 4 – Update**

- Name: `images_update_all`  
- Allowed operation: **UPDATE**  
- USING: `bucket_id = 'images'`  
- WITH CHECK: `bucket_id = 'images'`  
- Roles: **anon**, **authenticated**  

**Policy 5 – Delete**

- Name: `images_delete_all`  
- Allowed operation: **DELETE**  
- USING: `bucket_id = 'images'`  
- Roles: **anon**, **authenticated**  

Save each policy, then try uploading again.

---

## Why this happens

- Storage uses **Row Level Security (RLS)** on `storage.objects`.  
- By default, **no one** can insert rows (upload files) until you add an **INSERT** policy.  
- The admin panel uses the **anon** key, so you must have an **INSERT** policy for the **anon** role on the **images** bucket.  

The SQL script and the UI steps above add that policy (and the others needed for read/update/delete).

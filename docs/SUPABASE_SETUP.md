# Supabase Setup Guide

This guide will help you set up Supabase for your portfolio contact form.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `portfolio-contact` (or any name you prefer)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose the closest region to you
5. Click "Create new project"
6. Wait for the project to be created (takes 1-2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon)
2. Click on **API** in the left sidebar
3. You'll find:
   - **Project URL** - Copy this (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** - Copy this (starts with `eyJ...`)

## Step 3: Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the contents of `supabase-setup.sql` file
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 4: Configure Your Website

1. Open `config.js` in your project
2. Replace the placeholders:
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```
3. Save the file

## Step 5: Test the Contact Form

1. Open your website in a browser
2. Navigate to the Contact section
3. Fill out and submit the form
4. Go back to Supabase dashboard → **Table Editor** → `contact_messages`
5. You should see your test message!

## Viewing Messages

### Option 1: Supabase Dashboard
- Go to **Table Editor** → `contact_messages`
- View all submitted messages
- You can mark messages as read manually

### Option 2: Create an Admin Panel (Optional)
You can create a simple admin page to view messages. Here's a basic example:

```html
<!-- admin.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Contact Messages Admin</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="config.js"></script>
</head>
<body>
    <h1>Contact Messages</h1>
    <div id="messages"></div>
    <script>
        async function loadMessages() {
            const { data, error } = await supabase
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error(error);
                return;
            }
            
            const messagesDiv = document.getElementById('messages');
            messagesDiv.innerHTML = data.map(msg => `
                <div style="border: 1px solid #ccc; padding: 1rem; margin: 1rem 0;">
                    <h3>${msg.subject}</h3>
                    <p><strong>From:</strong> ${msg.name} (${msg.email})</p>
                    <p><strong>Date:</strong> ${new Date(msg.created_at).toLocaleString()}</p>
                    <p>${msg.message}</p>
                    <button onclick="markAsRead(${msg.id})">Mark as Read</button>
                </div>
            `).join('');
        }
        
        async function markAsRead(id) {
            await supabase
                .from('contact_messages')
                .update({ read: true })
                .eq('id', id);
            loadMessages();
        }
        
        loadMessages();
    </script>
</body>
</html>
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Row Level Security (RLS)**: The setup includes RLS policies that allow public inserts (form submissions) and reads. For production:
   - Consider restricting read access to authenticated users only
   - Or create a separate admin interface with authentication

2. **API Keys**: 
   - The `anon` key is safe to use in frontend code (it's public)
   - Never expose your `service_role` key in frontend code
   - The current setup uses the `anon` key which is correct

3. **Rate Limiting**: Consider adding rate limiting to prevent spam:
   - You can use Supabase Edge Functions
   - Or implement client-side rate limiting

4. **Email Notifications**: You can set up email notifications when new messages arrive:
   - Use Supabase Edge Functions with a service like SendGrid, Resend, or AWS SES
   - Or use Supabase's built-in email service (if available)

## Troubleshooting

### Form submission fails
- Check browser console for errors
- Verify your Supabase URL and key in `config.js`
- Make sure the table `contact_messages` exists in your database
- Check that RLS policies are set up correctly

### Messages not appearing
- Check the Supabase dashboard → Table Editor
- Verify the table name matches exactly: `contact_messages`
- Check browser console for any JavaScript errors

### CORS errors
- Supabase handles CORS automatically
- If you see CORS errors, check that your Supabase URL is correct

## Next Steps

- Set up email notifications for new messages
- Create an admin dashboard to manage messages
- Add message filtering and search
- Set up automated responses

For more help, visit [Supabase Documentation](https://supabase.com/docs)

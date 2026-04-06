# Admin Panel Setup Guide

This guide will help you set up and use the admin panel for managing your portfolio website.

## Features

- ✅ **Projects Management**: Add, edit, and delete portfolio projects
- ✅ **Team Management**: Add, edit, and delete team members
- ✅ **Messages Management**: View and manage contact form messages
- ✅ **Password Protection**: Secure admin access
- ✅ **Real-time Updates**: Changes reflect immediately on your website

## Setup Instructions

### Step 1: Set Up Database Tables

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `admin-database-setup.sql`
4. Click **Run** to execute the SQL script
5. Verify tables are created:
   - `portfolio_projects`
   - `team_members`
   - `contact_messages` (should already exist)

### Step 2: Configure Admin Password

1. Open `admin.js` in your project
2. Find this line near the top:
   ```javascript
   const ADMIN_PASSWORD = 'wOs2024Admin!';
   ```
3. **Change this to a strong, secure password**
4. Save the file

⚠️ **Important**: Never commit your admin password to version control. Consider using environment variables in production.

### Step 3: Access the Admin Panel

1. Open `admin.html` in your browser
   - Or navigate to: `http://localhost:8000/admin.html`
2. Enter your admin password
3. Click "Login"

## Using the Admin Panel

### Managing Projects

1. Click on the **Projects** tab
2. Click **+ Add Project** to create a new project
3. Fill in the form:
   - **Title**: Project name
   - **Description**: Brief description
   - **Platform**: Mobile App, Web Application, or Both
   - **Technologies**: Comma-separated list (e.g., "React, Node.js, MongoDB")
   - **Image URL**: Optional project image
   - **Project Link**: Optional link to live project
4. Click **Save Project**
5. Projects will appear on your main portfolio page automatically

**To Edit**: Click the "Edit" button next to any project
**To Delete**: Click the "Delete" button (confirmation required)

### Managing Team Members

1. Click on the **Team** tab
2. Click **+ Add Team Member** to add a new member
3. Fill in the form:
   - **Name**: Full name
   - **Role**: Job title/role
   - **Bio**: Brief biography
   - **Email**: Optional email address
   - **Image URL**: Optional profile photo URL
   - **LinkedIn URL**: Optional LinkedIn profile
   - **GitHub URL**: Optional GitHub profile
4. Click **Save Member**
5. Team members will appear on your Team section automatically

**To Edit**: Click the "Edit" button next to any member
**To Delete**: Click the "Delete" button (marks as inactive)

### Managing Messages

1. Click on the **Messages** tab
2. View all contact form submissions
3. Unread messages are highlighted in yellow
4. Click **View** to see full message details
5. Click **Mark Read** to mark messages as read

## Security Considerations

### Current Setup (Development)

The current setup uses:
- **Password-based authentication** (stored in JavaScript)
- **Session storage** for login state
- **Supabase RLS policies** for database access

### For Production

For a production environment, consider:

1. **Supabase Authentication**:
   - Set up proper user authentication
   - Use Supabase Auth instead of password
   - Create admin user roles

2. **Backend API**:
   - Move admin operations to a backend server
   - Use Supabase service role key (server-side only)
   - Never expose service role key in frontend

3. **Enhanced Security**:
   - Add rate limiting
   - Implement CSRF protection
   - Use HTTPS only
   - Add IP whitelisting if needed

4. **Update RLS Policies**:
   ```sql
   -- Example: Only allow specific admin users
   CREATE POLICY "Only admins can modify"
       ON portfolio_projects
       FOR ALL
       TO authenticated
       USING (
           auth.uid() IN (
               SELECT user_id FROM admin_users 
               WHERE user_id = auth.uid()
           )
       );
   ```

## Troubleshooting

### Can't Login
- Check that the password in `admin.js` matches what you're entering
- Clear browser cache and try again
- Check browser console for errors

### Projects/Team Not Showing on Website
- Verify Supabase is configured in `config.js`
- Check browser console for errors
- Ensure database tables exist and have data
- Verify RLS policies allow public read access

### Database Errors
- Check Supabase dashboard for error logs
- Verify table names match exactly (case-sensitive)
- Ensure RLS policies are set up correctly
- Check that you're using the correct Supabase credentials

### Changes Not Saving
- Check browser console for errors
- Verify Supabase connection in `config.js`
- Ensure RLS policies allow authenticated users to insert/update
- Check network tab for failed requests

## File Structure

```
portfolio/
├── admin.html              # Admin panel page
├── admin.css              # Admin panel styles
├── admin.js               # Admin panel functionality
├── admin-database-setup.sql  # Database schema
├── portfolio.js           # Loads projects from database
├── team.js                # Loads team from database
└── config.js              # Supabase configuration
```

## API Reference

### Portfolio Projects Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| title | TEXT | Project title |
| description | TEXT | Project description |
| platform | TEXT | 'Mobile App', 'Web Application', or 'Both' |
| technologies | TEXT | Comma-separated technologies |
| image_url | TEXT | Optional image URL |
| project_link | TEXT | Optional project link |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### Team Members Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| name | TEXT | Member name |
| role | TEXT | Job role/title |
| bio | TEXT | Biography |
| email | TEXT | Optional email |
| image_url | TEXT | Optional profile image URL |
| linkedin_url | TEXT | Optional LinkedIn URL |
| github_url | TEXT | Optional GitHub URL |
| active | BOOLEAN | Active status (default: true) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify Supabase configuration
3. Review database logs in Supabase dashboard
4. Check that all SQL scripts ran successfully

---

**Remember**: Change the admin password before deploying to production!

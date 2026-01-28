# Portfolio Website - Engr Qasim Khan

A modern, professional portfolio website for a Mobile App Developer & Web Developer.

## Features

- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Smooth scrolling navigation
- ✅ Animated sections on scroll
- ✅ Modern, clean UI with gradient accents
- ✅ SEO-friendly structure
- ✅ Contact form with Supabase integration
- ✅ Portfolio showcase (database-driven)
- ✅ Team section (database-driven)
- ✅ Skills visualization
- ✅ Services section
- ✅ **Admin Panel** for managing content (projects, team, messages)

## Getting Started

1. **Open the website**: Simply open `index.html` in your web browser, or
2. **Use a local server** (recommended):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. Navigate to `http://localhost:8000` in your browser

## Customization

### Update Personal Information

1. **Email**: Already set to `engrqasimkhan001@gmail.com` ✅
2. **Upwork Profile**: Replace `https://www.upwork.com/freelancers/~yourprofile` with your actual Upwork profile URL
3. **Portfolio Projects**: Update the portfolio items in the Portfolio section with your actual projects
4. **Skills**: Adjust skill percentages and names in the Skills section
5. **About Me**: Customize the about section text with your personal story

### Supabase Setup (Required for Contact Form)

The contact form uses Supabase to store messages. Follow these steps:

1. **Create a Supabase account** at [supabase.com](https://supabase.com)
2. **Create a new project** in Supabase
3. **Run the SQL script**: Copy and paste `supabase-setup.sql` into Supabase SQL Editor
4. **Get your credentials**: 
   - Go to Settings → API
   - Copy your Project URL and anon key
5. **Update `config.js`**: Replace the placeholder values with your Supabase credentials

📖 **Detailed instructions**: See `SUPABASE_SETUP.md` for a complete step-by-step guide.

### Styling

- **Colors**: Modify CSS variables in `styles.css` (lines 5-15) to change the color scheme
- **Fonts**: The site uses Google Fonts (Inter). Change the font import in `index.html` if desired
- **Animations**: Adjust animation timings in `styles.css` and `script.js`

### Contact Form

The contact form is integrated with Supabase! ✅

- Messages are stored in your Supabase database
- Form includes validation and error handling
- Success/error messages are displayed to users
- View messages in Supabase dashboard → Table Editor → `contact_messages`

**Setup Required**: See the Supabase Setup section above or check `SUPABASE_SETUP.md` for detailed instructions.

### Admin Panel

Your portfolio includes a powerful admin panel for managing content:

1. **Access**: Open `admin.html` in your browser
2. **Login**: Use the default password (change it in `admin.js` for security)
3. **Manage**:
   - Add/edit/delete portfolio projects
   - Add/edit/delete team members
   - View and manage contact messages

📖 **Complete Guide**: See `ADMIN_PANEL_GUIDE.md` for detailed setup and usage instructions.

**Important**: 
- Run `admin-database-setup.sql` in Supabase to create required tables
- Change the admin password in `admin.js` before deploying

## File Structure

```
portfolio/
├── index.html              # Main HTML structure
├── admin.html              # Admin panel page
├── styles.css              # All styling and responsive design
├── admin.css               # Admin panel styles
├── script.js               # JavaScript for interactivity
├── admin.js                # Admin panel functionality
├── portfolio.js            # Loads projects from database
├── team.js                 # Loads team from database
├── config.js               # Supabase configuration (update with your credentials)
├── supabase-setup.sql      # SQL script for contact messages
├── admin-database-setup.sql # SQL script for projects and team
├── SUPABASE_SETUP.md       # Detailed Supabase setup guide
├── ADMIN_PANEL_GUIDE.md    # Admin panel setup and usage guide
└── README.md               # This file
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment

### GitHub Pages
1. Push your code to a GitHub repository
2. Go to Settings > Pages
3. Select your branch and folder
4. Your site will be live at `https://yourusername.github.io/portfolio`

### Netlify
1. Drag and drop the folder to Netlify
2. Or connect your GitHub repository
3. Your site will be live instantly

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts

### Other Options
- AWS S3 + CloudFront
- Firebase Hosting
- Any static hosting service

## SEO Optimization

The site includes:
- Semantic HTML5 structure
- Meta tags for description and keywords
- Proper heading hierarchy
- Alt text placeholders (add when you add images)
- Clean URL structure

## Performance Tips

1. **Images**: When adding real project images, optimize them (use WebP format, compress)
2. **Fonts**: The Google Font is already optimized with `display=swap`
3. **Minification**: Consider minifying CSS and JS for production
4. **CDN**: Use a CDN for static assets if needed

## License

This portfolio template is free to use and modify for personal or commercial projects.

## Support

For questions or issues, feel free to reach out or open an issue in the repository.

---

**Built with ❤️ for Engr Qasim Khan**

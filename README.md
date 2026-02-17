# 🎬 Anime Tracker

A modern, feature-rich anime tracking web application built with vanilla JavaScript and Supabase. Track your anime watching progress with season-based tracking, poster uploads, and smart search functionality.

![Anime Tracker](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

### Core Functionality
- **Add & Manage Anime**: Track both series and movies with detailed information
- **Season-Based Tracking**: For series, track multiple seasons with episode progress
- **Poster Upload**: Upload and store anime posters using Supabase Storage
- **Smart Search**: Real-time, case-insensitive partial match search
- **Category Filters**: Filter by Watching, Completed, Plan to Watch, or Dropped
- **Progress Tracking**: Visual progress bars and episode counters

### Series Features
- Add multiple seasons per anime
- Track episodes per season
- Auto-progression to next season when current season is completed
- View overall episode count across all seasons
- Expandable seasons view

### Movie Features
- Simple watched/unwatched toggle
- No episode tracking required

### UI/UX
- Modern dark theme with gradient accents
- Fully responsive (mobile, tablet, desktop)
- Smooth animations and transitions
- Clean card-based layout
- Loading states and user feedback

## 🚀 Quick Start

### Prerequisites
- A Supabase account (free tier works perfectly)
- A modern web browser
- Basic understanding of HTML/CSS/JavaScript

### 1. Supabase Setup

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details and wait for setup to complete

#### Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create anime table
CREATE TABLE anime (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Series', 'Movie')),
    status TEXT NOT NULL CHECK (status IN ('Watching', 'Completed', 'Plan to Watch', 'Dropped')),
    poster_url TEXT,
    watched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create seasons table
CREATE TABLE seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    total_episodes INTEGER NOT NULL,
    last_watched INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT valid_last_watched CHECK (last_watched >= 0 AND last_watched <= total_episodes)
);

-- Create indexes for better performance
CREATE INDEX idx_anime_status ON anime(status);
CREATE INDEX idx_anime_type ON anime(type);
CREATE INDEX idx_seasons_anime_id ON seasons(anime_id);

-- Enable Row Level Security (RLS)
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your needs)
CREATE POLICY "Enable read access for all users" ON anime
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON anime
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON anime
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON anime
    FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON seasons
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON seasons
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON seasons
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON seasons
    FOR DELETE USING (true);
```

#### Create Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click **New Bucket**
3. Name it: `anime-posters`
4. Make it **Public** (so poster images are accessible)
5. Click **Create Bucket**

#### Set Storage Policies

In the Storage section, click on `anime-posters` bucket, then go to **Policies**:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'anime-posters');

-- Allow public insert
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'anime-posters');

-- Allow public update
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'anime-posters');

-- Allow public delete
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'anime-posters');
```

### 2. Configure the Application

1. Get your Supabase credentials:
   - Go to **Project Settings** → **API**
   - Copy your **Project URL**
   - Copy your **anon/public key**

2. Open `config.js` and update:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 3. Add Supabase Client Library

Add this line in your `index.html` **before** the `config.js` script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="config.js"></script>
<script src="script.js"></script>
```

### 4. Run Locally

Simply open `index.html` in your browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 🌐 Deploy to GitHub Pages

### 1. Create a GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/anime-tracker.git
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select `main` branch
4. Click **Save**
5. Your site will be live at `https://yourusername.github.io/anime-tracker/`

### Important Notes for Deployment

- **Never commit your actual Supabase keys to public repositories**
- For production, consider using environment variables or a backend proxy
- The current setup uses public anon keys which is acceptable for public data
- For user-specific data, implement Supabase Authentication

## 📁 Project Structure

```
anime-tracker/
├── index.html          # Main HTML structure
├── style.css           # Styling and theme
├── script.js           # Application logic
├── config.js           # Supabase configuration
└── README.md           # Documentation
```

## 🎨 Customization

### Change Theme Colors

Edit the CSS variables in `style.css`:

```css
:root {
    --accent-primary: #6366f1;    /* Primary accent color */
    --accent-secondary: #8b5cf6;  /* Secondary accent color */
    --bg-primary: #0a0e27;        /* Main background */
    /* ... more variables */
}
```

### Modify Status Options

Update the status options in `index.html`:

```html
<select id="animeStatus" required>
    <option value="Watching">Watching</option>
    <option value="Completed">Completed</option>
    <option value="Plan to Watch">Plan to Watch</option>
    <option value="Dropped">Dropped</option>
    <!-- Add your custom statuses here -->
</select>
```

Don't forget to update the database constraint:

```sql
ALTER TABLE anime DROP CONSTRAINT anime_status_check;
ALTER TABLE anime ADD CONSTRAINT anime_status_check 
    CHECK (status IN ('Watching', 'Completed', 'Plan to Watch', 'Dropped', 'Your Custom Status'));
```

## 🔧 Advanced Features

### Add User Authentication

To make the app user-specific:

1. Enable Supabase Authentication
2. Update RLS policies to filter by `auth.uid()`
3. Add login/signup UI
4. Modify queries to include user context

Example policy with auth:

```sql
CREATE POLICY "Users can only see their own anime" ON anime
    FOR SELECT USING (auth.uid() = user_id);
```

### Add More Fields

You can extend the anime table:

```sql
ALTER TABLE anime ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 10);
ALTER TABLE anime ADD COLUMN notes TEXT;
ALTER TABLE anime ADD COLUMN start_date DATE;
ALTER TABLE anime ADD COLUMN end_date DATE;
```

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Troubleshooting

### Images not loading
- Check if storage bucket is public
- Verify storage policies are set correctly
- Check browser console for CORS errors

### Data not saving
- Verify Supabase credentials in `config.js`
- Check RLS policies are enabled
- Look for errors in browser console

### Seasons not showing
- Ensure foreign key relationship is correct
- Check if seasons are being inserted properly
- Verify the anime_id matches

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 💡 Future Enhancements

- [ ] User authentication
- [ ] Export/Import data
- [ ] Statistics dashboard
- [ ] MAL/AniList integration
- [ ] Dark/Light theme toggle
- [ ] Bulk operations
- [ ] Advanced filtering
- [ ] Sorting options
- [ ] Favorites/Ratings system

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section
2. Review Supabase documentation
3. Open an issue on GitHub

---

## 🎯 Detailed Feature Guide

### 1. Add Anime ✅
**What it does**: Add new anime to your tracking list
- Enter anime name
- Select type (Series or Movie)
- Choose status (Watching, Completed, Plan to Watch, Dropped)
- Upload poster image from your device
- Image automatically stored in Supabase Storage

### 2. Season-Based Tracking (For Series) ✅
**What it does**: Track multiple seasons with individual episode counts
- Add unlimited seasons per anime
- Each season has: Season number, Total episodes, Last watched episode
- Progress is calculated automatically across all seasons

### 3. Episode Tracking ✅
**What it does**: Increment episode progress with one click
- "+1 Episode" button on each anime card
- Smart Auto-Progression: Finishes one season and automatically starts the next
- Updates progress bar in real-time

### 4. Movie Support ✅
**What it does**: Simple watched/unwatched tracking for movies
- Toggle switch for watched status
- No episode tracking needed

### 5. Watchlist Categories ✅
**What it does**: Organize anime by watching status (Watching, Completed, Plan to Watch, Dropped)
- Filter tabs at the top with count badges

### 6. Smart Search ✅
**What it does**: Real-time, case-insensitive partial match search

### 7. Responsive Design ✅
**What it does**: Works perfectly on all devices
- **Desktop**: 4-5 cards per row
- **Tablet**: 2-3 cards per row
- **Mobile**: 1 card per row (Optimized focus)

### 8. Modern Dark Theme ✅
**What it does**: Beautiful, eye-friendly dark interface with glassmorphism effects and neon accents.

### 9. Technical Stack
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for posters)
- **Frontend**: Vanilla JavaScript (ES6+), CSS3 with Glassmorphism

---

**Built with ❤️ using Vanilla JavaScript and Supabase**

## 🏗️ Database & Storage Guide

For the full technical setup, refer to the SQL sections below. These cover everything from table creation to advanced query patterns and security policies.

### 1. Database Schema
The application uses two main tables: `anime` and `seasons`.

```sql
-- Create tables
CREATE TABLE anime (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Series', 'Movie')),
    status TEXT NOT NULL CHECK (status IN ('Watching', 'Completed', 'Plan to Watch', 'Dropped')),
    poster_url TEXT,
    watched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    total_episodes INTEGER NOT NULL,
    last_watched INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT valid_last_watched CHECK (last_watched >= 0 AND last_watched <= total_episodes)
);
```

### 2. Advanced Queries
Useful for debugging or creating administrative views.

```sql
-- Get watching progress statistics
SELECT 
    a.name,
    a.type,
    CASE 
        WHEN a.type = 'Movie' THEN 
            CASE WHEN a.watched THEN '100%' ELSE '0%' END
        ELSE 
            ROUND(
                (SUM(s.last_watched)::DECIMAL / NULLIF(SUM(s.total_episodes), 0)) * 100, 
                2
            )::TEXT || '%'
    END as progress
FROM anime a
LEFT JOIN seasons s ON a.id = s.anime_id
GROUP BY a.id, a.name, a.type, a.watched
ORDER BY a.name;
```

---

**Built with ❤️ using Vanilla JavaScript and Supabase**

// Supabase Configuration
// Project credentials
const SUPABASE_URL = 'https://guwmniyfmkpdoigalnaa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_gpm2iRnZNj67s35R4r1n4Q_bZUDL80W';

// Storage bucket name
const STORAGE_BUCKET = 'anime-posters';

// Export configuration
window.supabaseConfig = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    storageBucket: STORAGE_BUCKET
};

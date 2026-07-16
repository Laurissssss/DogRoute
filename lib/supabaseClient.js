import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials are missing. Please check your .env.local file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://tuftiaznpvxsbgvruwvn.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZnRpYXpucHZ4c2JndnJ1d3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNzYwMzksImV4cCI6MjA5OTY1MjAzOX0.jcxPQm3YHE4cWLjjrI0woNkq-uDL2NyW2DXg7hCRtHI'
);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wjxnymejsadxjocjwfce.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqeG55bWVqc2FkeGpvY2p3ZmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MjI1MjUsImV4cCI6MjA2MzI5ODUyNX0.szDRoxO2WP0fwwsSXgg2NYdENVvPzoWmg5LnLplHNqQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
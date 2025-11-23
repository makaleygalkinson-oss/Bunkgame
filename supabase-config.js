// Конфигурация Supabase

const SUPABASE_URL = 'https://gvyjznoxikvydoygnpww.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2eWp6bm94aWt2eWRveWducHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjY1MzYsImV4cCI6MjA3OTQwMjUzNn0.pkSMxd7a1wt2VzM0-JnFVBIKob5q_LWCK1NkTthzqMc';

// Инициализация Supabase клиента
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



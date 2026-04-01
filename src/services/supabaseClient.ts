import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kpihjwzqtwqlschmtekx.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwaWhqd3pxdHdxbHNjaG10ZWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODkwODYsImV4cCI6MjA4NjE2NTA4Nn0.91fIJ1ZsG9YHzYlFj2zEG1Zt4L60cJh_Rcq4qOtQDps';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // important for React Native
  },
});
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

export interface Submission {
  id: string;
  full_name: string;
  date_of_birth: string;
  address: string;
  mobile_number: string;
  email: string | null;
  selfie_data_url: string;
  created_at: string;
}

export async function insertSubmission(data: Omit<Submission, 'id' | 'created_at'>) {
  const { data: result, error } = await supabase
    .from('eco_ganesha_submissions')
    .insert([data])
    .select()
    .single();
  return { result, error };
}

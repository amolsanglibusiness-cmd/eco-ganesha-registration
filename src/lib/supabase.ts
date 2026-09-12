import { createClient } from '@supabase/supabase-js';

// थेट URL आणि Anon Key इथे जोडली आहे
const supabaseUrl = 'https://hukvvhhadmsxxycyvtaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1a3Z2aGhhZG1zeHh5Y3l2dGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjE4NTQsImV4cCI6MjEwMjY5Nzg1NH0.8CHF4d0FBNXkXTGIlYk1pabvDGGLHqjcZ2_d - RcVnWo';

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
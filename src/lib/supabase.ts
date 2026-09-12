import { createClient } from '@supabase/supabase-js';

// थेट URL आणि Anon Key इथे जोडली आहे
const supabaseUrl = 'https://upyzejoowphdmhgialyh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVweXplam9vd3BoZG1oZ2lhbHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMzQ0MTAsImV4cCI6MjEwNDgxMDQxMH0.BrD4BwijAk60IWlMX_7hAA3CTXY94kH-u94RZvVUuwE';

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
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwePscZ2zyVQRAKjLyhkeGqDgOqhvHBneisqrSkIQ460accM8YxRBVFlzV8fyARwmOr/exec';

export interface Submission {
    id?: string;
    full_name: string;
    date_of_birth: string;
    address: string;
    mobile_number: string;
    email: string | null;
    selfie_data_url: string;
    created_at?: string;
}

export async function insertSubmission(data: Omit<Submission, 'id' | 'created_at'>) {
    try {
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors', // या ओळीमुळे 'Failed to fetch' ब्लॉक होणे थांबते
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        // no-cors मोडमध्ये थेट यश मिळते
        return { result: 'success', error: null };
    } catch (error) {
        return { result: null, error };
    }
}
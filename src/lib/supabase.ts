// तुमच्या Google Apps Script ची पब्लिश (Deploy) केलेली URL खालील सिंगल कोट (' ') मध्ये पेस्ट करा
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbx19900xs57ldlmTp78EoCYCeXsNOLqrbtUIBzb-IQ7zHoWp1aVO7djaQt4Hc02LRra/exec';

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
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.result === 'success') {
            return { result, error: null };
        } else {
            return { result: null, error: new Error(result.error || 'डेटा सेव्ह करताना त्रुटी आली') };
        }
    } catch (error) {
        return { result: null, error };
    }
}
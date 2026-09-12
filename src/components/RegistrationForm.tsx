import { useState } from 'react';
import {
    User,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Loader2,
    Send,
    AlertCircle,
} from 'lucide-react';
import CameraCapture from './CameraCapture';
import TermsModal from './TermsModal';
import { insertSubmission } from '@/lib/supabase';

interface FormData {
    fullName: string;
    dateOfBirth: string;
    address: string;
    mobileNumber: string;
    email: string;
}

interface FormErrors {
    fullName?: string;
    dateOfBirth?: string;
    address?: string;
    mobileNumber?: string;
    email?: string;
    selfie?: string;
    terms?: string;
}

interface RegistrationFormProps {
    onSuccess: (data: { fullName: string; selfieDataUrl: string }) => void;
}

export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        dateOfBirth: '',
        address: '',
        mobileNumber: '',
        email: '',
    });
    const [selfieDataUrl, setSelfieDataUrl] = useState<string>('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const validate = (): boolean => {
        const e: FormErrors = {};

        // १. नाव व्हॅलिडेशन
        if (!formData.fullName.trim()) {
            e.fullName = 'संपूर्ण नाव आवश्यक आहे';
        } else if (formData.fullName.trim().length < 3) {
            e.fullName = 'नाव किमान ३ अक्षरांचे असावे';
        }

        // २. जन्मतारीख व्हॅलिडेशन
        if (!formData.dateOfBirth) {
            e.dateOfBirth = 'जन्मदिनांक आवश्यक आहे';
        } else {
            const dob = new Date(formData.dateOfBirth);
            const today = new Date();
            if (dob >= today) {
                e.dateOfBirth = 'वैध जन्मदिनांक निवडा';
            }
        }

        // ३. पत्ता व्हॅलिडेशन (३ अक्षरे केली आहेत जेणेकरून अडचण येणार नाही)
        if (!formData.address.trim()) {
            e.address = 'संपूर्ण पत्ता आवश्यक आहे';
        } else if (formData.address.trim().length < 3) {
            e.address = 'कृपया पत्ता सविस्तर लिहा';
        }

        // ४. मोबाईल व्हॅलिडेशन (spaces काढून तपासणी)
        const cleanMobile = formData.mobileNumber.replace(/\D/g, '');
        if (!cleanMobile) {
            e.mobileNumber = 'मोबाईल क्रमांक आवश्यक आहे';
        } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
            e.mobileNumber = '१० अंकी वैध मोबाईल क्रमांक टाका (६-९ ने सुरू होणारा)';
        }

        // ५. ई-मेल व्हॅलिडेशन (पर्यायी)
        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            e.email = 'वैध ई-मेल आयडी टाका';
        }

        // ६. फोटो व्हॅलिडेशन
        if (!selfieDataUrl) {
            e.selfie = 'सेल्फी किंवा फोटो अपलोड करणे बंधनकारक आहे';
        }

        // ७. अटी मान्य करणे
        if (!agreedToTerms) {
            e.terms = 'कृपया नियम व अटी मान्य करा';
        }

        setErrors(e);

        // Console मध्ये कोणत्या फील्डमध्ये एरर आहे हे प्रिंट करा (Debugging साठी)
        if (Object.keys(e).length > 0) {
            console.log('Validation Errors:', e);
        }

        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setSubmitError(null);

        if (!validate()) {
            setSubmitError('कृपया लाल रंगात दर्शवलेल्या सर्व त्रुटी दुरुस्त करा.');
            return;
        }

        setSubmitting(true);
        try {
            const cleanMobile = formData.mobileNumber.replace(/\D/g, '');
            const { error } = await insertSubmission({
                full_name: formData.fullName.trim(),
                date_of_birth: formData.dateOfBirth,
                address: formData.address.trim(),
                mobile_number: cleanMobile,
                email: formData.email.trim() || null,
                selfie_data_url: selfieDataUrl,
            });

            if (error) {
                console.error('Supabase Database Error:', error);
                throw error;
            }

            onSuccess({ fullName: formData.fullName.trim(), selfieDataUrl });
        } catch (err: unknown) {
            console.error('Submission Catch Error:', err);
            const msg = err instanceof Error ? err.message : 'डेटाबेसमध्ये माहिती जतन करताना त्रुटी आली.';
            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const inputClass =
        'w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 input-glow transition-all outline-none text-base';

    const errorClass = 'text-red-300 text-sm mt-1.5 flex items-center gap-1 font-medium';

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                        संपूर्ण नाव <span className="text-festive-orange">*</span>
                    </label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleChange('fullName', e.target.value)}
                            placeholder="तुमचे संपूर्ण नाव"
                            className={`${inputClass} ${errors.fullName ? 'border-red-500' : ''}`}
                        />
                    </div>
                    {errors.fullName && (
                        <p className={errorClass}>
                            <AlertCircle className="w-4 h-4" /> {errors.fullName}
                        </p>
                    )}
                </div>

                {/* Date of Birth */}
                <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                        जन्मदिनांक <span className="text-festive-orange">*</span>
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 z-10 pointer-events-none" />
                        <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className={`${inputClass} [color-scheme:dark] ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                        />
                    </div>
                    {errors.dateOfBirth && (
                        <p className={errorClass}>
                            <AlertCircle className="w-4 h-4" /> {errors.dateOfBirth}
                        </p>
                    )}
                </div>

                {/* Address */}
                <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                        संपूर्ण पत्ता <span className="text-festive-orange">*</span>
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-4 w-5 h-5 text-white/40" />
                        <textarea
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder="संपूर्ण पत्ता (घर क्रमांक, रस्ता, गाव/शहर, तालुका, जिल्हा)"
                            rows={3}
                            className={`${inputClass} resize-none pt-4 ${errors.address ? 'border-red-500' : ''}`}
                        />
                    </div>
                    {errors.address && (
                        <p className={errorClass}>
                            <AlertCircle className="w-4 h-4" /> {errors.address}
                        </p>
                    )}
                </div>

                {/* Mobile & Email row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Mobile Number */}
                    <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                            मोबाईल क्रमांक <span className="text-festive-orange">*</span>
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                type="tel"
                                value={formData.mobileNumber}
                                onChange={(e) => handleChange('mobileNumber', e.target.value)}
                                placeholder="९८७६५४३२१०"
                                maxLength={10}
                                className={`${inputClass} ${errors.mobileNumber ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {errors.mobileNumber && (
                            <p className={errorClass}>
                                <AlertCircle className="w-4 h-4" /> {errors.mobileNumber}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                            ई-मेल आयडी <span className="text-white/40 text-xs">(पर्यायी)</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="example@email.com"
                                className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {errors.email && (
                            <p className={errorClass}>
                                <AlertCircle className="w-4 h-4" /> {errors.email}
                            </p>
                        )}
                    </div>
                </div>

                {/* Camera Capture / Photo Upload */}
                <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                        थेट सेल्फी / फोटो <span className="text-festive-orange">*</span>
                    </label>
                    <CameraCapture
                        onCapture={(url) => {
                            setSelfieDataUrl(url);
                            if (errors.selfie) setErrors((prev) => ({ ...prev, selfie: undefined }));
                        }}
                        capturedImage={selfieDataUrl || null}
                    />
                    {errors.selfie && (
                        <p className={errorClass}>
                            <AlertCircle className="w-4 h-4" /> {errors.selfie}
                        </p>
                    )}
                </div>

                {/* Terms checkbox */}
                <div className={`glass rounded-xl p-4 ${errors.terms ? 'border border-red-500' : ''}`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => {
                                setAgreedToTerms(e.target.checked);
                                if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
                            }}
                            className="mt-1 w-5 h-5 accent-festive-orange cursor-pointer flex-shrink-0"
                        />
                        <span className="text-white/80 text-sm leading-relaxed">
                            मी{' '}
                            <button
                                type="button"
                                onClick={() => setShowTerms(true)}
                                className="text-festive-gold underline hover:text-amber-300 transition-colors font-medium"
                            >
                                स्पर्धेचे नियम व अटी
                            </button>{' '}
                            वाचले आहेत व त्या मान्य करतो/करते.
                        </span>
                    </label>
                    {errors.terms && (
                        <p className={errorClass}>
                            <AlertCircle className="w-4 h-4" /> {errors.terms}
                        </p>
                    )}
                </div>

                {/* Submit error message */}
                {submitError && (
                    <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl p-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-red-200 text-sm">{submitError}</p>
                    </div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl bg-festive-gradient text-white font-bold text-lg shimmer-btn hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            सबमिट होत आहे...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            सहभाग नोंदवा
                        </>
                    )}
                </button>

                {/* Required fields note */}
                <p className="text-center text-white/40 text-xs">
                    <span className="text-festive-orange">*</span> चिन्हांकित सर्व फील्ड आवश्यक आहेत
                </p>
            </form>

            <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
        </>
    );
}
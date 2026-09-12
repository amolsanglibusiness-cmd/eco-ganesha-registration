"use client";

import { useState } from "react";
import {
    User,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Loader2,
    Send,
    AlertCircle,
    Sparkles,
} from "lucide-react";

import CameraCapture from "./CameraCapture";
import TermsModal from "./TermsModal";
import { insertSubmission } from "@/lib/supabase";

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
    onSuccess: (data: {
        fullName: string;
        selfieDataUrl: string;
    }) => void;
}

export default function RegistrationForm({
    onSuccess,
}: RegistrationFormProps) {
    const [formData, setFormData] = useState<FormData>({
        fullName: "",
        dateOfBirth: "",
        address: "",
        mobileNumber: "",
        email: "",
    });

    const [selfieDataUrl, setSelfieDataUrl] = useState<string>("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    /* ---------------------------------------------------------
       VALIDATION
    --------------------------------------------------------- */

    const validate = (): boolean => {
        const e: FormErrors = {};

        // १. नाव
        if (!formData.fullName.trim()) {
            e.fullName = "संपूर्ण नाव आवश्यक आहे";
        } else if (formData.fullName.trim().length < 3) {
            e.fullName = "नाव किमान ३ अक्षरांचे असावे";
        }

        // २. जन्मदिनांक
        if (!formData.dateOfBirth) {
            e.dateOfBirth = "जन्मदिनांक आवश्यक आहे";
        } else {
            const dob = new Date(formData.dateOfBirth);
            const today = new Date();

            if (dob >= today) {
                e.dateOfBirth = "वैध जन्मदिनांक निवडा";
            }
        }

        // ३. पत्ता
        if (!formData.address.trim()) {
            e.address = "संपूर्ण पत्ता आवश्यक आहे";
        } else if (formData.address.trim().length < 3) {
            e.address = "कृपया पत्ता सविस्तर लिहा";
        }

        // ४. मोबाईल
        const cleanMobile = formData.mobileNumber.replace(/\D/g, "");

        if (!cleanMobile) {
            e.mobileNumber = "मोबाईल क्रमांक आवश्यक आहे";
        } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
            e.mobileNumber =
                "१० अंकी वैध मोबाईल क्रमांक टाका (६-९ ने सुरू होणारा)";
        }

        // ५. ई-मेल
        if (
            formData.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
        ) {
            e.email = "वैध ई-मेल आयडी टाका";
        }

        // ६. गणपती सेल्फी
        if (!selfieDataUrl) {
            e.selfie = "गणपती सेल्फी काढणे आवश्यक आहे";
        }

        // ७. नियम व अटी
        if (!agreedToTerms) {
            e.terms = "कृपया नियम व अटी मान्य करा";
        }

        setErrors(e);

        if (Object.keys(e).length > 0) {
            console.log("Validation Errors:", e);
        }

        return Object.keys(e).length === 0;
    };

    /* ---------------------------------------------------------
       SUBMIT
    --------------------------------------------------------- */

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();

        setSubmitError(null);

        if (!validate()) {
            setSubmitError(
                "कृपया लाल रंगात दर्शवलेल्या सर्व त्रुटी दुरुस्त करा."
            );
            return;
        }

        setSubmitting(true);

        try {
            const cleanMobile = formData.mobileNumber.replace(/\D/g, "");

            const { error } = await insertSubmission({
                full_name: formData.fullName.trim(),
                date_of_birth: formData.dateOfBirth,
                address: formData.address.trim(),
                mobile_number: cleanMobile,
                email: formData.email.trim() || null,
                selfie_data_url: selfieDataUrl,
            });

            if (error) {
                console.error("Supabase Database Error:", error);
                throw error;
            }

            onSuccess({
                fullName: formData.fullName.trim(),
                selfieDataUrl,
            });
        } catch (err: unknown) {
            console.error("Submission Catch Error:", err);

            const msg =
                err instanceof Error
                    ? err.message
                    : "डेटाबेसमध्ये माहिती जतन करताना त्रुटी आली.";

            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    /* ---------------------------------------------------------
       INPUT CHANGE
    --------------------------------------------------------- */

    const handleChange = (
        field: keyof FormData,
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({
                ...prev,
                [field]: undefined,
            }));
        }
    };

    /* ---------------------------------------------------------
       COMMON CLASSES
    --------------------------------------------------------- */

    const inputClass = `
    w-full
    pl-12
    pr-4
    py-3.5
    rounded-2xl
    bg-white/[0.07]
    border
    border-white/15
    text-white
    placeholder-white/40
    input-glow
    transition-all
    duration-200
    outline-none
    text-base
    focus:border-orange-300/60
    focus:bg-white/[0.10]
    focus:ring-2
    focus:ring-orange-400/20
  `;

    const errorClass =
        "text-red-300 text-sm mt-1.5 flex items-center gap-1 font-medium";

    return (
        <>
            <div className="w-full">

                {/* =====================================================
            GANESH CHATURTHI HERO CARD
        ===================================================== */}

                <div
                    className="
            relative
            overflow-hidden
            rounded-[28px]
            mb-6
            p-[1px]
            bg-gradient-to-br
            from-orange-400
            via-red-500
            to-purple-700
            shadow-2xl
          "
                >
                    <div
                        className="
              relative
              overflow-hidden
              rounded-[27px]
              bg-gradient-to-br
              from-orange-600
              via-red-600
              to-purple-800
              px-5
              py-7
              sm:px-7
              sm:py-8
              text-center
            "
                    >

                        {/* Decorative background elements */}

                        <div
                            className="
                absolute
                -top-10
                -left-8
                text-7xl
                opacity-15
                animate-pulse
                pointer-events-none
              "
                        >
                            🪔
                        </div>

                        <div
                            className="
                absolute
                -top-7
                -right-5
                text-7xl
                opacity-15
                animate-pulse
                pointer-events-none
              "
                        >
                            🌺
                        </div>

                        <div
                            className="
                absolute
                -bottom-9
                -left-4
                text-7xl
                opacity-10
                pointer-events-none
              "
                        >
                            🪷
                        </div>

                        <div
                            className="
                absolute
                -bottom-9
                -right-4
                text-7xl
                opacity-10
                pointer-events-none
              "
                        >
                            🪔
                        </div>

                        {/* Small decorative sparkles */}

                        <Sparkles
                            className="
                absolute
                top-5
                left-1/2
                -translate-x-1/2
                w-5
                h-5
                text-yellow-200
                opacity-70
              "
                        />

                        {/* Ganpati Circle */}

                        <div
                            className="
                relative
                mx-auto
                mb-4
                flex
                h-20
                w-20
                sm:h-24
                sm:w-24
                items-center
                justify-center
                rounded-full
                bg-white/15
                border
                border-white/30
                shadow-2xl
                backdrop-blur-md
              "
                        >
                            <div
                                className="
                  absolute
                  inset-1
                  rounded-full
                  border
                  border-yellow-200/30
                "
                            />

                            <span
                                className="
                  text-5xl
                  sm:text-6xl
                  drop-shadow-2xl
                "
                            >
                                🐘
                            </span>
                        </div>

                        {/* Main heading */}

                        <h1
                            className="
                relative
                text-2xl
                sm:text-3xl
                font-extrabold
                text-white
                tracking-wide
                drop-shadow-lg
              "
                        >
                            गणपती बाप्पा मोरया!
                        </h1>

                        {/* Divider */}

                        <div
                            className="
                mx-auto
                my-3
                h-1
                w-20
                rounded-full
                bg-yellow-300
              "
                        />

                        {/* Selfie title */}

                        <h2
                            className="
                relative
                text-xl
                sm:text-2xl
                font-extrabold
                text-yellow-100
              "
                        >
                            📸 गणपती सेल्फी
                        </h2>

                        <p
                            className="
                relative
                mt-2
                text-sm
                sm:text-base
                text-white/90
                leading-relaxed
              "
                        >
                            बाप्पासोबतचा तुमचा खास क्षण
                            <br />
                            आमच्यासोबत नोंदवा
                        </p>

                        {/* Festive tags */}

                        <div
                            className="
                relative
                mt-5
                flex
                justify-center
                gap-2
                flex-wrap
              "
                        >
                            <span
                                className="
                  rounded-full
                  bg-white/15
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-white
                  border
                  border-white/20
                  backdrop-blur-sm
                "
                            >
                                🌺 मंगलमूर्ती
                            </span>

                            <span
                                className="
                  rounded-full
                  bg-white/15
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-white
                  border
                  border-white/20
                  backdrop-blur-sm
                "
                            >
                                🪔 शुभ गणेशोत्सव
                            </span>

                            <span
                                className="
                  rounded-full
                  bg-white/15
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-white
                  border
                  border-white/20
                  backdrop-blur-sm
                "
                            >
                                🙏 बाप्पाचे आशीर्वाद
                            </span>
                        </div>
                    </div>
                </div>

                {/* =====================================================
            FORM
        ===================================================== */}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >

                    {/* ===================================================
              FULL NAME
          =================================================== */}

                    <div>
                        <label
                            className="
                block
                text-white/80
                text-sm
                font-semibold
                mb-2
              "
                        >
                            संपूर्ण नाव{" "}
                            <span className="text-orange-300">*</span>
                        </label>

                        <div className="relative">
                            <User
                                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  w-5
                  h-5
                  text-orange-300/70
                "
                            />

                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) =>
                                    handleChange(
                                        "fullName",
                                        e.target.value
                                    )
                                }
                                placeholder="तुमचे संपूर्ण नाव"
                                className={`${inputClass} ${errors.fullName
                                        ? "border-red-500"
                                        : ""
                                    }`}
                            />
                        </div>

                        {errors.fullName && (
                            <p className={errorClass}>
                                <AlertCircle className="w-4 h-4" />
                                {errors.fullName}
                            </p>
                        )}
                    </div>

                    {/* ===================================================
              DATE OF BIRTH
          =================================================== */}

                    <div>
                        <label
                            className="
                block
                text-white/80
                text-sm
                font-semibold
                mb-2
              "
                        >
                            जन्मदिनांक{" "}
                            <span className="text-orange-300">*</span>
                        </label>

                        <div className="relative">
                            <Calendar
                                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  w-5
                  h-5
                  text-orange-300/70
                  z-10
                  pointer-events-none
                "
                            />

                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) =>
                                    handleChange(
                                        "dateOfBirth",
                                        e.target.value
                                    )
                                }
                                max={
                                    new Date()
                                        .toISOString()
                                        .split("T")[0]
                                }
                                className={`${inputClass} ${errors.dateOfBirth
                                        ? "border-red-500"
                                        : ""
                                    } [color-scheme:dark]`}
                            />
                        </div>

                        {errors.dateOfBirth && (
                            <p className={errorClass}>
                                <AlertCircle className="w-4 h-4" />
                                {errors.dateOfBirth}
                            </p>
                        )}
                    </div>

                    {/* ===================================================
              ADDRESS
          =================================================== */}

                    <div>
                        <label
                            className="
                block
                text-white/80
                text-sm
                font-semibold
                mb-2
              "
                        >
                            संपूर्ण पत्ता{" "}
                            <span className="text-orange-300">*</span>
                        </label>

                        <div className="relative">
                            <MapPin
                                className="
                  absolute
                  left-4
                  top-4
                  w-5
                  h-5
                  text-orange-300/70
                "
                            />

                            <textarea
                                value={formData.address}
                                onChange={(e) =>
                                    handleChange(
                                        "address",
                                        e.target.value
                                    )
                                }
                                placeholder="संपूर्ण पत्ता (घर क्रमांक, रस्ता, गाव/शहर, तालुका, जिल्हा)"
                                rows={3}
                                className={`${inputClass} ${errors.address
                                        ? "border-red-500"
                                        : ""
                                    } resize-none pt-4`}
                            />
                        </div>

                        {errors.address && (
                            <p className={errorClass}>
                                <AlertCircle className="w-4 h-4" />
                                {errors.address}
                            </p>
                        )}
                    </div>

                    {/* ===================================================
              MOBILE + EMAIL
          =================================================== */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                        {/* Mobile */}

                        <div>
                            <label
                                className="
                  block
                  text-white/80
                  text-sm
                  font-semibold
                  mb-2
                "
                            >
                                मोबाईल क्रमांक{" "}
                                <span className="text-orange-300">
                                    *
                                </span>
                            </label>

                            <div className="relative">
                                <Phone
                                    className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    w-5
                    h-5
                    text-orange-300/70
                  "
                                />

                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    value={formData.mobileNumber}
                                    onChange={(e) =>
                                        handleChange(
                                            "mobileNumber",
                                            e.target.value
                                        )
                                    }
                                    placeholder="९८७६५४३२१०"
                                    maxLength={10}
                                    className={`${inputClass} ${errors.mobileNumber
                                            ? "border-red-500"
                                            : ""
                                        }`}
                                />
                            </div>

                            {errors.mobileNumber && (
                                <p className={errorClass}>
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.mobileNumber}
                                </p>
                            )}
                        </div>

                        {/* Email */}

                        <div>
                            <label
                                className="
                  block
                  text-white/80
                  text-sm
                  font-semibold
                  mb-2
                "
                            >
                                ई-मेल आयडी{" "}
                                <span className="text-white/40 text-xs">
                                    (पर्यायी)
                                </span>
                            </label>

                            <div className="relative">
                                <Mail
                                    className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    w-5
                    h-5
                    text-orange-300/70
                  "
                                />

                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        handleChange(
                                            "email",
                                            e.target.value
                                        )
                                    }
                                    placeholder="example@email.com"
                                    className={`${inputClass} ${errors.email
                                            ? "border-red-500"
                                            : ""
                                        }`}
                                />
                            </div>

                            {errors.email && (
                                <p className={errorClass}>
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.email}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ===================================================
              GANPATI SELFIE CARD
          =================================================== */}

                    <div
                        className="
              relative
              overflow-hidden
              rounded-2xl
              border
              border-orange-300/20
              bg-gradient-to-br
              from-orange-500/10
              via-red-500/10
              to-purple-500/10
              p-4
              sm:p-5
              shadow-lg
            "
                    >

                        {/* Decorative top line */}

                        <div
                            className="
                absolute
                top-0
                left-0
                right-0
                h-1
                bg-gradient-to-r
                from-orange-400
                via-yellow-300
                to-red-500
              "
                        />

                        {/* Selfie heading */}

                        <div className="flex items-center gap-3 mb-4">

                            <div
                                className="
                  flex
                  h-11
                  w-11
                  flex-shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-gradient-to-br
                  from-orange-400
                  to-red-600
                  shadow-lg
                "
                            >
                                <span className="text-xl">
                                    📸
                                </span>
                            </div>

                            <div>
                                <h3
                                    className="
                    text-white
                    font-bold
                    text-base
                    sm:text-lg
                  "
                                >
                                    गणपती सेल्फी
                                </h3>

                                <p
                                    className="
                    text-white/55
                    text-xs
                    sm:text-sm
                  "
                                >
                                    बाप्पासोबतचा तुमचा खास फोटो
                                </p>
                            </div>
                        </div>

                        {/* Camera area */}

                        <div
                            className="
                rounded-2xl
                border
                border-dashed
                border-orange-300/30
                bg-black/10
                p-3
              "
                        >
                            <CameraCapture
                                onCapture={(url) => {
                                    setSelfieDataUrl(url);

                                    if (errors.selfie) {
                                        setErrors((prev) => ({
                                            ...prev,
                                            selfie: undefined,
                                        }));
                                    }
                                }}
                                capturedImage={
                                    selfieDataUrl || null
                                }
                            />
                        </div>

                        {errors.selfie && (
                            <p className={errorClass}>
                                <AlertCircle className="w-4 h-4" />
                                {errors.selfie}
                            </p>
                        )}

                        <p
                            className="
                mt-3
                text-center
                text-xs
                text-white/45
              "
                        >
                            🙏 बाप्पासोबत एक सुंदर सेल्फी काढा
                        </p>
                    </div>

                    {/* ===================================================
              TERMS
          =================================================== */}

                    <div
                        className={`
              rounded-2xl
              p-4
              border
              bg-white/[0.04]
              backdrop-blur-sm
              ${errors.terms
                                ? "border-red-500"
                                : "border-white/10"
                            }
            `}
                    >
                        <label
                            className="
                flex
                items-start
                gap-3
                cursor-pointer
              "
                        >
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => {
                                    setAgreedToTerms(
                                        e.target.checked
                                    );

                                    if (errors.terms) {
                                        setErrors((prev) => ({
                                            ...prev,
                                            terms: undefined,
                                        }));
                                    }
                                }}
                                className="
                  mt-1
                  w-5
                  h-5
                  accent-orange-500
                  cursor-pointer
                  flex-shrink-0
                "
                            />

                            <span
                                className="
                  text-white/80
                  text-sm
                  leading-relaxed
                "
                            >
                                मी{" "}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowTerms(true)
                                    }
                                    className="
                    text-yellow-300
                    underline
                    hover:text-yellow-200
                    transition-colors
                    font-semibold
                  "
                                >
                                    नियम व अटी
                                </button>{" "}
                                वाचले आहेत व त्या मान्य
                                करतो/करते.
                            </span>
                        </label>

                        {errors.terms && (
                            <p className={errorClass}>
                                <AlertCircle className="w-4 h-4" />
                                {errors.terms}
                            </p>
                        )}
                    </div>

                    {/* ===================================================
              SUBMIT ERROR
          =================================================== */}

                    {submitError && (
                        <div
                            className="
                flex
                items-center
                gap-2
                bg-red-500/15
                border
                border-red-500/30
                rounded-xl
                p-3
              "
                        >
                            <AlertCircle
                                className="
                  w-5
                  h-5
                  text-red-400
                  flex-shrink-0
                "
                            />

                            <p className="text-red-200 text-sm">
                                {submitError}
                            </p>
                        </div>
                    )}

                    {/* ===================================================
              SUBMIT BUTTON
          =================================================== */}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="
              relative
              w-full
              overflow-hidden
              py-4
              rounded-2xl
              bg-gradient-to-r
              from-orange-500
              via-red-500
              to-purple-600
              text-white
              font-extrabold
              text-lg
              shadow-xl
              shadow-red-900/30
              transition-all
              duration-300
              hover:scale-[1.01]
              hover:shadow-2xl
              active:scale-[0.99]
              disabled:opacity-50
              disabled:cursor-not-allowed
              flex
              items-center
              justify-center
              gap-2
            "
                    >
                        {submitting ? (
                            <>
                                <Loader2
                                    className="
                    w-5
                    h-5
                    animate-spin
                  "
                                />
                                नोंदणी होत आहे...
                            </>
                        ) : (
                            <>
                                <span className="text-xl">
                                    📸
                                </span>

                                गणपती सेल्फी नोंदवा

                                <Send className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    {/* ===================================================
              REQUIRED NOTE
          =================================================== */}

                    <p
                        className="
              text-center
              text-white/40
              text-xs
            "
                    >
                        <span className="text-orange-300">
                            *
                        </span>{" "}
                        चिन्हांकित सर्व फील्ड आवश्यक आहेत
                    </p>
                </form>
            </div>

            {/* =======================================================
          TERMS MODAL
      ======================================================= */}

            <TermsModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
            />
        </>
    );
}
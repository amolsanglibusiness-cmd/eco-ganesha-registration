"use client";

import React, { useEffect, useRef, useState } from "react";
import TermsModal from "./TermsModal";

interface RegistrationFormProps {
    onSuccess: (data: {
        fullName: string;
        selfieDataUrl: string;
        uniqueId: string;
        photoUrl: string;
    }) => void;
}

interface FormErrors {
    fullName?: string;
    address?: string;
    mobileNumber?: string;
    selfie?: string;
    terms?: string;
}

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwvx2I0JJYaUz_qu5Cmx0MH02lt64EQHRfTTfDOQ8_1T-FzPStuCwT1TrXnny8X8k0V/exec";

export default function RegistrationForm({
    onSuccess,
}: RegistrationFormProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const fullNameRef = useRef<HTMLInputElement | null>(null);
    const addressRef = useRef<HTMLTextAreaElement | null>(null);
    const mobileNumberRef = useRef<HTMLInputElement | null>(null);
    const selfieRef = useRef<HTMLDivElement | null>(null);
    const termsRef = useRef<HTMLDivElement | null>(null);

    const [fullName, setFullName] = useState("");
    const [address, setAddress] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");

    const [selfieDataUrl, setSelfieDataUrl] = useState("");
    const [cameraOpen, setCameraOpen] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);

    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);

    // Error काढण्यासाठी
    const clearError = (field: keyof FormErrors) => {
        setErrors((prev) => {
            if (!prev[field]) return prev;
            const updated = { ...prev };
            delete updated[field];
            return updated;
        });
    };

    // Camera बंद करणे
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraOpen(false);
    };

    // Camera सुरू करणे
    const startCamera = async () => {
        try {
            setErrors((prev) => ({
                ...prev,
                selfie: undefined,
            }));

            if (!navigator.mediaDevices?.getUserMedia) {
                setErrors((prev) => ({
                    ...prev,
                    selfie: "या डिव्हाइसवर कॅमेरा उपलब्ध नाही.",
                }));
                return;
            }

            stopCamera();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1080 },
                    height: { ideal: 1440 },
                },
                audio: false,
            });

            streamRef.current = stream;
            setCameraOpen(true);

            requestAnimationFrame(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => { });
                }
            });
        } catch (error) {
            console.error("Camera error:", error);
            setErrors((prev) => ({
                ...prev,
                selfie: "कॅमेरा सुरू करता आला नाही. कृपया Camera permission Allow करा किंवा फाइल अपलोड पर्याय वापरा.",
            }));
        }
    };

    // Camera मधून फोटो काढणे
    const capturePhoto = () => {
        const video = videoRef.current;

        if (!video || video.readyState < 2) {
            setErrors((prev) => ({
                ...prev,
                selfie: "कॅमेरा तयार झाल्यावर पुन्हा प्रयत्न करा.",
            }));
            return;
        }

        const canvas = document.createElement("canvas");
        const width = video.videoWidth || 720;
        const height = video.videoHeight || 960;

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
            setErrors((prev) => ({
                ...prev,
                selfie: "फोटो तयार करता आला नाही.",
            }));
            return;
        }

        context.save();
        context.translate(width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, width, height);
        context.restore();

        const image = canvas.toDataURL("image/jpeg", 0.9);

        setSelfieDataUrl(image);
        setErrors((prev) => ({
            ...prev,
            selfie: undefined,
        }));

        stopCamera();
    };

    // फोटो Upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setErrors((prev) => ({
                ...prev,
                selfie: "कृपया फक्त इमेज (फोटो) फाइल निवडा.",
            }));
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            if (event.target?.result) {
                setSelfieDataUrl(event.target.result as string);
                setErrors((prev) => ({
                    ...prev,
                    selfie: undefined,
                }));
                stopCamera();
            }
        };

        reader.readAsDataURL(file);
    };

    // दुसरा फोटो
    const retakePhoto = () => {
        setSelfieDataUrl("");
        setErrors((prev) => ({
            ...prev,
            selfie: undefined,
        }));

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, []);

    // Form Validation
    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        if (!fullName.trim()) {
            newErrors.fullName = "कृपया पूर्ण नाव भरा.";
        } else if (fullName.trim().length < 3) {
            newErrors.fullName = "पूर्ण नाव किमान 3 अक्षरांचे असावे.";
        }

        if (!address.trim()) {
            newErrors.address = "कृपया पूर्ण पत्ता भरा.";
        } else if (address.trim().length < 3) {
            newErrors.address = "पूर्ण पत्ता किमान 3 अक्षरांचा असावा.";
        }

        if (!mobileNumber.trim()) {
            newErrors.mobileNumber = "कृपया मोबाईल नंबर भरा.";
        } else if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
            newErrors.mobileNumber = "10 अंकी योग्य मोबाईल नंबर प्रविष्ट करा.";
        }

        if (!selfieDataUrl) {
            newErrors.selfie = "फोटो काढणे किंवा अपलोड करणे आवश्यक आहे.";
        }

        if (!termsAccepted) {
            newErrors.terms = "अटी व नियम स्वीकारणे आवश्यक आहे.";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            requestAnimationFrame(() => {
                if (newErrors.fullName) {
                    fullNameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    fullNameRef.current?.focus();
                    return;
                }
                if (newErrors.address) {
                    addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    addressRef.current?.focus();
                    return;
                }
                if (newErrors.mobileNumber) {
                    mobileNumberRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    mobileNumberRef.current?.focus();
                    return;
                }
                if (newErrors.selfie) {
                    selfieRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    return;
                }
                if (newErrors.terms) {
                    termsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });
        }

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const isValid = validate();

        if (!isValid || submitting) {
            return;
        }

        try {
            setSubmitting(true);
            setErrors({});

            const payload = {
                full_name: fullName.trim(),
                address: address.trim(),
                mobile_number: mobileNumber.trim(),
                selfie_data_url: selfieDataUrl,
            };

            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(payload),
                redirect: "follow",
            });

            if (!response.ok) {
                throw new Error("Google Apps Script कडून योग्य रिस्पॉन्स मिळाला नाही.");
            }

            const result = await response.json();

            if (result.result !== "success") {
                throw new Error(result.message || "डेटा सेव्ह करताना त्रुटी आली.");
            }

            onSuccess({
                fullName: fullName.trim(),
                selfieDataUrl: selfieDataUrl,
                uniqueId: result.unique_id,
                photoUrl: result.photo_url,
            });
        } catch (error) {
            console.error("SUBMISSION ERROR:", error);

            let message = "माहिती जतन करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.";

            if (error instanceof Error && error.message) {
                message = error.message;
            }

            setErrors({
                terms: message,
            });

            requestAnimationFrame(() => {
                termsRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50 px-2 py-3 sm:px-6 sm:py-6">
                <div className="mx-auto w-full max-w-2xl">
                    <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-xl shadow-orange-100/50">
                        {/* Header */}
                        <div className="relative overflow-hidden bg-white p-0 text-center">
                            <div className="relative">
                                <img
                                    src="/ganpati-header.png"
                                    alt="श्री गणेश उत्सव"
                                    className="block h-auto w-full object-contain"
                                />
                            </div>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-3.5 rounded-b-3xl bg-white p-3.5 sm:p-6"
                        >
                            {/* Full Name Floating Label */}
                            <div className="relative">
                                <input
                                    ref={fullNameRef}
                                    type="text"
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => {
                                        setFullName(e.target.value);
                                        clearError("fullName");
                                    }}
                                    onBlur={() => {
                                        if (fullName.trim() && fullName.trim().length < 3) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                fullName: "पूर्ण नाव किमान 3 अक्षरांचे असावे.",
                                            }));
                                        }
                                    }}
                                    placeholder=" "
                                    className={`peer w-full rounded-xl border bg-white px-4 pb-2.5 pt-5 text-base text-gray-900 outline-none transition-all duration-200 ${errors.fullName
                                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                            : "border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                                        }`}
                                />
                                <label
                                    htmlFor="fullName"
                                    className="pointer-events-none absolute left-3.5 top-1 z-10 origin-[0] -translate-y-0 scale-75 bg-white px-1 text-xs text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-orange-600"
                                >
                                    पूर्ण नाव <span className="text-red-500">*</span>
                                </label>
                                {errors.fullName && (
                                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                                        <span>⚠️</span>
                                        {errors.fullName}
                                    </p>
                                )}
                            </div>

                            {/* Address Floating Label */}
                            <div className="relative">
                                <textarea
                                    ref={addressRef}
                                    id="address"
                                    value={address}
                                    onChange={(e) => {
                                        setAddress(e.target.value);
                                        clearError("address");
                                    }}
                                    placeholder=" "
                                    rows={2.5}
                                    className={`peer w-full resize-none rounded-xl border bg-white px-4 pb-2 pt-5 text-base text-gray-900 outline-none transition-all duration-200 ${errors.address
                                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                            : "border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                                        }`}
                                />
                                <label
                                    htmlFor="address"
                                    className="pointer-events-none absolute left-3.5 top-1 z-10 origin-[0] -translate-y-0 scale-75 bg-white px-1 text-xs text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-orange-600"
                                >
                                    पूर्ण पत्ता <span className="text-red-500">*</span>
                                </label>
                                {errors.address && (
                                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                                        <span>⚠️</span>
                                        {errors.address}
                                    </p>
                                )}
                            </div>

                            {/* Mobile Floating Label */}
                            <div className="relative">
                                <input
                                    ref={mobileNumberRef}
                                    type="tel"
                                    id="mobileNumber"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={mobileNumber}
                                    onChange={(e) => {
                                        setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                                        clearError("mobileNumber");
                                    }}
                                    onBlur={() => {
                                        if (mobileNumber && !/^[6-9]\d{9}$/.test(mobileNumber)) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                mobileNumber: "10 अंकी योग्य मोबाईल नंबर प्रविष्ट करा.",
                                            }));
                                        }
                                    }}
                                    placeholder=" "
                                    className={`peer w-full rounded-xl border bg-white px-4 pb-2.5 pt-5 text-base text-gray-900 outline-none transition-all duration-200 ${errors.mobileNumber
                                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                            : "border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                                        }`}
                                />
                                <label
                                    htmlFor="mobileNumber"
                                    className="pointer-events-none absolute left-3.5 top-1 z-10 origin-[0] -translate-y-0 scale-75 bg-white px-1 text-xs text-gray-500 transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:scale-75 peer-focus:text-xs peer-focus:text-orange-600"
                                >
                                    मोबाईल नंबर <span className="text-red-500">*</span>
                                </label>
                                {errors.mobileNumber && (
                                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                                        <span>⚠️</span>
                                        {errors.mobileNumber}
                                    </p>
                                )}
                            </div>

                            {/* Photo Section */}
                            <div
                                ref={selfieRef}
                                className={`rounded-xl border ${errors.selfie
                                        ? "border-red-300 bg-red-50/60"
                                        : "border-orange-100 bg-orange-50/60"
                                    } p-2.5 sm:p-3.5`}
                            >
                                <div className="mb-2">
                                    <h2 className="text-xs font-bold text-gray-900 sm:text-sm">
                                        तुमचा फोटो <span className="text-red-500">*</span>
                                    </h2>
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />

                                {!selfieDataUrl && !cameraOpen && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-2 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-700 active:scale-[0.99]"
                                        >
                                            <span className="text-sm sm:text-base">📷</span>
                                            <span>कॅमेरा सुरू करा</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-orange-500 bg-white px-2 py-2.5 text-xs font-bold text-orange-600 shadow-sm transition hover:bg-orange-50 active:scale-[0.99]"
                                        >
                                            <span className="text-sm sm:text-base">📁</span>
                                            <span>फोटो अपलोड करा</span>
                                        </button>
                                    </div>
                                )}

                                {cameraOpen && (
                                    <div className="mx-auto max-w-sm overflow-hidden rounded-xl bg-black">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="aspect-[4/3] w-full object-cover"
                                            style={{ transform: "scaleX(-1)" }}
                                        />
                                        <div className="p-2">
                                            <button
                                                type="button"
                                                onClick={capturePhoto}
                                                className="w-full rounded-lg bg-white px-4 py-2 text-xs font-bold text-orange-600 shadow transition active:scale-[0.99]"
                                            >
                                                📸 फोटो काढा
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selfieDataUrl && !cameraOpen && (
                                    <div className="mx-auto max-w-xs text-center">
                                        <div className="overflow-hidden rounded-xl bg-gray-100">
                                            <img
                                                src={selfieDataUrl}
                                                alt="तुमचा फोटो"
                                                className="aspect-square w-full object-cover"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={retakePhoto}
                                            className="mt-2 w-full rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-50"
                                        >
                                            🔄 दुसरा फोटो निवडा / काढा
                                        </button>
                                    </div>
                                )}

                                {errors.selfie && (
                                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                                        <span>⚠️</span>
                                        {errors.selfie}
                                    </p>
                                )}
                            </div>

                            {/* Terms */}
                            <div
                                ref={termsRef}
                                className={`rounded-xl border ${errors.terms
                                        ? "border-red-300 bg-red-50"
                                        : "border-gray-200 bg-gray-50"
                                    } p-3`}
                            >
                                <label className="flex cursor-pointer items-start gap-2.5">
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => {
                                            setTermsAccepted(e.target.checked);
                                            if (e.target.checked) {
                                                clearError("terms");
                                            }
                                        }}
                                        className="mt-0.5 h-4 w-4 accent-orange-600"
                                    />
                                    <span className="text-xs leading-5 text-gray-700 sm:text-sm">
                                        मी दिलेली माहिती योग्य आहे आणि कार्यक्रमाच्या अटी व नियम मला मान्य आहेत.
                                        <button
                                            type="button"
                                            onClick={() => setTermsOpen(true)}
                                            className="ml-1 font-semibold text-orange-600 underline focus:outline-none"
                                        >
                                            अटी व नियम पाहा
                                        </button>
                                    </span>
                                </label>
                                {errors.terms && (
                                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                                        <span>⚠️</span>
                                        {errors.terms}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-3.5 text-base font-bold text-white shadow-md shadow-orange-200 transition hover:from-orange-700 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting
                                    ? "नोंदणी जतन होत आहे..."
                                    : "गणपती उत्सवासाठी सहभागी व्हा"}
                            </button>
                        </form>

                        {/* Sponsor Image */}
                        <div className="w-full overflow-hidden">
                            <img
                                src="/sponsor-logo.png"
                                alt="प्रायोजक लोगो"
                                className="block h-auto w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
        </>
    );
}
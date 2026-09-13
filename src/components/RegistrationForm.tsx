"use client";

import React, { useEffect, useRef, useState } from "react";
import TermsModal from "./TermsModal";
import { insertSubmission } from "@/lib/supabase";

interface RegistrationFormProps {
    onSuccess: (data: {
        fullName: string;
        selfieDataUrl: string;
    }) => void;
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

export default function RegistrationForm({
    onSuccess,
}: RegistrationFormProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [fullName, setFullName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [address, setAddress] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [email, setEmail] = useState("");

    const [selfieDataUrl, setSelfieDataUrl] = useState("");
    const [cameraOpen, setCameraOpen] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);

    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);

    const inputClass =
        "w-full rounded-xl border border-orange-200 bg-white px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

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
                    videoRef.current
                        .play()
                        .catch(() => {
                            // Browser autoplay handle
                        });
                }
            });
        } catch (error) {
            console.error("Camera error:", error);

            setErrors((prev) => ({
                ...prev,
                selfie:
                    "कॅमेरा सुरू करता आला नाही. कृपया Camera permission Allow करा.",
            }));
        }
    };

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

    const retakePhoto = () => {
        setSelfieDataUrl("");
        startCamera();
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

    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        if (!fullName.trim() || fullName.trim().length < 3) {
            newErrors.fullName = "पूर्ण नाव किमान 3 अक्षरांचे असावे.";
        }

        if (!dateOfBirth) {
            newErrors.dateOfBirth = "जन्मतारीख निवडा.";
        } else {
            const selectedDate = new Date(dateOfBirth);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate >= today) {
                newErrors.dateOfBirth = "योग्य जन्मतारीख निवडा.";
            }
        }

        if (!address.trim() || address.trim().length < 3) {
            newErrors.address = "पूर्ण पत्ता भरा.";
        }

        if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
            newErrors.mobileNumber =
                "10 अंकी योग्य मोबाईल नंबर प्रविष्ट करा.";
        }

        if (
            email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            newErrors.email = "योग्य ई-मेल पत्ता प्रविष्ट करा.";
        }

        if (!selfieDataUrl) {
            newErrors.selfie = "कॅमेरातून फोटो काढणे आवश्यक आहे.";
        }

        if (!termsAccepted) {
            newErrors.terms = "अटी व नियम स्वीकारणे आवश्यक आहे.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        try {
            setSubmitting(true);

            await insertSubmission({
                full_name: fullName.trim(),
                date_of_birth: dateOfBirth,
                address: address.trim(),
                mobile_number: mobileNumber.trim(),
                email: email.trim() || null,
                selfie_data_url: selfieDataUrl,
            });

            onSuccess({
                fullName: fullName.trim(),
                selfieDataUrl,
            });
        } catch (error) {
            console.error("Submission error:", error);

            setErrors({
                terms: "माहिती जतन करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50 px-3 py-4 sm:px-6 sm:py-8">
                <div className="mx-auto w-full max-w-2xl">
                    <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-xl shadow-orange-100/50">
                        {/* Header */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 px-5 py-7 text-center text-white sm:px-8 sm:py-9">
                            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10" />
                            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-white/10" />

                            <div className="relative">
                                <img
                                    src="/ganpati-header.png"
                                    alt="श्री गणेश उत्सव"
                                    className="mx-auto h-auto w-full max-w-[1200px] object-contain"
                                />
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-4 sm:p-7"
                        >
                            {/* Full Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    पूर्ण नाव <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="तुमचे पूर्ण नाव"
                                    className={inputClass}
                                />

                                {errors.fullName && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.fullName}
                                    </p>
                                )}
                            </div>

                            {/* DOB */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    जन्मतारीख <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    className={inputClass}
                                />

                                {errors.dateOfBirth && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.dateOfBirth}
                                    </p>
                                )}
                            </div>

                            {/* Address */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    पूर्ण पत्ता <span className="text-red-500">*</span>
                                </label>

                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="तुमचा पूर्ण पत्ता"
                                    rows={3}
                                    className={`${inputClass} resize-none`}
                                />

                                {errors.address && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.address}
                                    </p>
                                )}
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    मोबाईल नंबर <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={mobileNumber}
                                    onChange={(e) =>
                                        setMobileNumber(
                                            e.target.value.replace(/\D/g, "").slice(0, 10)
                                        )
                                    }
                                    placeholder="10 अंकी मोबाईल नंबर"
                                    className={inputClass}
                                />

                                {errors.mobileNumber && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.mobileNumber}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    ई-मेल <span className="text-gray-400">(ऐच्छिक)</span>
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                    className={inputClass}
                                />

                                {errors.email && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Camera Section */}
                            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                                <div className="mb-3">
                                    <h2 className="text-base font-bold text-gray-900">
                                        तुमचा फोटो
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        फक्त कॅमेरातून फोटो काढा
                                    </p>
                                </div>

                                {!selfieDataUrl && !cameraOpen && (
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 active:scale-[0.99]"
                                    >
                                        <span className="text-2xl">📷</span>
                                        <span>कॅमेरा सुरू करा</span>
                                    </button>
                                )}

                                {cameraOpen && (
                                    <div className="overflow-hidden rounded-2xl bg-black">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="aspect-[3/4] w-full object-cover sm:aspect-[4/3]"
                                            style={{
                                                transform: "scaleX(-1)",
                                            }}
                                        />

                                        <div className="p-3">
                                            <button
                                                type="button"
                                                onClick={capturePhoto}
                                                className="w-full rounded-xl bg-white px-5 py-3.5 font-bold text-orange-600 shadow transition active:scale-[0.99]"
                                            >
                                                📸 फोटो काढा
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selfieDataUrl && !cameraOpen && (
                                    <div>
                                        <div className="overflow-hidden rounded-2xl bg-gray-100">
                                            <img
                                                src={selfieDataUrl}
                                                alt="तुमचा फोटो"
                                                className="aspect-[3/4] w-full object-cover sm:aspect-[4/3]"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={retakePhoto}
                                            className="mt-3 w-full rounded-xl border border-orange-300 bg-white px-5 py-3 font-semibold text-orange-700 transition hover:bg-orange-50"
                                        >
                                            🔄 पुन्हा फोटो काढा
                                        </button>
                                    </div>
                                )}

                                {errors.selfie && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.selfie}
                                    </p>
                                )}
                            </div>

                            {/* Terms Checkbox */}
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) =>
                                            setTermsAccepted(e.target.checked)
                                        }
                                        className="mt-1 h-5 w-5 accent-orange-600"
                                    />

                                    <span className="text-sm leading-6 text-gray-700">
                                        मी दिलेली माहिती योग्य आहे आणि कार्यक्रमाच्या
                                        अटी व नियम मला मान्य आहेत.
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
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.terms}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 transition hover:from-orange-700 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting
                                    ? "नोंदणी जतन होत आहे..."
                                    : "गणपती उत्सवासाठी सहभागी व्हा"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Terms & Conditions Modal */}
            <TermsModal
                open={termsOpen}
                onClose={() => setTermsOpen(false)}
            />
        </>
    );
}
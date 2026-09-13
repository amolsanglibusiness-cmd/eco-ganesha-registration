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
    dateOfBirth?: string;
    address?: string;
    mobileNumber?: string;
    email?: string;
    selfie?: string;
    terms?: string;
}

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwePscZ2zyVQRAKjLyhkeGqDgOqhvHBneisqrSkIQ460accM8YxRBVFlzV8fyARwmOr/exec";

export default function RegistrationForm({
    onSuccess,
}: RegistrationFormProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const fullNameRef = useRef<HTMLInputElement | null>(null);
    const dateOfBirthRef = useRef<HTMLInputElement | null>(null);
    const addressRef = useRef<HTMLTextAreaElement | null>(null);
    const mobileNumberRef = useRef<HTMLInputElement | null>(null);
    const emailRef = useRef<HTMLInputElement | null>(null);
    const selfieRef = useRef<HTMLDivElement | null>(null);
    const termsRef = useRef<HTMLDivElement | null>(null);

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

    const errorInputClass =
        "w-full rounded-xl border border-red-500 bg-red-50 px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-100";

    // -----------------------------------------
    // Error काढण्यासाठी
    // -----------------------------------------
    const clearError = (
        field: keyof FormErrors
    ) => {
        setErrors((prev) => {
            if (!prev[field]) {
                return prev;
            }

            const updated = {
                ...prev,
            };

            delete updated[field];

            return updated;
        });
    };

    // -----------------------------------------
    // जन्मतारखेची 10 ते 80 वर्षांची मर्यादा
    // -----------------------------------------
    const getDateLimits = () => {
        const today = new Date();

        // किमान वय 10 वर्षे
        const maxDate = new Date(
            today.getFullYear() - 10,
            today.getMonth(),
            today.getDate()
        );

        // कमाल वय 80 वर्षे
        const minDate = new Date(
            today.getFullYear() - 80,
            today.getMonth(),
            today.getDate()
        );

        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(
                date.getMonth() + 1
            ).padStart(2, "0");
            const day = String(
                date.getDate()
            ).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        return {
            minDate: formatDate(minDate),
            maxDate: formatDate(maxDate),
        };
    };

    // -----------------------------------------
    // Camera बंद करणे
    // -----------------------------------------
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) =>
                    track.stop()
                );

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraOpen(false);
    };

    // -----------------------------------------
    // Camera सुरू करणे
    // -----------------------------------------
    const startCamera = async () => {
        try {
            setErrors((prev) => ({
                ...prev,
                selfie: undefined,
            }));

            if (
                !navigator.mediaDevices?.getUserMedia
            ) {
                setErrors((prev) => ({
                    ...prev,
                    selfie:
                        "या डिव्हाइसवर कॅमेरा उपलब्ध नाही.",
                }));

                return;
            }

            stopCamera();

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: {
                            facingMode: "user",
                            width: {
                                ideal: 1080,
                            },
                            height: {
                                ideal: 1440,
                            },
                        },
                        audio: false,
                    }
                );

            streamRef.current = stream;

            setCameraOpen(true);

            requestAnimationFrame(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject =
                        stream;

                    videoRef.current
                        .play()
                        .catch(() => {
                            // Browser autoplay handle
                        });
                }
            });
        } catch (error) {
            console.error(
                "Camera error:",
                error
            );

            setErrors((prev) => ({
                ...prev,
                selfie:
                    "कॅमेरा सुरू करता आला नाही. कृपया Camera permission Allow करा किंवा फाइल अपलोड पर्याय वापरा.",
            }));
        }
    };

    // -----------------------------------------
    // Camera मधून फोटो काढणे
    // -----------------------------------------
    const capturePhoto = () => {
        const video = videoRef.current;

        if (
            !video ||
            video.readyState < 2
        ) {
            setErrors((prev) => ({
                ...prev,
                selfie:
                    "कॅमेरा तयार झाल्यावर पुन्हा प्रयत्न करा.",
            }));

            return;
        }

        const canvas =
            document.createElement(
                "canvas"
            );

        const width =
            video.videoWidth || 720;

        const height =
            video.videoHeight || 960;

        canvas.width = width;
        canvas.height = height;

        const context =
            canvas.getContext("2d");

        if (!context) {
            setErrors((prev) => ({
                ...prev,
                selfie:
                    "फोटो तयार करता आला नाही.",
            }));

            return;
        }

        // Selfie mirror correction
        context.save();

        context.translate(
            width,
            0
        );

        context.scale(
            -1,
            1
        );

        context.drawImage(
            video,
            0,
            0,
            width,
            height
        );

        context.restore();

        const image =
            canvas.toDataURL(
                "image/jpeg",
                0.9
            );

        setSelfieDataUrl(image);

        setErrors((prev) => ({
            ...prev,
            selfie: undefined,
        }));

        stopCamera();
    };

    // -----------------------------------------
    // फोटो Upload
    // -----------------------------------------
    const handleFileUpload = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file =
            e.target.files?.[0];

        if (!file) return;

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            setErrors((prev) => ({
                ...prev,
                selfie:
                    "कृपया फक्त इमेज (फोटो) फाइल निवडा.",
            }));

            return;
        }

        const reader =
            new FileReader();

        reader.onload = (
            event
        ) => {
            if (
                event.target?.result
            ) {
                setSelfieDataUrl(
                    event.target
                        .result as string
                );

                setErrors((prev) => ({
                    ...prev,
                    selfie: undefined,
                }));

                stopCamera();
            }
        };

        reader.readAsDataURL(file);
    };

    // -----------------------------------------
    // दुसरा फोटो
    // -----------------------------------------
    const retakePhoto = () => {
        setSelfieDataUrl("");

        setErrors((prev) => ({
            ...prev,
            selfie: undefined,
        }));

        if (fileInputRef.current) {
            fileInputRef.current.value =
                "";
        }
    };

    // -----------------------------------------
    // Component बंद झाल्यावर Camera बंद
    // -----------------------------------------
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) =>
                        track.stop()
                    );

                streamRef.current = null;
            }

            if (videoRef.current) {
                videoRef.current.srcObject =
                    null;
            }
        };
    }, []);

    // -----------------------------------------
    // Form Validation
    // -----------------------------------------
    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        // -------------------------------------
        // नाव
        // -------------------------------------
        if (
            !fullName.trim()
        ) {
            newErrors.fullName =
                "कृपया पूर्ण नाव भरा.";
        } else if (
            fullName.trim().length < 3
        ) {
            newErrors.fullName =
                "पूर्ण नाव किमान 3 अक्षरांचे असावे.";
        }

        // -------------------------------------
        // जन्मतारीख
        // -------------------------------------
        if (!dateOfBirth) {
            newErrors.dateOfBirth =
                "कृपया जन्मतारीख निवडा.";
        } else {
            const selectedDate =
                new Date(
                    `${dateOfBirth}T00:00:00`
                );

            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            // 80 वर्षांपूर्वीची तारीख
            const minAllowedDate =
                new Date(
                    today.getFullYear() -
                    80,
                    today.getMonth(),
                    today.getDate()
                );

            // 10 वर्षांपूर्वीची तारीख
            const maxAllowedDate =
                new Date(
                    today.getFullYear() -
                    10,
                    today.getMonth(),
                    today.getDate()
                );

            if (
                selectedDate <
                minAllowedDate ||
                selectedDate >
                maxAllowedDate
            ) {
                newErrors.dateOfBirth =
                    "वय 10 ते 80 वर्षांच्या दरम्यान असणे आवश्यक आहे.";
            }
        }

        // -------------------------------------
        // पत्ता
        // -------------------------------------
        if (
            !address.trim()
        ) {
            newErrors.address =
                "कृपया पूर्ण पत्ता भरा.";
        } else if (
            address.trim().length < 3
        ) {
            newErrors.address =
                "पूर्ण पत्ता किमान 3 अक्षरांचा असावा.";
        }

        // -------------------------------------
        // Mobile
        // -------------------------------------
        if (
            !mobileNumber.trim()
        ) {
            newErrors.mobileNumber =
                "कृपया मोबाईल नंबर भरा.";
        } else if (
            !/^[6-9]\d{9}$/.test(
                mobileNumber.trim()
            )
        ) {
            newErrors.mobileNumber =
                "10 अंकी योग्य मोबाईल नंबर प्रविष्ट करा.";
        }

        // -------------------------------------
        // Email
        // -------------------------------------
        if (
            email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email.trim()
            )
        ) {
            newErrors.email =
                "योग्य ई-मेल पत्ता प्रविष्ट करा.";
        }

        // -------------------------------------
        // Photo
        // -------------------------------------
        if (!selfieDataUrl) {
            newErrors.selfie =
                "फोटो काढणे किंवा अपलोड करणे आवश्यक आहे.";
        }

        // -------------------------------------
        // Terms
        // -------------------------------------
        if (!termsAccepted) {
            newErrors.terms =
                "अटी व नियम स्वीकारणे आवश्यक आहे.";
        }

        setErrors(newErrors);

        // -------------------------------------
        // पहिल्या चुकीच्या field कडे scroll
        // -------------------------------------
        if (
            Object.keys(
                newErrors
            ).length > 0
        ) {
            requestAnimationFrame(() => {
                if (
                    newErrors.fullName
                ) {
                    fullNameRef.current?.scrollIntoView(
                        {
                            behavior:
                                "smooth",
                            block:
                                "center",
                        }
                    );
                    fullNameRef.current?.focus();
                    return;
                }

                if (
                    newErrors.dateOfBirth
                ) {
                    dateOfBirthRef.current?.scrollIntoView(
                        {
                            behavior:
                                "smooth",
                            block:
                                "center",
                        }
                    );
                    dateOfBirthRef.current?.focus();
                    return;
                }

                if (
                    newErrors.address
                ) {
                    addressRef.current?.scrollIntoView(
                        {
                            behavior:
                                "smooth",
                            block:
                                "center",
                        }
                    );
                    addressRef.current?.focus();
                    return;
                }

                if (
                    newErrors.mobileNumber
                ) {
                    mobileNumberRef.current?.scrollIntoView(
                        {
                            behavior:
                                "smooth",
                            block:
                                "center",
                        }
                    );
                    mobileNumberRef.current?.focus();
                    return;
                }

                if (
                    newErrors.email
                ) {
                    emailRef.current?.scrollIntoView(
                        {
                            behavior:
                                "smooth",
                            block:
                                "center",
                        }
                    );
                    emailRef.current?.focus();
                    return;
                }

                if (
                    newErrors.selfie
                ) {
                    selfieRef.current?.scrollIntoView(
                        {
                            behavior:
                                "smooth",
                            block:
                                "center",
                        }
                    );
                    return;
                }

                if (
                    newErrors.terms
                ) {
                    termsRef.current?.scrollIntoView(
                        {
                            behavior:
                                "smooth",
                            block:
                                "center",
                        }
                    );
                }
            });
        }

        return (
            Object.keys(
                newErrors
            ).length === 0
        );
    };

    // -----------------------------------------
    // Google Sheet मध्ये Data Save
    // -----------------------------------------
    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        console.log(
            "SUBMIT BUTTON CLICKED"
        );

        // -----------------------------------------
        // Validation
        // -----------------------------------------
        const isValid =
            validate();

        if (!isValid) {
            console.log(
                "FORM VALIDATION FAILED"
            );

            return;
        }

        // -----------------------------------------
        // Prevent Double Submit
        // -----------------------------------------
        if (submitting) {
            return;
        }

        try {
            setSubmitting(true);

            setErrors({});

            // -------------------------------------
            // Data तयार करा
            // -------------------------------------
            const formData = {
                full_name:
                    fullName.trim(),

                date_of_birth:
                    dateOfBirth,

                address:
                    address.trim(),

                mobile_number:
                    mobileNumber.trim(),

                email:
                    email.trim() || "",

                selfie_data_url:
                    selfieDataUrl,
            };

            console.log(
                "Google Apps Script ला Data पाठवत आहे..."
            );

            // -------------------------------------
            // Google Apps Script
            // -------------------------------------
            const response =
                await fetch(
                    GOOGLE_SCRIPT_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "text/plain;charset=utf-8",
                        },

                        body:
                            JSON.stringify(
                                formData
                            ),
                    }
                );

            console.log(
                "Google Script Status:",
                response.status
            );

            if (!response.ok) {
                throw new Error(
                    "Google Apps Script response error."
                );
            }

            // -------------------------------------
            // Response
            // -------------------------------------
            const result =
                await response.json();

            console.log(
                "Google Script Result:",
                result
            );

            // -------------------------------------
            // Error
            // -------------------------------------
            if (
                result.result !==
                "success"
            ) {
                throw new Error(
                    result.message ||
                    "Google Sheet मध्ये Data Save झाला नाही."
                );
            }

            // -------------------------------------
            // Success
            // -------------------------------------
            console.log(
                "DATA SAVED SUCCESSFULLY"
            );

            console.log(
                "Unique ID:",
                result.unique_id
            );

            console.log(
                "Drive Photo:",
                result.photo_url
            );

            // -------------------------------------
            // Success Page
            // -------------------------------------
            onSuccess({
                fullName:
                    fullName.trim(),

                selfieDataUrl:
                    selfieDataUrl,

                uniqueId:
                    result.unique_id,

                photoUrl:
                    result.photo_url,
            });
        } catch (error) {
            console.error(
                "SUBMISSION ERROR:",
                error
            );

            let message =
                "माहिती जतन करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.";

            if (
                error instanceof Error &&
                error.message
            ) {
                message =
                    error.message;
            }

            setErrors({
                terms: message,
            });

            requestAnimationFrame(() => {
                termsRef.current?.scrollIntoView(
                    {
                        behavior:
                            "smooth",
                        block:
                            "center",
                    }
                );
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

                        {/* =========================
                            Header
                        ========================== */}
                        <div className="relative overflow-hidden bg-white p-0 text-center">

                            <div className="relative">
                                <img
                                    src="/ganpati-header.png"
                                    alt="श्री गणेश उत्सव"
                                    className="block h-auto w-full object-contain"
                                />
                            </div>

                        </div>

                        {/* =========================
                            Form
                        ========================== */}
                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="space-y-5 p-4 sm:p-7"
                        >

                            {/* Full Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    पूर्ण नाव{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    ref={
                                        fullNameRef
                                    }
                                    type="text"
                                    value={
                                        fullName
                                    }
                                    onChange={(
                                        e
                                    ) => {
                                        setFullName(
                                            e
                                                .target
                                                .value
                                        );

                                        clearError(
                                            "fullName"
                                        );
                                    }}
                                    onBlur={() => {
                                        if (
                                            fullName.trim()
                                        ) {
                                            const temp =
                                                fullName.trim()
                                                    .length <
                                                3;

                                            if (
                                                temp
                                            ) {
                                                setErrors(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        fullName:
                                                            "पूर्ण नाव किमान 3 अक्षरांचे असावे.",
                                                    })
                                                );
                                            }
                                        }
                                    }}
                                    placeholder="तुमचे पूर्ण नाव"
                                    className={
                                        errors.fullName
                                            ? errorInputClass
                                            : inputClass
                                    }
                                    aria-invalid={
                                        !!errors.fullName
                                    }
                                    aria-describedby={
                                        errors.fullName
                                            ? "fullName-error"
                                            : undefined
                                    }
                                />

                                {errors.fullName && (
                                    <p
                                        id="fullName-error"
                                        className="mt-1.5 flex items-center gap-1 text-sm font-medium text-red-600"
                                    >
                                        <span>
                                            ⚠️
                                        </span>
                                        {
                                            errors.fullName
                                        }
                                    </p>
                                )}
                            </div>

                            {/* DOB */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    जन्मतारीख{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    ref={
                                        dateOfBirthRef
                                    }
                                    type="date"
                                    value={
                                        dateOfBirth
                                    }
                                    min={
                                        getDateLimits()
                                            .minDate
                                    }
                                    max={
                                        getDateLimits()
                                            .maxDate
                                    }
                                    onChange={(
                                        e
                                    ) => {
                                        setDateOfBirth(
                                            e
                                                .target
                                                .value
                                        );

                                        clearError(
                                            "dateOfBirth"
                                        );
                                    }}
                                    className={
                                        errors.dateOfBirth
                                            ? errorInputClass
                                            : inputClass
                                    }
                                    aria-invalid={
                                        !!errors.dateOfBirth
                                    }
                                />

                           
                                {errors.dateOfBirth && (
                                    <p className="mt-1.5 flex items-center gap-1 text-sm font-medium text-red-600">
                                        <span>
                                            ⚠️
                                        </span>
                                        {
                                            errors.dateOfBirth
                                        }
                                    </p>
                                )}
                            </div>

                            {/* Address */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    पूर्ण पत्ता{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <textarea
                                    ref={
                                        addressRef
                                    }
                                    value={
                                        address
                                    }
                                    onChange={(
                                        e
                                    ) => {
                                        setAddress(
                                            e
                                                .target
                                                .value
                                        );

                                        clearError(
                                            "address"
                                        );
                                    }}
                                    placeholder="तुमचा पूर्ण पत्ता"
                                    rows={3}
                                    className={`${errors.address ? errorInputClass : inputClass} resize-none`}
                                    aria-invalid={
                                        !!errors.address
                                    }
                                />

                                {errors.address && (
                                    <p className="mt-1.5 flex items-center gap-1 text-sm font-medium text-red-600">
                                        <span>
                                            ⚠️
                                        </span>
                                        {
                                            errors.address
                                        }
                                    </p>
                                )}
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    मोबाईल नंबर{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    ref={
                                        mobileNumberRef
                                    }
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={
                                        mobileNumber
                                    }
                                    onChange={(
                                        e
                                    ) => {
                                        setMobileNumber(
                                            e
                                                .target
                                                .value
                                                .replace(
                                                    /\D/g,
                                                    ""
                                                )
                                                .slice(
                                                    0,
                                                    10
                                                )
                                        );

                                        clearError(
                                            "mobileNumber"
                                        );
                                    }}
                                    onBlur={() => {
                                        if (
                                            mobileNumber &&
                                            !/^[6-9]\d{9}$/.test(
                                                mobileNumber
                                            )
                                        ) {
                                            setErrors(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    mobileNumber:
                                                        "10 अंकी योग्य मोबाईल नंबर प्रविष्ट करा.",
                                                })
                                            );
                                        }
                                    }}
                                    placeholder="10 अंकी मोबाईल नंबर"
                                    className={
                                        errors.mobileNumber
                                            ? errorInputClass
                                            : inputClass
                                    }
                                    aria-invalid={
                                        !!errors.mobileNumber
                                    }
                                />

                                {errors.mobileNumber && (
                                    <p className="mt-1.5 flex items-center gap-1 text-sm font-medium text-red-600">
                                        <span>
                                            ⚠️
                                        </span>
                                        {
                                            errors.mobileNumber
                                        }
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    ई-मेल{" "}
                                    <span className="text-gray-400">
                                        (ऐच्छिक)
                                    </span>
                                </label>

                                <input
                                    ref={
                                        emailRef
                                    }
                                    type="email"
                                    value={
                                        email
                                    }
                                    onChange={(
                                        e
                                    ) => {
                                        setEmail(
                                            e
                                                .target
                                                .value
                                        );

                                        clearError(
                                            "email"
                                        );
                                    }}
                                    onBlur={() => {
                                        if (
                                            email.trim() &&
                                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                                email.trim()
                                            )
                                        ) {
                                            setErrors(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    email:
                                                        "योग्य ई-मेल पत्ता प्रविष्ट करा.",
                                                })
                                            );
                                        }
                                    }}
                                    placeholder="example@email.com"
                                    className={
                                        errors.email
                                            ? errorInputClass
                                            : inputClass
                                    }
                                    aria-invalid={
                                        !!errors.email
                                    }
                                />

                                {errors.email && (
                                    <p className="mt-1.5 flex items-center gap-1 text-sm font-medium text-red-600">
                                        <span>
                                            ⚠️
                                        </span>
                                        {
                                            errors.email
                                        }
                                    </p>
                                )}
                            </div>

                            {/* =========================
                                Photo Section
                            ========================== */}
                            <div
                                ref={
                                    selfieRef
                                }
                                className={`rounded-2xl border ${errors.selfie
                                        ? "border-red-300 bg-red-50/60"
                                        : "border-orange-100 bg-orange-50/60"
                                    } p-4`}
                            >

                                <div className="mb-3">
                                    <h2 className="text-base font-bold text-gray-900">
                                        तुमचा फोटो{" "}
                                        <span className="text-red-500">
                                            *
                                        </span>
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        कॅमेरातून फोटो काढा किंवा
                                        संगणकावरून निवडा
                                    </p>
                                </div>

                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    ref={
                                        fileInputRef
                                    }
                                    accept="image/*"
                                    onChange={
                                        handleFileUpload
                                    }
                                    className="hidden"
                                />

                                {/* Camera / Upload Buttons */}
                                {!selfieDataUrl &&
                                    !cameraOpen && (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                                            <button
                                                type="button"
                                                onClick={
                                                    startCamera
                                                }
                                                className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3.5 text-base font-bold text-white shadow-md shadow-orange-200 transition hover:bg-orange-700 active:scale-[0.99]"
                                            >
                                                <span className="text-xl">
                                                    📷
                                                </span>

                                                <span>
                                                    कॅमेरा सुरू करा
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-orange-500 bg-white px-4 py-3.5 text-base font-bold text-orange-600 shadow-sm transition hover:bg-orange-50 active:scale-[0.99]"
                                            >
                                                <span className="text-xl">
                                                    📁
                                                </span>

                                                <span>
                                                    फोटो अपलोड करा
                                                </span>
                                            </button>

                                        </div>
                                    )}

                                {/* Camera */}
                                {cameraOpen && (
                                    <div className="overflow-hidden rounded-2xl bg-black">

                                        <video
                                            ref={
                                                videoRef
                                            }
                                            autoPlay
                                            playsInline
                                            muted
                                            className="aspect-[3/4] w-full object-cover sm:aspect-[4/3]"
                                            style={{
                                                transform:
                                                    "scaleX(-1)",
                                            }}
                                        />

                                        <div className="p-3">
                                            <button
                                                type="button"
                                                onClick={
                                                    capturePhoto
                                                }
                                                className="w-full rounded-xl bg-white px-5 py-3.5 font-bold text-orange-600 shadow transition active:scale-[0.99]"
                                            >
                                                📸 फोटो काढा
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Selected Photo */}
                                {selfieDataUrl &&
                                    !cameraOpen && (
                                        <div>

                                            <div className="overflow-hidden rounded-2xl bg-gray-100">
                                                <img
                                                    src={
                                                        selfieDataUrl
                                                    }
                                                    alt="तुमचा फोटो"
                                                    className="aspect-[3/4] w-full object-cover sm:aspect-[4/3]"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={
                                                    retakePhoto
                                                }
                                                className="mt-3 w-full rounded-xl border border-orange-300 bg-white px-5 py-3 font-semibold text-orange-700 transition hover:bg-orange-50"
                                            >
                                                🔄 दुसरा फोटो
                                                निवडा / काढा
                                            </button>

                                        </div>
                                    )}

                                {errors.selfie && (
                                    <p className="mt-2 flex items-center gap-1 text-sm font-medium text-red-600">
                                        <span>
                                            ⚠️
                                        </span>
                                        {
                                            errors.selfie
                                        }
                                    </p>
                                )}
                            </div>

                            {/* =========================
                                Terms
                            ========================== */}
                            <div
                                ref={
                                    termsRef
                                }
                                className={`rounded-xl border ${errors.terms
                                        ? "border-red-300 bg-red-50"
                                        : "border-gray-200 bg-gray-50"
                                    } p-4`}
                            >

                                <label className="flex cursor-pointer items-start gap-3">

                                    <input
                                        type="checkbox"
                                        checked={
                                            termsAccepted
                                        }
                                        onChange={(
                                            e
                                        ) => {
                                            setTermsAccepted(
                                                e
                                                    .target
                                                    .checked
                                            );

                                            if (
                                                e
                                                    .target
                                                    .checked
                                            ) {
                                                clearError(
                                                    "terms"
                                                );
                                            }
                                        }}
                                        className="mt-1 h-5 w-5 accent-orange-600"
                                        aria-invalid={
                                            !!errors.terms
                                        }
                                    />

                                    <span className="text-sm leading-6 text-gray-700">
                                        मी दिलेली माहिती योग्य
                                        आहे आणि कार्यक्रमाच्या
                                        अटी व नियम मला मान्य
                                        आहेत.

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setTermsOpen(
                                                    true
                                                )
                                            }
                                            className="ml-1 font-semibold text-orange-600 underline focus:outline-none"
                                        >
                                            अटी व नियम पाहा
                                        </button>
                                    </span>

                                </label>

                                {errors.terms && (
                                    <p className="mt-2 flex items-center gap-1 text-sm font-medium text-red-600">
                                        <span>
                                            ⚠️
                                        </span>
                                        {
                                            errors.terms
                                        }
                                    </p>
                                )}
                            </div>

                            {/* =========================
                                Submit Button
                            ========================== */}
                            <button
                                type="submit"
                                disabled={
                                    submitting
                                }
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
                open={
                    termsOpen
                }
                onClose={() =>
                    setTermsOpen(
                        false
                    )
                }
            />
        </>
    );
}
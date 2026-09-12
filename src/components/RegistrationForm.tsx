"use client";

import { useEffect, useRef, useState } from "react";
import {
    User,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Loader2,
    Send,
    AlertCircle,
    Camera,
    RotateCcw,
    Sparkles,
} from "lucide-react";

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

    /* =========================================================
       CAMERA STATES
    ========================================================= */

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    /* =========================================================
       START CAMERA
    ========================================================= */

    const startCamera = async () => {
        setCameraError(null);
        setCameraLoading(true);

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error(
                    "या डिव्हाइसवर कॅमेरा उपलब्ध नाही किंवा ब्राउझर कॅमेरा वापरण्यास समर्थन देत नाही."
                );
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: {
                        ideal: 1280,
                    },
                    height: {
                        ideal: 1280,
                    },
                },
                audio: false,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                await videoRef.current.play();
            }

            setCameraOpen(true);
        } catch (error) {
            console.error("Camera Error:", error);

            setCameraError(
                "कॅमेरा सुरू करता आला नाही. कृपया कॅमेरा परवानगी Allow करा."
            );
        } finally {
            setCameraLoading(false);
        }
    };

    /* =========================================================
       STOP CAMERA
    ========================================================= */

    const stopCamera = () => {
        const video = videoRef.current;

        if (video?.srcObject) {
            const stream = video.srcObject as MediaStream;

            stream.getTracks().forEach((track) => {
                track.stop();
            });

            video.srcObject = null;
        }

        setCameraOpen(false);
    };

    /* =========================================================
       CAPTURE PHOTO
    ========================================================= */

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) return;

        if (
            video.readyState < 2 ||
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {
            setCameraError("कॅमेरा तयार झालेला नाही. कृपया थोडा वेळ थांबा.");
            return;
        }

        const maxSize = 1080;

        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > height && width > maxSize) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
        } else if (height > maxSize) {
            width = Math.round((width / height) * maxSize);
            height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
            setCameraError("फोटो तयार करता आला नाही.");
            return;
        }

        /*
          Selfie camera प्रमाणे preview mirror आहे.
          Capture करताना image देखील mirror ठेवली आहे.
        */

        context.save();

        context.translate(width, 0);
        context.scale(-1, 1);

        context.drawImage(
            video,
            0,
            0,
            width,
            height
        );

        context.restore();

        const image = canvas.toDataURL(
            "image/jpeg",
            0.88
        );

        setSelfieDataUrl(image);

        if (errors.selfie) {
            setErrors((prev) => ({
                ...prev,
                selfie: undefined,
            }));
        }

        stopCamera();
    };

    /* =========================================================
       RETAKE PHOTO
    ========================================================= */

    const retakePhoto = async () => {
        setSelfieDataUrl("");
        setCameraError(null);

        await startCamera();
    };

    /* =========================================================
       CLEAN CAMERA ON UNMOUNT
    ========================================================= */

    useEffect(() => {
        return () => {
            const video = videoRef.current;

            if (video?.srcObject) {
                const stream = video.srcObject as MediaStream;

                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            }
        };
    }, []);

    /* =========================================================
       VALIDATION
    ========================================================= */

    const validate = (): boolean => {
        const e: FormErrors = {};

        // नाव
        if (!formData.fullName.trim()) {
            e.fullName = "संपूर्ण नाव आवश्यक आहे";
        } else if (formData.fullName.trim().length < 3) {
            e.fullName = "नाव किमान ३ अक्षरांचे असावे";
        }

        // जन्मदिनांक
        if (!formData.dateOfBirth) {
            e.dateOfBirth = "जन्मदिनांक आवश्यक आहे";
        } else {
            const dob = new Date(formData.dateOfBirth);
            const today = new Date();

            if (dob >= today) {
                e.dateOfBirth = "वैध जन्मदिनांक निवडा";
            }
        }

        // पत्ता
        if (!formData.address.trim()) {
            e.address = "संपूर्ण पत्ता आवश्यक आहे";
        } else if (formData.address.trim().length < 3) {
            e.address = "कृपया पत्ता सविस्तर लिहा";
        }

        // मोबाईल
        const cleanMobile =
            formData.mobileNumber.replace(/\D/g, "");

        if (!cleanMobile) {
            e.mobileNumber =
                "मोबाईल क्रमांक आवश्यक आहे";
        } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
            e.mobileNumber =
                "१० अंकी वैध मोबाईल क्रमांक टाका (६-९ ने सुरू होणारा)";
        }

        // ईमेल
        if (
            formData.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                formData.email.trim()
            )
        ) {
            e.email = "वैध ई-मेल आयडी टाका";
        }

        // सेल्फी
        if (!selfieDataUrl) {
            e.selfie =
                "कॅमेऱ्याने गणपती सेल्फी काढणे आवश्यक आहे";
        }

        // Terms
        if (!agreedToTerms) {
            e.terms =
                "कृपया नियम व अटी मान्य करा";
        }

        setErrors(e);

        return Object.keys(e).length === 0;
    };

    /* =========================================================
       SUBMIT
    ========================================================= */

    const handleSubmit = async (
        ev: React.FormEvent
    ) => {
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
            const cleanMobile =
                formData.mobileNumber.replace(/\D/g, "");

            const { error } = await insertSubmission({
                full_name: formData.fullName.trim(),
                date_of_birth: formData.dateOfBirth,
                address: formData.address.trim(),
                mobile_number: cleanMobile,
                email: formData.email.trim() || null,
                selfie_data_url: selfieDataUrl,
            });

            if (error) {
                console.error(
                    "Supabase Database Error:",
                    error
                );

                throw error;
            }

            onSuccess({
                fullName: formData.fullName.trim(),
                selfieDataUrl,
            });
        } catch (err: unknown) {
            console.error(
                "Submission Catch Error:",
                err
            );

            const msg =
                err instanceof Error
                    ? err.message
                    : "डेटाबेसमध्ये माहिती जतन करताना त्रुटी आली.";

            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    /* =========================================================
       INPUT CHANGE
    ========================================================= */

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

    /* =========================================================
       CLASSES
    ========================================================= */

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
    focus:border-orange-300/70
    focus:bg-white/[0.10]
    focus:ring-2
    focus:ring-orange-400/20
  `;

    const errorClass =
        "text-red-300 text-sm mt-1.5 flex items-center gap-1 font-medium";

    /* =========================================================
       RETURN
    ========================================================= */

    return (
        <>
            <div className="w-full">

                {/* =====================================================
            ONE SINGLE MAIN GANESH CARD
        ===================================================== */}

                <div
                    className="
            relative
            w-full
            overflow-hidden
            rounded-[28px]
            border
            border-yellow-400/30
            bg-gradient-to-br
            from-[#26080d]
            via-[#16091b]
            to-[#180b2b]
            shadow-2xl
          "
                >

                    {/* TOP FESTIVE GLOW */}

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
              to-pink-500
            "
                    />

                    {/* =================================================
              GANPATI HEADER
          ================================================= */}

                    <div
                        className="
              relative
              px-4
              pt-5
              pb-6
              sm:px-7
              sm:pt-7
              sm:pb-7
              text-center
            "
                    >

                        {/* Decorative elements */}

                        <div
                            className="
                pointer-events-none
                absolute
                top-2
                left-2
                text-4xl
                opacity-30
              "
                        >
                            🪔
                        </div>

                        <div
                            className="
                pointer-events-none
                absolute
                top-2
                right-2
                text-4xl
                opacity-30
              "
                        >
                            🪔
                        </div>

                        <Sparkles
                            className="
                absolute
                top-5
                left-1/2
                -translate-x-1/2
                w-4
                h-4
                text-yellow-300
                opacity-70
              "
                        />

                        {/* GANPATI IMAGE */}

                        <div
                            className="
                relative
                mx-auto
                mt-2
                mb-4
                w-[145px]
                h-[145px]
                sm:w-[175px]
                sm:h-[175px]
                rounded-full
                overflow-hidden
                border
                border-yellow-300/60
                bg-gradient-to-br
                from-orange-300/20
                via-red-500/20
                to-purple-700/30
                shadow-[0_0_40px_rgba(251,146,60,0.35)]
              "
                        >
                            <img
                                src="/ganpati-murti.png"
                                alt="गणपती बाप्पा"
                                className="
                  w-full
                  h-full
                  object-cover
                "
                            />

                            {/* Image overlay */}

                            <div
                                className="
                  absolute
                  inset-0
                  rounded-full
                  ring-1
                  ring-inset
                  ring-white/20
                  pointer-events-none
                "
                            />
                        </div>

                        {/* TITLE */}

                        <h1
                            className="
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

                        <div
                            className="
                mx-auto
                my-3
                h-1
                w-20
                rounded-full
                bg-gradient-to-r
                from-orange-400
                via-yellow-300
                to-pink-400
              "
                        />

                        <h2
                            className="
                text-xl
                sm:text-2xl
                font-extrabold
                text-yellow-200
              "
                        >
                            📸 गणपती सेल्फी
                        </h2>

                        <p
                            className="
                mt-2
                text-sm
                sm:text-base
                text-white/75
                leading-relaxed
              "
                        >
                            बाप्पासोबतचा तुमचा खास क्षण
                            <br />
                            आमच्यासोबत नोंदवा
                        </p>

                        <div
                            className="
                mt-4
                flex
                justify-center
                gap-2
                flex-wrap
              "
                        >
                            <span
                                className="
                  rounded-full
                  border
                  border-yellow-300/20
                  bg-white/10
                  px-3
                  py-1
                  text-xs
                  text-yellow-100
                "
                            >
                                🌺 मंगलमूर्ती
                            </span>

                            <span
                                className="
                  rounded-full
                  border
                  border-yellow-300/20
                  bg-white/10
                  px-3
                  py-1
                  text-xs
                  text-yellow-100
                "
                            >
                                🙏 शुभ गणेशोत्सव
                            </span>
                        </div>
                    </div>

                    {/* =================================================
              FORM CONTENT
          ================================================= */}

                    <div
                        className="
              px-4
              pb-5
              sm:px-7
              sm:pb-7
            "
                    >

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >

                            {/* =================================================
                  NAME
              ================================================= */}

                            <div>
                                <label
                                    className="
                    block
                    text-white/85
                    text-sm
                    font-semibold
                    mb-2
                  "
                                >
                                    संपूर्ण नाव{" "}
                                    <span className="text-orange-300">
                                        *
                                    </span>
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

                            {/* =================================================
                  DATE
              ================================================= */}

                            <div>
                                <label
                                    className="
                    block
                    text-white/85
                    text-sm
                    font-semibold
                    mb-2
                  "
                                >
                                    जन्मदिनांक{" "}
                                    <span className="text-orange-300">
                                        *
                                    </span>
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

                            {/* =================================================
                  ADDRESS
              ================================================= */}

                            <div>
                                <label
                                    className="
                    block
                    text-white/85
                    text-sm
                    font-semibold
                    mb-2
                  "
                                >
                                    संपूर्ण पत्ता{" "}
                                    <span className="text-orange-300">
                                        *
                                    </span>
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

                            {/* =================================================
                  MOBILE + EMAIL
              ================================================= */}

                            <div
                                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  gap-5
                "
                            >

                                {/* MOBILE */}

                                <div>
                                    <label
                                        className="
                      block
                      text-white/85
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

                                {/* EMAIL */}

                                <div>
                                    <label
                                        className="
                      block
                      text-white/85
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

                            {/* =================================================
                  CAMERA / SELFIE
              ================================================= */}

                            <div
                                className="
                  relative
                  overflow-hidden
                  rounded-3xl
                  border
                  border-orange-400/40
                  bg-gradient-to-br
                  from-orange-500/[0.08]
                  via-red-500/[0.08]
                  to-purple-500/[0.12]
                  p-4
                  sm:p-5
                "
                            >

                                {/* Camera heading */}

                                <div
                                    className="
                    flex
                    items-center
                    gap-3
                    mb-4
                  "
                                >
                                    <div
                                        className="
                      flex
                      h-12
                      w-12
                      flex-shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-gradient-to-br
                      from-orange-400
                      to-pink-600
                      shadow-lg
                    "
                                    >
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>

                                    <div>
                                        <h3
                                            className="
                        text-white
                        font-extrabold
                        text-lg
                      "
                                        >
                                            गणपती सेल्फी{" "}
                                            <span className="text-orange-300">
                                                *
                                            </span>
                                        </h3>

                                        <p
                                            className="
                        text-white/50
                        text-xs
                        sm:text-sm
                      "
                                        >
                                            फक्त कॅमेऱ्याने फोटो काढा
                                        </p>
                                    </div>
                                </div>

                                {/* =================================================
                    CAMERA NOT OPEN + NO PHOTO
                ================================================= */}

                                {!cameraOpen && !selfieDataUrl && (
                                    <div
                                        className="
                      rounded-2xl
                      border
                      border-dashed
                      border-orange-300/40
                      bg-black/20
                      p-5
                      sm:p-7
                      text-center
                    "
                                    >

                                        <div
                                            className="
                        mx-auto
                        mb-4
                        flex
                        h-20
                        w-20
                        items-center
                        justify-center
                        rounded-full
                        bg-gradient-to-br
                        from-orange-400/20
                        to-pink-500/20
                        border
                        border-orange-300/30
                      "
                                        >
                                            <Camera
                                                className="
                          w-10
                          h-10
                          text-orange-300
                        "
                                            />
                                        </div>

                                        <h4
                                            className="
                        text-white
                        font-bold
                        text-base
                        sm:text-lg
                      "
                                        >
                                            बाप्पासोबत सेल्फी काढा
                                        </h4>

                                        <p
                                            className="
                        mt-1
                        text-white/45
                        text-xs
                        sm:text-sm
                      "
                                        >
                                            खालील बटन दाबून कॅमेरा सुरू करा
                                        </p>

                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            disabled={cameraLoading}
                                            className="
                        mt-5
                        w-full
                        sm:w-auto
                        min-w-[220px]
                        rounded-2xl
                        bg-gradient-to-r
                        from-orange-500
                        via-red-500
                        to-pink-600
                        px-6
                        py-4
                        text-white
                        font-extrabold
                        text-base
                        shadow-lg
                        transition-all
                        hover:scale-[1.02]
                        active:scale-[0.98]
                        disabled:opacity-60
                        flex
                        items-center
                        justify-center
                        gap-2
                      "
                                        >
                                            {cameraLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    कॅमेरा सुरू होत आहे...
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className="w-5 h-5" />
                                                    कॅमेरा सुरू करा
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* =================================================
                    LIVE CAMERA
                ================================================= */}

                                {cameraOpen && (
                                    <div className="space-y-4">

                                        <div
                                            className="
                        relative
                        w-full
                        overflow-hidden
                        rounded-2xl
                        bg-black
                        border
                        border-orange-300/30
                        shadow-2xl
                        aspect-[3/4]
                        sm:aspect-[4/3]
                      "
                                        >
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                muted
                                                playsInline
                                                className="
                          absolute
                          inset-0
                          w-full
                          h-full
                          object-cover
                          -scale-x-100
                        "
                                            />

                                            {/* Camera frame */}

                                            <div
                                                className="
                          pointer-events-none
                          absolute
                          inset-4
                          rounded-2xl
                          border-2
                          border-white/35
                        "
                                            />

                                            {/* Top label */}

                                            <div
                                                className="
                          absolute
                          top-4
                          left-1/2
                          -translate-x-1/2
                          rounded-full
                          bg-black/50
                          backdrop-blur-md
                          px-4
                          py-2
                          text-xs
                          font-semibold
                          text-white
                        "
                                            >
                                                📸 बाप्पासोबत सेल्फी
                                            </div>

                                            {/* Bottom gradient */}

                                            <div
                                                className="
                          absolute
                          bottom-0
                          left-0
                          right-0
                          h-28
                          bg-gradient-to-t
                          from-black/70
                          to-transparent
                          pointer-events-none
                        "
                                            />
                                        </div>

                                        {/* Capture button */}

                                        <button
                                            type="button"
                                            onClick={capturePhoto}
                                            className="
                        w-full
                        rounded-2xl
                        bg-gradient-to-r
                        from-orange-500
                        via-red-500
                        to-pink-600
                        py-4
                        text-white
                        font-extrabold
                        text-lg
                        shadow-xl
                        flex
                        items-center
                        justify-center
                        gap-3
                        transition-all
                        hover:scale-[1.01]
                        active:scale-[0.98]
                      "
                                        >
                                            <span
                                                className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-full
                          bg-white/20
                        "
                                            >
                                                <Camera className="w-5 h-5" />
                                            </span>

                                            फोटो काढा
                                        </button>

                                        <button
                                            type="button"
                                            onClick={stopCamera}
                                            className="
                        w-full
                        rounded-xl
                        border
                        border-white/10
                        bg-white/5
                        py-3
                        text-sm
                        font-medium
                        text-white/70
                        hover:bg-white/10
                      "
                                        >
                                            कॅमेरा बंद करा
                                        </button>
                                    </div>
                                )}

                                {/* =================================================
                    CAPTURED PHOTO
                ================================================= */}

                                {selfieDataUrl && !cameraOpen && (
                                    <div className="space-y-4">

                                        <div
                                            className="
                        relative
                        overflow-hidden
                        rounded-2xl
                        border
                        border-green-400/30
                        bg-black
                      "
                                        >
                                            <img
                                                src={selfieDataUrl}
                                                alt="गणपती सेल्फी"
                                                className="
                          block
                          w-full
                          max-h-[520px]
                          object-contain
                        "
                                            />

                                            <div
                                                className="
                          absolute
                          top-3
                          right-3
                          rounded-full
                          bg-green-500/90
                          px-3
                          py-1.5
                          text-xs
                          font-bold
                          text-white
                        "
                                            >
                                                ✓ फोटो तयार
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={retakePhoto}
                                            className="
                        w-full
                        rounded-2xl
                        border
                        border-orange-300/30
                        bg-orange-500/10
                        py-3.5
                        text-white
                        font-bold
                        flex
                        items-center
                        justify-center
                        gap-2
                        hover:bg-orange-500/20
                        transition-all
                      "
                                        >
                                            <RotateCcw className="w-5 h-5" />
                                            पुन्हा फोटो काढा
                                        </button>
                                    </div>
                                )}

                                {/* Camera error */}

                                {cameraError && (
                                    <div
                                        className="
                      mt-3
                      flex
                      items-start
                      gap-2
                      rounded-xl
                      border
                      border-red-500/30
                      bg-red-500/10
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
                                            {cameraError}
                                        </p>
                                    </div>
                                )}

                                {/* Selfie validation error */}

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
                    text-white/40
                  "
                                >
                                    🔒 फोटो फक्त कॅमेऱ्यातून घेता येईल
                                </p>
                            </div>

                            {/* Hidden canvas */}

                            <canvas
                                ref={canvasRef}
                                className="hidden"
                            />

                            {/* =================================================
                  TERMS
              ================================================= */}

                            <div
                                className={`
                  rounded-2xl
                  p-4
                  border
                  bg-white/[0.04]
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

                            {/* =================================================
                  SUBMIT ERROR
              ================================================= */}

                            {submitError && (
                                <div
                                    className="
                    flex
                    items-start
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

                            {/* =================================================
                  SUBMIT
              ================================================= */}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="
                  relative
                  w-full
                  overflow-hidden
                  rounded-2xl
                  bg-gradient-to-r
                  from-orange-500
                  via-red-500
                  to-purple-600
                  py-4
                  text-white
                  font-extrabold
                  text-lg
                  shadow-xl
                  transition-all
                  hover:scale-[1.01]
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
                                        <Camera className="w-5 h-5" />
                                        गणपती सेल्फी नोंदवा
                                        <Send className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <p
                                className="
                  text-center
                  text-white/40
                  text-xs
                  pb-1
                "
                            >
                                <span className="text-orange-300">
                                    *
                                </span>{" "}
                                चिन्हांकित सर्व फील्ड आवश्यक आहेत
                            </p>
                        </form>
                    </div>
                </div>
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
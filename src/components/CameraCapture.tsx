import {
    useRef,
    useState,
    useEffect,
    useCallback,
    ChangeEvent,
} from 'react';

import {
    Camera,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Loader2,
} from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (dataUrl: string) => void;
    capturedImage: string | null;
}

export default function CameraCapture({
    onCapture,
    capturedImage,
}: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);

    // =====================================================
    // STOP CAMERA
    // =====================================================

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
            });
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsStreaming(false);
    }, []);

    // =====================================================
    // START CAMERA (Optimized for Mobile Browsers)
    // =====================================================

    const startCamera = useCallback(async () => {
        setIsStarting(true);
        setError(null);

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                fileInputRef.current?.click();
                setIsStarting(false);
                return;
            }

            stopCamera();

            // मोबाईल व पीसीवर थेट फ्रंट कॅमेरा उघडण्यासाठी Constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.muted = true;
                videoRef.current.playsInline = true;

                // iOS / Chrome ऑटोप्लेसाठी playsinline सेट करणे
                videoRef.current.setAttribute('playsinline', 'true');

                await videoRef.current.play();
            }

            setIsStreaming(true);
        } catch (err) {
            console.error('Camera Error:', err);

            const errorName = err instanceof DOMException ? err.name : '';

            if (
                errorName === 'NotAllowedError' ||
                errorName === 'PermissionDeniedError'
            ) {
                setError(
                    'कॅमेराची परवानगी नाकारली आहे. कृपया Browser Settings मध्ये Camera Permission चालू करा.'
                );
            } else if (
                errorName === 'NotFoundError' ||
                errorName === 'DevicesNotFoundError'
            ) {
                setError('कॅमेरा डिव्हाइस सापडले नाही.');
            } else if (
                errorName === 'NotReadableError' ||
                errorName === 'TrackStartError'
            ) {
                setError(
                    'कॅमेरा सध्या दुसऱ्या अॅपमध्ये वापरला जात आहे. इतर Camera Apps बंद करून पुन्हा प्रयत्न करा.'
                );
            } else if (
                errorName === 'SecurityError' ||
                errorName === 'TypeError'
            ) {
                setError(
                    'कॅमेरा वापरण्यासाठी वेबसाइट HTTPS वर उघडणे आवश्यक आहे.'
                );
            } else {
                setError(
                    'कॅमेरा सुरू करता आला नाही. कृपया पुन्हा प्रयत्न करा किंवा फोटो अपलोड करा.'
                );
            }
        } finally {
            setIsStarting(false);
        }
    }, [stopCamera]);

    // =====================================================
    // TAKE SQUARE SELFIE
    // =====================================================

    const takeSelfie = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        const exportSize = 1000;
        canvas.width = exportSize;
        canvas.height = exportSize;

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        if (!videoWidth || !videoHeight) {
            setError(
                'कॅमेरा फोटो तयार करण्यासाठी अजून तयार झालेला नाही. कृपया पुन्हा प्रयत्न करा.'
            );
            return;
        }

        const sourceSize = Math.min(videoWidth, videoHeight);
        const sourceX = (videoWidth - sourceSize) / 2;
        const sourceY = (videoHeight - sourceSize) / 2;

        ctx.save();
        ctx.translate(exportSize, 0);
        ctx.scale(-1, 1);

        ctx.drawImage(
            video,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            exportSize,
            exportSize
        );

        ctx.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        onCapture(dataUrl);
        stopCamera();
    }, [onCapture, stopCamera]);

    // =====================================================
    // GALLERY PHOTO -> SQUARE
    // =====================================================

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('कृपया फक्त इमेज फाईल (JPG, PNG) निवडा.');
            return;
        }

        setError(null);

        const reader = new FileReader();

        reader.onload = (event) => {
            const result = event.target?.result;
            if (!result) return;

            const img = new Image();

            img.onload = async () => {
                if ('decode' in img) {
                    try {
                        await img.decode();
                    } catch (decodeErr) {
                        console.warn('Image decode warn:', decodeErr);
                    }
                }

                const canvas =
                    canvasRef.current || document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) return;

                const exportSize = 1000;
                canvas.width = exportSize;
                canvas.height = exportSize;

                const sourceSize = Math.min(img.width, img.height);
                const sourceX = (img.width - sourceSize) / 2;
                const sourceY = (img.height - sourceSize) / 2;

                ctx.drawImage(
                    img,
                    sourceX,
                    sourceY,
                    sourceSize,
                    sourceSize,
                    0,
                    0,
                    exportSize,
                    exportSize
                );

                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

                onCapture(dataUrl);
                stopCamera();
            };

            img.onerror = () => {
                setError('फोटो वाचता आला नाही. कृपया दुसरा फोटो निवडा.');
            };

            img.src = result as string;
        };

        reader.onerror = () => {
            setError('फोटो वाचताना त्रुटी आली.');
        };

        reader.readAsDataURL(file);
    };

    // =====================================================
    // RETAKE
    // =====================================================

    const retake = useCallback(() => {
        onCapture('');
        setError(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onCapture]);

    // =====================================================
    // CLEANUP CAMERA
    // =====================================================

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => {
                    track.stop();
                });
            }
        };
    }, []);

    const hasImage = !!capturedImage;

    return (
        <div className="space-y-3">
            {/* NOTICE */}
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                <p className="text-sm leading-relaxed text-amber-200">
                    टीप: तुम्ही थेट कॅमेऱ्याने सेल्फी काढू शकता किंवा गॅलरीतून फोटो अपलोड करू शकता.
                </p>
            </div>

            {/* HIDDEN CANVAS */}
            <canvas ref={canvasRef} className="hidden" />

            {/* FILE INPUT */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
            />

            {/* SQUARE CAMERA PREVIEW */}
            <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-white/10 bg-black/40 shadow-inner">
                {!hasImage ? (
                    <>
                        {/* VIDEO */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="h-full w-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                        />

                        {/* START SCREEN */}
                        {!isStreaming && !isStarting && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-festive-gradient animate-pulse-glow">
                                    <Camera className="h-8 w-8 text-white" />
                                </div>
                                <p className="px-4 text-center text-sm font-medium text-white/80">
                                    कॅमेरा सुरू करा किंवा फोटो अपलोड करा
                                </p>
                            </div>
                        )}

                        {/* CAMERA STARTING */}
                        {isStarting && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
                                <Loader2 className="h-8 w-8 animate-spin text-festive-gold" />
                                <p className="text-sm text-white/70">
                                    कॅमेरा सुरू होत आहे...
                                </p>
                            </div>
                        )}

                        {/* ERROR */}
                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 p-6 text-center">
                                <AlertCircle className="h-12 w-12 text-red-400" />
                                <p className="text-sm text-red-200">{error}</p>
                            </div>
                        )}

                        {/* SQUARE CAMERA GUIDE */}
                        {isStreaming && (
                            <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-dashed border-white/40">
                                <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-festive-gold to-transparent animate-pulse" />
                                <div className="glass-dark absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs text-white/80">
                                    चौकटीत चेहरा ठेवून सेल्फी काढा
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* CAPTURED PHOTO */
                    <img
                        src={capturedImage}
                        alt="Captured selfie"
                        className="h-full w-full object-cover animate-scale-in"
                    />
                )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                {!hasImage && !isStreaming && !isStarting && (
                    <>
                        <button
                            type="button"
                            onClick={startCamera}
                            className="shimmer-btn flex items-center gap-2 rounded-xl bg-festive-gradient px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90"
                        >
                            <Camera className="h-5 w-5" />
                            कॅमेरा सुरू करा
                        </button>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-orange-500 bg-white px-4 py-3 text-base font-bold text-orange-600 shadow-sm transition hover:bg-orange-50 active:scale-[0.99]"
                        >
                            <span className="text-xl">📁</span>
                            <span>फोटो अपलोड करा</span>
                        </button>
                    </>
                )}

                {!hasImage && isStreaming && (
                    <button
                        type="button"
                        onClick={takeSelfie}
                        className="shimmer-btn flex items-center gap-2 rounded-xl bg-gradient-to-r from-festive-emerald to-emerald-700 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 animate-pulse-glow"
                    >
                        <Camera className="h-5 w-5" />
                        सेल्फी काढा
                    </button>
                )}

                {hasImage && (
                    <button
                        type="button"
                        onClick={retake}
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/20"
                    >
                        <RefreshCw className="h-5 w-5" />
                        पुन्हा फोटो निवडा/काढा
                    </button>
                )}
            </div>

            {/* PHOTO SAVED MESSAGE */}
            {hasImage && (
                <div className="flex items-center justify-center gap-2 text-festive-emerald">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                        फोटो सेव्ह झाला!
                    </span>
                </div>
            )}
        </div>
    );
}
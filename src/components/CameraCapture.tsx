import { useRef, useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertCircle, Loader2, Upload } from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (dataUrl: string) => void;
    capturedImage: string | null;
}

export default function CameraCapture({ onCapture, capturedImage }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);

    const startCamera = useCallback(async () => {
        setIsStarting(true);
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 1280 },
                },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setIsStreaming(true);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'कॅमेरा सुरू करण्यात त्रुटी';
            if (msg.includes('Permission') || msg.includes('NotAllowed')) {
                setError('कॅमेराची परवानगी द्या. ब्राउझर सेटिंग्जमध्ये कॅमेरा अॅक्सेस चालू करा.');
            } else if (msg.includes('NotFound') || msg.includes('Devices')) {
                setError('कॅमेरा डिव्हाइस सापडला नाही. कॅमेरा असलेले डिव्हाइस वापरा.');
            } else {
                setError('कॅमेरा सुरू करण्यात त्रुटी: ' + msg);
            }
        } finally {
            setIsStarting(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setIsStreaming(false);
    }, []);

    const takeSelfie = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = size;
        canvas.height = size;

        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;

        // Mirror the image horizontally to match preview
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        onCapture(dataUrl);
        stopCamera();
    }, [onCapture, stopCamera]);

    // फाइल सिलेक्ट करून अपलोड करण्यासाठीचे फंक्शन
    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('कृपया फक्त इमेज फाईल (JPG, PNG) निवडा.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                onCapture(result);
                stopCamera();
            };
            reader.readAsDataURL(file);
        }
    };

    const retake = useCallback(() => {
        onCapture('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onCapture]);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const hasImage = !!capturedImage;

    return (
        <div className="space-y-3">
            {/* Notice */}
            <div className="flex items-start gap-2 bg-amber-500/15 border border-amber-500/30 rounded-xl p-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-200 text-sm leading-relaxed">
                    टीप: तुम्ही थेट कॅमेऱ्याने सेल्फी काढू शकता किंवा गॅलरीतून फोटो अपलोड करू शकता.
                </p>
            </div>

            {/* Hidden canvas & Hidden file input */}
            <canvas ref={canvasRef} className="hidden" />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
            />

            <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-black/40 border-2 border-white/10">
                {!hasImage ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        {!isStreaming && !isStarting && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-festive-gradient flex items-center justify-center animate-pulse-glow">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-white/70 text-sm">कॅमेरा सुरू करा किंवा फोटो अपलोड करा</p>
                            </div>
                        )}
                        {isStarting && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
                                <Loader2 className="w-8 h-8 text-festive-gold animate-spin" />
                                <p className="text-white/70 text-sm">कॅमेरा सुरू होत आहे...</p>
                            </div>
                        )}
                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                                <AlertCircle className="w-12 h-12 text-red-400" />
                                <p className="text-red-200 text-sm">{error}</p>
                            </div>
                        )}
                        {/* Scan line effect when streaming */}
                        {isStreaming && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-festive-gold to-transparent animate-pulse" />
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs glass-dark px-3 py-1 rounded-full">
                                    थेट सेल्फी काढा
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <img
                        src={capturedImage}
                        alt="Captured selfie"
                        className="w-full h-full object-cover animate-scale-in"
                    />
                )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                {!hasImage && !isStreaming && !isStarting && (
                    <>
                        <button
                            type="button"
                            onClick={startCamera}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-festive-gradient text-white font-semibold shimmer-btn hover:opacity-90 transition-opacity"
                        >
                            <Camera className="w-5 h-5" />
                            कॅमेरा सुरू करा
                        </button>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors"
                        >
                            <Upload className="w-5 h-5" />
                            फोटो अपलोड करा
                        </button>
                    </>
                )}
                {!hasImage && isStreaming && (
                    <button
                        type="button"
                        onClick={takeSelfie}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-festive-emerald to-emerald-700 text-white font-semibold shimmer-btn hover:opacity-90 transition-opacity animate-pulse-glow"
                    >
                        <Camera className="w-5 h-5" />
                        सेल्फी काढा
                    </button>
                )}
                {hasImage && (
                    <button
                        type="button"
                        onClick={retake}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                        पुन्हा फोटो निवडा/काढा
                    </button>
                )}
            </div>

            {hasImage && (
                <div className="flex items-center justify-center gap-2 text-festive-emerald">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">फोटो सेव्ह झाला!</span>
                </div>
            )}
        </div>
    );
}
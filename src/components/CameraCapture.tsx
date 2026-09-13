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
          width: { ideal: 1080 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 1 }, // 1:1 Aspect ratio साठी
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

  /*
   * अचूक स्क्वेअर (1:1) क्रॉप करून फोटो कॅप्चर करणारे फंक्शन
   */
  const takeSelfie = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // व्हिडीओचा सर्वात लहान भाग घेऊन १:१ साईझ निश्चित केली जाते
    const targetSize = Math.min(video.videoWidth, video.videoHeight);
    
    // आउटपुट कॅनव्हास साईझ (उदा. 1000x1000 px)
    const exportSize = 1000;
    canvas.width = exportSize;
    canvas.height = exportSize;

    // व्हिडीओचा मध्यभाग अचूक मोजून क्रॉप केला जातो
    const sx = (video.videoWidth - targetSize) / 2;
    const sy = (video.videoHeight - targetSize) / 2;

    ctx.save();
    // 1:1 मध्ये प्रिव्ह्यू प्रमाणे फोटो मिरर (Horizontal Flip) करा
    ctx.translate(exportSize, 0);
    ctx.scale(-1, 1);
    
    // व्हिडिओमधील नक्की प्रिव्ह्यू एवढाच भाग drawImage ने घेतला जातो
    ctx.drawImage(
      video,
      sx,
      sy,
      targetSize,
      targetSize,
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

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('कृपया फक्त इमेज फाईल (JPG, PNG) निवडा.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // गॅलरीतून आलेला फोटोसुद्धा १:१ स्क्वेअर साइजमध्ये क्रॉप केला जाईल
          const canvas = canvasRef.current || document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const size = Math.min(img.width, img.height);
          const exportSize = 1000;

          canvas.width = exportSize;
          canvas.height = exportSize;

          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;

          if (ctx) {
            ctx.drawImage(img, sx, sy, size, size, 0, 0, exportSize, exportSize);
            onCapture(canvas.toDataURL('image/jpeg', 0.92));
          }
          stopCamera();
        };
        img.src = event.target?.result as string;
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
      <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 p-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
        <p className="text-sm leading-relaxed text-amber-200">
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

      {/* Camera View / Preview Container (Fixed 1:1 Box) */}
      <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-white/10 bg-black/40 shadow-inner">
        {!hasImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!isStreaming && !isStarting && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-festive-gradient animate-pulse-glow">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm text-white/80 font-medium">कॅमेरा सुरू करा किंवा फोटो अपलोड करा</p>
              </div>
            )}
            {isStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-festive-gold" />
                <p className="text-sm text-white/70">कॅमेरा सुरू होत आहे...</p>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-black/70">
                <AlertCircle className="h-12 w-12 text-red-400" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}
            {/* Camera Overlay Guide Line (1:1 Box Guide) */}
            {isStreaming && (
              <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-white/40 rounded-2xl">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-festive-gold to-transparent animate-pulse" />
                <div className="glass-dark absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs text-white/80">
                  चौकटीत चेहरा ठेवून सेल्फी काढा
                </div>
              </div>
            )}
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured selfie"
            className="h-full w-full object-cover animate-scale-in"
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
              className="shimmer-btn flex items-center gap-2 rounded-xl bg-festive-gradient px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Camera className="h-5 w-5" />
              कॅमेरा सुरू करा
            </button>
            <button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  className="hidden min-[768px]:flex items-center justify-center gap-2 rounded-2xl border-2 border-orange-500 bg-white px-4 py-3.5 text-base font-bold text-orange-600 shadow-sm transition hover:bg-orange-50 active:scale-[0.99]"
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

      {hasImage && (
        <div className="flex items-center justify-center gap-2 text-festive-emerald">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">फोटो सेव्ह झाला!</span>
        </div>
      )}
    </div>
  );
}
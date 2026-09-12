import { useState } from 'react';
import { Download, Share2, CheckCircle, Sparkles, RotateCcw } from 'lucide-react';
import StatusCard, { getStatusCardDataUrl } from './StatusCard';

interface SuccessViewProps {
  fullName: string;
  selfieDataUrl: string;
  onReset: () => void;
}

export default function SuccessView({ fullName, selfieDataUrl, onReset }: SuccessViewProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    const dataUrl = getStatusCardDataUrl();
    if (!dataUrl) return;

    setDownloading(true);
    const link = document.createElement('a');
    link.download = `EcoGanesha2026_${fullName.replace(/\s+/g, '_')}.jpg`;
    link.href = dataUrl;
    link.click();
    setTimeout(() => setDownloading(false), 1000);
  };

  const handleWhatsAppShare = () => {
    const dataUrl = getStatusCardDataUrl();
    if (!dataUrl) return;

    const text = `🙏 घरगुती इकोफ्रेंडली गणेशा २०२६ 🌿\n\nमी "${fullName}" या राज्यस्तरीय स्पर्धेत सहभागी झालो/झाले आहे! 🎉\n\n✅ अधिकृत सहभागी\n\nतुम्हीही सहभाग नोंदवा! 🦚\n#EcoFriendlyGanesha2026 #घरगुतीइकोफ्रेंडलीगणेशा`;

    // Try Web Share API first (mobile)
    if (navigator.share && dataUrl.startsWith('data:')) {
      // Convert data URL to blob for sharing
      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `EcoGanesha2026.jpg`, { type: 'image/jpeg' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              text,
              files: [file],
            }).catch(() => {
              // Fallback to WhatsApp URL
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            });
          } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
          }
        })
        .catch(() => {
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="animate-slide-up">
      {/* Success header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-festive-emerald to-emerald-700 mb-4 animate-scale-in">
          <CheckCircle className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          सहभाग यशस्वी नोंदवला! 🎉
        </h2>
        <p className="text-white/70 text-sm">
          तुमचा सेल्फी फोटो आणि माहिती यशस्वीरित्या सबमिट झाली आहे.
        </p>
      </div>

      {/* Status Card Preview */}
      <div className="glass rounded-3xl p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-festive-gold" />
          <h3 className="text-white font-semibold">तुमचे व्हॉट्सॲप स्टेटस कार्ड</h3>
        </div>
        <StatusCard fullName={fullName} selfieDataUrl={selfieDataUrl} />
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-festive-orange to-festive-red text-white font-bold text-lg shimmer-btn hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          स्टेटस कार्ड डाऊनलोड करा
        </button>

        <button
          onClick={handleWhatsAppShare}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-festive-emerald to-green-700 text-white font-bold text-lg shimmer-btn hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          व्हॉट्सॲपवर शेअर करा
        </button>

        <button
          onClick={onReset}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/15 text-white/70 font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          नवीन सहभाग नोंदवा
        </button>
      </div>
    </div>
  );
}

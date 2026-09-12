import { useState, useEffect } from 'react';
import { Leaf, Sparkles, Users, Award, ChevronRight } from 'lucide-react';
import RegistrationForm from "./components/RegistrationForm";
import SuccessView from "./components/SuccessView";
import Confetti from "./components/Confetti";
type AppState = 'form' | 'success';

interface SuccessData {
  fullName: string;
  selfieDataUrl: string;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('form');
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSuccess = (data: SuccessData) => {
    setSuccessData(data);
    setAppState('success');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 6000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setSuccessData(null);
    setAppState('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-festive-radial relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-festive-orange/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-festive-emerald/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-festive-gold/10 rounded-full blur-3xl" />
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-festive-gold/20 animate-float"
            style={{
              top: `${10 + i * 12}%`,
              left: `${5 + i * 11}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Header */}
      <header className="relative z-10 pt-6 pb-4 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Brand bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-festive-gradient flex items-center justify-center shadow-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm sm:text-base">Eco Ganesha</p>
                <p className="text-white/50 text-xs">घरगुती स्पर्धा २०२६</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 glass-dark px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-festive-gold" />
              <span className="text-white/80 text-xs font-medium">राज्यस्तरीय स्पर्धा</span>
            </div>
          </div>

          {/* Hero Banner */}
          <div className="relative rounded-3xl overflow-hidden mb-6 animate-fade-in">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-festive-red via-festive-orange to-festive-gold" />

            {/* Decorative pattern overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(16,185,129,0.3) 0%, transparent 50%)`,
              }}
            />

            {/* Content */}
            <div className="relative px-6 py-8 sm:px-10 sm:py-12 text-center">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                <Leaf className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-semibold tracking-wide">ECO-FRIENDLY CONTEST</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-2 drop-shadow-lg leading-tight">
                घरगुती इकोफ्रेंडली
              </h1>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 drop-shadow-lg leading-tight">
                गणेशा २०२६
              </h1>

              <p className="text-white/90 text-base sm:text-lg font-medium mb-4">
                — विशेष राज्यस्तरीय स्पर्धा —
              </p>

              <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
                <div className="flex items-center gap-2 text-white/90">
                  <Users className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">सर्वांसाठी खुली</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <Award className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">आकर्षक बक्षिसे</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <Leaf className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">निसर्गाच्या सानिध्यात</span>
                </div>
              </div>
            </div>

            {/* Bottom decorative wave */}
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-festive-gold via-white to-festive-gold" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          {appState === 'form' && (
            <>
              {/* Info banner */}
              <div className="glass rounded-2xl p-4 mb-5 flex items-center gap-3 animate-slide-up">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-festive-emerald to-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    सहभाग नोंदवा आणि तुमचे व्हॉट्सॲप स्टेटस कार्ड मिळवा!
                  </p>
                  <p className="text-white/60 text-xs mt-0.5">
                    फॉर्म भरा, सेल्फी काढा आणि तुमचे अधिकृत स्टेटस कार्ड डाऊनलोड करा.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0" />
              </div>

              {/* Form card */}
              <div className="glass rounded-3xl p-5 sm:p-7 animate-slide-up">
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    सहभागी नोंदणी फॉर्म
                  </h2>
                  <div className="h-1 w-20 bg-festive-gradient rounded-full" />
                </div>
                <RegistrationForm onSuccess={handleSuccess} />
              </div>
            </>
          )}

          {appState === 'success' && successData && (
            <div className="glass rounded-3xl p-5 sm:p-7">
              <SuccessView
                fullName={successData.fullName}
                selfieDataUrl={successData.selfieDataUrl}
                onReset={handleReset}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-4 pb-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px w-12 bg-white/20" />
            <Leaf className="w-4 h-4 text-festive-emerald" />
            <div className="h-px w-12 bg-white/20" />
          </div>
          <p className="text-white/40 text-xs">
            घरगुती इकोफ्रेंडली गणेशा २०२६ · विशेष राज्यस्तरीय स्पर्धा
          </p>
          <p className="text-white/30 text-xs mt-1">
            पर्यावरणाची जपणी · निसर्गाची साथ · हरित गणेशोत्सव
          </p>
        </div>
      </footer>
    </div>
  );
}

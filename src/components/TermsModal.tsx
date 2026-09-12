import { X, Leaf, Scale, Award, Shield, Users } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TERMS = [
  {
    icon: Leaf,
    title: 'पर्यावरणपूरक गणेश मूर्ती',
    desc: 'फक्त नैसर्गिक आणि विघटनशील (eco-friendly) साहित्याचा वापर करावा. प्लास्टर ऑफ पॅरिस (POP) वापरणार नाही. रंगीत रंगांचा वापर टाळावा.',
  },
  {
    icon: Scale,
    title: 'निकाल व निर्णय',
    desc: 'स्पर्धेचे निकाल निवड समितीचा अंतिम निर्णय मान्य असेल. कोणत्याही प्रकारचा वाद उठविला जाणार नाही.',
  },
  {
    icon: Award,
    title: 'बक्षिसे व सन्मान',
    desc: 'विजेत्यांना आकर्षक बक्षिसे व सन्मानचिन्हे देण्यात येतील. सहभागी सर्वांना प्रतिभागिता प्रमाणपत्र मिळेल.',
  },
  {
    icon: Shield,
    title: 'माहितीचा वापर',
    desc: 'तुमची वैयक्तिक माहिती केवळ स्पर्धेच्या उद्देशाने वापरली जाईल. ती इतर कोणासही शेअर केली जाणार नाही.',
  },
  {
    icon: Users,
    title: 'सहभागाचे नियम',
    desc: 'एका व्यक्ती एकच सहभाग नोंदवू शकेल. थेट सेल्फी फोटो आवश्यक आहे. गॅलरीतील जुने फोटो चालणार नाहीत.',
  },
];

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative glass-dark rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 animate-scale-in border border-festive-gold/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-festive-gradient flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">स्पर्धेचे नियम व अटी</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="बंद करा"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="space-y-4">
          {TERMS.map((term, i) => {
            const Icon = term.icon;
            return (
              <div
                key={i}
                className="glass rounded-2xl p-4 flex gap-4 items-start hover:bg-white/10 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-festive-orange to-festive-red flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-festive-gold text-base mb-1">{term.title}</h3>
                  <p className="text-white/80 text-sm leading-relaxed">{term.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-festive-gradient text-white font-semibold shimmer-btn hover:opacity-90 transition-opacity"
        >
          समजले, बंद करा
        </button>
      </div>
    </div>
  );
}

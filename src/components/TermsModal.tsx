"use client";

import React from "react";

interface TermsModalProps {
    open: boolean;
    onClose: () => void;
}

export default function TermsModal({ open, onClose }: TermsModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity">
            <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50 px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-900">
                        📋 नियम व अटी (Terms & Conditions)
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-gray-400 transition hover:bg-orange-100 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Terms Content */}
                <div className="overflow-y-auto p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
                    <div className="rounded-xl bg-orange-50/50 p-3 text-orange-800 text-xs font-medium">
                        कृपया श्री गणेश उत्सवातील सहभागासाठी खालील सर्व नियम आणि अटी काळजीपूर्वक वाचा.
                    </div>

                    <div className="space-y-3">
                        <p>
                            <strong>१. वैयक्तिक माहिती:</strong> नोंदणी फॉर्ममध्ये दिलेली सर्व माहिती (नाव, जन्मतारीख, पत्ता आणि संपर्क क्रमांक) सत्य आणि अचूक असणे आवश्यक आहे.
                        </p>
                        <p>
                            <strong>२. फोटो/लाइव्ह सेल्फी:</strong> अपलोड केलेला फोटो किंवा थेट कॅमेऱ्यातून घेतलेला सेल्फी हा केवळ ओळखीच्या पडताळणीसाठी वापरला जाईल.
                        </p>
                        <p>
                            <strong>३. गोपनीयतेचे नियम:</strong> तुमची कोणतीही वैयक्तिक माहिती थर्ड पार्टीसोबत शेअर केली जाणार नाही. ती गणेश उत्सव व्यवस्थापनापुरतीच मर्यादित राहील.
                        </p>
                        <p>
                            <strong>४. उत्सवाचे शिस्तपालन:</strong> सर्व सहभागींनी उत्सव परिसरातील नियम, शिस्त आणि मार्गदर्शक तत्वांचे पालन करणे बंधनकारक आहे.
                        </p>
                        <p>
                            <strong>५. आयोजकांचे अधिकार:</strong> कोणत्याही प्रकारचा गैरप्रकार किंवा चुकीची माहिती आढळल्यास नोंदणी रद्द करण्याचे अंतिम अधिकार गणेश उत्सव समितीकडे राखीव राहतील.
                        </p>
                    </div>
                </div>

                {/* Footer / Close Action */}
                <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-orange-700 hover:to-amber-600 active:scale-[0.98]"
                    >
                        मला सर्व अटी मान्य आहेत
                    </button>
                </div>

            </div>
        </div>
    );
}
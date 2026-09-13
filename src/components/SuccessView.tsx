"use client";

import React, { useState } from "react";

interface SuccessViewProps {
    fullName: string;
    selfieDataUrl: string;
    onReset: () => void;
}

export default function SuccessView({
    fullName,
    selfieDataUrl,
    onReset,
}: SuccessViewProps) {
    const [sharing, setSharing] = useState(false);

    const getFileName = () => {
        const safeName = fullName
            .trim()
            .replace(/[^\p{L}\p{N}]+/gu, "_")
            .replace(/^_+|_+$/g, "");

        return `GanpatiUtsav_${ safeName || "Participant" }.jpg`;
    };

    const dataUrlToBlob = async (
        dataUrl: string
    ): Promise<Blob> => {
        const response = await fetch(dataUrl);
        return response.blob();
    };

    const downloadPhoto = () => {
        if (!selfieDataUrl) {
            alert("फोटो उपलब्ध नाही.");
            return;
        }

        const link = document.createElement("a");

        link.href = selfieDataUrl;
        link.download = getFileName();

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const sharePhoto = async () => {
        if (!selfieDataUrl) {
            alert("फोटो उपलब्ध नाही.");
            return;
        }

        try {
            setSharing(true);

            const blob =
                await dataUrlToBlob(selfieDataUrl);

            const file = new File(
                [blob],
                getFileName(),
                {
                    type: "image/jpeg",
                }
            );

            if (
                navigator.share &&
                navigator.canShare &&
                navigator.canShare({
                    files: [file],
                })
            ) {
                await navigator.share({
                    title: "गणपती उत्सव",
                    text: "गणपती बाप्पा मोरया 🙏",
                    files: [file],
                });

                return;
            }

            if (navigator.share) {
                await navigator.share({
                    title: "गणपती उत्सव",
                    text:
                        "गणपती बाप्पा मोरया 🙏\n\n" +
                        "मी गणपती उत्सवासाठी सहभागी झालो आहे.",
                });

                return;
            }

            const message =
                "गणपती बाप्पा मोरया 🙏\n\n" +
                `मी ${ fullName } गणपती उत्सवासाठी सहभागी झालो आहे.`;

            const whatsappUrl =
                "https://wa.me/?text=" +
                encodeURIComponent(message);

            window.open(
                whatsappUrl,
                "_blank",
                "noopener,noreferrer"
            );
        } catch (error) {
            console.error(
                "Share error:",
                error
            );
        } finally {
            setSharing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50 px-3 py-5 sm:px-6 sm:py-10">
            <div className="mx-auto w-full max-w-2xl">
                <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-xl shadow-orange-100/50">

                    {/* Success Header */}
                    <div className="bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-7 text-center text-white sm:px-8">

                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl">
                            ✓
                        </div>

                        <h1 className="text-2xl font-bold sm:text-3xl">
                            नोंदणी यशस्वी!
                        </h1>

                        <p className="mt-2 text-sm text-orange-50 sm:text-base">
                            गणपती उत्सवासाठी तुमचा सहभाग नोंदवला गेला आहे.
                        </p>
                    </div>

                    <div className="space-y-5 p-4 sm:p-7">

                        {/* Participant */}
                        <div className="text-center">

                            <p className="text-sm text-gray-500">
                                धन्यवाद
                            </p>

                            <h2 className="mt-1 text-xl font-bold text-gray-900">
                                {fullName}
                            </h2>

                        </div>

                        {/* Original Selfie */}
                        {selfieDataUrl && (
                            <div className="flex justify-center">
                                <div className="overflow-hidden rounded-2xl border-4 border-orange-100 bg-orange-50 shadow-lg">
                                    <img
                                        src={selfieDataUrl}
                                        alt="नोंदणीसाठी घेतलेला फोटो"
                                        className="h-auto max-h-[520px] w-full max-w-md object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="grid gap-3 sm:grid-cols-2">

                            <button
                                type="button"
                                onClick={downloadPhoto}
                                className="rounded-xl bg-orange-600 px-5 py-3.5 font-bold text-white shadow-md transition hover:bg-orange-700"
                            >
                                ⬇️ फोटो जतन करा
                            </button>

                            <button
                                type="button"
                                onClick={sharePhoto}
                                disabled={sharing}
                                className="rounded-xl border border-orange-300 bg-white px-5 py-3.5 font-bold text-orange-700 transition hover:bg-orange-50 disabled:opacity-60"
                            >
                                {sharing
                                    ? "Share होत आहे..."
                                    : "↗️ Share करा"}
                            </button>

                        </div>

                        {/* Reset */}
                        <button
                            type="button"
                            onClick={onReset}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 font-semibold text-gray-700 transition hover:bg-gray-100"
                        >
                            पुन्हा नोंदणी करा
                        </button>

                        <p className="text-center text-xs text-gray-400">
                            गणपती बाप्पा मोरया 🙏
                        </p>

                    </div>
                </div>
            </div>
        </main>
    );
}
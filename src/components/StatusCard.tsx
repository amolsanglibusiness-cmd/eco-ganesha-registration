"use client";

import React, { useEffect, useState } from "react";

interface SuccessViewProps {
    fullName: string;
    selfieDataUrl: string;
    onReset: () => void;
}

const FORM_LINK = "https://www.sanglibusiness.in/p/tarunbharat.html";

export default function SuccessView({
    fullName,
    selfieDataUrl,
    onReset,
}: SuccessViewProps) {
    const [sharing, setSharing] = useState(false);
    const [statusImage, setStatusImage] = useState("");
    const [uniqueId, setUniqueId] = useState("");
    const [creatingImage, setCreatingImage] = useState(true);

    // Unique ID Generation (Runs Once)
    useEffect(() => {
        const now = new Date();
        const datePart =
            now.getFullYear().toString().slice(-2) +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0");

        const randomPart = Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase();

        const id = `TB-GAN-${datePart}-${randomPart}`;
        setUniqueId(id);
    }, []);

    const getFileName = () => {
        const safeName = fullName
            .trim()
            .replace(/[^\p{L}\p{N}]+/gu, "_")
            .replace(/^_+|_+$/g, "");

        return `GanpatiUtsav_${safeName || "Participant"}.jpg`;
    };

    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Image load failed: ${src}`));
            image.src = src;
        });
    };

    /*
     * Canvas Image Builder
     */
    const createStatusImage = async (): Promise<string> => {
        if (!selfieDataUrl) throw new Error("Selfie image not available.");
        if (!uniqueId) throw new Error("Unique ID not ready.");

        const framePath = encodeURI(`/share image.png?v=${Date.now()}`);

        const frameImage = await loadImage(framePath);
        const selfieImage = await loadImage(selfieDataUrl);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) throw new Error("Canvas उपलब्ध नाही.");

        const canvasWidth = frameImage.naturalWidth || 1200;
        const canvasHeight = frameImage.naturalHeight || 1800;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // ----------------------------------------------------
        // STEP 1: Background & Selfie (Bottom Layer)
        // ----------------------------------------------------
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const selfieBoxX = canvasWidth * 0.08;
        const selfieBoxY = canvasHeight * 0.28;
        const selfieBoxWidth = canvasWidth * 0.84;
        const selfieBoxHeight = canvasHeight * 0.52;

        const imgRatio = selfieImage.width / selfieImage.height;
        const boxRatio = selfieBoxWidth / selfieBoxHeight;

        let drawWidth = selfieBoxWidth;
        let drawHeight = selfieBoxHeight;
        let drawX = selfieBoxX;
        let drawY = selfieBoxY;

        if (imgRatio > boxRatio) {
            drawHeight = selfieBoxHeight;
            drawWidth = drawHeight * imgRatio;
            drawX = selfieBoxX + (selfieBoxWidth - drawWidth) / 2;
        } else {
            drawWidth = selfieBoxWidth;
            drawHeight = drawWidth / imgRatio;
            drawY = selfieBoxY + (selfieBoxHeight - drawHeight) / 2;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(selfieBoxX, selfieBoxY, selfieBoxWidth, selfieBoxHeight);
        ctx.clip();
        ctx.drawImage(selfieImage, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();

        // ----------------------------------------------------
        // STEP 2: Main Frame Layer (Top Layer)
        // ----------------------------------------------------
        ctx.drawImage(frameImage, 0, 0, canvasWidth, canvasHeight);

        // ----------------------------------------------------
        // STEP 3: Text Overlay (Unique ID & Name)
        // ----------------------------------------------------

        // 1. UNIQUE ID (EXACT TOP CENTER)
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.textAlign = "center"; // horizontal centering
        ctx.textBaseline = "middle"; // vertical centering
        ctx.fillStyle = "#5C2C16"; // Dark Chocolate Color
        ctx.font = `bold ${Math.round(canvasWidth * 0.038)}px Arial, sans-serif`;

        // X: 0.5 (Dead Center), Y: 0.035 (कार्डच्या अगदी वरच्या मोकळ्या भागात)
        ctx.fillText(`ID: ${uniqueId}`, canvasWidth * 0.5, canvasHeight * 0.035);
        ctx.restore();

        // 2. FULL NAME (With White Background Box)
        ctx.save();
        ctx.shadowBlur = 0;

        const nameText = fullName.trim();
        const fontSize = Math.round(canvasWidth * 0.042);
        ctx.font = `bold ${fontSize}px Arial, Noto Sans Devanagari, sans-serif`;

        const textMetrics = ctx.measureText(nameText);
        const textWidth = textMetrics.width;

        const paddingX = canvasWidth * 0.05;
        const paddingY = canvasHeight * 0.012;
        const boxWidth = textWidth + paddingX * 2;
        const boxHeight = fontSize + paddingY * 2;

        const boxX = (canvasWidth - boxWidth) / 2;
        const boxY = canvasHeight * 0.81 - boxHeight / 2;
        const cornerRadius = 12;

        // White Box Background
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, cornerRadius);
        ctx.fill();

        // Orange Border
        ctx.strokeStyle = "#e65100";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Name Text
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#7a2d00";
        ctx.fillText(nameText, canvasWidth / 2, canvasHeight * 0.81);
        ctx.restore();

        return canvas.toDataURL("image/jpeg", 0.92);
    };

    useEffect(() => {
        if (!selfieDataUrl || !uniqueId) return;

        let cancelled = false;

        const generate = async () => {
            try {
                setCreatingImage(true);
                const image = await createStatusImage();
                if (!cancelled) setStatusImage(image);
            } catch (error) {
                console.error("Status image creation error:", error);
            } finally {
                if (!cancelled) setCreatingImage(false);
            }
        };

        generate();

        return () => {
            cancelled = true;
        };
    }, [selfieDataUrl, uniqueId, fullName]);

    const downloadPhoto = () => {
        if (!statusImage) return;
        const link = document.createElement("a");
        link.href = statusImage;
        link.download = getFileName();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const sharePhoto = async () => {
        if (!statusImage) return;

        try {
            setSharing(true);
            const res = await fetch(statusImage);
            const blob = await res.blob();
            const file = new File([blob], getFileName(), { type: "image/jpeg" });

            const shareText =
                `गणपती बाप्पा मोरया 🙏\n\n` +
                `${fullName} यांनी गणपती उत्सवातील आपला खास क्षण नोंदवला आहे.\n\n` +
                `Unique ID: ${uniqueId}\n\n` +
                `नवीन सहभागासाठी नोंदणी करा:\n` +
                `${FORM_LINK}`;

            if (
                navigator.share &&
                navigator.canShare &&
                navigator.canShare({ files: [file] })
            ) {
                await navigator.share({
                    title: "गणपती उत्सव",
                    text: shareText,
                    files: [file],
                });
                return;
            }

            const whatsappText =
                `गणपती बाप्पा मोरया 🙏\n\n` +
                `${fullName} यांनी गणपती उत्सवातील आपला खास क्षण नोंदवला आहे.\n\n` +
                `नवीन सहभागासाठी नोंदणी करा:\n` +
                `${FORM_LINK}`;

            window.open(
                "https://wa.me/?text=" + encodeURIComponent(whatsappText),
                "_blank"
            );
        } catch (error) {
            console.error("Share error:", error);
        } finally {
            setSharing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50 px-3 py-5 sm:px-6 sm:py-10">
            <div className="mx-auto w-full max-w-2xl">
                <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-xl">
                    <div className="bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-7 text-center text-white">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl">
                            ✓
                        </div>
                        <h1 className="text-2xl font-bold sm:text-3xl">नोंदणी यशस्वी!</h1>
                    </div>

                    <div className="space-y-5 p-4 sm:p-7">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
                            {uniqueId && (
                                <p className="mt-1 text-sm font-semibold text-orange-600">
                                    ID: {uniqueId}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-center">
                            {statusImage ? (
                                <div className="overflow-hidden rounded-2xl border-4 border-orange-100 shadow-lg">
                                    <img
                                        src={statusImage}
                                        alt="कार्ड"
                                        className="h-auto max-h-[720px] w-full max-w-md object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="flex min-h-[320px] w-full max-w-md items-center justify-center rounded-2xl border border-orange-100 bg-orange-50">
                                    <p className="text-sm font-medium text-gray-600">
                                        इमेज तयार होत आहे...
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                onClick={downloadPhoto}
                                disabled={!statusImage}
                                className="rounded-xl bg-orange-600 px-5 py-3.5 font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50"
                            >
                                ⬇️ इमेज जतन करा
                            </button>
                            <button
                                onClick={sharePhoto}
                                disabled={sharing || !statusImage}
                                className="rounded-xl border border-orange-300 bg-white px-5 py-3.5 font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                            >
                                {sharing ? "Share होत आहे..." : "↗️ इमेज Share करा"}
                            </button>
                        </div>

                        <button
                            onClick={onReset}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 font-semibold text-gray-700 hover:bg-gray-100"
                        >
                            पुन्हा नोंदणी करा
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
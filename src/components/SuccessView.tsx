"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface SuccessViewProps {
    fullName: string;
    selfieDataUrl: string;
    onReset: () => void;
    onSaveToDrive?: (originalPhoto: string) => void;
}

const FORM_LINK = "https://www.sanglibusiness.in/p/tarunbharat.html";

const FRAME_CONFIG = {
    CANVAS_WIDTH: 576,
    CANVAS_HEIGHT: 1024,
    BOX_X: 24,
    BOX_Y: 442,
    BOX_WIDTH: 528,
    BOX_HEIGHT: 382,
    BOX_RADIUS: 24,
};

export default function SuccessView({
    fullName,
    selfieDataUrl,
    onReset,
    onSaveToDrive,
}: SuccessViewProps) {
    const [sharing, setSharing] = useState(false);
    const [uniqueId, setUniqueId] = useState("");
    const [saving, setSaving] = useState(false);

    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const selfieImgRef = useRef<HTMLImageElement | null>(null);
    const frameImgRef = useRef<HTMLImageElement | null>(null);

    // 1. UNIQUE ID & DRIVE SAVE
    useEffect(() => {
        const now = new Date();
        const datePart =
            now.getFullYear().toString().slice(-2) +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0");

        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const id = `TB-GAN-${datePart}-${randomPart}`;
        setUniqueId(id);

        if (onSaveToDrive && selfieDataUrl) {
            onSaveToDrive(selfieDataUrl);
        }
    }, [onSaveToDrive, selfieDataUrl]);

    // IMAGE LOADER
    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Image load failed: ${src}`));
            image.src = src;
        });
    };

    // LAYOUT CALCULATION (Auto Centered Photo)
    const getPhotoLayout = useCallback(() => {
        const selfie = selfieImgRef.current;
        if (!selfie) return null;

        const { BOX_X: boxX, BOX_Y: boxY, BOX_WIDTH: boxW, BOX_HEIGHT: boxH } = FRAME_CONFIG;

        const scale = Math.max(boxW / selfie.width, boxH / selfie.height);
        const drawW = selfie.width * scale;
        const drawH = selfie.height * scale;

        const drawX = boxX + (boxW - drawW) / 2;
        const drawY = boxY + (boxH - drawH) / 2;

        return { boxX, boxY, boxW, boxH, drawW, drawH, drawX, drawY };
    }, []);

    // CANVAS DRAWING
    const drawCanvas = useCallback(() => {
        const canvas = previewCanvasRef.current;
        if (!canvas || !selfieImgRef.current || !frameImgRef.current) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { CANVAS_WIDTH: canvasW, CANVAS_HEIGHT: canvasH, BOX_RADIUS: radius } = FRAME_CONFIG;

        if (canvas.width !== canvasW) canvas.width = canvasW;
        if (canvas.height !== canvasH) canvas.height = canvasH;

        ctx.clearRect(0, 0, canvasW, canvasH);

        const layout = getPhotoLayout();
        if (!layout) return;

        const { boxX, boxY, boxW, boxH, drawW, drawH, drawX, drawY } = layout;

        // STEP 1: PHOTO CLIPPING
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, radius);
        ctx.clip();
        ctx.drawImage(selfieImgRef.current, drawX, drawY, drawW, drawH);
        ctx.restore();

        // STEP 2: FRAME PNG
        ctx.drawImage(frameImgRef.current, 0, 0, canvasW, canvasH);

        // STEP 3: NAME OVERLAY (Anek Devanagari Font)
        const nameText = fullName.trim();
        let nameBoxBottomY = boxY + boxH - 20;

        if (nameText) {
            const fontSize = Math.round(canvasW * 0.048);
            ctx.save();
            ctx.font = `800 ${fontSize}px "Anek Devanagari", sans-serif`;

            const textMetrics = ctx.measureText(nameText);
            const textWidth = textMetrics.width;
            const paddingX = canvasW * 0.05;
            const paddingY = canvasH * 0.008;

            const nameBoxW = textWidth + paddingX * 2;
            const nameBoxH = fontSize + paddingY * 2;
            const nameBoxX = (canvasW - nameBoxW) / 2;
            const nameBoxY = boxY + boxH - nameBoxH / 2 - 15;

            nameBoxBottomY = nameBoxY + nameBoxH;

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.roundRect(nameBoxX, nameBoxY, nameBoxW, nameBoxH, 10);
            ctx.fill();

            ctx.strokeStyle = "#e65100";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#7a2d00";
            ctx.fillText(nameText, canvasW / 2, nameBoxY + nameBoxH / 2 + 7);
            ctx.restore();
        }

        // STEP 4: UNIQUE ID OVERLAY (BELOW NAME WITH WHITE PATCH)
        if (uniqueId) {
            const idText = `ID: ${uniqueId}`;
            const fontSize = Math.round(canvasW * 0.030);

            ctx.save();
            ctx.font = `bold ${fontSize}px Arial, sans-serif`;

            const textMetrics = ctx.measureText(idText);
            const textWidth = textMetrics.width;
            const paddingX = 12;
            const paddingY = 5;

            const patchWidth = textWidth + paddingX * 2;
            const patchHeight = fontSize + paddingY * 2;

            const patchX = (canvasW - patchWidth) / 2;
            const patchY = nameBoxBottomY + 8; // नामाच्या व्हाईट बॉक्सच्या खाली

            // ID चा व्हाईट बॅकग्राउंड पॅच
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.roundRect(patchX, patchY, patchWidth, patchHeight, 8);
            ctx.fill();

            // पॅचची ऑरेंज बॉर्डर
            ctx.strokeStyle = "#f97316";
            ctx.lineWidth = 1;
            ctx.stroke();

            // ID टेक्स्ट
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#5C2C16";
            ctx.fillText(idText, canvasW / 2, patchY + patchHeight / 2);

            ctx.restore();
        }
    }, [fullName, uniqueId, getPhotoLayout]);

    // LOAD IMAGES
    useEffect(() => {
        if (!selfieDataUrl) return;

        const framePath = encodeURI(`/share image.png?v=${Date.now()}`);

        Promise.all([loadImage(selfieDataUrl), loadImage(framePath)])
            .then(([selfieImg, frameImg]) => {
                selfieImgRef.current = selfieImg;
                frameImgRef.current = frameImg;
                drawCanvas();
            })
            .catch((err) => console.error("Image load error:", err));
    }, [selfieDataUrl, drawCanvas]);

    // DOWNLOAD PHOTO
    const downloadPhoto = () => {
        const canvas = previewCanvasRef.current;
        if (!canvas) return;

        setSaving(true);
        try {
            const safeName = fullName.trim().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "");
            const imageData = canvas.toDataURL("image/jpeg", 0.95);

            const link = document.createElement("a");
            link.href = imageData;
            link.download = `GanpatiUtsav_${safeName || "Participant"}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download error:", error);
        } finally {
            setSaving(false);
        }
    };

    // SHARE PHOTO
    const sharePhoto = async () => {
        const canvas = previewCanvasRef.current;
        if (!canvas) return;

        try {
            setSharing(true);
            const imageData = canvas.toDataURL("image/jpeg", 0.95);
            const res = await fetch(imageData);
            const blob = await res.blob();
            const file = new File([blob], "GanpatiUtsav.jpg", { type: "image/jpeg" });

            const shareText = `गणपती बाप्पा मोरया 🙏\n\n${fullName} यांनी गणपती उत्सवातील आपला खास क्षण नोंदवला आहे.\n\nUnique ID: ${uniqueId}\n\nनवीन सहभागासाठी नोंदणी करा:\n${FORM_LINK}`;

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: "गणपती उत्सव",
                    text: shareText,
                    files: [file],
                });
                return;
            }

            window.open("https://wa.me/?text=" + encodeURIComponent(shareText), "_blank");
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
                            {uniqueId && <p className="mt-1 text-sm font-semibold text-orange-600">ID: {uniqueId}</p>}
                        </div>

                        <div className="space-y-4">
                            <div className="relative flex justify-center">
                                <canvas
                                    ref={previewCanvasRef}
                                    className="w-[340px] max-w-full rounded-2xl border-4 border-orange-400 bg-white shadow-2xl"
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={downloadPhoto}
                                    disabled={saving}
                                    className="rounded-xl bg-orange-600 px-5 py-3.5 font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50"
                                >
                                    {saving ? "जतन होत आहे..." : "⬇️ इमेज जतन करा"}
                                </button>

                                <button
                                    type="button"
                                    onClick={sharePhoto}
                                    disabled={sharing}
                                    className="rounded-xl border border-orange-300 bg-white px-5 py-3.5 font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                                >
                                    {sharing ? "Share होत आहे..." : "↗️ इमेज Share करा"}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={onReset}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 font-semibold text-gray-700 hover:bg-gray-100"
                            >
                                पुन्हा नोंदणी करा
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
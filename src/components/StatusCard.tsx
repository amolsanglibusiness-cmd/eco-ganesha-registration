"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

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
    const [downloading, setDownloading] = useState(false);
    const [uniqueId, setUniqueId] = useState("");

    // Drag States
    const [photoOffsetY, setPhotoOffsetY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [canDrag, setCanDrag] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const selfieImgRef = useRef<HTMLImageElement | null>(null);
    const frameImgRef = useRef<HTMLImageElement | null>(null);

    const boxBoundsRef = useRef({ boxX: 0, boxY: 0, boxW: 0, boxH: 0 });

    // Unique ID Generation
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

        setUniqueId(`TB-GAN-${datePart}-${randomPart}`);
    }, []);

    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Image load failed: ${src}`));
            image.src = src;
        });
    };

    const getLayoutConfig = (canvasW: number, canvasH: number) => {
        return {
            boxX: canvasW * 0.08,
            boxY: canvasH * 0.28,
            boxW: canvasW * 0.84,
            boxH: canvasH * 0.52,
        };
    };

    // FAST RENDER CANVAS (इथे toDataURL काढून टाकले आहे)
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const selfie = selfieImgRef.current;
        const frame = frameImgRef.current;

        if (!canvas || !selfie || !frame) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const canvasW = frame.naturalWidth || 1200;
        const canvasH = frame.naturalHeight || 1800;

        if (canvas.width !== canvasW) canvas.width = canvasW;
        if (canvas.height !== canvasH) canvas.height = canvasH;

        const { boxX, boxY, boxW, boxH } = getLayoutConfig(canvasW, canvasH);
        boxBoundsRef.current = { boxX, boxY, boxW, boxH };

        const imgRatio = selfie.width / selfie.height;
        const boxRatio = boxW / boxH;

        const isTall = imgRatio < boxRatio;
        setCanDrag(isTall);

        let drawW = boxW;
        let drawH = boxH;
        let drawX = boxX;

        if (isTall) {
            drawH = boxW / imgRatio;
            drawX = boxX;
        } else {
            drawW = boxH * imgRatio;
            drawX = boxX + (boxW - drawW) / 2;
        }

        const minOffsetY = boxH - drawH;
        const maxOffsetY = 0;
        const clampedOffsetY = isTall
            ? Math.max(minOffsetY, Math.min(maxOffsetY, photoOffsetY))
            : 0;

        const drawY = boxY + (isTall ? clampedOffsetY : (boxH - drawH) / 2);

        // 1. Clear
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 2. Selfie Image Clip & Draw
        ctx.save();
        ctx.beginPath();
        ctx.rect(boxX, boxY, boxW, boxH);
        ctx.clip();
        ctx.drawImage(selfie, drawX, drawY, drawW, drawH);
        ctx.restore();

        // 3. Frame
        ctx.drawImage(frame, 0, 0, canvasW, canvasH);

        // 4. Name Box
        const nameText = fullName.trim();
        const fontSize = Math.round(canvasW * 0.042);
        ctx.save();
        ctx.font = `bold ${fontSize}px Arial, Noto Sans Devanagari, sans-serif`;

        const nameWidth = ctx.measureText(nameText).width;
        const paddingX = canvasW * 0.05;
        const paddingY = canvasH * 0.012;
        const nameBoxW = nameWidth + paddingX * 2;
        const nameBoxH = fontSize + paddingY * 2;

        const nameBoxX = (canvasW - nameBoxW) / 2;
        const nameBoxY = canvasH * 0.81 - nameBoxH / 2;

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(nameBoxX, nameBoxY, nameBoxW, nameBoxH, 12);
        ctx.fill();

        ctx.strokeStyle = "#e65100";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#7a2d00";
        ctx.fillText(nameText, canvasW / 2, canvasH * 0.81);
        ctx.restore();

        // 5. Unique ID Box
        if (uniqueId) {
            const idText = `ID: ${uniqueId}`;
            const idFontSize = Math.round(canvasW * 0.032);

            ctx.save();
            ctx.font = `bold ${idFontSize}px Arial, sans-serif`;
            const idWidth = ctx.measureText(idText).width;

            const idBoxW = idWidth + 32;
            const idBoxH = idFontSize + 16;
            const idBoxX = (canvasW - idBoxW) / 2;
            const idBoxY = nameBoxY + nameBoxH + 12;

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.roundRect(idBoxX, idBoxY, idBoxW, idBoxH, 8);
            ctx.fill();

            ctx.strokeStyle = "#f97316";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#5C2C16";
            ctx.fillText(idText, canvasW / 2, idBoxY + idBoxH / 2);
            ctx.restore();
        }
    }, [fullName, uniqueId, photoOffsetY]);

    useEffect(() => {
        if (!selfieDataUrl || !uniqueId) return;

        const framePath = encodeURI(`/share image.png?v=${Date.now()}`);

        Promise.all([loadImage(selfieDataUrl), loadImage(framePath)])
            .then(([selfieImg, frameImg]) => {
                selfieImgRef.current = selfieImg;
                frameImgRef.current = frameImg;
                renderCanvas();
            })
            .catch((err) => console.error("Load error:", err));
    }, [selfieDataUrl, uniqueId, renderCanvas]);

    useEffect(() => {
        renderCanvas();
    }, [photoOffsetY, renderCanvas]);

    // Touch Controls
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!canDrag) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clickXInCanvas = (e.clientX - rect.left) * scaleX;
        const clickYInCanvas = (e.clientY - rect.top) * scaleY;

        const { boxX, boxY, boxW, boxH } = boxBoundsRef.current;

        const isInsidePhotoBox =
            clickXInCanvas >= boxX &&
            clickXInCanvas <= boxX + boxW &&
            clickYInCanvas >= boxY &&
            clickYInCanvas <= boxY + boxH;

        if (isInsidePhotoBox) {
            setIsDragging(true);
            setStartY(e.clientY);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDragging || !canDrag) return;

        const canvas = canvasRef.current;
        const selfie = selfieImgRef.current;
        if (!canvas || !selfie) return;

        const rect = canvas.getBoundingClientRect();
        const scaleY = canvas.height / rect.height;

        const deltaY = (e.clientY - startY) * scaleY;

        const { boxW, boxH } = boxBoundsRef.current;
        const imgRatio = selfie.width / selfie.height;
        const drawH = boxW / imgRatio;

        const minOffsetY = boxH - drawH;
        const maxOffsetY = 0;

        setPhotoOffsetY((prev) => {
            const nextOffset = prev + deltaY;
            return Math.max(minOffsetY, Math.min(maxOffsetY, nextOffset));
        });

        setStartY(e.clientY);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (isDragging) {
            setIsDragging(false);
            try {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            } catch (err) {
                // ignore
            }
        }
    };

    // FAST BLOB GENERATOR
    const getCanvasBlob = (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (!canvasRef.current) return resolve(null);
            canvasRef.current.toBlob(
                (blob) => resolve(blob),
                "image/jpeg",
                0.85 // 0.85 क्वालिटीमुळे फोटो साईज कमी होऊन लगेच सेव्ह होतो
            );
        });
    };

    // FAST DOWNLOAD
    const downloadPhoto = async () => {
        setDownloading(true);
        const blob = await getCanvasBlob();
        if (!blob) {
            setDownloading(false);
            return;
        }

        const url = URL.createObjectURL(blob);
        const safeName = fullName.trim().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "");
        const link = document.createElement("a");
        link.href = url;
        link.download = `GanpatiUtsav_${safeName || "Participant"}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setDownloading(false);
    };

    // FAST SHARE
    const sharePhoto = async () => {
        setSharing(true);
        const blob = await getCanvasBlob();
        if (!blob) {
            setSharing(false);
            return;
        }

        try {
            const file = new File([blob], "GanpatiUtsav.jpg", { type: "image/jpeg" });

            const shareText = `गणपती बाप्पा मोरया 🙏\n\n${fullName} यांनी गणपती उत्सवातील आपला खास क्षण नोंदवला आहे.\n\nUnique ID: ${uniqueId}\n\nनवीन सहभागासाठी नोंदणी करा:\n${FORM_LINK}`;

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ title: "गणपती उत्सव", text: shareText, files: [file] });
            } else {
                window.open("https://wa.me/?text=" + encodeURIComponent(shareText), "_blank");
            }
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

                        <div className="flex flex-col items-center justify-center">
                            {canDrag && (
                                <p className="mb-2 text-xs font-semibold text-orange-700 bg-orange-100 px-3 py-1 rounded-full animate-pulse">
                                    ↕️ फोटो वर-खाली सेट करण्यासाठी फोटोच्या चौकटीवर ड्रॅग करा
                                </p>
                            )}

                            <div className="relative overflow-hidden rounded-2xl border-4 border-orange-100 shadow-lg">
                                <canvas
                                    ref={canvasRef}
                                    style={{ touchAction: "pan-y" }}
                                    className={`h-auto max-h-[60vh] w-full max-w-md object-contain ${canDrag ? "cursor-grab active:cursor-grabbing" : ""
                                        }`}
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerCancel={handlePointerUp}
                                />
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 pt-2">
                            <button
                                onClick={downloadPhoto}
                                disabled={downloading}
                                className="rounded-xl bg-orange-600 px-5 py-3.5 font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50"
                            >
                                {downloading ? "जतन होत आहे..." : "⬇️ इमेज जतन करा"}
                            </button>
                            <button
                                onClick={sharePhoto}
                                disabled={sharing}
                                className="rounded-xl border border-orange-300 bg-white px-5 py-3.5 font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                            >
                                {sharing ? "Share होत आहे..." : "↗️ इमेज Share करा"}
                            </button>
                        </div>

                        <button
                            onClick={onReset}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 font-semibold text-gray-700 hover:bg-gray-100"
                        >
                            पुन्हा नोंदणी करा!
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
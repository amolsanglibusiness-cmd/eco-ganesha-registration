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

    // DRAG STATES
    const [photoOffsetY, setPhotoOffsetY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [canDrag, setCanDrag] = useState(false);

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

    // LAYOUT CALCULATION
    const getPhotoLayout = useCallback(() => {
        const selfie = selfieImgRef.current;
        if (!selfie) return null;

        const { BOX_X: boxX, BOX_Y: boxY, BOX_WIDTH: boxW, BOX_HEIGHT: boxH } = FRAME_CONFIG;

        const scale = Math.max(boxW / selfie.width, boxH / selfie.height);
        const drawW = selfie.width * scale;
        const drawH = selfie.height * scale;

        const isOverflowing = drawH > boxH + 2;

        if (canDrag !== isOverflowing) {
            setCanDrag(isOverflowing);
        }

        const drawX = boxX + (boxW - drawW) / 2;

        const minOffsetY = boxH - drawH;
        const maxOffsetY = 0;
        const clampedOffsetY = isOverflowing
            ? Math.max(minOffsetY, Math.min(maxOffsetY, photoOffsetY))
            : (boxH - drawH) / 2;

        const drawY = boxY + (isOverflowing ? clampedOffsetY : (boxH - drawH) / 2);

        return { boxX, boxY, boxW, boxH, drawW, drawH, drawX, drawY };
    }, [photoOffsetY, canDrag]);

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

        // STEP 3: NAME OVERLAY
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

        // STEP 4: UNIQUE ID OVERLAY
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
            const patchY = nameBoxBottomY + 8;

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.roundRect(patchX, patchY, patchWidth, patchHeight, 8);
            ctx.fill();

            ctx.strokeStyle = "#f97316";
            ctx.lineWidth = 1;
            ctx.stroke();

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

    // UPDATE CANVAS ON OFFSET CHANGE
    useEffect(() => {
        drawCanvas();
    }, [photoOffsetY, drawCanvas]);

    // STRICT DRAG HANDLER (ONLY BLACK FRAME AREA)
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!canDrag) return;

        const canvas = previewCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        // Canvas Ratio नुसार X आणि Y स्थान शोधणे
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clickXCanvas = (e.clientX - rect.left) * scaleX;
        const clickYCanvas = (e.clientY - rect.top) * scaleY;

        const { BOX_X: boxX, BOX_Y: boxY, BOX_WIDTH: boxW, BOX_HEIGHT: boxH } = FRAME_CONFIG;

        // X आणि Y दोन्ही अक्षांची तपासणी (फक्त काळ्या चौकटीतच क्लिक चालू होईल)
        const isInsideBlackBox =
            clickXCanvas >= boxX &&
            clickXCanvas <= boxX + boxW &&
            clickYCanvas >= boxY &&
            clickYCanvas <= boxY + boxH;

        if (isInsideBlackBox) {
            setIsDragging(true);
            setStartY(e.clientY);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDragging || !canDrag) return;

        const canvas = previewCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleY = canvas.height / rect.height;
        const deltaY = (e.clientY - startY) * scaleY;

        setPhotoOffsetY((prev) => prev + deltaY);
        setStartY(e.clientY);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (isDragging) {
            setIsDragging(false);
            try {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            } catch (err) { }
        }
    };

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

            const shareText = `गणपती बाप्पा मोरया 🙏\n\n` +
                `${fullName} यांनी गणपती उत्सवातील आपला खास क्षण नोंदवला आहे.\n\n` +
                `दैनिक तरुण भारत संवादच्या निर्माल्य संकलन मोहिमेत सहभागी विद्यार्थी आणि घरगुती गणपती सजावट स्पर्धेत सहभाग घेतलेल्या महिलांनी येथे फोटो आणि माहिती अपलोड करा आणि मिळवा आकर्षक सेल्फी स्टेटस.\n\n` +
                `Unique ID: ${uniqueId}\n\n` +
                `🚩 **विशेष सूचना** 🚩\n\n` +
                `👩‍🦰 **महिलांसाठी:**\n` +
                `• महिलांनी आपले सजावटीचे अर्धा किंवा एक मिनिटांचे व्हिडिओ नाव व पत्त्यासह 9325403234 या नंबरवर व्हॉट्सॲप करावेत.\n` +
                `• (लकी ड्रॉ मधून सहभागी पाच महिलांना अशोक मिल्स कडून पैठणी + ५०० महिलांना सोनरूपम जेम्स अँड ज्वेलरी तर्फे आकर्षक गिफ्ट + हॉटेल उत्कर्ष पॅलेस तर्फे आकर्षक योजना कुपन)\n\n` +
                `👦 **विद्यार्थ्यांसाठी:**\n` +
                `• विद्यार्थ्यांनीही गणेश विसर्जनानंतर निर्माल्य कुंडात सोपवून 9325403226 या नंबरवर आपले नाव, पत्ता व व्हॉट्सॲप नंबर पाठवा. कूपन आपल्या शाळेत ठेवलेल्या बॉक्समध्ये जमा करा.\n` +
                `• सहभागी सर्व मुलांना बाल पर्यावरण दूत पुरस्कार वजा प्रमाणपत्र आणि लकी ड्रॉ मधून आलेल्या दीडशे लकी विजेत्यांना आकर्षक भेटवस्तू मिळेल.\n\n` +
                `नवा सहभाग नोंदवण्यासाठी लिंकवर क्लिक करा:\n${FORM_LINK}`;

            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, "image/jpeg", 0.95)
            );

            if (!blob) throw new Error("Blob creation failed");

            const file = new File([blob], `GanpatiUtsav_${Date.now()}.jpg`, { type: "image/jpeg" });

            if (
                navigator.canShare &&
                navigator.canShare({ files: [file] }) &&
                navigator.share
            ) {
                await navigator.share({
                    title: "गणपती उत्सव",
                    text: shareText,
                    files: [file],
                });
                return;
            }

            downloadPhoto();
            setTimeout(() => {
                alert("तुमची फोटो इमेज डाउनलोड झाली आहे. आता ती WhatsApp वर शेअर करा!");
                window.open("https://wa.me/?text=" + encodeURIComponent(shareText), "_blank");
            }, 800);

        } catch (error: any) {
            if (error.name !== "AbortError") {
                console.error("Share error:", error);
                downloadPhoto();
                window.open("https://wa.me/?text=" + encodeURIComponent(shareText), "_blank");
            }
        } finally {
            setSharing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50 px-2 py-4 sm:px-4 sm:py-6 select-none flex items-center justify-center">
            <div className="w-full max-w-sm">
                <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-lg">

                    {/* Header: दोन ओळींचा मेसेज */}
                    <div className="bg-gradient-to-r from-orange-600 to-amber-500 px-3 py-3 text-center text-white flex items-center justify-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                            ✓
                        </div>
                        <div className="text-left leading-tight">
                            <h1 className="text-base font-bold">नोंदणी यशस्वी!</h1>
                            <h1 className="text-xs font-medium text-orange-100">आपले कार्ड शेअर करा</h1>
                        </div>
                    </div>

                    <div className="space-y-3 p-3">
                        <div className="text-center">
                            <h2 className="text-base font-bold text-gray-900 leading-tight">{fullName}</h2>
                            {uniqueId && <p className="text-xs font-semibold text-orange-600 mt-0.5">ID: {uniqueId}</p>}
                        </div>

                        <div className="space-y-3">
                            <div className="relative flex flex-col items-center justify-center">
                                {canDrag && (
                                    <p className="mb-1.5 text-[11px] font-semibold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full animate-pulse">
                                        ↕️ फोटो ॲडजस्ट करण्यासाठी वर-खाली ड्रॅग करा
                                    </p>
                                )}

                                <canvas
                                    ref={previewCanvasRef}
                                    style={{ touchAction: "none" }}
                                    className={`w-[260px] max-w-full rounded-xl border-2 border-orange-400 bg-white shadow-md ${canDrag ? "cursor-grab active:cursor-grabbing" : ""
                                        }`}
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerCancel={handlePointerUp}
                                />
                            </div>

                            <div className="grid gap-2 grid-cols-2">
                                <button
                                    type="button"
                                    onClick={downloadPhoto}
                                    disabled={saving}
                                    className="rounded-lg bg-orange-600 px-2 py-2.5 text-xs font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50"
                                >
                                    {saving ? "जतन होत आहे..." : "⬇️ जतन करा"}
                                </button>

                                <button
                                    type="button"
                                    onClick={sharePhoto}
                                    disabled={sharing}
                                    className="rounded-lg border border-orange-300 bg-white px-2 py-2.5 text-xs font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                                >
                                    {sharing ? "Share होत आहे..." : "↗️ Share करा"}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={onReset}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
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
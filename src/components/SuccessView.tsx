"use client";

import React, { useEffect, useState } from "react";

interface SuccessViewProps {
    fullName: string;
    selfieDataUrl: string;
    onReset: () => void;
}

const FORM_LINK =
    "https://www.sanglibusiness.in/p/tarunbharat.html";

export default function SuccessView({
    fullName,
    selfieDataUrl,
    onReset,
}: SuccessViewProps) {
    const [sharing, setSharing] = useState(false);
    const [statusImage, setStatusImage] = useState("");
    const [uniqueId, setUniqueId] = useState("");
    const [creatingImage, setCreatingImage] = useState(true);

    /*
     * Unique ID
     * Example:
     * TB-GAN-260913-A8F2
     */
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

    /*
     * File name
     */
    const getFileName = () => {
        const safeName = fullName
            .trim()
            .replace(/[^\p{L}\p{N}]+/gu, "_")
            .replace(/^_+|_+$/g, "");

        return `GanpatiUtsav_${safeName || "Participant"}.jpg`;
    };

    /*
     * Image load helper
     */
    const loadImage = (
        src: string
    ): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const image = new Image();

            image.onload = () => {
                resolve(image);
            };

            image.onerror = () => {
                reject(
                    new Error(
                        `Image load failed: ${src}`
                    )
                );
            };

            image.src = src;
        });
    };

    /*
     * Create Final Status Image
     *
     * IMPORTANT:
     * Registration link is NOT added
     * inside the generated image.
     */
    const createStatusImage = async (): Promise<string> => {
        if (!selfieDataUrl) {
            throw new Error(
                "Selfie image not available."
            );
        }

        if (!uniqueId) {
            throw new Error(
                "Unique ID not ready."
            );
        }

        /*
         * Header
         */
        const headerImage =
            await loadImage(
                "/ganpati-header.png"
            );

        /*
         * Selfie
         */
        const selfieImage =
            await loadImage(
                selfieDataUrl
            );

        /*
         * Canvas
         *
         * Final image:
         * 1200 × 1800
         */
        const canvas =
            document.createElement(
                "canvas"
            );

        const ctx =
            canvas.getContext("2d");

        if (!ctx) {
            throw new Error(
                "Canvas उपलब्ध नाही."
            );
        }

        const canvasWidth = 1200;
        const canvasHeight = 1800;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        /*
         * Background
         */
        const gradient =
            ctx.createLinearGradient(
                0,
                0,
                0,
                canvasHeight
            );

        gradient.addColorStop(
            0,
            "#fff9ef"
        );

        gradient.addColorStop(
            1,
            "#fff0d2"
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
            0,
            0,
            canvasWidth,
            canvasHeight
        );

        /*
         * Outer Border
         */
        ctx.strokeStyle =
            "#e58a19";

        ctx.lineWidth = 10;

        ctx.strokeRect(
            5,
            5,
            canvasWidth - 10,
            canvasHeight - 10
        );

        /*
         * =========================
         * HEADER IMAGE
         * =========================
         */

        const headerHeight = 500;

        ctx.drawImage(
            headerImage,
            0,
            0,
            canvasWidth,
            headerHeight
        );

        /*
         * Header separator
         */
        ctx.fillStyle =
            "#e58a19";

        ctx.fillRect(
            0,
            headerHeight,
            canvasWidth,
            8
        );

        /*
         * =========================
         * SELFIE
         * =========================
         */

        const selfieAreaX = 70;
        const selfieAreaY = 550;
        const selfieAreaWidth = 1060;
        const selfieAreaHeight = 850;

        /*
         * Selfie background
         */
        ctx.fillStyle =
            "#ffffff";

        ctx.beginPath();

        ctx.roundRect(
            selfieAreaX,
            selfieAreaY,
            selfieAreaWidth,
            selfieAreaHeight,
            30
        );

        ctx.fill();

        /*
         * Selfie border
         */
        ctx.strokeStyle =
            "#f0b44c";

        ctx.lineWidth = 5;

        ctx.beginPath();

        ctx.roundRect(
            selfieAreaX,
            selfieAreaY,
            selfieAreaWidth,
            selfieAreaHeight,
            30
        );

        ctx.stroke();

        /*
         * Selfie ratio
         */
        const imageRatio =
            selfieImage.width /
            selfieImage.height;

        const boxRatio =
            selfieAreaWidth /
            selfieAreaHeight;

        let drawWidth =
            selfieAreaWidth;

        let drawHeight =
            selfieAreaHeight;

        let drawX =
            selfieAreaX;

        let drawY =
            selfieAreaY;

        if (
            imageRatio >
            boxRatio
        ) {
            drawHeight =
                selfieAreaHeight;

            drawWidth =
                drawHeight *
                imageRatio;

            drawX =
                selfieAreaX +
                (
                    selfieAreaWidth -
                    drawWidth
                ) /
                2;
        } else {
            drawWidth =
                selfieAreaWidth;

            drawHeight =
                drawWidth /
                imageRatio;

            drawY =
                selfieAreaY +
                (
                    selfieAreaHeight -
                    drawHeight
                ) /
                2;
        }

        /*
         * Clip selfie
         */
        ctx.save();

        ctx.beginPath();

        ctx.roundRect(
            selfieAreaX,
            selfieAreaY,
            selfieAreaWidth,
            selfieAreaHeight,
            30
        );

        ctx.clip();

        ctx.drawImage(
            selfieImage,
            drawX,
            drawY,
            drawWidth,
            drawHeight
        );

        ctx.restore();

        /*
         * =========================
         * NAME
         * =========================
         */

        ctx.textAlign =
            "center";

        ctx.fillStyle =
            "#7a2d00";

        ctx.font =
            "bold 48px Arial, Noto Sans Devanagari, sans-serif";

        ctx.fillText(
            fullName.trim(),
            canvasWidth / 2,
            1480
        );

        /*
         * =========================
         * UNIQUE ID
         * =========================
         */

        ctx.fillStyle =
            "#555555";

        ctx.font =
            "bold 30px Arial, sans-serif";

        ctx.fillText(
            `ID : ${uniqueId}`,
            canvasWidth / 2,
            1540
        );

        /*
         * =========================
         * BOTTOM MESSAGE
         * =========================
         *
         * NO URL
         * NO QR CODE
         */

        ctx.fillStyle =
            "#d97706";

        ctx.font =
            "bold 34px Arial, Noto Sans Devanagari, sans-serif";

        ctx.fillText(
            "गणपती बाप्पा मोरया 🙏",
            canvasWidth / 2,
            1660
        );

        /*
         * Small festive line
         */
        ctx.fillStyle =
            "#a16207";

        ctx.font =
            "24px Arial, Noto Sans Devanagari, sans-serif";

        ctx.fillText(
            "श्री गणेश उत्सव",
            canvasWidth / 2,
            1710
        );

        /*
         * Convert to JPEG
         */
        return canvas.toDataURL(
            "image/jpeg",
            0.92
        );
    };

    /*
     * Generate final image
     */
    useEffect(() => {
        if (
            !selfieDataUrl ||
            !uniqueId
        ) {
            return;
        }

        let cancelled = false;

        const generate =
            async () => {
                try {
                    setCreatingImage(
                        true
                    );

                    const image =
                        await createStatusImage();

                    if (!cancelled) {
                        setStatusImage(
                            image
                        );
                    }
                } catch (error) {
                    console.error(
                        "Status image creation error:",
                        error
                    );

                    if (!cancelled) {
                        alert(
                            "स्टेटस इमेज तयार करता आली नाही. कृपया पुन्हा प्रयत्न करा."
                        );
                    }
                } finally {
                    if (!cancelled) {
                        setCreatingImage(
                            false
                        );
                    }
                }
            };

        generate();

        return () => {
            cancelled = true;
        };
    }, [
        selfieDataUrl,
        uniqueId,
        fullName,
    ]);

    /*
     * =========================
     * DOWNLOAD
     * =========================
     */

    const downloadPhoto = () => {
        if (!statusImage) {
            alert(
                "इमेज तयार होत आहे. कृपया थोडा वेळ थांबा."
            );

            return;
        }

        const link =
            document.createElement(
                "a"
            );

        link.href =
            statusImage;

        link.download =
            getFileName();

        document.body.appendChild(
            link
        );

        link.click();

        document.body.removeChild(
            link
        );
    };

    /*
     * Data URL → Blob
     */
    const dataUrlToBlob = async (
        dataUrl: string
    ): Promise<Blob> => {
        const response =
            await fetch(dataUrl);

        return response.blob();
    };

    /*
     * =========================
     * SHARE
     * =========================
     *
     * Share:
     * 1. Final Image
     * 2. Registration Link
     *
     * Link is NOT inside image.
     */

    const sharePhoto = async () => {
        if (!statusImage) {
            alert("इमेज तयार होत आहे. कृपया थोडा वेळ थांबा.");
            return;
        }

        try {
            setSharing(true);

            const blob = await dataUrlToBlob(statusImage);

            const file = new File(
                [blob],
                getFileName(),
                {
                    type: "image/jpeg",
                }
            );

            const shareText =
                `गणपती बाप्पा मोरया 🙏\n\n` +
                `${fullName} यांनी गणपती उत्सवातील आपला खास क्षण नोंदवला आहे.\n\n` +
                `Unique ID: ${uniqueId}\n\n` +
                `नवीन सहभागासाठी नोंदणी करा:\n` +
                `${FORM_LINK}`;

            // ---------------------------------------
            // 1. Image + Text + Link Share
            // ---------------------------------------
            if (
                navigator.share &&
                navigator.canShare &&
                navigator.canShare({
                    files: [file],
                })
            ) {
                await navigator.share({
                    title: "गणपती उत्सव",
                    text: shareText,
                    files: [file],
                });

                return;
            }

            // ---------------------------------------
            // 2. Text + Link Share
            // ---------------------------------------
            if (navigator.share) {
                await navigator.share({
                    title: "गणपती उत्सव",
                    text: shareText,
                });

                return;
            }

            // ---------------------------------------
            // 3. Desktop / Unsupported Browser
            // ---------------------------------------
            const whatsappText =
                `गणपती बाप्पा मोरया 🙏\n\n` +
                `${fullName} यांनी गणपती उत्सवातील आपला खास क्षण नोंदवला आहे.\n\n` +
                `नवीन सहभागासाठी नोंदणी करा:\n` +
                `${FORM_LINK}`;

            const whatsappUrl =
                "https://wa.me/?text=" +
                encodeURIComponent(whatsappText);

            window.open(
                whatsappUrl,
                "_blank",
                "noopener,noreferrer"
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

                            {uniqueId && (
                                <p className="mt-1 text-sm font-semibold text-orange-600">
                                    ID: {uniqueId}
                                </p>
                            )}

                        </div>

                        {/* Final Generated Image */}
                        <div className="flex justify-center">

                            {statusImage ? (
                                <div className="overflow-hidden rounded-2xl border-4 border-orange-100 bg-orange-50 shadow-lg">

                                    <img
                                        src={statusImage}
                                        alt="गणपती उत्सवासाठी तयार केलेली इमेज"
                                        className="h-auto max-h-[720px] w-full max-w-md object-contain"
                                    />

                                </div>
                            ) : (
                                <div className="flex min-h-[320px] w-full max-w-md items-center justify-center rounded-2xl border border-orange-100 bg-orange-50">

                                    <div className="text-center">

                                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />

                                        <p className="text-sm font-medium text-gray-600">
                                            {creatingImage
                                                ? "तुमची इमेज तयार होत आहे..."
                                                : "इमेज उपलब्ध नाही."}
                                        </p>

                                    </div>

                                </div>
                            )}

                        </div>

                        {/* Share Information */}
                        {statusImage && (
                            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-center">

                                <p className="text-sm font-bold text-orange-800">
                                    इमेज Share करताना नोंदणी लिंकही पाठवली जाईल.
                                </p>

                                <p className="mt-2 break-all text-xs text-gray-500">
                                    {FORM_LINK}
                                </p>

                            </div>
                        )}

                        {/* Actions */}
                        <div className="grid gap-3 sm:grid-cols-2">

                            <button
                                type="button"
                                onClick={downloadPhoto}
                                disabled={!statusImage}
                                className="rounded-xl bg-orange-600 px-5 py-3.5 font-bold text-white shadow-md transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                ⬇️ इमेज जतन करा
                            </button>

                            <button
                                type="button"
                                onClick={sharePhoto}
                                disabled={
                                    sharing ||
                                    !statusImage
                                }
                                className="rounded-xl border border-orange-300 bg-white px-5 py-3.5 font-bold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {sharing
                                    ? "Share होत आहे..."
                                    : "↗️ इमेज Share करा"}
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
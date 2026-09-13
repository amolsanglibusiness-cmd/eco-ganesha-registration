"use client";

import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
} from "react";

interface SuccessViewProps {
    fullName: string;
    selfieDataUrl: string;
    onReset: () => void;
    onSaveToDrive?: (originalPhoto: string) => void;
}

const FORM_LINK =
    "https://www.sanglibusiness.in/p/tarunbharat.html";

/*
 * share image.png ची रचना 576 × 1024 आहे.
 *
 * फोटो बसवायची जागा:
 * X = 24
 * Y = 442
 * Width = 528
 * Height = 382
 */
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

    // Animated hand दाखवायचा की नाही
    const [showDragHint, setShowDragHint] = useState(true);

    // --------------------------------------------------
    // PHOTO POSITION
    // --------------------------------------------------

    /*
     * फोटोची vertical position.
     *
     * 0 = फ्रेमच्या वरची position
     * Negative = फोटो वर
     * Positive = फोटो खाली
     */
    const posYRef = useRef(0);

    const previewCanvasRef =
        useRef<HTMLCanvasElement | null>(null);

    // --------------------------------------------------
    // DRAG REFERENCES
    // --------------------------------------------------

    const isDragging = useRef(false);

    // Drag सुरू करतानाची screen Y position
    const dragStartClientY = useRef(0);

    // Drag सुरू करतानाची फोटो position
    const dragStartPosY = useRef(0);

    // --------------------------------------------------
    // IMAGE REFERENCES
    // --------------------------------------------------

    const selfieImgRef =
        useRef<HTMLImageElement | null>(null);

    const frameImgRef =
        useRef<HTMLImageElement | null>(null);

    // --------------------------------------------------
    // UNIQUE ID
    // --------------------------------------------------

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

        const id =
            `TB-GAN-${datePart}-${randomPart}`;

        setUniqueId(id);

        if (
            onSaveToDrive &&
            selfieDataUrl
        ) {
            onSaveToDrive(selfieDataUrl);
        }
    }, [
        selfieDataUrl,
        onSaveToDrive,
    ]);

    // --------------------------------------------------
    // IMAGE LOADER
    // --------------------------------------------------

    const loadImage = (
        src: string
    ): Promise<HTMLImageElement> => {
        return new Promise(
            (resolve, reject) => {
                const image =
                    new Image();

                image.crossOrigin =
                    "anonymous";

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
            }
        );
    };

    // --------------------------------------------------
    // PHOTO LAYOUT
    // --------------------------------------------------

    const getPhotoLayout =
        useCallback(() => {
            const selfie =
                selfieImgRef.current;

            if (!selfie) {
                return null;
            }

            const boxX =
                FRAME_CONFIG.BOX_X;

            const boxY =
                FRAME_CONFIG.BOX_Y;

            const boxW =
                FRAME_CONFIG.BOX_WIDTH;

            const boxH =
                FRAME_CONFIG.BOX_HEIGHT;

            /*
             * COVER LOGIC
             *
             * फोटोने फ्रेमचा पूर्ण
             * area भरला पाहिजे.
             *
             * त्यामुळे डावीकडे/उजवीकडे
             * किंवा वर/खाली रिकामी जागा
             * राहणार नाही.
             */
            const scale =
                Math.max(
                    boxW / selfie.width,
                    boxH / selfie.height
                );

            const drawW =
                selfie.width * scale;

            const drawH =
                selfie.height * scale;

            /*
             * फोटो horizontal center मध्ये.
             *
             * म्हणजे फोटोच्या दोन्ही बाजू
             * फ्रेममध्ये व्यवस्थित फिट होतील.
             */
            const drawX =
                boxX +
                (boxW - drawW) / 2;

            /*
             * Vertical movement ची मर्यादा.
             *
             * फोटो फ्रेमच्या वर किंवा
             * खाली पूर्णपणे बाहेर जाणार नाही.
             */
            const minY =
                boxY +
                boxH -
                drawH;

            const maxY =
                boxY;

            return {
                boxX,
                boxY,
                boxW,
                boxH,
                drawW,
                drawH,
                drawX,
                minY,
                maxY,
            };
        }, []);

    // --------------------------------------------------
    // CANVAS DRAW
    // --------------------------------------------------

    const drawCanvas =
        useCallback(() => {
            const canvas =
                previewCanvasRef.current;

            if (
                !canvas ||
                !selfieImgRef.current ||
                !frameImgRef.current
            ) {
                return;
            }

            const ctx =
                canvas.getContext("2d");

            if (!ctx) {
                return;
            }

            const canvasW =
                FRAME_CONFIG.CANVAS_WIDTH;

            const canvasH =
                FRAME_CONFIG.CANVAS_HEIGHT;

            // Canvas fixed size
            if (
                canvas.width !== canvasW
            ) {
                canvas.width =
                    canvasW;
            }

            if (
                canvas.height !== canvasH
            ) {
                canvas.height =
                    canvasH;
            }

            // पूर्ण canvas clear
            ctx.clearRect(
                0,
                0,
                canvasW,
                canvasH
            );

            const layout =
                getPhotoLayout();

            if (!layout) {
                return;
            }

            const {
                boxX,
                boxY,
                boxW,
                boxH,
                drawW,
                drawH,
                drawX,
                minY,
                maxY,
            } = layout;

            // --------------------------------------------------
            // PHOTO POSITION
            // --------------------------------------------------

            const requestedY =
                boxY +
                posYRef.current;

            /*
             * फोटोला frame च्या आतच ठेवणे.
             */
            const drawY =
                Math.min(
                    maxY,
                    Math.max(
                        minY,
                        requestedY
                    )
                );

            /*
             * Actual position ref मध्ये save.
             */
            posYRef.current =
                drawY -
                boxY;

            // --------------------------------------------------
            // STEP 1
            // PHOTO CLIPPING
            // --------------------------------------------------

            ctx.save();

            ctx.beginPath();

            ctx.roundRect(
                boxX,
                boxY,
                boxW,
                boxH,
                FRAME_CONFIG.BOX_RADIUS
            );

            ctx.clip();

            // --------------------------------------------------
            // PHOTO
            // --------------------------------------------------

            ctx.drawImage(
                selfieImgRef.current,
                drawX,
                drawY,
                drawW,
                drawH
            );

            ctx.restore();

            // --------------------------------------------------
            // STEP 2
            // FRAME PNG OVERLAY
            // --------------------------------------------------

            ctx.drawImage(
                frameImgRef.current,
                0,
                0,
                canvasW,
                canvasH
            );

            // --------------------------------------------------
            // STEP 3
            // UNIQUE ID
            // --------------------------------------------------

            if (uniqueId) {
                ctx.save();

                ctx.fillStyle =
                    "#5C2C16";

                ctx.font =
                    `bold ${Math.round(
                        canvasW * 0.032
                    )}px Arial, sans-serif`;

                ctx.textAlign =
                    "left";

                ctx.textBaseline =
                    "alphabetic";

                ctx.fillText(
                    `ID: ${uniqueId}`,
                    canvasW * 0.06,
                    canvasH * 0.045
                );

                ctx.restore();
            }

            // --------------------------------------------------
            // STEP 4
            // NAME OVERLAY
            // --------------------------------------------------

            const nameText =
                fullName.trim();

            if (nameText) {
                const fontSize =
                    Math.round(
                        canvasW * 0.045
                    );

                ctx.save();

                ctx.font =
                    `bold ${fontSize}px Arial, Noto Sans Devanagari, sans-serif`;

                const textMetrics =
                    ctx.measureText(
                        nameText
                    );

                const textWidth =
                    textMetrics.width;

                const paddingX =
                    canvasW * 0.04;

                const paddingY =
                    canvasH * 0.008;

                const nameBoxW =
                    textWidth +
                    paddingX * 2;

                const nameBoxH =
                    fontSize +
                    paddingY * 2;

                const nameBoxX =
                    (canvasW -
                        nameBoxW) /
                    2;

                const nameBoxY =
                    boxY +
                    boxH -
                    nameBoxH / 2 -
                    10;

                // White background
                ctx.fillStyle =
                    "#ffffff";

                ctx.beginPath();

                ctx.roundRect(
                    nameBoxX,
                    nameBoxY,
                    nameBoxW,
                    nameBoxH,
                    10
                );

                ctx.fill();

                // Orange border
                ctx.strokeStyle =
                    "#e65100";

                ctx.lineWidth = 2;

                ctx.stroke();

                // Name
                ctx.textAlign =
                    "center";

                ctx.textBaseline =
                    "middle";

                ctx.fillStyle =
                    "#7a2d00";

                ctx.fillText(
                    nameText,
                    canvasW / 2,
                    nameBoxY +
                    nameBoxH / 2
                );

                ctx.restore();
            }
        }, [
            fullName,
            uniqueId,
            getPhotoLayout,
        ]);

    // --------------------------------------------------
    // LOAD SELFIE + FRAME
    // --------------------------------------------------

    useEffect(() => {
        if (!selfieDataUrl) {
            return;
        }

        // नवीन फोटो आला की hand पुन्हा दाखवा
        setShowDragHint(true);

        const framePath =
            encodeURI(
                `/share image.png?v=${Date.now()}`
            );

        Promise.all([
            loadImage(
                selfieDataUrl
            ),
            loadImage(
                framePath
            ),
        ])
            .then(
                ([
                    selfieImg,
                    frameImg,
                ]) => {
                    selfieImgRef.current =
                        selfieImg;

                    frameImgRef.current =
                        frameImg;

                    /*
                     * फोटो सुरुवातीला
                     * vertical center मध्ये.
                     */
                    const layout =
                        getPhotoLayout();

                    if (layout) {
                        const {
                            boxY,
                            boxH,
                            drawH,
                        } = layout;

                        const centeredY =
                            boxY +
                            (boxH -
                                drawH) /
                            2;

                        posYRef.current =
                            centeredY -
                            boxY;
                    } else {
                        posYRef.current =
                            0;
                    }

                    drawCanvas();
                }
            )
            .catch(
                (error) => {
                    console.error(
                        "Image loading error:",
                        error
                    );
                }
            );
    }, [
        selfieDataUrl,
        getPhotoLayout,
        drawCanvas,
    ]);

    // --------------------------------------------------
    // DRAG START
    // --------------------------------------------------

    const handleMouseDown = (
        e:
            | React.MouseEvent<HTMLCanvasElement>
            | React.TouchEvent<HTMLCanvasElement>
    ) => {
        e.preventDefault();

        /*
         * पहिल्यांदा फोटो touch/drag केला
         * की animated hand गायब.
         */
        setShowDragHint(false);

        isDragging.current =
            true;

        const clientY =
            "touches" in e
                ? e.touches[0]?.clientY
                : e.clientY;

        if (
            typeof clientY !==
            "number"
        ) {
            isDragging.current =
                false;
            return;
        }

        dragStartClientY.current =
            clientY;

        dragStartPosY.current =
            posYRef.current;
    };

    // --------------------------------------------------
    // DRAG MOVE
    // --------------------------------------------------

    const handleMouseMove = (
        e:
            | React.MouseEvent<HTMLCanvasElement>
            | React.TouchEvent<HTMLCanvasElement>
    ) => {
        if (
            !isDragging.current
        ) {
            return;
        }

        e.preventDefault();

        const clientY =
            "touches" in e
                ? e.touches[0]?.clientY
                : e.clientY;

        if (
            typeof clientY !==
            "number"
        ) {
            return;
        }

        const canvas =
            previewCanvasRef.current;

        if (!canvas) {
            return;
        }

        const rect =
            canvas.getBoundingClientRect();

        if (!rect.height) {
            return;
        }

        /*
         * Screen pixels →
         * Canvas pixels
         */
        const scaleY =
            FRAME_CONFIG.CANVAS_HEIGHT /
            rect.height;

        /*
         * User ने किती drag केले
         */
        const deltaY =
            (clientY -
                dragStartClientY.current) *
            scaleY;

        let newPosY =
            dragStartPosY.current +
            deltaY;

        // --------------------------------------------------
        // POSITION LIMIT
        // --------------------------------------------------

        const layout =
            getPhotoLayout();

        if (layout) {
            const {
                boxH,
                drawH,
            } = layout;

            /*
             * Relative position:
             *
             * 0 = वर
             * boxH - drawH = खाली
             */
            const minPosY =
                boxH - drawH;

            const maxPosY = 0;

            newPosY =
                Math.min(
                    maxPosY,
                    Math.max(
                        minPosY,
                        newPosY
                    )
                );
        }

        posYRef.current =
            newPosY;

        requestAnimationFrame(
            drawCanvas
        );
    };

    // --------------------------------------------------
    // DRAG END
    // --------------------------------------------------

    const handleMouseUp = () => {
        isDragging.current =
            false;
    };

    const handleMouseLeave = () => {
        isDragging.current =
            false;
    };

    // --------------------------------------------------
    // DOWNLOAD PHOTO
    // --------------------------------------------------

    const downloadPhoto = () => {
        const canvas =
            previewCanvasRef.current;

        if (!canvas) {
            return;
        }

        setSaving(true);

        try {
            const safeName =
                fullName
                    .trim()
                    .replace(
                        /[^\p{L}\p{N}]+/gu,
                        "_"
                    )
                    .replace(
                        /^_+|_+$/g,
                        ""
                    );

            /*
             * Current edited position
             * final image मध्ये जाईल.
             *
             * Animated hand इथे येणार नाही.
             */
            const imageData =
                canvas.toDataURL(
                    "image/jpeg",
                    0.95
                );

            const link =
                document.createElement(
                    "a"
                );

            link.href =
                imageData;

            link.download =
                `GanpatiUtsav_${safeName ||
                "Participant"
                }.jpg`;

            document.body.appendChild(
                link
            );

            link.click();

            document.body.removeChild(
                link
            );
        } catch (error) {
            console.error(
                "Download error:",
                error
            );
        } finally {
            setSaving(false);
        }
    };

    // --------------------------------------------------
    // SHARE PHOTO
    // --------------------------------------------------

    const sharePhoto = async () => {
        const canvas =
            previewCanvasRef.current;

        if (!canvas) {
            return;
        }

        try {
            setSharing(true);

            /*
             * Current edited position
             * मधील final canvas image.
             */
            const imageData =
                canvas.toDataURL(
                    "image/jpeg",
                    0.95
                );

            const res =
                await fetch(
                    imageData
                );

            const blob =
                await res.blob();

            const file =
                new File(
                    [blob],
                    "GanpatiUtsav.jpg",
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

            // Mobile Web Share API
            if (
                navigator.share &&
                navigator.canShare &&
                navigator.canShare({
                    files: [file],
                })
            ) {
                await navigator.share({
                    title:
                        "गणपती उत्सव",
                    text:
                        shareText,
                    files: [file],
                });

                return;
            }

            // Web Share नसेल तर WhatsApp
            window.open(
                "https://wa.me/?text=" +
                encodeURIComponent(
                    shareText
                ),
                "_blank"
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

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    return (
        <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50 px-3 py-5 sm:px-6 sm:py-10">

            <div className="mx-auto w-full max-w-2xl">

                <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-xl">

                    {/* SUCCESS HEADER */}
                    <div className="bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-7 text-center text-white">

                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl">
                            ✓
                        </div>

                        <h1 className="text-2xl font-bold sm:text-3xl">
                            नोंदणी यशस्वी!
                        </h1>

                    </div>

                    {/* CONTENT */}
                    <div className="space-y-5 p-4 sm:p-7">

                        {/* NAME + ID */}
                        <div className="text-center">

                            <h2 className="text-xl font-bold text-gray-900">
                                {fullName}
                            </h2>

                            {uniqueId && (
                                <p className="mt-1 text-sm font-semibold text-orange-600">
                                    ID: {uniqueId}
                                </p>
                            )}

                        </div>

                        <div className="space-y-4">

                            {/* INSTRUCTION */}
                            <p className="text-center text-xs font-semibold text-orange-800 sm:text-sm">
                                फोटो योग्य जागी सेट करण्यासाठी फोटोवर बोटाने / माऊसने वर-खाली सरकवा
                            </p>

                            {/* ------------------------------------------------
                                MAIN EDITABLE CANVAS
                            ------------------------------------------------ */}

                            <div className="relative flex justify-center">

                                <canvas
                                    ref={
                                        previewCanvasRef
                                    }
                                    className="w-[340px] max-w-full cursor-ns-resize touch-none rounded-2xl border-4 border-orange-400 bg-white shadow-2xl active:border-orange-600"
                                    onMouseDown={
                                        handleMouseDown
                                    }
                                    onMouseMove={
                                        handleMouseMove
                                    }
                                    onMouseUp={
                                        handleMouseUp
                                    }
                                    onMouseLeave={
                                        handleMouseLeave
                                    }
                                    onTouchStart={
                                        handleMouseDown
                                    }
                                    onTouchMove={
                                        handleMouseMove
                                    }
                                    onTouchEnd={
                                        handleMouseUp
                                    }
                                    onTouchCancel={
                                        handleMouseUp
                                    }
                                />

                                {/* ------------------------------------------------
                                    ANIMATED HAND GUIDE
                                ------------------------------------------------ */}

                                {showDragHint && (
                                    <div
                                        className="pointer-events-none absolute inset-0 flex items-center justify-center"
                                        aria-hidden="true"
                                    >

                                        <div className="flex flex-col items-center">

                                            {/* Animated Hand */}
                                            <div
                                                className="select-none text-6xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)] sm:text-7xl"
                                                style={{
                                                    animation:
                                                        "dragHand 1.2s ease-in-out infinite",
                                                }}
                                            >
                                                👆
                                            </div>

                                            {/* Hint Text */}
                                            <div
                                                className="mt-2 rounded-full bg-black/65 px-4 py-1.5 text-xs font-bold text-white shadow-lg"
                                            >
                                                वर ↕️ खाली सरकवा
                                            </div>

                                        </div>

                                    </div>
                                )}

                            </div>

                            {/* ------------------------------------------------
                                SAVE + SHARE
                            ------------------------------------------------ */}

                            <div className="grid gap-3 sm:grid-cols-2">

                                <button
                                    type="button"
                                    onClick={
                                        downloadPhoto
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="rounded-xl bg-orange-600 px-5 py-3.5 font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50"
                                >
                                    {saving
                                        ? "जतन होत आहे..."
                                        : "⬇️ इमेज जतन करा"}
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        sharePhoto
                                    }
                                    disabled={
                                        sharing
                                    }
                                    className="rounded-xl border border-orange-300 bg-white px-5 py-3.5 font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                                >
                                    {sharing
                                        ? "Share होत आहे..."
                                        : "↗️ इमेज Share करा"}
                                </button>

                            </div>

                            {/* RESET */}
                            <button
                                type="button"
                                onClick={
                                    onReset
                                }
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 font-semibold text-gray-700 hover:bg-gray-100"
                            >
                                पुन्हा नोंदणी करा
                            </button>

                        </div>
                    </div>
                </div>
            </div>

            {/* ------------------------------------------------
                HAND ANIMATION
            ------------------------------------------------ */}

            <style jsx>{`
                @keyframes dragHand {
                    0% {
                        transform: translateY(-20px);
                    }

                    50% {
                        transform: translateY(20px);
                    }

                    100% {
                        transform: translateY(-20px);
                    }
                }
            `}</style>

        </main>
    );
}
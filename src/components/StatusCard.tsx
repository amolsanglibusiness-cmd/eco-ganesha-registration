import { useEffect, useRef, useState } from 'react';

interface StatusCardProps {
    fullName: string;
    selfieDataUrl: string;
    uniqueId?: string;
    headerImageUrl?: string; // public फोल्डरमधील इमेजचा पाथ
    formUrl?: string; // फॉर्मची लिंक (ऑप्शनल, डीफॉल्ट सध्याचा URL घेतला जाईल)
}

export default function StatusCard({
    fullName,
    selfieDataUrl,
    uniqueId = 'TB-2026-001',
    headerImageUrl = '/ganpati-header.png', // public/ganpati-header.png साठी पाथ
    formUrl,
}: StatusCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dataUrl, setDataUrl] = useState<string>('');
    const [isSharing, setIsSharing] = useState<boolean>(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 1080;
        const H = 1920;

        canvas.width = W;
        canvas.height = H;

        // १. बॅकग्राउंड ग्रेडियंट (Background)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#b71c1c');
        bgGrad.addColorStop(0.35, '#d32f2f');
        bgGrad.addColorStop(0.7, '#ff4b2b');
        bgGrad.addColorStop(1, '#e65100');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // २. बॉर्डर व कॉर्नर डिझाईन (Borders)
        const borderGrad = ctx.createLinearGradient(0, 0, W, 0);
        borderGrad.addColorStop(0, '#f59e0b');
        borderGrad.addColorStop(0.5, '#ffeb3b');
        borderGrad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = borderGrad;
        ctx.fillRect(0, 0, W, 12);
        ctx.fillRect(0, H - 12, W, 12);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 30, W - 60, H - 60);

        const drawCorner = (x: number, y: number, flipX: boolean, flipY: boolean) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(0, 60);
            ctx.lineTo(60, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };

        drawCorner(30, 30, false, false);
        drawCorner(W - 30, 30, true, false);
        drawCorner(30, H - 30, false, true);
        drawCorner(W - 30, H - 30, true, true);

        // ३. इमेज लोडिंग (Header & Selfie)
        const headerImg = new Image();
        const selfieImg = new Image();

        let headerLoaded = false;
        let selfieLoaded = false;

        const renderCanvas = () => {
            // हेडर इमेज (Header Banner) ड्रॉ करणे
            if (headerLoaded) {
                const headerAspect = headerImg.width / headerImg.height;
                const targetW = W - 100;
                const targetH = targetW / headerAspect;
                const headerX = 50;
                const headerY = 60;

                // हेडर इमेजसाठी पांढरा बॅकग्राउंड बॉक्स व शैडो
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.roundRect(headerX - 10, headerY - 10, targetW + 20, targetH + 20, 16);
                ctx.fill();
                ctx.shadowColor = 'transparent';

                ctx.drawImage(headerImg, headerX, headerY, targetW, targetH);
            }

            // युझरची सेल्फी इमेज ड्रॉ करणे
            const photoSize = 650;
            const photoX = (W - photoSize) / 2;
            const photoY = 560; // हेडर इमेजच्या खाली स्थान
            const framePadding = 15;

            // फोटो शैडो व बॉर्डर
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetY = 10;
            ctx.beginPath();
            ctx.roundRect(
                photoX - framePadding,
                photoY - framePadding,
                photoSize + framePadding * 2,
                photoSize + framePadding * 2,
                24
            );
            ctx.fill();
            ctx.shadowColor = 'transparent';

            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 4;
            ctx.stroke();

            if (selfieLoaded) {
                const imgSize = Math.min(selfieImg.width, selfieImg.height);
                const sx = (selfieImg.width - imgSize) / 2;
                const sy = (selfieImg.height - imgSize) / 2;

                ctx.save();
                ctx.beginPath();
                ctx.roundRect(photoX, photoY, photoSize, photoSize, 16);
                ctx.clip();
                ctx.drawImage(
                    selfieImg,
                    sx,
                    sy,
                    imgSize,
                    imgSize,
                    photoX,
                    photoY,
                    photoSize,
                    photoSize
                );
                ctx.restore();
            }

            // ४. बॅज, नाव आणि युनिक आयडी (Text & Badges)
            const badgeY = photoY + photoSize + 50;

            // अधिकृत सहभागी बॅज
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.roundRect(W / 2 - 220, badgeY, 440, 60, 30);
            ctx.fill();

            // टिक मार्क आयकॉन
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(W / 2 - 170, badgeY + 30, 16, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(W / 2 - 178, badgeY + 30);
            ctx.lineTo(W / 2 - 173, badgeY + 36);
            ctx.lineTo(W / 2 - 162, badgeY + 23);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 30px "Mukta", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('अधिकृत सहभागी', W / 2 + 15, badgeY + 41);

            // सहभागीदाराचे नाव
            ctx.fillStyle = '#ffeb3b';
            ctx.font = 'bold 50px "Mukta", sans-serif';
            ctx.fillText(fullName, W / 2, badgeY + 140);

            // युनिक आयडी बॅज (Unique ID Display)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.roundRect(W / 2 - 180, badgeY + 175, 360, 45, 10);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '600 24px "Mukta", monospace';
            ctx.fillText(`ID: ${uniqueId}`, W / 2, badgeY + 206);

            // फुटर माहिती
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = '600 28px "Mukta", sans-serif';
            ctx.fillText('गणपती उत्सव २०२६', W / 2, H - 90);

            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.font = '400 22px "Mukta", sans-serif';
            ctx.fillText('गणपती बाप्पा मोरया!', W / 2, H - 50);

            // फायनल डेटा URL जेनेरेट करणे
            try {
                setDataUrl(canvas.toDataURL('image/jpeg', 0.92));
            } catch (e) {
                console.error("Canvas export error:", e);
            }
        };

        // १. हेडर इमेज लोड करणे
        headerImg.onload = () => {
            headerLoaded = true;
            if (selfieLoaded) renderCanvas();
        };
        headerImg.onerror = (err) => {
            console.error("Header image load error:", err);
            headerLoaded = false;
            if (selfieLoaded) renderCanvas();
        };
        headerImg.src = headerImageUrl;

        // २. युझर सेल्फी लोड करणे
        selfieImg.onload = () => {
            selfieLoaded = true;
            if (headerLoaded || !headerImageUrl) renderCanvas();
        };
        selfieImg.onerror = (err) => {
            console.error("Selfie image load error:", err);
            selfieLoaded = false;
            renderCanvas();
        };
        selfieImg.src = selfieDataUrl;

    }, [fullName, selfieDataUrl, uniqueId, headerImageUrl]);

    // ५. इमेज आणि फॉर्मची लिंक शेअर करण्याचे फंक्शन
    const handleShare = async () => {
        if (!dataUrl) return;

        setIsSharing(true);
        const targetUrl = formUrl || window.location.href;
        const shareText = `माझी गणेश मूर्ती सेल्फी कार्ड पहा! तुम्हीही सहभाग नोंदवा:\n${targetUrl}`;

        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `${fullName}-ganesh-selfie.jpg`, {
                type: 'image/jpeg',
            });

            // मोबाईल डिव्हाइसवर फाईल शेअरिंग (WhatsApp, इत्यादी)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'गणेश मूर्ती सेल्फी स्पर्धा',
                    text: shareText,
                    files: [file],
                });
            } else if (navigator.share) {
                // केवळ लिंक शेअर करणे जर डिव्हाइस फाईल शेअरिंगला सपोर्ट करत नसेल
                await navigator.share({
                    title: 'गणेश मूर्ती सेल्फी स्पर्धा',
                    text: shareText,
                    url: targetUrl,
                });
            } else {
                // PC / डेस्कटॉप ब्राऊजरसाठी डाऊनलोड आणि मेसेज
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `${fullName}-ganesh-selfie.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                alert('कार्ड डाऊनलोड झाले आहे! आपण ते व्हॉट्सॲपवर शेअर करू शकता.');
            }
        } catch (error) {
            console.error('Sharing failed:', error);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <canvas ref={canvasRef} className="hidden" />

            {dataUrl ? (
                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                    <img
                        src={dataUrl}
                        alt="WhatsApp Status Card"
                        className="w-full rounded-2xl shadow-2xl border-4 border-white/20 animate-scale-in"
                        style={{ aspectRatio: '9 / 16' }}
                    />

                    {/* शेअर बटण */}
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 fill-current"
                            viewBox="0 0 24 24"
                        >
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
                        </svg>
                        {isSharing ? 'शेअर होत आहे...' : 'कार्ड शेअर करा (Share)'}
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-xs aspect-[9/16] rounded-2xl bg-white/10 animate-pulse flex items-center justify-center">
                    <span className="text-white/50 text-sm">कार्ड तयार होत आहे...</span>
                </div>
            )}

            <input
                type="hidden"
                id="status-card-data-url"
                value={dataUrl}
            />
        </div>
    );
}

export function getStatusCardDataUrl(): string | null {
    const input = document.getElementById(
        'status-card-data-url'
    ) as HTMLInputElement | null;
    return input?.value || null;
}
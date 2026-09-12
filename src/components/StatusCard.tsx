import { useEffect, useRef, useState } from 'react';

interface StatusCardProps {
  fullName: string;
  selfieDataUrl: string;
}

export default function StatusCard({ fullName, selfieDataUrl }: StatusCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#b71c1c');
    bgGrad.addColorStop(0.3, '#d32f2f');
    bgGrad.addColorStop(0.6, '#ff4b2b');
    bgGrad.addColorStop(1, '#e65100');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Decorative top border
    const borderGrad = ctx.createLinearGradient(0, 0, W, 0);
    borderGrad.addColorStop(0, '#f59e0b');
    borderGrad.addColorStop(0.5, '#ffeb3b');
    borderGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = borderGrad;
    ctx.fillRect(0, 0, W, 12);
    ctx.fillRect(0, H - 12, W, 12);

    // Inner border frame
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    // Corner decorations
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

    // Header text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffeb3b';
    ctx.font = 'bold 52px "Mukta", sans-serif';
    ctx.fillText('घरगुती इकोफ्रेंडली', W / 2, 130);
    ctx.fillText('गणेशा २०२६', W / 2, 195);

    // Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 32px "Mukta", sans-serif';
    ctx.fillText('— विशेष राज्यस्तरीय स्पर्धा —', W / 2, 250);

    // Decorative line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 200, 280);
    ctx.lineTo(W / 2 + 200, 280);
    ctx.stroke();

    // Eco-friendly badge
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 180, 310, 360, 50, 25);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Mukta", sans-serif';
    ctx.fillText('Eco-Friendly Contest', W / 2, 345);

    // Selfie photo with white frame
    const img = new Image();
    img.onload = () => {
      const photoSize = 700;
      const photoX = (W - photoSize) / 2;
      const photoY = 400;
      const framePadding = 20;

      // White frame
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.beginPath();
      ctx.roundRect(photoX - framePadding, photoY - framePadding, photoSize + framePadding * 2, photoSize + framePadding * 2, 20);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Gold inner border on frame
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(photoX - framePadding, photoY - framePadding, photoSize + framePadding * 2, photoSize + framePadding * 2, 20);
      ctx.stroke();

      // Draw photo (cover fit)
      const imgSize = Math.min(img.width, img.height);
      const sx = (img.width - imgSize) / 2;
      const sy = (img.height - imgSize) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoSize, photoSize, 10);
      ctx.clip();
      ctx.drawImage(img, sx, sy, imgSize, imgSize, photoX, photoY, photoSize, photoSize);
      ctx.restore();

      // Official badge below photo
      const badgeY = photoY + photoSize + 60;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 250, badgeY, 500, 65, 32);
      ctx.fill();

      // Check mark circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(W / 2 - 200, badgeY + 32, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 210, badgeY + 32);
      ctx.lineTo(W / 2 - 205, badgeY + 38);
      ctx.lineTo(W / 2 - 192, badgeY + 25);
      ctx.stroke();

      // Badge text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px "Mukta", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('अधिकृत सहभागी', W / 2 + 20, badgeY + 43);

      // Participant name
      ctx.fillStyle = '#ffeb3b';
      ctx.font = 'bold 48px "Mukta", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fullName, W / 2, badgeY + 150);

      // Name underline
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 150, badgeY + 170);
      ctx.lineTo(W / 2 + 150, badgeY + 170);
      ctx.stroke();

      // "सहभागी" label
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 30px "Mukta", sans-serif';
      ctx.fillText('यशस्वी सहभागी', W / 2, badgeY + 215);

      // Bottom branding
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '600 26px "Mukta", sans-serif';
      ctx.fillText('Eco-Friendly Ganesha 2026', W / 2, H - 100);
      ctx.font = '400 22px "Mukta", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('स्पर्धेत सहभाग नोंदवा!', W / 2, H - 60);

      setDataUrl(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => {
      // Fallback: draw placeholder
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(190, 400, 700, 700, 10);
      ctx.fill();
      setDataUrl(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = selfieDataUrl;
  }, [fullName, selfieDataUrl]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="hidden" />
      {dataUrl && (
        <img
          src={dataUrl}
          alt="WhatsApp Status Card"
          className="w-full max-w-xs rounded-2xl shadow-2xl border-4 border-white/20 animate-scale-in"
          style={{ aspectRatio: '9/16' }}
        />
      )}
      {!dataUrl && (
        <div className="w-full max-w-xs aspect-[9/16] rounded-2xl bg-white/10 animate-pulse flex items-center justify-center">
          <span className="text-white/50 text-sm">कार्ड तयार होत आहे...</span>
        </div>
      )}
      <input type="hidden" id="status-card-data-url" value={dataUrl} />
    </div>
  );
}

export function getStatusCardDataUrl(): string | null {
  const input = document.getElementById('status-card-data-url') as HTMLInputElement | null;
  return input?.value || null;
}

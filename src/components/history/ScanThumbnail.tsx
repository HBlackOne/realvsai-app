"use client";

import { useEffect, useRef } from "react";

type MediaType = "IMAGE" | "VIDEO" | "AUDIO";
type ScanStatus = "COMPLETED" | "FAILED" | "PENDING" | "PROCESSING" | "CANCELED";

interface ScanThumbnailProps {
  mediaType: MediaType;
  seed: number;
  selected?: boolean;
  status: ScanStatus;
}

export function ScanThumbnail({ mediaType, seed, selected = false, status }: ScanThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 72, H = 56;
    canvas.width = W;
    canvas.height = H;

    let s = seed * 9301 + 49297;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

    if (mediaType === "IMAGE") {
      const hue = 180 + rand() * 120;
      const grd = ctx.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, `hsl(${hue},45%,18%)`);
      grd.addColorStop(1, `hsl(${hue + 40},35%,10%)`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(rand() * W, rand() * H, 6 + rand() * 18, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue + rand() * 60}, 60%, 55%, ${0.08 + rand() * 0.12})`;
        ctx.fill();
      }
      ctx.strokeStyle = `hsla(${hue},40%,60%,0.07)`;
      ctx.lineWidth = 0.5;
      for (let x = 8; x < W; x += 10) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 8; y < H; y += 10) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.fillStyle = `hsla(${hue}, 40%, 65%, 0.18)`;
      ctx.beginPath(); ctx.arc(W / 2, H * 0.42, 8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W / 2, H * 0.72, 12, 0, Math.PI); ctx.fill();
    } else if (mediaType === "VIDEO") {
      ctx.fillStyle = "#0d0d10";
      ctx.fillRect(0, 0, W, H);
      const hue = 220 + rand() * 40;
      const grd = ctx.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, `hsla(${hue},30%,20%,0.6)`);
      grd.addColorStop(1, `hsla(${hue},20%,10%,0.4)`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#080810";
      ctx.fillRect(0, 0, 8, H);
      for (let y = 4; y < H - 6; y += 9) {
        ctx.fillStyle = "#1a1a28";
        ctx.beginPath();
        (ctx as CanvasRenderingContext2D & { roundRect: (...args: number[]) => void }).roundRect(1.5, y, 5, 6, 1);
        ctx.fill();
      }
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = `hsla(${hue},40%,60%,${0.05 + rand() * 0.06})`;
        ctx.fillRect(10, 10 + rand() * (H - 20), W - 12, 1 + rand() * 2);
      }
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.moveTo(W / 2 - 3, H / 2 - 5);
      ctx.lineTo(W / 2 + 6, H / 2);
      ctx.lineTo(W / 2 - 3, H / 2 + 5);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#0e0c0a";
      ctx.fillRect(0, 0, W, H);
      const grd = ctx.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, "rgba(245,197,66,0.08)");
      grd.addColorStop(1, "rgba(245,197,66,0.02)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
      const bars = 22, barW = 2;
      const gap = (W - bars * barW) / (bars + 1);
      for (let i = 0; i < bars; i++) {
        const h = 6 + rand() * (H * 0.65);
        const x = gap + i * (barW + gap);
        ctx.fillStyle = `rgba(245,197,66,${0.35 + rand() * 0.55})`;
        ctx.beginPath();
        (ctx as CanvasRenderingContext2D & { roundRect: (...args: number[]) => void }).roundRect(x, (H - h) / 2, barW, h, 1);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(245,197,66,0.15)";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    }

    if (status === "FAILED" || status === "CANCELED") {
      ctx.fillStyle = "rgba(255,60,60,0.3)";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,107,107,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(W * 0.3, H * 0.3); ctx.lineTo(W * 0.7, H * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.7, H * 0.3); ctx.lineTo(W * 0.3, H * 0.7); ctx.stroke();
    }
  }, [mediaType, seed, status]);

  const typeColor =
    mediaType === "IMAGE" ? "var(--color-primary)" :
    mediaType === "VIDEO" ? "var(--color-danger)" :
    "var(--color-warning)";

  const typeLabel =
    mediaType === "VIDEO" ? "VID" : mediaType === "AUDIO" ? "AUD" : "IMG";

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden rounded-[10px]"
      style={{
        width: 72,
        height: 56,
        border: `1px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
        transition: "border-color 0.15s",
      }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div
        className="absolute bottom-1 left-1 rounded-[4px] px-[5px] py-px text-[9px] font-bold tracking-[0.07em] uppercase"
        style={{ background: "rgba(0,0,0,0.72)", color: typeColor }}
      >
        {typeLabel}
      </div>
    </div>
  );
}

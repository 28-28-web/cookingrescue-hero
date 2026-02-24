'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useScroll, useTransform, motion, useMotionValueEvent } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────────── */
const TOTAL_FRAMES = 192;
// Frames live at /frames/00001.jpg … /frames/00192.jpg
const frameSrc = (i: number) =>
    `/frames/${String(i + 1).padStart(5, '0')}.jpg`;

// Watermark crop: draw only top 91% of source image height
const CROP_BOTTOM = 0.91;

/* ─────────────────────────────────────────────────────────────
   TEXT BEATS
───────────────────────────────────────────────────────────── */
interface Beat {
    start: number; // scroll progress 0-1
    end: number;
    align: 'left' | 'center' | 'right';
    heading: React.ReactNode;
    sub: React.ReactNode;
}

const BEATS: Beat[] = [
    {
        start: 0, end: 0.18,
        align: 'center',
        heading: <>You Can Cook<br />Tonight.</>,
        sub: 'Even far from home.',
    },
    {
        start: 0.22, end: 0.45,
        align: 'left',
        heading: <>No Chef.<br />No Kitchen.<br />No Problem.</>,
        sub: 'Just you and a microwave.',
    },
    {
        start: 0.55, end: 0.75,
        align: 'right',
        heading: <>Simple.<br />Real. Yours.</>,
        sub: 'Food that feels like home.',
    },
    {
        start: 0.84, end: 1,
        align: 'center',
        heading: 'CookingRescue.',
        sub: (
            <a
                href="https://cookingrescue.com"
                className="inline-flex items-center gap-2 bg-black/80 backdrop-blur-sm text-white text-sm font-medium tracking-wide px-6 py-3 rounded-full hover:bg-black transition-colors duration-200"
            >
                Start cooking tonight
                <span style={{ color: '#E8631A', fontSize: '1rem', lineHeight: 1 }}>→</span>
            </a>
        ),
    },
];

/* ─────────────────────────────────────────────────────────────
   TEXT OVERLAY — individual beat
───────────────────────────────────────────────────────────── */
function TextBeat({ beat, progress }: { beat: Beat; progress: number }) {
    const span = beat.end - beat.start;
    const fade = 0.12;

    let opacity = 0;
    let ty = 14;

    const local = (progress - beat.start) / span;
    if (local >= 0 && local <= 1) {
        const fadeIn = Math.min(local / fade, 1);
        const fadeOut = local > 1 - fade ? Math.max((1 - local) / fade, 0) : 1;
        opacity = fadeIn * fadeOut;
        ty = (1 - fadeIn) * 14;
    }

    const alignClass =
        beat.align === 'left'
            ? 'items-start text-left md:pl-16 lg:pl-24'
            : beat.align === 'right'
                ? 'items-end text-right md:pr-16 lg:pr-24'
                : 'items-center text-center';

    if (opacity < 0.01) return null;

    return (
        <div
            className={`absolute inset-0 flex flex-col justify-center px-6 pointer-events-auto ${alignClass}`}
            style={{ opacity, transform: `translateY(${ty}px)`, transition: 'none' }}
        >
            {/* Avoid covering center — push text to sides */}
            <div className={beat.align === 'center' ? 'max-w-lg mx-auto' : 'max-w-xs'}>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-black/90 leading-[1.05] mb-4">
                    {beat.heading}
                </h2>
                <p className="text-base md:text-lg text-black/55 font-light tracking-wide">{beat.sub}</p>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────────────────────── */
function Loader({ pct }: { pct: number }) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#E9E9E9]">
            <div className="mb-8 flex flex-col items-center gap-2">
                <span className="text-xs font-semibold tracking-[0.25em] text-black/40 uppercase">
                    CookingRescue
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-black/80">
                    Loading sequence…
                </h1>
            </div>
            {/* Progress bar */}
            <div className="w-48 h-[2px] bg-black/10 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full origin-left transition-transform duration-300"
                    style={{ transform: `scaleX(${pct / 100})`, background: '#E8631A' }}
                />
            </div>
            <p className="mt-4 text-xs text-black/30 tabular-nums">{pct}%</p>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function MicrowaveScroll() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const framesRef = useRef<HTMLImageElement[]>([]);
    const currentFrameRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);

    const [loadPct, setLoadPct] = useState(0);
    const [ready, setReady] = useState(false);

    /* ── Scroll tracking ── */
    const { scrollYProgress } = useScroll({ target: containerRef });
    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);
    const [scrollProg, setScrollProg] = useState(0);

    useMotionValueEvent(scrollYProgress, 'change', (v) => setScrollProg(v));

    /* ── Draw frame on canvas ── */
    const drawFrame = useCallback((index: number) => {
        const canvas = canvasRef.current;
        const img = framesRef.current[index];
        if (!canvas || !img?.complete) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const W = canvas.width / dpr;
        const H = canvas.height / dpr;

        // Source crop to remove Veo watermark (bottom 9%)
        const srcW = img.naturalWidth;
        const srcH = img.naturalHeight * CROP_BOTTOM;

        // "Contain" fit
        const scale = Math.min(W / srcW, H / srcH);
        const dw = srcW * scale;
        const dh = srcH * scale;
        const dx = (W - dw) / 2;
        const dy = (H - dh) / 2;

        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0, srcW, img.naturalHeight * CROP_BOTTOM, dx, dy, dw, dh);
    }, []);

    /* ── Resize canvas ── */
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
        drawFrame(currentFrameRef.current);
    }, [drawFrame]);

    /* ── Preload all frames ── */
    useEffect(() => {
        let loaded = 0;
        const images: HTMLImageElement[] = [];

        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = frameSrc(i);
            img.onload = () => {
                loaded++;
                setLoadPct(Math.round((loaded / TOTAL_FRAMES) * 100));
                if (loaded === TOTAL_FRAMES) setReady(true);
            };
            img.onerror = () => {
                loaded++;
                setLoadPct(Math.round((loaded / TOTAL_FRAMES) * 100));
                if (loaded === TOTAL_FRAMES) setReady(true);
            };
            images.push(img);
        }

        framesRef.current = images;
    }, []);

    /* ── Set up canvas once ready ── */
    useEffect(() => {
        if (!ready) return;
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [ready, resizeCanvas]);

    /* ── Animate on scroll ── */
    useEffect(() => {
        if (!ready) return;

        const unsubscribe = frameIndex.on('change', (raw) => {
            const idx = Math.round(Math.max(0, Math.min(TOTAL_FRAMES - 1, raw)));
            if (idx === currentFrameRef.current) return;
            currentFrameRef.current = idx;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => drawFrame(idx));
        });

        // Draw initial frame
        drawFrame(0);

        return () => {
            unsubscribe();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [ready, frameIndex, drawFrame]);

    return (
        <>
            {!ready && <Loader pct={loadPct} />}

            {/* 400vh scroll container */}
            <div ref={containerRef} className="relative" style={{ height: '400vh' }}>
                {/* Sticky viewport */}
                <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#E9E9E9]">
                    {/* Canvas */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0"
                        style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.4s ease' }}
                    />

                    {/* Text overlays */}
                    <div className="absolute inset-0 pointer-events-none">
                        {BEATS.map((beat, i) => (
                            <TextBeat key={i} beat={beat} progress={scrollProg} />
                        ))}
                    </div>

                    {/* Scroll hint (only at the very top) */}
                    {scrollProg < 0.04 && ready && (
                        <motion.div
                            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 0.4, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                        >
                            <span className="text-xs tracking-widest text-black/40 uppercase">Scroll</span>
                            <motion.div
                                className="w-[1px] h-8 bg-black/25"
                                animate={{ scaleY: [1, 0.3, 1] }}
                                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
}

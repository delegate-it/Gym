"use client";

import { useEffect, useState } from "react";

/** Flips between the start and end photos so the movement reads like a short animation. */
export function ExerciseAnimation({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing || images.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % images.length), 1100);
    return () => clearInterval(t);
  }, [playing, images.length]);

  if (!images.length) return null;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200 dark:ring-zinc-800">
      {images.map((src, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt={idx === 0 ? alt : ""} className={`w-full object-contain transition-opacity duration-300 ${idx === i ? "opacity-100" : "absolute inset-0 opacity-0"}`} />
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-2 flex gap-1">
          {images.map((_, idx) => (
            <button key={idx} onClick={() => { setPlaying(false); setI(idx); }} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${idx === i ? "bg-zinc-900 text-white" : "bg-white/90 text-zinc-700"}`}>
              {idx === 0 ? "Start" : "End"}
            </button>
          ))}
          <button onClick={() => setPlaying(!playing)} className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-700">{playing ? "❚❚" : "▶"}</button>
        </div>
      )}
    </div>
  );
}

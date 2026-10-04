import { useApp } from "./store";

let ac: AudioContext | null = null;

export function playTone(kind: "correct" | "retry" | "fanfare") {
  if (typeof window === "undefined" || !useApp.getState().sound) return;
  try {
    ac ??= new AudioContext();
    const notes = kind === "correct" ? [660, 880] : kind === "retry" ? [440, 392] : [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      const o = ac!.createOscillator();
      const g = ac!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t = ac!.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(ac!.destination);
      o.start(t);
      o.stop(t + 0.2);
    });
  } catch {
    /* audio unavailable */
  }
}

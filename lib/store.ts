import { create } from "zustand";

type View = "tracks" | "piano-roll" | "mixer" | "playlist";

export const CHANNELS = [
	"Kick",
	"Snare",
	"Closed Hat",
	"Open Hat",
	"Percussion",
	"Ride",
];
export const STEPS = 32;

export type Pattern = Record<string, boolean[]>;

interface DAWState {
	activeView: View;
	isPlaying: boolean;
	bpm: number;
	currentTick: number;
	pattern: Pattern;
	playStartAudioTime: number | null;
	setActiveView: (view: View) => void;
	togglePlay: () => void;
	setBpm: (bpm: number) => void;
	setCurrentTick: (tick: number) => void;
	toggleStep: (channel: string, step: number) => void;
	setPlayStartAudioTime: (t: number | null) => void;
}

export const useDAWStore = create<DAWState>((set) => ({
	activeView: "tracks",
	isPlaying: false,
	bpm: 128,
	currentTick: 0,
	pattern: Object.fromEntries(
		CHANNELS.map((ch) => [ch, Array(STEPS).fill(false)]),
	),
	playStartAudioTime: null,
	setActiveView: (view) => set({ activeView: view }),
	togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
	setBpm: (bpm) => set({ bpm }),
	setCurrentTick: (tick) => set({ currentTick: tick }),
	setPlayStartAudioTime: (t) => set({ playStartAudioTime: t }),
	toggleStep: (channel, step) =>
		set((s) => {
			const next = [...s.pattern[channel]];
			next[step] = !next[step];
			return { pattern: { ...s.pattern, [channel]: next } };
		}),
}));

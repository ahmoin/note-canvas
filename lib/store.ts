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

export type TrackSubtype =
	| "wave"
	| "drum"
	| "audio"
	| "slicer"
	| "sampler"
	| "sound"
	| "effect";
export type TrackItem = { name: string; type: string; subtype: TrackSubtype };

const DEFAULT_TRACKS: TrackItem[] = [
	{ name: "Drum Track", type: "sound", subtype: "drum" },
	{ name: "Guitar", type: "sound", subtype: "wave" },
];

function makeDefaultGuitarNotes(): Record<string, boolean> {
	const notes: Record<string, boolean> = {};
	const melody: [number, number][] = [
		[52, 0], [55, 16], [57, 32], [59, 48],
		[52, 64], [50, 80], [52, 96], [55, 112],
	];
	for (const [row, sub] of melody) {
		for (let i = 0; i < 8; i++) notes[`${row}-${sub + i}`] = true;
	}
	return notes;
}

const emptyPattern = (): Pattern =>
	Object.fromEntries(CHANNELS.map((ch) => [ch, Array(STEPS).fill(false)]));

interface DAWState {
	activeView: View;
	isPlaying: boolean;
	bpm: number;
	currentTick: number;
	patterns: Pattern[];
	activeTrack: number;
	playStartAudioTime: number | null;
	tracks: TrackItem[];
	trackVolumes: number[];
	trackPans: number[];
	soloTrack: number | null;
	mutedTracks: boolean[];
	setActiveView: (view: View) => void;
	togglePlay: () => void;
	setBpm: (bpm: number) => void;
	setCurrentTick: (tick: number) => void;
	toggleStep: (channel: string, step: number) => void;
	setStep: (channel: string, step: number, value: boolean) => void;
	setPlayStartAudioTime: (t: number | null) => void;
	setActiveTrack: (ti: number) => void;
	setTrackVolume: (track: number, vol: number) => void;
	setTrackPan: (track: number, pan: number) => void;
	setSoloTrack: (track: number | null) => void;
	toggleMuteTrack: (track: number) => void;
	addTrack: (name: string, type: string, subtype?: TrackSubtype) => void;
	pianoNotes: Record<number, Record<string, boolean>>;
	togglePianoNote: (trackIndex: number, row: number, sub: number) => void;
	placeNote: (trackIndex: number, row: number, sub: number, len: number, on: boolean) => void;
	noteVelocities: Record<number, Record<number, number>>;
	setNoteVelocity: (trackIndex: number, sub: number, velocity: number) => void;
	masterVolume: number;
	masterPan: number;
	setMasterVolume: (vol: number) => void;
	setMasterPan: (pan: number) => void;
}

export const useDAWStore = create<DAWState>((set) => ({
	activeView: "tracks",
	isPlaying: false,
	bpm: 128,
	currentTick: 0,
	patterns: DEFAULT_TRACKS.map(() => emptyPattern()),
	activeTrack: 0,
	playStartAudioTime: null,
	tracks: DEFAULT_TRACKS,
	trackVolumes: Array(DEFAULT_TRACKS.length).fill(82.5),
	trackPans: Array(DEFAULT_TRACKS.length).fill(0),
	soloTrack: null,
	mutedTracks: Array(DEFAULT_TRACKS.length).fill(false),
	pianoNotes: { 1: makeDefaultGuitarNotes() },
	noteVelocities: {},
	masterVolume: 82.5,
	masterPan: 0,
	setActiveView: (view) => set({ activeView: view }),
	togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
	setBpm: (bpm) => set({ bpm }),
	setCurrentTick: (tick) => set({ currentTick: tick }),
	setPlayStartAudioTime: (t) => set({ playStartAudioTime: t }),
	setActiveTrack: (ti) => set({ activeTrack: ti }),
	toggleStep: (channel, step) =>
		set((s) => {
			const next = s.patterns.map((p) => ({ ...p }));
			next[s.activeTrack] = {
				...next[s.activeTrack],
				[channel]: next[s.activeTrack][channel].map((v, i) =>
					i === step ? !v : v,
				),
			};
			return { patterns: next };
		}),
	setStep: (channel, step, value) =>
		set((s) => {
			const next = s.patterns.map((p) => ({ ...p }));
			next[s.activeTrack] = {
				...next[s.activeTrack],
				[channel]: next[s.activeTrack][channel].map((v, i) =>
					i === step ? value : v,
				),
			};
			return { patterns: next };
		}),
	setTrackVolume: (track, vol) =>
		set((s) => {
			const next = [...s.trackVolumes];
			next[track] = vol;
			return { trackVolumes: next };
		}),
	setTrackPan: (track, pan) =>
		set((s) => {
			const next = [...s.trackPans];
			next[track] = pan;
			return { trackPans: next };
		}),
	setSoloTrack: (track) =>
		set((s) => ({ soloTrack: s.soloTrack === track ? null : track })),
	toggleMuteTrack: (track) =>
		set((s) => {
			const next = [...s.mutedTracks];
			next[track] = !next[track];
			return { mutedTracks: next };
		}),
	togglePianoNote: (trackIndex, row, sub) =>
		set((s) => {
			const key = `${row}-${sub}`;
			const track = { ...s.pianoNotes[trackIndex] };
			if (track[key]) delete track[key];
			else track[key] = true;
			return { pianoNotes: { ...s.pianoNotes, [trackIndex]: track } };
		}),
	placeNote: (trackIndex, row, sub, len, on) =>
		set((s) => {
			const track = { ...(s.pianoNotes[trackIndex] ?? {}) };
			for (let i = 0; i < len; i++) {
				const key = `${row}-${sub + i}`;
				if (on) track[key] = true;
				else delete track[key];
			}
			return { pianoNotes: { ...s.pianoNotes, [trackIndex]: track } };
		}),
	setNoteVelocity: (trackIndex, sub, velocity) =>
		set((s) => ({
			noteVelocities: {
				...s.noteVelocities,
				[trackIndex]: { ...s.noteVelocities[trackIndex], [sub]: Math.max(0, Math.min(127, velocity)) },
			},
		})),
	setMasterVolume: (vol) => set({ masterVolume: vol }),
	setMasterPan: (pan) => set({ masterPan: pan }),
	addTrack: (name, type, subtype = "sound") =>
		set((s) => ({
			tracks: [...s.tracks, { name, type, subtype }],
			patterns: [...s.patterns, emptyPattern()],
			trackVolumes: [...s.trackVolumes, 82.5],
			trackPans: [...s.trackPans, 0],
			mutedTracks: [...s.mutedTracks, false],
		})),
}));

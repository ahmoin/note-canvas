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

export type PianoNote = { row: number; start: number; duration: number };

const DEFAULT_TRACKS: TrackItem[] = [
	{ name: "Drum Track", type: "sound", subtype: "drum" },
	{ name: "Guitar", type: "sound", subtype: "wave" },
];

function makeDefaultGuitarNotes(): PianoNote[] {
	return (
		[
			[52, 0],
			[55, 16],
			[57, 32],
			[59, 48],
			[52, 64],
			[50, 80],
			[52, 96],
			[55, 112],
		] as [number, number][]
	).map(([row, start]) => ({ row, start, duration: 8 }));
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
	pianoNotes: Record<number, PianoNote[]>;
	addNote: (trackIndex: number, note: PianoNote) => void;
	removeNote: (trackIndex: number, noteIndex: number) => void;
	resizeNote: (trackIndex: number, noteIndex: number, duration: number) => void;
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
	addNote: (trackIndex, note) =>
		set((s) => ({
			pianoNotes: {
				...s.pianoNotes,
				[trackIndex]: [...(s.pianoNotes[trackIndex] ?? []), note],
			},
		})),
	removeNote: (trackIndex, noteIndex) =>
		set((s) => ({
			pianoNotes: {
				...s.pianoNotes,
				[trackIndex]: (s.pianoNotes[trackIndex] ?? []).filter(
					(_, i) => i !== noteIndex,
				),
			},
		})),
	resizeNote: (trackIndex, noteIndex, duration) =>
		set((s) => {
			const notes = [...(s.pianoNotes[trackIndex] ?? [])];
			if (noteIndex < 0 || noteIndex >= notes.length) return s;
			notes[noteIndex] = {
				...notes[noteIndex],
				duration: Math.max(1, duration),
			};
			return { pianoNotes: { ...s.pianoNotes, [trackIndex]: notes } };
		}),
	setNoteVelocity: (trackIndex, sub, velocity) =>
		set((s) => ({
			noteVelocities: {
				...s.noteVelocities,
				[trackIndex]: {
					...s.noteVelocities[trackIndex],
					[sub]: Math.max(0, Math.min(127, velocity)),
				},
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

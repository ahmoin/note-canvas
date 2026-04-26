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

export type TrackSnapshot = {
	track: TrackItem;
	pattern: Pattern;
	pianoNotes: PianoNote[];
	patternLengthBars: number;
	trackLoop: boolean;
	trackVolume: number;
	trackPan: number;
};

export type PianoNote = {
	row: number;
	start: number;
	duration: number;
	velocity: number;
};

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
	).map(([row, start]) => ({ row, start, duration: 8, velocity: 100 }));
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
	duplicateTrack: (ti: number) => void;
	removeTrack: (ti: number) => void;
	renameTrack: (ti: number, name: string) => void;
	clipboardTrack: TrackSnapshot | null;
	copyTrack: (ti: number) => void;
	cutTrack: (ti: number) => void;
	pianoNotes: Record<number, PianoNote[]>;
	patternLengthBars: number[];
	trackLoop: boolean[];
	setPatternLength: (trackIndex: number, bars: number) => void;
	setTrackLoop: (trackIndex: number, loop: boolean) => void;
	addNote: (trackIndex: number, note: PianoNote) => void;
	removeNote: (trackIndex: number, noteIndex: number) => void;
	resizeNote: (trackIndex: number, noteIndex: number, duration: number) => void;
	moveNote: (
		trackIndex: number,
		noteIndex: number,
		newRow: number,
		newStart: number,
	) => void;
	setNoteVelocity: (
		trackIndex: number,
		noteIndex: number,
		velocity: number,
	) => void;
	masterVolume: number;
	masterPan: number;
	setMasterVolume: (vol: number) => void;
	setMasterPan: (pan: number) => void;
	channelVolumes: Record<number, Record<string, number>>;
	channelPans: Record<number, Record<string, number>>;
	channelMuted: Record<number, Record<string, boolean>>;
	setChannelVolume: (trackIndex: number, channel: string, vol: number) => void;
	setChannelPan: (trackIndex: number, channel: string, pan: number) => void;
	toggleChannelMute: (trackIndex: number, channel: string) => void;
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
	patternLengthBars: Array(DEFAULT_TRACKS.length).fill(16),
	trackLoop: Array(DEFAULT_TRACKS.length).fill(true),
	masterVolume: 82.5,
	masterPan: 0,
	channelVolumes: {},
	channelPans: {},
	channelMuted: {},
	clipboardTrack: null,
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
	moveNote: (trackIndex, noteIndex, newRow, newStart) =>
		set((s) => {
			const notes = [...(s.pianoNotes[trackIndex] ?? [])];
			if (noteIndex < 0 || noteIndex >= notes.length) return s;
			notes[noteIndex] = { ...notes[noteIndex], row: newRow, start: newStart };
			return { pianoNotes: { ...s.pianoNotes, [trackIndex]: notes } };
		}),
	setNoteVelocity: (trackIndex, noteIndex, velocity) =>
		set((s) => {
			const notes = [...(s.pianoNotes[trackIndex] ?? [])];
			if (noteIndex < 0 || noteIndex >= notes.length) return s;
			notes[noteIndex] = {
				...notes[noteIndex],
				velocity: Math.max(0, Math.min(127, velocity)),
			};
			return { pianoNotes: { ...s.pianoNotes, [trackIndex]: notes } };
		}),
	setPatternLength: (trackIndex, bars) =>
		set((s) => {
			const next = [...s.patternLengthBars];
			next[trackIndex] = bars;
			return { patternLengthBars: next };
		}),
	setTrackLoop: (trackIndex, loop) =>
		set((s) => {
			const next = [...s.trackLoop];
			next[trackIndex] = loop;
			return { trackLoop: next };
		}),
	setMasterVolume: (vol) => set({ masterVolume: vol }),
	setMasterPan: (pan) => set({ masterPan: pan }),
	setChannelVolume: (trackIndex, channel, vol) =>
		set((s) => ({
			channelVolumes: {
				...s.channelVolumes,
				[trackIndex]: {
					...(s.channelVolumes[trackIndex] ?? {}),
					[channel]: vol,
				},
			},
		})),
	setChannelPan: (trackIndex, channel, pan) =>
		set((s) => ({
			channelPans: {
				...s.channelPans,
				[trackIndex]: { ...(s.channelPans[trackIndex] ?? {}), [channel]: pan },
			},
		})),
	toggleChannelMute: (trackIndex, channel) =>
		set((s) => ({
			channelMuted: {
				...s.channelMuted,
				[trackIndex]: {
					...(s.channelMuted[trackIndex] ?? {}),
					[channel]: !(s.channelMuted[trackIndex]?.[channel] ?? false),
				},
			},
		})),
	addTrack: (name, type, subtype = "sound") =>
		set((s) => ({
			tracks: [...s.tracks, { name, type, subtype }],
			patterns: [...s.patterns, emptyPattern()],
			trackVolumes: [...s.trackVolumes, 82.5],
			trackPans: [...s.trackPans, 0],
			mutedTracks: [...s.mutedTracks, false],
			patternLengthBars: [...s.patternLengthBars, 16],
			trackLoop: [...s.trackLoop, true],
		})),
	duplicateTrack: (ti) =>
		set((s) => {
			const insertAt = ti + 1;
			const tracks = [
				...s.tracks.slice(0, insertAt),
				{ ...s.tracks[ti] },
				...s.tracks.slice(insertAt),
			];
			const patterns = [
				...s.patterns.slice(0, insertAt),
				JSON.parse(JSON.stringify(s.patterns[ti])),
				...s.patterns.slice(insertAt),
			];
			const trackVolumes = [
				...s.trackVolumes.slice(0, insertAt),
				s.trackVolumes[ti],
				...s.trackVolumes.slice(insertAt),
			];
			const trackPans = [
				...s.trackPans.slice(0, insertAt),
				s.trackPans[ti],
				...s.trackPans.slice(insertAt),
			];
			const mutedTracks = [
				...s.mutedTracks.slice(0, insertAt),
				false,
				...s.mutedTracks.slice(insertAt),
			];
			const patternLengthBars = [
				...s.patternLengthBars.slice(0, insertAt),
				s.patternLengthBars[ti],
				...s.patternLengthBars.slice(insertAt),
			];
			const trackLoop = [
				...s.trackLoop.slice(0, insertAt),
				s.trackLoop[ti],
				...s.trackLoop.slice(insertAt),
			];
			const pianoNotes: Record<number, PianoNote[]> = {};
			for (const [k, v] of Object.entries(s.pianoNotes)) {
				const n = Number(k);
				if (n < insertAt) pianoNotes[n] = v;
				else pianoNotes[n + 1] = v;
			}
			pianoNotes[insertAt] = (s.pianoNotes[ti] ?? []).map((n) => ({ ...n }));
			return {
				tracks,
				patterns,
				trackVolumes,
				trackPans,
				mutedTracks,
				patternLengthBars,
				trackLoop,
				pianoNotes,
				activeTrack: insertAt,
			};
		}),
	removeTrack: (ti) =>
		set((s) => {
			if (s.tracks.length <= 1) return s;
			const tracks = s.tracks.filter((_, i) => i !== ti);
			const patterns = s.patterns.filter((_, i) => i !== ti);
			const trackVolumes = s.trackVolumes.filter((_, i) => i !== ti);
			const trackPans = s.trackPans.filter((_, i) => i !== ti);
			const mutedTracks = s.mutedTracks.filter((_, i) => i !== ti);
			const patternLengthBars = s.patternLengthBars.filter((_, i) => i !== ti);
			const trackLoop = s.trackLoop.filter((_, i) => i !== ti);
			const pianoNotes: Record<number, PianoNote[]> = {};
			for (const [k, v] of Object.entries(s.pianoNotes)) {
				const n = Number(k);
				if (n < ti) pianoNotes[n] = v;
				else if (n > ti) pianoNotes[n - 1] = v;
			}
			const activeTrack = Math.min(s.activeTrack, tracks.length - 1);
			return {
				tracks,
				patterns,
				trackVolumes,
				trackPans,
				mutedTracks,
				patternLengthBars,
				trackLoop,
				pianoNotes,
				activeTrack,
			};
		}),
	renameTrack: (ti, name) =>
		set((s) => {
			const tracks = [...s.tracks];
			tracks[ti] = { ...tracks[ti], name };
			return { tracks };
		}),
	copyTrack: (ti) =>
		set((s) => ({
			clipboardTrack: {
				track: { ...s.tracks[ti] },
				pattern: JSON.parse(JSON.stringify(s.patterns[ti])),
				pianoNotes: (s.pianoNotes[ti] ?? []).map((n) => ({ ...n })),
				patternLengthBars: s.patternLengthBars[ti],
				trackLoop: s.trackLoop[ti],
				trackVolume: s.trackVolumes[ti],
				trackPan: s.trackPans[ti],
			},
		})),
	cutTrack: (ti) =>
		set((s) => {
			if (s.tracks.length <= 1) return s;
			const clipboard: TrackSnapshot = {
				track: { ...s.tracks[ti] },
				pattern: JSON.parse(JSON.stringify(s.patterns[ti])),
				pianoNotes: (s.pianoNotes[ti] ?? []).map((n) => ({ ...n })),
				patternLengthBars: s.patternLengthBars[ti],
				trackLoop: s.trackLoop[ti],
				trackVolume: s.trackVolumes[ti],
				trackPan: s.trackPans[ti],
			};
			const tracks = s.tracks.filter((_, i) => i !== ti);
			const patterns = s.patterns.filter((_, i) => i !== ti);
			const trackVolumes = s.trackVolumes.filter((_, i) => i !== ti);
			const trackPans = s.trackPans.filter((_, i) => i !== ti);
			const mutedTracks = s.mutedTracks.filter((_, i) => i !== ti);
			const patternLengthBars = s.patternLengthBars.filter((_, i) => i !== ti);
			const trackLoop = s.trackLoop.filter((_, i) => i !== ti);
			const pianoNotes: Record<number, PianoNote[]> = {};
			for (const [k, v] of Object.entries(s.pianoNotes)) {
				const n = Number(k);
				if (n < ti) pianoNotes[n] = v;
				else if (n > ti) pianoNotes[n - 1] = v;
			}
			const activeTrack = Math.min(s.activeTrack, tracks.length - 1);
			return {
				clipboardTrack: clipboard,
				tracks,
				patterns,
				trackVolumes,
				trackPans,
				mutedTracks,
				patternLengthBars,
				trackLoop,
				pianoNotes,
				activeTrack,
			};
		}),
}));

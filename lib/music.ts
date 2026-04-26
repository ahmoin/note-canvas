export const NOTES_DESC = [
	"B",
	"A#",
	"A",
	"G#",
	"G",
	"F#",
	"F",
	"E",
	"D#",
	"D",
	"C#",
	"C",
] as const;

export const OCTAVES = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1] as const;

export const NOTE_SEMITONES = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] as const;

export function getNoteName(ri: number): string {
	return `${NOTES_DESC[ri % 12]}${OCTAVES[Math.floor(ri / 12)]}`;
}

export function rowToFreq(row: number): number {
	const oct = OCTAVES[Math.floor(row / 12)] ?? 0;
	const semitone = NOTE_SEMITONES[row % 12] ?? 0;
	const midi = (oct + 1) * 12 + semitone;
	return 440 * 2 ** ((midi - 69) / 12);
}

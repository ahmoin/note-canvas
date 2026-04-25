"use client";

import * as React from "react";
import {
	DRUM_PLAYERS,
	getAudioCtx,
	getTrackDest,
	playPianoNote,
	setTrackGainValue,
} from "@/lib/drums";
import { CHANNELS, STEPS, useDAWStore } from "@/lib/store";

const LOOKAHEAD = 0.1;
const INTERVAL = 25;
const PIANO_STEPS = 256;
const SUBS_PER_STEP = PIANO_STEPS / STEPS;

export function usePlayback() {
	const {
		isPlaying,
		bpm,
		patterns,
		mutedTracks,
		pianoNotes,
		tracks,
		trackVolumes,
		setCurrentTick,
		setPlayStartAudioTime,
	} = useDAWStore();

	const bpmRef = React.useRef(bpm);
	bpmRef.current = bpm;
	const patternsRef = React.useRef(patterns);
	patternsRef.current = patterns;
	const mutedRef = React.useRef(mutedTracks);
	mutedRef.current = mutedTracks;
	const pianoRef = React.useRef(pianoNotes);
	pianoRef.current = pianoNotes;
	const tracksRef = React.useRef(tracks);
	tracksRef.current = tracks;
	const trackVolumesRef = React.useRef(trackVolumes);
	trackVolumesRef.current = trackVolumes;

	const startRef = React.useRef<{
		audioTime: number;
		nextStepTime: number;
		nextStep: number;
	} | null>(null);
	const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
	const rafRef = React.useRef<number | null>(null);

	React.useEffect(() => {
		trackVolumes.forEach((vol, ti) => {
			setTrackGainValue(ti, vol / 100);
		});
	}, [trackVolumes]);

	React.useEffect(() => {
		if (!isPlaying) {
			if (intervalRef.current) clearInterval(intervalRef.current);
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			startRef.current = null;
			setPlayStartAudioTime(null);
			return;
		}

		const ac = getAudioCtx();
		const offset = 0.05;
		const audioTime = ac.currentTime + offset;
		startRef.current = { audioTime, nextStepTime: audioTime, nextStep: 0 };
		setPlayStartAudioTime(audioTime);

		intervalRef.current = setInterval(() => {
			const s = startRef.current;
			if (!s) return;
			const subDur = 60 / bpmRef.current / 4 / SUBS_PER_STEP;
			while (s.nextStepTime < ac.currentTime + LOOKAHEAD) {
				const step = s.nextStep;
				const time = s.nextStepTime;
				const isDrumTick = step % SUBS_PER_STEP === 0;
				const drumStep = Math.floor(step / SUBS_PER_STEP) % STEPS;

				patternsRef.current.forEach((pat, ti) => {
					if (mutedRef.current[ti]) return;
					const dest = getTrackDest(ti);
					const subtype = tracksRef.current[ti]?.subtype;
					if (subtype === "wave") {
						const notes = pianoRef.current[ti];
						if (notes) {
							Object.keys(notes).forEach((k) => {
								const ci = parseInt(k.split("-")[1], 10);
								if (ci === step % PIANO_STEPS) {
									const ri = parseInt(k.split("-")[0], 10);
									playPianoNote(ri, time, 0.3, dest);
								}
							});
						}
					} else if (isDrumTick) {
						for (const ch of CHANNELS) {
							if (pat[ch]?.[drumStep]) DRUM_PLAYERS[ch]?.(time, dest);
						}
					}
				});

				s.nextStep = (step + 1) % PIANO_STEPS;
				s.nextStepTime += subDur;
			}
		}, INTERVAL);

		const drawCaret = () => {
			const s = startRef.current;
			if (s) {
				const drumStepDur = 60 / bpmRef.current / 4;
				const elapsed = Math.max(0, ac.currentTime - s.audioTime);
				setCurrentTick(Math.floor(elapsed / drumStepDur) % STEPS);
			}
			rafRef.current = requestAnimationFrame(drawCaret);
		};
		rafRef.current = requestAnimationFrame(drawCaret);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [isPlaying, setCurrentTick, setPlayStartAudioTime]);
}

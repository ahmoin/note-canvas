"use client";

import { PlusIcon } from "@phosphor-icons/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { DRUM_PLAYERS, getAudioCtx } from "@/lib/drums";
import { CHANNELS, STEPS, type TrackItem, useDAWStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const LOOKAHEAD = 0.1;
const INTERVAL = 25;
const STEP_PX = 25;

function StepButton({
	active,
	isCaret,
	beat,
	onClick,
}: {
	active: boolean;
	isCaret: boolean;
	beat: number;
	onClick: () => void;
}) {
	const inactiveBg =
		beat % 2 === 0
			? "bg-white/[0.12] hover:bg-white/[0.17]"
			: "bg-white/[0.07] hover:bg-white/10";
	return (
		<div className="cursor-pointer px-1" onClick={onClick}>
			<div
				className={cn(
					"relative h-[27px] w-[17px] overflow-hidden rounded-[3px] px-[2px] py-[5px] transition-colors",
					active ? "bg-[#D61919] hover:bg-[#e62020]" : inactiveBg,
				)}
			>
				<div
					className={cn(
						"h-[3px] rounded-full",
						isCaret && active ? "bg-white" : "bg-background",
					)}
				/>
			</div>
		</div>
	);
}

export function ChannelRack() {
	const {
		isPlaying,
		bpm,
		setCurrentTick,
		patterns,
		activeTrack,
		tracks,
		toggleStep,
		setPlayStartAudioTime,
		mutedTracks,
	} = useDAWStore();
	const mutedTracksRef = React.useRef(mutedTracks);
	mutedTracksRef.current = mutedTracks;
	const patternsRef = React.useRef(patterns);
	patternsRef.current = patterns;

	const pattern = patterns[activeTrack] ?? patterns[0];
	const [caretStep, setCaretStep] = React.useState(0);

	const bpmRef = React.useRef(bpm);
	const startRef = React.useRef<{
		audioTime: number;
		nextStepTime: number;
		nextStep: number;
	} | null>(null);
	const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
	const rafRef = React.useRef<number | null>(null);

	bpmRef.current = bpm;

	React.useEffect(() => {
		if (!isPlaying) {
			if (intervalRef.current) clearInterval(intervalRef.current);
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			startRef.current = null;
			setCaretStep(0);
			setCurrentTick(0);
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
			const stepDur = 60 / bpmRef.current / 4;
			while (s.nextStepTime < ac.currentTime + LOOKAHEAD) {
				const step = s.nextStep;
				const time = s.nextStepTime;
				patternsRef.current.forEach((pat, ti) => {
					if (!mutedTracksRef.current[ti]) {
						for (const ch of CHANNELS) {
							if (pat[ch]?.[step]) DRUM_PLAYERS[ch]?.(time);
						}
					}
				});
				s.nextStep = (step + 1) % STEPS;
				s.nextStepTime += stepDur;
			}
		}, INTERVAL);

		const drawCaret = () => {
			const s = startRef.current;
			if (s) {
				const stepDur = 60 / bpmRef.current / 4;
				const elapsed = Math.max(0, ac.currentTime - s.audioTime);
				const visualStep = Math.floor(elapsed / stepDur) % STEPS;
				setCaretStep(visualStep);
				setCurrentTick(visualStep);
			}
			rafRef.current = requestAnimationFrame(drawCaret);
		};
		rafRef.current = requestAnimationFrame(drawCaret);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [isPlaying, setCurrentTick]);

	const toggle = (channel: string, step: number) => toggleStep(channel, step);

	const triangleLeft = caretStep * STEP_PX + 7;

	return (
		<div className="flex h-[286px] shrink-0 flex-col border-t bg-background">
			<div className="flex h-8 shrink-0 items-center justify-between border-b px-3">
				<span className="text-xs font-medium tracking-wide">
					Channel Rack — {tracks[activeTrack]?.name ?? "No Track"}
				</span>
				<Button variant="ghost" size="icon" className="size-6">
					<PlusIcon className="size-3" />
				</Button>
			</div>

			<div className="flex flex-1 overflow-hidden">
				<div className="flex w-36 shrink-0 flex-col border-r">
					<div className="h-5 shrink-0 border-b" />
					{CHANNELS.map((ch) => (
						<div
							key={ch}
							className="flex h-[39px] shrink-0 items-center border-b px-3 last:border-0"
						>
							<span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
								{ch}
							</span>
						</div>
					))}
				</div>

				<div className="flex-1 overflow-x-auto overflow-y-hidden">
					<div className="relative flex h-5 shrink-0 items-end border-b">
						{Array.from({ length: STEPS / 4 }, (_, i) => (
							<div key={i} className="flex w-[100px] shrink-0 items-center">
								<span className="pl-1 text-[10px] tabular-nums text-muted-foreground">
									{i + 1}
								</span>
							</div>
						))}
						<div
							className="pointer-events-none absolute bottom-0 h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-[#D61919]"
							style={{ left: triangleLeft }}
						/>
					</div>

					{CHANNELS.map((ch) => (
						<div
							key={ch}
							className="flex h-[39px] items-center border-b last:border-0"
						>
							{pattern[ch].map((active, si) => (
								<StepButton
									key={si}
									active={active}
									isCaret={si === caretStep}
									beat={Math.floor(si / 4)}
									onClick={() => toggle(ch, si)}
								/>
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

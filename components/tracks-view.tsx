"use client";

import { Headphones, Play, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { getAudioCtx } from "@/lib/drums";
import { CHANNELS, type Pattern, useDAWStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const BEAT_PX = 32;
const BAR_PX = BEAT_PX * 4;
const TOTAL_BARS = 16;

function ClipPreview({ pattern }: { pattern: Pattern }) {
	return (
		<div className="flex h-full w-full flex-col gap-px px-1.5 py-1.5">
			{CHANNELS.map((ch) => (
				<div key={ch} className="flex flex-1 gap-px">
					{pattern[ch].map((active, si) => (
						<div
							key={si}
							className={cn(
								"flex-1 rounded-[1px]",
								active ? "bg-red-400/80" : "bg-transparent",
							)}
						/>
					))}
				</div>
			))}
		</div>
	);
}

function Knob({ label }: { label: string }) {
	return (
		<div className="group relative flex size-7 cursor-pointer items-center justify-center rounded-full bg-[#2a1212] shadow-inner ring-1 ring-red-900/60">
			<div className="h-2.5 w-[2px] -translate-y-[1px] rounded-full bg-red-300/80" />
			<span className="absolute -bottom-3.5 text-[8px] text-red-400/60 opacity-0 group-hover:opacity-100">
				{label}
			</span>
		</div>
	);
}

const TRACKS = [
	{ name: "Drum Track", border: "border-l-red-600" },
	{ name: "Bass", border: "border-l-red-500" },
	{ name: "Lead Synth", border: "border-l-rose-500" },
];

function rulerBeats() {
	const beats: { label: string; isMajor: boolean }[] = [];
	for (let bar = 0; bar < TOTAL_BARS; bar++) {
		beats.push({ label: String(bar + 1), isMajor: true });
		beats.push({ label: `${bar + 1}.2`, isMajor: false });
		beats.push({ label: `${bar + 1}.3`, isMajor: false });
		beats.push({ label: `${bar + 1}.4`, isMajor: false });
	}
	return beats;
}

const RULER_BEATS = rulerBeats();

export function TracksView() {
	const { pattern, isPlaying, bpm, playStartAudioTime } = useDAWStore();
	const playheadRef = React.useRef<HTMLDivElement>(null);
	const rafRef = React.useRef<number | null>(null);
	const bpmRef = React.useRef(bpm);
	bpmRef.current = bpm;

	React.useEffect(() => {
		if (!isPlaying || playStartAudioTime == null) {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			if (playheadRef.current)
				playheadRef.current.style.transform = "translateX(0px)";
			return;
		}

		const ac = getAudioCtx();

		const draw = () => {
			if (playheadRef.current) {
				const elapsed = Math.max(0, ac.currentTime - playStartAudioTime);
				const beats = elapsed * (bpmRef.current / 60);
				const px = beats * BEAT_PX;
				playheadRef.current.style.transform = `translateX(${px}px)`;
			}
			rafRef.current = requestAnimationFrame(draw);
		};
		rafRef.current = requestAnimationFrame(draw);

		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [isPlaying, playStartAudioTime]);

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="flex h-8 shrink-0 items-center justify-end border-b px-2">
				<Button variant="ghost" size="icon" className="size-6">
					<Plus className="size-3" />
				</Button>
			</div>

			<div className="flex flex-1 overflow-hidden">
				<div className="flex w-48 shrink-0 flex-col border-r">
					<div className="h-6 shrink-0 border-b" />
					{TRACKS.map((track, ti) => (
						<div
							key={ti}
							className={cn(
								"flex h-16 shrink-0 flex-col justify-between border-b border-l-2 bg-[#1a0f0f] px-2 py-1.5",
								track.border,
							)}
						>
							<div className="flex items-center gap-1.5">
								<Play className="size-3 fill-red-300 text-red-300" />
								<span className="text-xs font-medium text-red-100">
									{track.name}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Knob label="VOL" />
								<Knob label="PAN" />
								<div className="size-2 rounded-full bg-white/20" />
								<Headphones className="size-3.5 text-red-400/70" />
								<div className="size-2 rounded-full bg-green-400 shadow-[0_0_4px_#4ade80]" />
							</div>
						</div>
					))}
				</div>

				<div className="relative flex-1 overflow-x-auto overflow-y-hidden">
					<div
						className="flex h-6 shrink-0 items-end border-b"
						style={{ width: TOTAL_BARS * BAR_PX }}
					>
						{RULER_BEATS.map((b, i) => (
							<div
								key={i}
								className="relative shrink-0 border-l"
								style={{
									width: BEAT_PX,
									borderColor: b.isMajor
										? "rgb(255 255 255 / 0.2)"
										: "rgb(255 255 255 / 0.07)",
								}}
							>
								<span
									className={cn(
										"absolute bottom-0.5 left-0.5 text-[9px] tabular-nums leading-none",
										b.isMajor ? "text-white/60" : "text-white/25",
									)}
								>
									{b.label}
								</span>
							</div>
						))}
					</div>

					{TRACKS.map((_, ti) => (
						<div
							key={ti}
							className="flex h-16 items-center border-b"
							style={{ width: TOTAL_BARS * BAR_PX }}
						>
							<div
								className="mx-1 h-[52px] overflow-hidden rounded-[3px] bg-[#2d1010] ring-1 ring-red-600/40"
								style={{ width: BAR_PX * 8 - 8 }}
							>
								<ClipPreview pattern={pattern} />
							</div>
						</div>
					))}

					<div
						ref={playheadRef}
						className="pointer-events-none absolute left-0 top-0 flex h-full flex-col items-center"
						style={{ willChange: "transform" }}
					>
						<div className="h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-white" />
						<div className="w-px flex-1 border-l border-dashed border-white/70" />
					</div>
				</div>
			</div>
		</div>
	);
}

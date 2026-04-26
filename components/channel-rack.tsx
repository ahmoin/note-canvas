"use client";

import { PlusIcon } from "@phosphor-icons/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useFlavor } from "@/hooks/use-flavor";
import { getAudioCtx } from "@/lib/audio";
import { FLAVOR_VARS, TRACK_PALETTE } from "@/lib/catppuccin";
import { CHANNELS, STEPS, useDAWStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STEP_PX = 25;

const StepButton = React.memo(function StepButton({
	active,
	beat,
	color,
	stepIndex,
	channel,
	onStepMouseDown,
	onStepMouseEnter,
}: {
	active: boolean;
	beat: number;
	color: string;
	stepIndex: number;
	channel: string;
	onStepMouseDown: (channel: string, step: number) => void;
	onStepMouseEnter: (channel: string, step: number) => void;
}) {
	const inactiveBg =
		beat % 2 === 0
			? "bg-white/[0.12] hover:bg-white/[0.17]"
			: "bg-white/[0.07] hover:bg-white/10";
	return (
		<div
			role="button"
			tabIndex={0}
			data-step={stepIndex}
			data-active={active ? "1" : "0"}
			className="cursor-pointer select-none px-1"
			onMouseDown={() => onStepMouseDown(channel, stepIndex)}
			onMouseEnter={() => onStepMouseEnter(channel, stepIndex)}
			onKeyDown={(e) =>
				e.key === "Enter" && onStepMouseDown(channel, stepIndex)
			}
		>
			<div
				className={cn(
					"relative h-[27px] w-[17px] overflow-hidden rounded-[3px] px-[2px] py-[5px] transition-colors",
					!active && inactiveBg,
				)}
				style={
					active
						? {
								backgroundColor: `color-mix(in srgb, ${color} 80%, transparent)`,
							}
						: undefined
				}
			>
				<div className="step-slit h-[3px] rounded-full bg-background" />
			</div>
		</div>
	);
});

export function ChannelRack() {
	const {
		isPlaying,
		bpm,
		patterns,
		activeTrack,
		tracks,
		toggleStep,
		setStep,
		playStartAudioTime,
	} = useDAWStore();

	const flavor = useFlavor();
	const vars = FLAVOR_VARS[flavor];
	const trackColor = vars[TRACK_PALETTE[activeTrack % TRACK_PALETTE.length]];

	const pattern = patterns[activeTrack] ?? patterns[0];
	const caretRef = React.useRef<HTMLDivElement>(null);
	const gridRef = React.useRef<HTMLDivElement>(null);
	const prevStepRef = React.useRef(-1);
	const bpmRef = React.useRef(bpm);
	bpmRef.current = bpm;
	const rafRef = React.useRef<number | null>(null);

	React.useEffect(() => {
		if (!isPlaying || playStartAudioTime == null) {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			return;
		}
		const ac = getAudioCtx();
		const draw = () => {
			const stepDur = 60 / bpmRef.current / 4;
			const elapsed = Math.max(0, ac.currentTime - playStartAudioTime);
			const step = Math.floor(elapsed / stepDur) % STEPS;
			if (caretRef.current) {
				caretRef.current.style.left = `${step * STEP_PX + 7}px`;
			}
			if (step !== prevStepRef.current && gridRef.current) {
				gridRef.current
					.querySelectorAll<HTMLElement>(
						`[data-step="${prevStepRef.current}"] .step-slit`,
					)
					.forEach((el) => {
						el.style.backgroundColor = "";
					});
				gridRef.current
					.querySelectorAll<HTMLElement>(
						`[data-step="${step}"][data-active="1"] .step-slit`,
					)
					.forEach((el) => {
						el.style.backgroundColor = "white";
					});
				prevStepRef.current = step;
			}
			rafRef.current = requestAnimationFrame(draw);
		};
		rafRef.current = requestAnimationFrame(draw);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [isPlaying, playStartAudioTime]);

	const patternRef = React.useRef(pattern);
	patternRef.current = pattern;

	const dragRef = React.useRef<{ intent: boolean } | null>(null);

	React.useEffect(() => {
		const onMouseUp = () => {
			dragRef.current = null;
		};
		window.addEventListener("mouseup", onMouseUp);
		return () => window.removeEventListener("mouseup", onMouseUp);
	}, []);

	const handleStepMouseDown = React.useCallback(
		(channel: string, step: number) => {
			const currentlyActive = patternRef.current[channel]?.[step] ?? false;
			dragRef.current = { intent: !currentlyActive };
			toggleStep(channel, step);
		},
		[toggleStep],
	);

	const handleStepMouseEnter = React.useCallback(
		(channel: string, step: number) => {
			if (!dragRef.current) return;
			const currentlyActive = patternRef.current[channel]?.[step] ?? false;
			if (currentlyActive !== dragRef.current.intent) {
				setStep(channel, step, dragRef.current.intent);
			}
		},
		[setStep],
	);

	return (
		<div className="flex h-[286px] shrink-0 flex-col border-t bg-background">
			<div className="flex h-8 shrink-0 items-center justify-between border-b px-3">
				<span className="text-xs font-medium tracking-wide">
					Channel Rack - {tracks[activeTrack]?.name ?? "No Track"}
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
							ref={caretRef}
							className="pointer-events-none absolute bottom-0 h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent"
							style={{ borderTopColor: trackColor, left: 7 }}
						/>
					</div>

					<div ref={gridRef}>
						{CHANNELS.map((ch) => (
							<div
								key={ch}
								className="flex h-[39px] items-center border-b last:border-0"
							>
								{pattern[ch].map((active, si) => (
									<StepButton
										key={si}
										active={active}
										beat={Math.floor(si / 4)}
										color={trackColor}
										stepIndex={si}
										channel={ch}
										onStepMouseDown={handleStepMouseDown}
										onStepMouseEnter={handleStepMouseEnter}
									/>
								))}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

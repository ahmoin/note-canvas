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

const CH_KNOB_SIZE = 20;
const CH_KNOB_R = 7;
const CH_KNOB_CX = CH_KNOB_SIZE / 2;
const CH_KNOB_CY = CH_KNOB_SIZE / 2;

function chKnobXY(deg: number) {
	return {
		x: CH_KNOB_CX + CH_KNOB_R * Math.sin((deg * Math.PI) / 180),
		y: CH_KNOB_CY - CH_KNOB_R * Math.cos((deg * Math.PI) / 180),
	};
}

function ChannelKnob({
	label,
	value,
	min = 0,
	max = 100,
	onChange,
	color,
}: {
	label: string;
	value: number;
	min?: number;
	max?: number;
	onChange: (v: number) => void;
	color: string;
}) {
	const dragRef = React.useRef<{ y: number; value: number } | null>(null);
	const ratio = (value - min) / (max - min);
	const angle = -135 + ratio * 270;
	const span = angle + 135;
	const startPt = chKnobXY(-135);
	const bgEndPt = chKnobXY(135);
	const valEndPt = chKnobXY(angle);
	const fmt = (n: number) => n.toFixed(2);
	const bgPath = `M ${fmt(startPt.x)} ${fmt(startPt.y)} A ${CH_KNOB_R} ${CH_KNOB_R} 0 1 1 ${fmt(bgEndPt.x)} ${fmt(bgEndPt.y)}`;
	const valPath =
		ratio > 0.002
			? `M ${fmt(startPt.x)} ${fmt(startPt.y)} A ${CH_KNOB_R} ${CH_KNOB_R} 0 ${span > 180 ? 1 : 0} 1 ${fmt(valEndPt.x)} ${fmt(valEndPt.y)}`
			: null;
	const displayValue =
		label === "PAN"
			? value === 0
				? "C"
				: value > 0
					? `R${Math.round(value)}`
					: `L${Math.round(-value)}`
			: `${Math.round(value)}`;
	const onMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		dragRef.current = { y: e.clientY, value };
		const onMouseMove = (mv: MouseEvent) => {
			if (!dragRef.current) return;
			const delta = (dragRef.current.y - mv.clientY) / 100;
			onChange(Math.max(min, Math.min(max, dragRef.current.value + delta * (max - min))));
		};
		const onMouseUp = () => {
			dragRef.current = null;
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
	};
	return (
		<div
			className="group relative cursor-ns-resize select-none"
			style={{ width: CH_KNOB_SIZE, height: CH_KNOB_SIZE }}
			onMouseDown={onMouseDown}
			title={`${label}: ${displayValue}`}
		>
			<svg width={CH_KNOB_SIZE} height={CH_KNOB_SIZE} className="absolute inset-0">
				<title>{label}</title>
				<path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeLinecap="round" />
				{valPath && (
					<path d={valPath} fill="none" style={{ stroke: `color-mix(in srgb, ${color} 65%, transparent)` }} strokeWidth="1.5" strokeLinecap="round" />
				)}
			</svg>
			<div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-[#2e1111] to-[#150808] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] ring-1 ring-black/70" />
			<div
				className="absolute inset-[3px] flex items-start justify-center pt-[2px]"
				style={{ transform: `rotate(${angle}deg)` }}
			>
				<div className="h-[5px] w-[1.5px] rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${color} 90%, white)` }} />
			</div>
		</div>
	);
}

const PATTERN_LENGTH_OPTIONS = [2, 4, 8, 16] as const;

const StepButton = React.memo(function StepButton({
	active,
	beat,
	color,
	stepIndex,
	channel,
	withinLength,
	onStepMouseDown,
	onStepMouseEnter,
}: {
	active: boolean;
	beat: number;
	color: string;
	stepIndex: number;
	channel: string;
	withinLength: boolean;
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
			style={{ opacity: withinLength ? 1 : 0.25 }}
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
		patternLengthBars,
		trackLoop,
		setPatternLength,
		setTrackLoop,
		channelVolumes,
		channelPans,
		channelMuted,
		setChannelVolume,
		setChannelPan,
		toggleChannelMute,
	} = useDAWStore();

	const activeLengthBars = patternLengthBars[activeTrack] ?? 16;
	const activeSteps = activeLengthBars * 2;
	const loopEnabled = trackLoop[activeTrack] ?? true;

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
				<div className="flex items-center gap-1">
					{PATTERN_LENGTH_OPTIONS.map((b) => (
						<button
							key={b}
							type="button"
							onClick={() => setPatternLength(activeTrack, b)}
							className={cn(
								"rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
								activeLengthBars === b
									? "bg-white/20 text-white"
									: "text-white/35 hover:text-white/60",
							)}
						>
							{b}
						</button>
					))}
					<div className="mx-1 h-3 w-px bg-white/10" />
					<button
						type="button"
						onClick={() => setTrackLoop(activeTrack, !loopEnabled)}
						className={cn(
							"rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
							loopEnabled
								? "bg-white/20 text-white"
								: "text-white/35 hover:text-white/60",
						)}
					>
						LOOP
					</button>
					<Button variant="ghost" size="icon" className="size-6">
						<PlusIcon className="size-3" />
					</Button>
				</div>
			</div>

			<div className="flex flex-1 overflow-hidden">
				<div className="flex w-36 shrink-0 flex-col border-r">
					<div className="h-5 shrink-0 border-b" />
					{CHANNELS.map((ch) => {
						const vol = channelVolumes[activeTrack]?.[ch] ?? 82.5;
						const pan = channelPans[activeTrack]?.[ch] ?? 0;
						const muted = channelMuted[activeTrack]?.[ch] ?? false;
						return (
							<div
								key={ch}
								className="flex h-[39px] shrink-0 flex-col justify-between border-b px-2 py-1 last:border-0"
							>
								<span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">
									{ch}
								</span>
								<div className="flex items-center gap-1.5">
									<ChannelKnob
										label="PAN"
										value={pan}
										min={-50}
										max={50}
										onChange={(v) => setChannelPan(activeTrack, ch, v)}
										color={trackColor}
									/>
									<ChannelKnob
										label="VOL"
										value={vol}
										onChange={(v) => setChannelVolume(activeTrack, ch, v)}
										color={trackColor}
									/>
									<button
										type="button"
										onClick={() => toggleChannelMute(activeTrack, ch)}
										title={muted ? "Unmute" : "Mute"}
										className={cn(
											"size-2 rounded-full transition-colors",
											muted
												? "bg-white/20"
												: "bg-green-400 shadow-[0_0_4px_#4ade80]",
										)}
									/>
								</div>
							</div>
						);
					})}
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
										withinLength={si < activeSteps}
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

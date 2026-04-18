"use client";

import {
	HeadphonesIcon,
	PlayIcon,
	PlusIcon,
	SidebarSimpleIcon,
} from "@phosphor-icons/react";
import * as React from "react";
import { ClipMenu } from "@/components/clip-menu";
import { Button } from "@/components/ui/button";
import { useFlavor } from "@/hooks/use-flavor";
import { FLAVOR_VARS, TRACK_PALETTE } from "@/lib/catppuccin";
import { getAudioCtx } from "@/lib/drums";
import {
	CHANNELS,
	type Pattern,
	type TrackSubtype,
	useDAWStore,
} from "@/lib/store";
import { cn } from "@/lib/utils";

const BEAT_PX = 32;
const BAR_PX = BEAT_PX * 4;
const TOTAL_BARS = 16;
const TOTAL_SUBS = 256;

function ClipPreview({
	pattern,
	red,
	subtype,
	pianoNotes,
}: {
	pattern: Pattern;
	red: string;
	subtype: TrackSubtype;
	pianoNotes: Record<string, boolean>;
}) {
	if (subtype === "wave") {
		const noteKeys = Object.keys(pianoNotes);
		if (noteKeys.length === 0) {
			return (
				<div className="flex h-full w-full items-center justify-center">
					<span className="text-[8px] text-white/20">no notes</span>
				</div>
			);
		}
		const rows = noteKeys.map((k) => parseInt(k.split("-")[0]));
		const minRow = Math.min(...rows);
		const maxRow = Math.max(...rows);
		const rowSpan = Math.max(maxRow - minRow + 1, 1);
		return (
			<div className="relative h-full w-full overflow-hidden px-1 py-1">
				{noteKeys.map((k) => {
					const r = parseInt(k.split("-")[0]);
					const s = parseInt(k.split("-")[1]);
					const top = ((r - minRow) / rowSpan) * 100;
					const left = (s / TOTAL_SUBS) * 100;
					return (
						<div
							key={k}
							className="absolute h-[2px] rounded-[1px]"
							style={{
								top: `${top}%`,
								left: `${left}%`,
								width: "3%",
								backgroundColor: `color-mix(in srgb, ${red} 85%, transparent)`,
							}}
						/>
					);
				})}
			</div>
		);
	}

	return (
		<div className="flex h-full w-full flex-col gap-px px-1.5 py-1.5">
			{CHANNELS.map((ch) => (
				<div key={ch} className="flex flex-1 gap-px">
					{pattern[ch].map((active, si) => (
						<div
							key={si}
							className="flex-1 rounded-[1px]"
							style={{
								backgroundColor: active
									? `color-mix(in srgb, ${red} 80%, transparent)`
									: "transparent",
							}}
						/>
					))}
				</div>
			))}
		</div>
	);
}

const KNOB_SIZE = 28;
const KNOB_R = 11;
const KNOB_CX = KNOB_SIZE / 2;
const KNOB_CY = KNOB_SIZE / 2;

function knobXY(deg: number) {
	return {
		x: KNOB_CX + KNOB_R * Math.sin((deg * Math.PI) / 180),
		y: KNOB_CY - KNOB_R * Math.cos((deg * Math.PI) / 180),
	};
}

function Knob({
	label,
	value,
	min = 0,
	max = 100,
	onChange,
	red,
}: {
	label: string;
	value: number;
	min?: number;
	max?: number;
	onChange: (v: number) => void;
	red: string;
}) {
	const dragRef = React.useRef<{ y: number; value: number } | null>(null);

	const ratio = (value - min) / (max - min);
	const angle = -135 + ratio * 270;
	const span = angle + 135;

	const startPt = knobXY(-135);
	const bgEndPt = knobXY(135);
	const valEndPt = knobXY(angle);

	const fmt = (n: number) => n.toFixed(2);
	const bgPath = `M ${fmt(startPt.x)} ${fmt(startPt.y)} A ${KNOB_R} ${KNOB_R} 0 1 1 ${fmt(bgEndPt.x)} ${fmt(bgEndPt.y)}`;
	const valPath =
		ratio > 0.002
			? `M ${fmt(startPt.x)} ${fmt(startPt.y)} A ${KNOB_R} ${KNOB_R} 0 ${span > 180 ? 1 : 0} 1 ${fmt(valEndPt.x)} ${fmt(valEndPt.y)}`
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
			onChange(
				Math.max(
					min,
					Math.min(max, dragRef.current.value + delta * (max - min)),
				),
			);
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
			style={{ width: KNOB_SIZE, height: KNOB_SIZE }}
			onMouseDown={onMouseDown}
			title={`${label}: ${displayValue}`}
		>
			<svg width={KNOB_SIZE} height={KNOB_SIZE} className="absolute inset-0">
				<path
					d={bgPath}
					fill="none"
					stroke="rgba(255,255,255,0.08)"
					strokeWidth="2"
					strokeLinecap="round"
				/>
				{valPath && (
					<path
						d={valPath}
						fill="none"
						style={{ stroke: `color-mix(in srgb, ${red} 65%, transparent)` }}
						strokeWidth="2"
						strokeLinecap="round"
					/>
				)}
			</svg>
			<div className="absolute inset-[4px] rounded-full bg-gradient-to-b from-[#2e1111] to-[#150808] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8),inset_0_-1px_1px_rgba(255,255,255,0.04)] ring-1 ring-black/70" />
			<div
				className="absolute inset-[4px] flex items-start justify-center pt-[3px]"
				style={{ transform: `rotate(${angle}deg)` }}
			>
				<div
					className="h-[7px] w-[2px] rounded-full"
					style={{ backgroundColor: `color-mix(in srgb, ${red} 90%, white)` }}
				/>
			</div>
			<span
				className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] opacity-0 group-hover:opacity-100"
				style={{ color: `color-mix(in srgb, ${red} 60%, transparent)` }}
			>
				{label}
			</span>
		</div>
	);
}

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

export function TracksView({
	showPanel,
	onTogglePanel,
}: {
	showPanel: boolean;
	onTogglePanel: () => void;
}) {
	const {
		tracks,
		patterns,
		activeTrack,
		isPlaying,
		bpm,
		playStartAudioTime,
		trackVolumes,
		trackPans,
		soloTrack,
		mutedTracks,
		pianoNotes,
		setTrackVolume,
		setTrackPan,
		setSoloTrack,
		toggleMuteTrack,
		addTrack,
		setActiveTrack,
	} = useDAWStore();
	const flavor = useFlavor();
	const vars = FLAVOR_VARS[flavor];
	const trackColors = tracks.map(
		(_, ti) => vars[TRACK_PALETTE[ti % TRACK_PALETTE.length]],
	);
	const [selectedClips, setSelectedClips] = React.useState<Set<number>>(
		new Set([0]),
	);
	const [isDragOver, setIsDragOver] = React.useState(false);

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
		try {
			const { name, type, subtype } = JSON.parse(
				e.dataTransfer.getData("text/plain"),
			);
			addTrack(name, type, subtype);
		} catch {}
	};

	const handleClipClick = (ti: number, e: React.MouseEvent) => {
		setActiveTrack(ti);
		setSelectedClips((prev) => {
			const next = new Set(e.ctrlKey || e.metaKey ? prev : []);
			if (next.has(ti)) next.delete(ti);
			else next.add(ti);
			return next;
		});
	};

	const playheadRef = React.useRef<HTMLDivElement>(null);
	const rafRef = React.useRef<number | null>(null);
	const bpmRef = React.useRef(bpm);
	bpmRef.current = bpm;

	React.useEffect(() => {
		if (!isPlaying || playStartAudioTime == null) {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
			<div className="flex h-8 shrink-0 items-center border-b px-2 gap-2">
				<Button
					variant="ghost"
					size="icon"
					className="size-6"
					onClick={onTogglePanel}
					title={showPanel ? "Hide panel" : "Show panel"}
				>
					<SidebarSimpleIcon className="size-3" />
				</Button>
				<div className="flex-1" />
				<Button variant="ghost" size="icon" className="size-6">
					<PlusIcon className="size-3" />
				</Button>
			</div>

			<div className="flex flex-1 overflow-hidden">
				<div className="flex w-48 shrink-0 flex-col border-r">
					<div className="h-6 shrink-0 border-b" />
					{tracks.map((track, ti) => {
						const color = trackColors[ti];
						return (
							<div
								key={ti}
								className="flex h-16 shrink-0 flex-col justify-between border-b border-l-[3px] bg-black/20 px-2 py-1.5"
								style={{ borderLeftColor: color }}
							>
								<div className="flex items-center gap-1.5">
									<PlayIcon className="size-3" style={{ fill: color, color }} />
									<span className="text-xs font-medium text-white/80">
										{track.name}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Knob
										label="PAN"
										value={trackPans[ti]}
										min={-50}
										max={50}
										onChange={(v) => setTrackPan(ti, v)}
										red={color}
									/>
									<Knob
										label="VOL"
										value={trackVolumes[ti]}
										onChange={(v) => setTrackVolume(ti, v)}
										red={color}
									/>
									<div className="size-2 rounded-full bg-white/20" />
									<button
										type="button"
										onClick={() => setSoloTrack(ti)}
										className="flex items-center justify-center rounded-sm p-0.5 transition-colors"
										title={soloTrack === ti ? "Unsolo" : "Solo"}
									>
										<HeadphonesIcon
											className="size-3.5"
											style={{
												color:
													soloTrack === ti
														? color
														: soloTrack !== null
															? `color-mix(in srgb, ${color} 25%, transparent)`
															: `color-mix(in srgb, ${color} 70%, transparent)`,
											}}
										/>
									</button>
									<button
										type="button"
										onClick={() => toggleMuteTrack(ti)}
										title={mutedTracks[ti] ? "Enable audio" : "Disable audio"}
										className={cn(
											"size-2 rounded-full transition-colors",
											mutedTracks[ti]
												? "bg-white/20"
												: "bg-green-400 shadow-[0_0_4px_#4ade80]",
										)}
									/>
								</div>
							</div>
						);
					})}
				</div>

				<div
					className={cn(
						"relative flex-1 overflow-x-auto overflow-y-hidden transition-colors",
						isDragOver && "bg-white/5",
					)}
					onClick={(e) => {
						if (e.target === e.currentTarget) setSelectedClips(new Set());
					}}
					onDragOver={(e) => {
						e.preventDefault();
						setIsDragOver(true);
					}}
					onDragLeave={() => setIsDragOver(false)}
					onDrop={handleDrop}
				>
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

					{tracks.map((track, ti) => {
						const color = trackColors[ti];
						return (
							<div
								key={ti}
								className="flex h-16 items-center border-b"
								style={{ width: TOTAL_BARS * BAR_PX }}
							>
								<div
									className="relative mx-1 h-[52px] cursor-pointer overflow-hidden rounded-sm transition-shadow"
									style={{
										width: BAR_PX * 8 - 8,
										backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
										boxShadow: selectedClips.has(ti)
											? `inset 0 0 0 2px ${color}`
											: `inset 0 0 0 1px color-mix(in srgb, ${color} 50%, transparent)`,
									}}
									onClick={(e) => handleClipClick(ti, e)}
								>
									<div className="absolute inset-0">
										<ClipPreview
											pattern={patterns[ti]}
											red={color}
											subtype={tracks[ti].subtype}
											pianoNotes={pianoNotes[ti] ?? {}}
										/>
									</div>
									<span
										className="absolute left-1.5 top-1 text-[9px] font-medium"
										style={{ color: `color-mix(in srgb, ${color} 90%, white)` }}
									>
										{track.name}
									</span>
									<ClipMenu>
										<button
											type="button"
											className="absolute right-1.5 top-1 text-[9px] text-white/30 hover:text-white/70 transition-colors"
											onClick={(e) => e.stopPropagation()}
										>
											•••
										</button>
									</ClipMenu>
								</div>
							</div>
						);
					})}

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

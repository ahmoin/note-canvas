"use client";

import * as React from "react";
import { useFlavor } from "@/hooks/use-flavor";
import { FLAVOR_VARS, TRACK_PALETTE } from "@/lib/catppuccin";
import { getAudioCtx, playPianoNote } from "@/lib/drums";
import { useDAWStore } from "@/lib/store";

const NOTES_DESC = [
	"B", "A#", "A", "G#", "G", "F#", "F", "E", "D#", "D", "C#", "C",
] as const;
const BLACK = new Set(["A#", "G#", "F#", "D#", "C#"]);
const OCTAVES = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1];

const ROW_H = 14;
const KEY_W = 34;
const BARS = 16;
const BPB = 4;
const SUBS = 4;
const BEAT_W = 32;
const SUB_W = BEAT_W / SUBS;
const TOTAL_SUBS = BARS * BPB * SUBS;
const TOTAL_W = BARS * BPB * BEAT_W;
const NOTE_LEN = 8;
const STEM_MAX_H = 34;
const DEFAULT_VEL = 100;

const VelocityHandle = React.memo(function VelocityHandle({
	sub,
	color,
	velocity,
	onVelocityChange,
}: {
	sub: number;
	color: string;
	velocity: number;
	onVelocityChange: (sub: number, vel: number) => void;
}) {
	const stemH = Math.round((velocity / 127) * STEM_MAX_H);
	const cx = sub * SUB_W + Math.round((NOTE_LEN * SUB_W) / 2) - 3;
	const startRef = React.useRef<{ y: number; vel: number } | null>(null);

	return (
		<div
			style={{
				position: "absolute",
				left: cx,
				bottom: 3,
				width: 6,
				height: 6 + stemH,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				cursor: "ns-resize",
				userSelect: "none",
			}}
			onPointerDown={(e) => {
				e.preventDefault();
				e.currentTarget.setPointerCapture(e.pointerId);
				startRef.current = { y: e.clientY, vel: velocity };
			}}
			onPointerMove={(e) => {
				if (!startRef.current) return;
				const dy = startRef.current.y - e.clientY;
				const newVel = Math.max(0, Math.min(127, Math.round(startRef.current.vel + (dy / STEM_MAX_H) * 127)));
				onVelocityChange(sub, newVel);
			}}
			onPointerUp={() => { startRef.current = null; }}
		>
			<div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
			{stemH > 0 && (
				<div style={{ width: 2, height: stemH, backgroundColor: `color-mix(in srgb, ${color} 70%, transparent)` }} />
			)}
		</div>
	);
});

function getNoteName(ri: number): string {
	return `${NOTES_DESC[ri % 12]}${OCTAVES[Math.floor(ri / 12)]}`;
}

function groupRuns(trackNotes: Record<string, boolean>, ri: number) {
	const subs = Object.keys(trackNotes)
		.filter((k) => k.startsWith(`${ri}-`))
		.map((k) => parseInt(k.split("-")[1]))
		.sort((a, b) => a - b);
	const runs: { start: number; end: number }[] = [];
	for (const sub of subs) {
		if (runs.length > 0 && runs[runs.length - 1].end >= sub - 1) {
			runs[runs.length - 1].end = sub;
		} else {
			runs.push({ start: sub, end: sub });
		}
	}
	return runs;
}

function gridBg(): string {
	const lines: string[] = [];
	for (let ci = 0; ci < TOTAL_SUBS; ci++) {
		const x = ci * SUB_W;
		const isBar = ci % (SUBS * BPB) === 0;
		const isBeat = ci % SUBS === 0;
		const color = isBar
			? "rgba(255,255,255,0.18)"
			: isBeat
				? "rgba(255,255,255,0.07)"
				: "rgba(255,255,255,0.025)";
		lines.push(`linear-gradient(${color},${color}) ${x}px 0 / 1px 100% no-repeat`);
	}
	return lines.join(",");
}
const GRID_BG = gridBg();

function PianoKey({
	note,
	octave,
	color,
	hasNotes,
}: {
	note: string;
	octave: number;
	color: string;
	hasNotes: boolean;
}) {
	const isBlack = BLACK.has(note);
	const isC = note === "C";
	const isE = note === "E";

	if (isBlack) {
		return (
			<div
				style={{
					height: ROW_H,
					width: KEY_W,
					flexShrink: 0,
					borderBottom: "1px solid #000",
					backgroundColor: "#1c1c24",
					position: "relative",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						position: "absolute",
						left: 0,
						top: 0,
						width: "65%",
						height: "100%",
						backgroundColor: hasNotes
							? `color-mix(in srgb, ${color} 55%, #08080f)`
							: "#08080f",
						borderRight: "1px solid rgba(255,255,255,0.06)",
					}}
				/>
			</div>
		);
	}

	return (
		<div
			style={{
				height: ROW_H,
				width: KEY_W,
				flexShrink: 0,
				borderBottom: `1px solid ${isC || isE ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.35)"}`,
				backgroundColor: hasNotes
					? `color-mix(in srgb, ${color} 22%, #3c3c50)`
					: "#3c3c50",
				position: "relative",
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-end",
				paddingRight: 4,
			}}
		>
			<div
				style={{
					position: "absolute",
					right: 0,
					top: 0,
					width: 1,
					height: "100%",
					backgroundColor: "rgba(255,255,255,0.1)",
				}}
			/>
			{isC && (
				<span
					style={{
						fontSize: 8,
						fontWeight: 700,
						fontFamily: "monospace",
						color: hasNotes ? color : "rgba(255,255,255,0.38)",
						userSelect: "none",
					}}
				>
					C{octave}
				</span>
			)}
		</div>
	);
}

const GridRow = React.memo(function GridRow({
	ri,
	note,
	trackNotes,
	color,
	onRowClick,
}: {
	ri: number;
	note: string;
	trackNotes: Record<string, boolean>;
	color: string;
	onRowClick: (ri: number, e: React.MouseEvent<HTMLDivElement>) => void;
}) {
	const isBlack = BLACK.has(note);
	const isC = note === "C";
	const runs = groupRuns(trackNotes, ri);
	const noteName = getNoteName(ri);

	return (
		<div
			onClick={(e) => onRowClick(ri, e)}
			style={{
				position: "relative",
				height: ROW_H,
				width: TOTAL_W,
				flexShrink: 0,
				backgroundColor: isC
					? "rgba(255,255,255,0.055)"
					: isBlack
						? "rgba(0,0,0,0.38)"
						: "rgba(255,255,255,0.018)",
				borderBottom: `1px solid ${isBlack ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.035)"}`,
				backgroundImage: GRID_BG,
				cursor: "crosshair",
				boxSizing: "border-box",
			}}
		>
			{runs.map(({ start, end }) => {
				const w = (end - start + 1) * SUB_W;
				return (
					<div
						key={start}
						style={{
							position: "absolute",
							left: start * SUB_W + 1,
							top: 1,
							width: w - 2,
							height: ROW_H - 3,
							background: `linear-gradient(to bottom, color-mix(in srgb, ${color} 85%, white) 0%, ${color} 100%)`,
							borderRadius: 2,
							overflow: "hidden",
							display: "flex",
							alignItems: "center",
							paddingLeft: 3,
							pointerEvents: "none",
							boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.25)`,
						}}
					>
						{w >= 18 && (
							<span
								style={{
									fontSize: 8,
									fontWeight: 600,
									color: "rgba(255,255,255,0.95)",
									userSelect: "none",
									lineHeight: 1,
									whiteSpace: "nowrap",
									textShadow: "0 1px 2px rgba(0,0,0,0.4)",
								}}
							>
								{noteName}
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
});

export function PianoRoll() {
	const {
		activeTrack,
		tracks,
		pianoNotes,
		placeNote,
		noteVelocities,
		setNoteVelocity,
		isPlaying,
		playStartAudioTime,
		bpm,
	} = useDAWStore();
	const flavor = useFlavor();
	const vars = FLAVOR_VARS[flavor];
	const color = vars[TRACK_PALETTE[activeTrack % TRACK_PALETTE.length]];
	const trackNotes = pianoNotes[activeTrack] ?? {};
	const trackVelocities = noteVelocities[activeTrack] ?? {};

	const rows = React.useMemo(
		() => OCTAVES.flatMap((oct) => NOTES_DESC.map((note) => ({ note, octave: oct }))),
		[],
	);

	const activeRows = React.useMemo(() => {
		const set = new Set<number>();
		Object.keys(trackNotes).forEach((k) => set.add(parseInt(k.split("-")[0])));
		return set;
	}, [trackNotes]);

	const totalH = rows.length * ROW_H;

	const scrollContainerRef = React.useRef<HTMLDivElement>(null);
	const playheadRef = React.useRef<HTMLDivElement>(null);
	const rafRef = React.useRef<number | null>(null);
	const bpmRef = React.useRef(bpm);
	bpmRef.current = bpm;

	React.useLayoutEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;
		const keys = Object.keys(trackNotes);
		let targetRow: number;
		if (keys.length > 0) {
			const rowNums = keys.map((k) => parseInt(k.split("-")[0]));
			targetRow = Math.floor((Math.min(...rowNums) + Math.max(...rowNums)) / 2);
		} else {
			targetRow = 48;
		}
		const targetY = targetRow * ROW_H - container.clientHeight / 2 + 20;
		container.scrollTop = Math.max(0, targetY);
	}, [activeTrack]); // eslint-disable-line react-hooks/exhaustive-deps

	React.useEffect(() => {
		if (!isPlaying || playStartAudioTime == null) {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			return;
		}
		const ac = getAudioCtx();
		const draw = () => {
			if (playheadRef.current) {
				const elapsed = Math.max(0, ac.currentTime - playStartAudioTime);
				const px = elapsed * (bpmRef.current / 60) * BEAT_W;
				playheadRef.current.style.transform = `translateX(${px % TOTAL_W}px)`;
			}
			rafRef.current = requestAnimationFrame(draw);
		};
		rafRef.current = requestAnimationFrame(draw);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [isPlaying, playStartAudioTime]);

	const handleVelocityChange = React.useCallback(
		(sub: number, vel: number) => setNoteVelocity(activeTrack, sub, vel),
		[activeTrack, setNoteVelocity],
	);

	const handleRowClick = React.useCallback(
		(ri: number, e: React.MouseEvent<HTMLDivElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const ci = Math.floor(x / SUB_W);
			const snapSub = Math.floor(ci / NOTE_LEN) * NOTE_LEN;
			if (snapSub >= 0 && snapSub < TOTAL_SUBS) {
				const hasNote = !!trackNotes[`${ri}-${snapSub}`];
				placeNote(activeTrack, ri, snapSub, NOTE_LEN, !hasNote);
				if (!hasNote) {
					const ac = getAudioCtx();
					playPianoNote(ri, ac.currentTime);
				}
			}
		},
		[activeTrack, trackNotes, placeNote],
	);

	return (
		<div
			className="flex shrink-0 flex-col border-t"
			style={{ height: 286, backgroundColor: vars.base }}
		>
			<div
				className="flex h-8 shrink-0 items-center border-b px-3"
				style={{ borderColor: "rgba(255,255,255,0.08)" }}
			>
				<span className="text-xs font-medium" style={{ color: vars.text }}>
					Piano Roll — {tracks[activeTrack]?.name ?? "No Track"}
				</span>
			</div>

			<div className="scrollbar-none flex-1 overflow-auto" ref={scrollContainerRef} style={{ position: "relative" }}>
				<div style={{ width: KEY_W + TOTAL_W, minHeight: "100%" }}>
					<div
						style={{
							position: "sticky",
							top: 0,
							zIndex: 20,
							display: "flex",
							height: 20,
							backgroundColor: vars.mantle,
							borderBottom: "1px solid rgba(255,255,255,0.08)",
						}}
					>
						<div style={{ width: KEY_W, minWidth: KEY_W, borderRight: "1px solid rgba(255,255,255,0.08)" }} />
						{Array.from({ length: BARS * BPB }).map((_, i) => {
							const bar = Math.floor(i / BPB);
							const beat = i % BPB;
							const major = beat === 0;
							return (
								<div
									key={i}
									style={{
										width: BEAT_W,
										minWidth: BEAT_W,
										display: "flex",
										alignItems: "flex-end",
										paddingBottom: 2,
										paddingLeft: 3,
										borderLeft: `1px solid ${major ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.05)"}`,
									}}
								>
									<span
										style={{
											fontSize: 9,
											lineHeight: 1,
											userSelect: "none",
											color: major ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)",
										}}
									>
										{major ? bar + 1 : `${bar + 1}.${beat + 1}`}
									</span>
								</div>
							);
						})}
					</div>

					<div style={{ position: "relative", height: totalH, display: "flex" }}>
						<div
							style={{
								position: "sticky",
								left: 0,
								zIndex: 10,
								width: KEY_W,
								minWidth: KEY_W,
								height: totalH,
								flexShrink: 0,
								borderRight: "1px solid rgba(255,255,255,0.08)",
							}}
						>
							{rows.map(({ note, octave }, i) => (
								<PianoKey
									key={i}
									note={note}
									octave={octave}
									color={color}
									hasNotes={activeRows.has(i)}
								/>
							))}
						</div>

						<div style={{ position: "relative", width: TOTAL_W, flexShrink: 0 }}>
							{rows.map(({ note }, ri) => (
								<GridRow
									key={ri}
									ri={ri}
									note={note}
									trackNotes={trackNotes}
									color={color}
									onRowClick={handleRowClick}
								/>
							))}

							<div
								ref={playheadRef}
								className="pointer-events-none absolute left-0 top-0 flex h-full flex-col items-center"
								style={{ willChange: "transform" }}
							>
								<div className="h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-white" />
								<div className="w-px flex-1" style={{ borderLeft: "1px solid rgba(255,255,255,0.7)" }} />
							</div>
						</div>
					</div>
				</div>
			</div>

			<div
				style={{
					height: 48,
					flexShrink: 0,
					borderTop: "4px solid rgba(255,255,255,0.05)",
					backgroundColor: "rgba(0,0,0,0.15)",
					position: "relative",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						position: "absolute",
						left: KEY_W,
						top: 0,
						right: 0,
						bottom: 0,
						borderLeft: "1px solid rgba(255,255,255,0.08)",
					}}
				>
					{[...new Set(
						Object.keys(trackNotes)
							.filter((k) => parseInt(k.split("-")[1]) % NOTE_LEN === 0)
							.map((k) => parseInt(k.split("-")[1]))
					)].map((sub) => (
						<VelocityHandle
							key={sub}
							sub={sub}
							color={color}
							velocity={trackVelocities[sub] ?? DEFAULT_VEL}
							onVelocityChange={handleVelocityChange}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

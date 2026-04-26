"use client";

import * as React from "react";
import { useFlavor } from "@/hooks/use-flavor";
import { getAudioCtx } from "@/lib/audio";
import { FLAVOR_VARS, TRACK_PALETTE } from "@/lib/catppuccin";
import { getNoteName, NOTES_DESC, OCTAVES } from "@/lib/music";
import { playPianoNote } from "@/lib/sounds";
import { type PianoNote, useDAWStore } from "@/lib/store";

const BLACK = new Set(["A#", "G#", "F#", "D#", "C#"]);

const ROW_H = 14;
const KEY_W = 34;
const BARS = 16;
const BPB = 4;
const SUBS = 4;
const BEAT_W = 32;
const SUB_W = BEAT_W / SUBS;
const TOTAL_SUBS = BARS * BPB * SUBS;
const TOTAL_W = BARS * BPB * BEAT_W;
const SNAP = 2;
const NOTE_LEN = 8;
const STEM_MAX_H = 34;
const DEFAULT_VEL = 100;

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
		lines.push(
			`linear-gradient(${color},${color}) ${x}px 0 / 1px 100% no-repeat`,
		);
	}
	return lines.join(",");
}

const GRID_BG = gridBg();

const VelocityHandle = React.memo(function VelocityHandle({
	noteIndex,
	startSub,
	color,
	velocity,
	onVelocityChange,
}: {
	noteIndex: number;
	startSub: number;
	color: string;
	velocity: number;
	onVelocityChange: (noteIndex: number, vel: number) => void;
}) {
	const stemH = Math.round((velocity / 127) * STEM_MAX_H);
	const cx = startSub * SUB_W + Math.round((NOTE_LEN * SUB_W) / 2) - 6;
	const startRef = React.useRef<{ y: number; vel: number } | null>(null);

	return (
		<div
			style={{
				position: "absolute",
				left: cx,
				bottom: 3,
				width: 12,
				height: 4 + stemH,
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-start",
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
				const newVel = Math.max(
					0,
					Math.min(
						127,
						Math.round(startRef.current.vel + (dy / STEM_MAX_H) * 127),
					),
				);
				onVelocityChange(noteIndex, newVel);
			}}
			onPointerUp={() => {
				startRef.current = null;
			}}
		>
			<div
				style={{
					width: 12,
					height: 4,
					borderRadius: 2,
					backgroundColor: color,
					flexShrink: 0,
				}}
			/>
			{stemH > 0 && (
				<div
					style={{
						width: 2,
						height: stemH,
						backgroundColor: `color-mix(in srgb, ${color} 70%, transparent)`,
						marginLeft: 1,
					}}
				/>
			)}
		</div>
	);
});

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
	selectedNoteIdx,
}: {
	ri: number;
	note: string;
	trackNotes: PianoNote[];
	color: string;
	selectedNoteIdx: number | null;
}) {
	const isBlack = BLACK.has(note);
	const isC = note === "C";
	const noteName = getNoteName(ri);
	const rowNotes = trackNotes.filter((n) => n.row === ri);

	return (
		<div
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
				boxSizing: "border-box",
			}}
		>
			{rowNotes.map((n, i) => {
				const w = n.duration * SUB_W;
				const opacity = n.velocity / 127;
				const isSelected = trackNotes.indexOf(n) === selectedNoteIdx;
				return (
					<div
						key={i}
						style={{
							position: "absolute",
							left: n.start * SUB_W + 1,
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
							boxShadow: isSelected
								? `inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.25), 0 0 0 1.5px white`
								: `inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.25)`,
							opacity,
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
		addNote,
		removeNote,
		resizeNote,
		moveNote,
		setNoteVelocity,
		isPlaying,
		playStartAudioTime,
		bpm,
	} = useDAWStore();
	const flavor = useFlavor();
	const vars = FLAVOR_VARS[flavor];
	const color = vars[TRACK_PALETTE[activeTrack % TRACK_PALETTE.length]];
	const trackNotes = pianoNotes[activeTrack] ?? [];

	const rows = React.useMemo(
		() =>
			OCTAVES.flatMap((oct) =>
				NOTES_DESC.map((note) => ({ note, octave: oct })),
			),
		[],
	);

	const activeRows = React.useMemo(() => {
		const set = new Set<number>();
		trackNotes.forEach((n) => set.add(n.row));
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
		let targetRow: number;
		if (trackNotes.length > 0) {
			const rowNums = trackNotes.map((n) => n.row);
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
		(noteIndex: number, vel: number) =>
			setNoteVelocity(activeTrack, noteIndex, vel),
		[activeTrack, setNoteVelocity],
	);

	const [selectedNoteIdx, setSelectedNoteIdx] = React.useState<number | null>(
		null,
	);

	const dragRef = React.useRef<{
		noteIndex: number;
		originalStart: number;
	} | null>(null);

	const moveRef = React.useRef<{
		noteIndex: number;
		originalRow: number;
		originalStart: number;
		startX: number;
		startY: number;
	} | null>(null);

	const handleGridPointerDown = React.useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.currentTarget.setPointerCapture(e.pointerId);
			const rect = e.currentTarget.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const ri = Math.floor(y / ROW_H);
			const ci = Math.floor(x / SUB_W);
			const startSub = Math.floor(ci / SNAP) * SNAP;
			if (ri < 0 || ri >= rows.length || startSub < 0 || startSub >= TOTAL_SUBS)
				return;

			const existingIdx = trackNotes.findIndex(
				(n) =>
					n.row === ri &&
					startSub >= n.start &&
					startSub < n.start + n.duration,
			);

			if (e.button === 2) {
				if (existingIdx >= 0) {
					removeNote(activeTrack, existingIdx);
					if (selectedNoteIdx === existingIdx) setSelectedNoteIdx(null);
				}
				return;
			}

			if (existingIdx >= 0) {
				setSelectedNoteIdx(existingIdx);
				const note = trackNotes[existingIdx];
				moveRef.current = {
					noteIndex: existingIdx,
					originalRow: note.row,
					originalStart: note.start,
					startX: x,
					startY: y,
				};
			} else {
				const newIndex = trackNotes.length;
				addNote(activeTrack, {
					row: ri,
					start: startSub,
					duration: NOTE_LEN,
					velocity: DEFAULT_VEL,
				});
				const ac = getAudioCtx();
				playPianoNote(ri, ac.currentTime);
				dragRef.current = { noteIndex: newIndex, originalStart: startSub };
				setSelectedNoteIdx(null);
			}
		},
		[
			activeTrack,
			trackNotes,
			addNote,
			removeNote,
			rows.length,
			selectedNoteIdx,
		],
	);

	const handleGridPointerMove = React.useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			const move = moveRef.current;
			if (move) {
				const rect = e.currentTarget.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;
				const newRow = Math.max(
					0,
					Math.min(
						rows.length - 1,
						move.originalRow + Math.round((y - move.startY) / ROW_H),
					),
				);
				const rawStart =
					move.originalStart + Math.round((x - move.startX) / SUB_W);
				const newStart = Math.max(
					0,
					Math.min(TOTAL_SUBS - 1, Math.floor(rawStart / SNAP) * SNAP),
				);
				moveNote(activeTrack, move.noteIndex, newRow, newStart);
				return;
			}
			const drag = dragRef.current;
			if (!drag) return;
			const rect = e.currentTarget.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const ci = Math.min(
				TOTAL_SUBS - 1,
				Math.max(drag.originalStart, Math.floor(x / SUB_W)),
			);
			const rawDuration = ci - drag.originalStart + 1;
			const snappedDuration = Math.max(
				SNAP,
				Math.ceil(rawDuration / SNAP) * SNAP,
			);
			resizeNote(activeTrack, drag.noteIndex, snappedDuration);
		},
		[activeTrack, resizeNote, moveNote, rows.length],
	);

	const handleGridPointerUp = React.useCallback(() => {
		dragRef.current = null;
		moveRef.current = null;
	}, []);

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
					Piano Roll - {tracks[activeTrack]?.name ?? "No Track"}
				</span>
			</div>

			<div
				className="scrollbar-none flex-1 overflow-auto"
				ref={scrollContainerRef}
				style={{ position: "relative" }}
			>
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
						<div
							style={{
								width: KEY_W,
								minWidth: KEY_W,
								borderRight: "1px solid rgba(255,255,255,0.08)",
							}}
						/>
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
											color: major
												? "rgba(255,255,255,0.55)"
												: "rgba(255,255,255,0.2)",
										}}
									>
										{major ? bar + 1 : `${bar + 1}.${beat + 1}`}
									</span>
								</div>
							);
						})}
					</div>

					<div
						style={{ position: "relative", height: totalH, display: "flex" }}
					>
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

						<div
							style={{
								position: "relative",
								width: TOTAL_W,
								flexShrink: 0,
								cursor: "crosshair",
							}}
							onPointerDown={handleGridPointerDown}
							onPointerMove={handleGridPointerMove}
							onPointerUp={handleGridPointerUp}
							onContextMenu={(e) => e.preventDefault()}
						>
							{rows.map(({ note }, ri) => (
								<GridRow
									key={ri}
									ri={ri}
									note={note}
									trackNotes={trackNotes}
									color={color}
									selectedNoteIdx={selectedNoteIdx}
								/>
							))}

							<div
								ref={playheadRef}
								className="pointer-events-none absolute left-0 top-0 flex h-full flex-col items-center"
								style={{ willChange: "transform" }}
							>
								<div className="h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-white" />
								<div
									className="w-px flex-1"
									style={{ borderLeft: "1px solid rgba(255,255,255,0.7)" }}
								/>
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
					{trackNotes.map((n, ni) => (
						<VelocityHandle
							key={ni}
							noteIndex={ni}
							startSub={n.start}
							color={color}
							velocity={n.velocity}
							onVelocityChange={handleVelocityChange}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

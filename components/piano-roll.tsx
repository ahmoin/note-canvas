"use client";

import * as React from "react";
import { useFlavor } from "@/hooks/use-flavor";
import { FLAVOR_VARS, TRACK_PALETTE } from "@/lib/catppuccin";
import { getAudioCtx, playPianoNote } from "@/lib/drums";
import { useDAWStore } from "@/lib/store";

const NOTES_DESC = [
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
const BLACK = new Set(["A#", "G#", "F#", "D#", "C#"]);
const OCTAVES = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1];

const GRID_ALPHA: Record<string, number> = {
	B: 0.05,
	"A#": 0,
	A: 0.05,
	"G#": 0.05,
	G: 0,
	"F#": 0.05,
	F: 0,
	E: 0.05,
	"D#": 0.05,
	D: 0,
	"C#": 0.05,
	C: 0.02,
};

const ROW_H = 14;
const KEY_W = 50;
const BARS = 16;
const BPB = 4;
const SUBS = 4;
const BEAT_W = 32;
const SUB_W = BEAT_W / SUBS;
const TOTAL_SUBS = BARS * BPB * SUBS;
const TOTAL_W = BARS * BPB * BEAT_W;

function gridBg(): string {
	const lines: string[] = [];
	for (let ci = 0; ci < TOTAL_SUBS; ci++) {
		const x = ci * SUB_W;
		const isBar = ci % (SUBS * BPB) === 0;
		const isBeat = ci % SUBS === 0;
		const color = isBar
			? "rgba(255,255,255,0.15)"
			: isBeat
				? "rgba(255,255,255,0.07)"
				: "rgba(255,255,255,0.03)";
		lines.push(
			`linear-gradient(${color},${color}) ${x}px 0 / 1px 100% no-repeat`,
		);
	}
	return lines.join(",");
}
const GRID_BG = gridBg();

function PianoKey({
	note,
	octave,
	color,
}: {
	note: string;
	octave: number;
	color: string;
}) {
	const isBlack = BLACK.has(note);
	const isC = note === "C";

	if (isBlack) {
		return (
			<div
				style={{
					position: "relative",
					height: ROW_H,
					width: KEY_W,
					flexShrink: 0,
					borderBottom: "1px solid rgba(0,0,0,0.6)",
					backgroundColor: "#1e1e30",
				}}
			>
				<div
					style={{
						position: "absolute",
						left: 0,
						top: 0,
						width: Math.round(KEY_W * 0.65),
						height: "100%",
						backgroundColor: "#0c0c1c",
					}}
				/>
			</div>
		);
	}

	return (
		<div
			style={{
				position: "relative",
				height: ROW_H,
				width: KEY_W,
				flexShrink: 0,
				borderBottom: "1px solid rgba(0,0,0,0.6)",
				backgroundColor: isC ? "#60607a" : "#505068",
			}}
		>
			<div
				style={{
					position: "absolute",
					right: 0,
					top: 1,
					width: 2,
					height: ROW_H - 2,
					backgroundColor: "rgba(255,255,255,0.12)",
				}}
			/>
			{isC && (
				<span
					style={{
						position: "absolute",
						right: 5,
						top: "50%",
						transform: "translateY(-50%)",
						fontSize: 8,
						fontFamily: "monospace",
						fontWeight: "bold",
						color,
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
	const alpha = GRID_ALPHA[note] ?? 0;

	const activeKeys = Object.keys(trackNotes).filter((k) =>
		k.startsWith(`${ri}-`),
	);

	return (
		<div
			onClick={(e) => onRowClick(ri, e)}
			style={{
				position: "relative",
				height: ROW_H,
				width: TOTAL_W,
				flexShrink: 0,
				backgroundColor: `rgba(255,255,255,${alpha})`,
				borderBottom: "1px solid rgba(0,0,0,0.2)",
				background: `rgba(255,255,255,${alpha})`,
				backgroundImage: GRID_BG,
				cursor: "pointer",
				boxSizing: "border-box",
			}}
		>
			{activeKeys.map((k) => {
				const ci = parseInt(k.split("-")[1]);
				return (
					<div
						key={k}
						style={{
							position: "absolute",
							left: ci * SUB_W,
							top: 0,
							width: SUB_W - 1,
							height: ROW_H - 1,
							backgroundColor: color,
							opacity: 0.85,
							borderRadius: 2,
							pointerEvents: "none",
						}}
					/>
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
		togglePianoNote,
		isPlaying,
		playStartAudioTime,
		bpm,
	} = useDAWStore();
	const flavor = useFlavor();
	const vars = FLAVOR_VARS[flavor];
	const color = vars[TRACK_PALETTE[activeTrack % TRACK_PALETTE.length]];
	const trackNotes = pianoNotes[activeTrack] ?? {};

	const rows = React.useMemo(
		() =>
			OCTAVES.flatMap((oct) =>
				NOTES_DESC.map((note) => ({ note, octave: oct })),
			),
		[],
	);

	const totalH = rows.length * ROW_H;

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

	const handleRowClick = React.useCallback(
		(ri: number, e: React.MouseEvent<HTMLDivElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const ci = Math.floor(x / SUB_W);
			if (ci >= 0 && ci < TOTAL_SUBS) {
				togglePianoNote(activeTrack, ri, ci);
				const ac = getAudioCtx();
				playPianoNote(ri, ac.currentTime);
			}
		},
		[activeTrack, togglePianoNote],
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

			<div className="flex-1 overflow-auto" style={{ position: "relative" }}>
				<div style={{ width: KEY_W + TOTAL_W, minHeight: "100%" }}>
					<div
						style={{
							position: "sticky",
							top: 0,
							zIndex: 20,
							display: "flex",
							height: 24,
							backgroundColor: vars.mantle,
							borderBottom: "1px solid rgba(255,255,255,0.1)",
						}}
					>
						<div
							style={{
								width: KEY_W,
								minWidth: KEY_W,
								borderRight: "1px solid rgba(255,255,255,0.1)",
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
										paddingBottom: 3,
										paddingLeft: 3,
										borderLeft: `1px solid ${major ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
									}}
								>
									<span
										style={{
											fontSize: 9,
											lineHeight: 1,
											userSelect: "none",
											color: major
												? "rgba(255,255,255,0.6)"
												: "rgba(255,255,255,0.25)",
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
								borderRight: "1px solid rgba(255,255,255,0.1)",
							}}
						>
							{rows.map(({ note, octave }, i) => (
								<PianoKey key={i} note={note} octave={octave} color={color} />
							))}
						</div>

						<div
							style={{ position: "relative", width: TOTAL_W, flexShrink: 0 }}
						>
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
								<div className="w-px flex-1 border-l border-dashed border-white/60" />
							</div>
						</div>
					</div>
				</div>
			</div>

			<div
				style={{
					height: 50,
					flexShrink: 0,
					borderTop: "5px solid rgba(255,255,255,0.06)",
					backgroundColor: "rgba(0,0,0,0.12)",
				}}
			>
				<div
					style={{
						marginLeft: KEY_W,
						height: "100%",
						borderLeft: "1px solid rgba(255,255,255,0.1)",
					}}
				/>
			</div>
		</div>
	);
}

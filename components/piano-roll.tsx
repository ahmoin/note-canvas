"use client";

const NOTES = ["C", "B", "A#", "A", "G#", "G", "F#", "F", "E", "D#", "D", "C#"];
const OCTAVES = [6, 5, 4, 3, 2];
const KEYS = OCTAVES.flatMap((o) => NOTES.map((n) => `${n}${o}`));
const COLS = 32;
const BLACK = ["A#", "C#", "D#", "F#", "G#"];

export function PianoRoll() {
	return (
		<div className="flex flex-1 overflow-auto">
			<div className="flex w-12 shrink-0 flex-col border-r">
				{KEYS.map((key) => (
					<div
						key={key}
						className={`flex h-5 shrink-0 items-center justify-end pr-1 text-[10px] ${
							BLACK.includes(key.slice(0, -1))
								? "bg-muted text-muted-foreground"
								: "text-foreground"
						}`}
					>
						{key.endsWith("C") || key.endsWith("A") ? key : ""}
					</div>
				))}
			</div>
			<div className="flex-1">
				{KEYS.map((key) => (
					<div key={key} className="flex h-5 border-b border-border/30">
						{Array.from({ length: COLS }).map((_, ci) => (
							<div
								key={ci}
								className={`h-5 flex-1 cursor-pointer border-r border-border/20 hover:bg-primary/20 ${
									ci % 4 === 0 ? "border-r-border/50" : ""
								} ${BLACK.includes(key.slice(0, -1)) ? "bg-muted/30" : ""}`}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

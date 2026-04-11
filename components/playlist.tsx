"use client";

const ROWS = 8;
const COLS = 32;

export function Playlist() {
	return (
		<div className="flex flex-1 overflow-auto">
			<div className="flex w-32 shrink-0 flex-col border-r">
				{Array.from({ length: ROWS }).map((_, i) => (
					<div key={i} className="flex h-10 items-center border-b px-2 text-xs">
						Track {i + 1}
					</div>
				))}
			</div>
			<div className="flex-1">
				{Array.from({ length: ROWS }).map((_, ri) => (
					<div key={ri} className="flex h-10 border-b">
						{Array.from({ length: COLS }).map((_, ci) => (
							<div
								key={ci}
								className={`h-10 w-16 shrink-0 cursor-pointer border-r border-border/30 hover:bg-muted/50 ${
									ci % 4 === 0 ? "border-r-border/60" : ""
								}`}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

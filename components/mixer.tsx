"use client";

const CHANNELS = ["Master", "Ch 1", "Ch 2", "Ch 3", "Ch 4", "Ch 5", "Ch 6"];

export function Mixer() {
	return (
		<div className="flex flex-1 gap-px overflow-auto bg-border p-px">
			{CHANNELS.map((ch, i) => (
				<div
					key={i}
					className="flex w-16 flex-col items-center gap-2 bg-background p-2"
				>
					<span className="text-xs font-medium">{ch}</span>
					<div className="relative flex h-40 w-2 rounded bg-muted">
						<div
							className="absolute bottom-0 w-full rounded bg-primary"
							style={{ height: i === 0 ? "75%" : `${60 - i * 5}%` }}
						/>
					</div>
					<input
						type="range"
						min={0}
						max={100}
						defaultValue={i === 0 ? 75 : 60 - i * 5}
						{...{ orient: "vertical" }}
						className="h-40 w-2 cursor-pointer accent-primary"
					/>
					<span className="text-[10px] text-muted-foreground">
						{i === 0 ? "75" : 60 - i * 5}
					</span>
				</div>
			))}
		</div>
	);
}

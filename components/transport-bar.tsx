"use client";

import { Play, SkipBack, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDAWStore } from "@/lib/store";

export function TransportBar() {
	const { isPlaying, togglePlay, bpm, setBpm, currentTick } = useDAWStore();

	return (
		<div className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3">
			<Button variant="ghost" size="icon" className="size-8">
				<SkipBack className="size-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="size-8"
				onClick={togglePlay}
			>
				{isPlaying ? (
					<Square className="size-4" />
				) : (
					<Play className="size-4" />
				)}
			</Button>
			<div className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
				<span>
					{Math.floor(currentTick / 192 / 4 + 1)}:
					{Math.floor(((currentTick / 192) % 4) + 1)}:
					{String(Math.floor(currentTick % 192)).padStart(3, "0")}
				</span>
			</div>
			<div className="ml-auto flex items-center gap-2">
				<span className="text-xs text-muted-foreground">BPM</span>
				<input
					type="number"
					min={20}
					max={300}
					value={bpm}
					onChange={(e) => setBpm(Number(e.target.value))}
					className="w-14 rounded border bg-transparent px-1.5 py-0.5 text-center text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
				/>
			</div>
		</div>
	);
}

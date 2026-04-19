"use client";

import {
	MetronomeIcon,
	PlayIcon,
	SkipBackIcon,
	SquareIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useDAWStore } from "@/lib/store";

export function TransportBar() {
	const { isPlaying, togglePlay, bpm, setBpm, currentTick } = useDAWStore();

	return (
		<div className="relative flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3">
			<Button variant="ghost" size="icon" className="size-8">
				<SkipBackIcon className="size-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="size-8"
				onClick={togglePlay}
			>
				{isPlaying ? (
					<SquareIcon className="size-4" />
				) : (
					<PlayIcon className="size-4" />
				)}
			</Button>
			<div className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
				<span>
					{Math.floor(currentTick / 192 / 4 + 1)}:
					{Math.floor(((currentTick / 192) % 4) + 1)}:
					{String(Math.floor(currentTick % 192)).padStart(3, "0")}
				</span>
			</div>
			<div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
				<MetronomeIcon className="size-4 text-muted-foreground" />
				<input
					type="number"
					min={20}
					max={300}
					value={bpm}
					onChange={(e) => setBpm(Number(e.target.value))}
					className="w-14 rounded border bg-transparent px-1.5 py-0.5 text-center text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
				/>
				<span className="text-xs text-muted-foreground">BPM</span>
			</div>
		</div>
	);
}

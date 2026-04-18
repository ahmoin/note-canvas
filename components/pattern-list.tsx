"use client";

import {
	ArrowsInSimpleIcon,
	CircleIcon,
	ClockCountdownIcon,
	GuitarIcon,
	HandsClappingIcon,
	LightningIcon,
	MetronomeIcon,
	MusicNoteIcon,
	MusicNotesIcon,
	PianoKeysIcon,
	PlusIcon,
	SlidersHorizontalIcon,
	SpeakerHighIcon,
	WaveformIcon,
	WindIcon,
} from "@phosphor-icons/react";
import * as React from "react";
import { LiaDrumSolid } from "react-icons/lia";
import { Button } from "@/components/ui/button";
import { useDAWStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Tab = "sounds" | "instruments" | "effects";

type Item = { name: string; icon: React.ElementType };

const TABS: { id: Tab; label: string }[] = [
	{ id: "sounds", label: "Sounds" },
	{ id: "instruments", label: "Instruments" },
	{ id: "effects", label: "Effects" },
];

const CONTENT: Record<Tab, Item[]> = {
	sounds: [
		{ name: "808 Kick", icon: CircleIcon },
		{ name: "Snare Crack", icon: LiaDrumSolid },
		{ name: "Hi-Hat", icon: MusicNoteIcon },
		{ name: "Clap", icon: HandsClappingIcon },
		{ name: "Perc", icon: MetronomeIcon },
	],
	instruments: [
		{ name: "Bass", icon: GuitarIcon },
		{ name: "Guitar", icon: GuitarIcon },
		{ name: "Keys", icon: PianoKeysIcon },
		{ name: "Strings", icon: MusicNotesIcon },
		{ name: "Synths", icon: WaveformIcon },
		{ name: "Tuned Percussion", icon: MetronomeIcon },
		{ name: "Wind & Brass", icon: WindIcon },
	],
	effects: [
		{ name: "Reverb", icon: SpeakerHighIcon },
		{ name: "Delay", icon: ClockCountdownIcon },
		{ name: "Distortion", icon: LightningIcon },
		{ name: "Compressor", icon: ArrowsInSimpleIcon },
		{ name: "EQ", icon: SlidersHorizontalIcon },
	],
};

export function PatternList() {
	const [tab, setTab] = React.useState<Tab>("sounds");
	const addTrack = useDAWStore((s) => s.addTrack);

	const handleDragStart = (e: React.DragEvent, name: string) => {
		e.dataTransfer.setData("text/plain", JSON.stringify({ name, type: tab }));
		e.dataTransfer.effectAllowed = "copy";
	};

	return (
		<div className="flex w-44 shrink-0 flex-col border-r bg-background">
			<div className="flex h-8 shrink-0 items-center justify-between border-b px-2">
				<span className="text-xs font-medium capitalize">{tab}</span>
				<Button variant="ghost" size="icon" className="size-6">
					<PlusIcon className="size-3" />
				</Button>
			</div>

			<div className="flex shrink-0 border-b">
				{TABS.map((t) => (
					<button
						key={t.id}
						type="button"
						onClick={() => setTab(t.id)}
						className={cn(
							"flex-1 py-1 text-[10px] font-medium tracking-wide transition-colors",
							tab === t.id
								? "border-b-2 border-primary text-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{t.label}
					</button>
				))}
			</div>

			<div className="flex-1 overflow-y-auto">
				{CONTENT[tab].map(({ name, icon: Icon }, i) => (
					<button
						key={i}
						type="button"
						draggable
						onDragStart={(e) => handleDragStart(e, name)}
						onDoubleClick={() => addTrack(name, tab)}
						className="flex w-full cursor-grab items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-muted active:cursor-grabbing"
						title="Drag to track or double-click to add"
					>
						<Icon className="size-3.5 shrink-0 text-muted-foreground" />
						{name}
					</button>
				))}
			</div>
		</div>
	);
}

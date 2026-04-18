"use client";

import {
	ArrowsInSimpleIcon,
	CaretRightIcon,
	CircleIcon,
	ClockCountdownIcon,
	GuitarIcon,
	HandsClappingIcon,
	LightningIcon,
	MetronomeIcon,
	MusicNoteIcon,
	MusicNotesIcon,
	PianoKeysIcon,
	ScissorsIcon,
	SlidersHorizontalIcon,
	SpeakerHighIcon,
	WaveformIcon,
	WindIcon,
} from "@phosphor-icons/react";
import * as React from "react";
import { LiaDrumSolid } from "react-icons/lia";
import { useDAWStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Tab = "sounds" | "instruments" | "effects";

type FlatItem = { kind: "item"; name: string; icon: React.ElementType };
type GroupItem = {
	kind: "group";
	name: string;
	icon: React.ElementType;
	children: FlatItem[];
};
type ListEntry = FlatItem | GroupItem;

const TABS: { id: Tab; label: string }[] = [
	{ id: "sounds", label: "Sounds" },
	{ id: "instruments", label: "Instruments" },
	{ id: "effects", label: "Effects" },
];

const CONTENT: Record<Tab, ListEntry[]> = {
	sounds: [
		{ kind: "item", name: "808 Kick", icon: CircleIcon },
		{ kind: "item", name: "Snare Crack", icon: LiaDrumSolid },
		{ kind: "item", name: "Hi-Hat", icon: MusicNoteIcon },
		{ kind: "item", name: "Clap", icon: HandsClappingIcon },
		{ kind: "item", name: "Perc", icon: MetronomeIcon },
	],
	instruments: [
		{ kind: "item", name: "Audio Track", icon: WaveformIcon },
		{
			kind: "group",
			name: "WaveInstrument",
			icon: MusicNotesIcon,
			children: [
				{ kind: "item", name: "Bass", icon: GuitarIcon },
				{ kind: "item", name: "Guitar", icon: GuitarIcon },
				{ kind: "item", name: "Keys", icon: PianoKeysIcon },
				{ kind: "item", name: "Strings", icon: MusicNotesIcon },
				{ kind: "item", name: "Synths", icon: WaveformIcon },
				{ kind: "item", name: "Tuned Percussion", icon: MetronomeIcon },
				{ kind: "item", name: "Wind & Brass", icon: WindIcon },
			],
		},
		{ kind: "item", name: "Drum Track", icon: LiaDrumSolid },
		{ kind: "item", name: "Slicer", icon: ScissorsIcon },
		{ kind: "item", name: "Sampler", icon: SpeakerHighIcon },
	],
	effects: [
		{ kind: "item", name: "Reverb", icon: SpeakerHighIcon },
		{ kind: "item", name: "Delay", icon: ClockCountdownIcon },
		{ kind: "item", name: "Distortion", icon: LightningIcon },
		{ kind: "item", name: "Compressor", icon: ArrowsInSimpleIcon },
		{ kind: "item", name: "EQ", icon: SlidersHorizontalIcon },
	],
};

function Item({
	name,
	icon: Icon,
	tab,
	indent,
	onDragStart,
	onDoubleClick,
}: {
	name: string;
	icon: React.ElementType;
	tab: Tab;
	indent?: boolean;
	onDragStart: (e: React.DragEvent, name: string) => void;
	onDoubleClick: (name: string) => void;
}) {
	return (
		<button
			type="button"
			draggable
			onDragStart={(e) => onDragStart(e, name)}
			onDoubleClick={() => onDoubleClick(name)}
			className={cn(
				"flex w-full cursor-grab items-center gap-2 py-1.5 text-left text-xs hover:bg-muted active:cursor-grabbing",
				indent ? "pl-6 pr-2" : "px-2",
			)}
			title="Drag to track or double-click to add"
		>
			<Icon className="size-3.5 shrink-0 text-muted-foreground" />
			{name}
		</button>
	);
}

export function PatternList({
	tab,
	setTab,
}: {
	tab: Tab;
	setTab: (t: Tab) => void;
}) {
	const addTrack = useDAWStore((s) => s.addTrack);
	const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
		new Set(["WaveInstrument"]),
	);

	const toggleGroup = (name: string) =>
		setExpandedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(name)) next.delete(name);
			else next.add(name);
			return next;
		});

	const handleDragStart = (e: React.DragEvent, name: string) => {
		e.dataTransfer.setData("text/plain", JSON.stringify({ name, type: tab }));
		e.dataTransfer.effectAllowed = "copy";
	};

	return (
		<div className="flex w-44 shrink-0 flex-col border-r bg-background">
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
				{CONTENT[tab].map((entry, i) => {
					if (entry.kind === "item") {
						return (
							<Item
								key={i}
								name={entry.name}
								icon={entry.icon}
								tab={tab}
								onDragStart={handleDragStart}
								onDoubleClick={(name) => addTrack(name, tab)}
							/>
						);
					}

					const expanded = expandedGroups.has(entry.name);
					return (
						<div key={i}>
							<button
								type="button"
								onClick={() => toggleGroup(entry.name)}
								className="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-muted"
							>
								<CaretRightIcon
									className={cn(
										"size-3 shrink-0 text-muted-foreground transition-transform",
										expanded && "rotate-90",
									)}
								/>
								<entry.icon className="size-3.5 shrink-0 text-muted-foreground" />
								{entry.name}
							</button>
							{expanded &&
								entry.children.map((child, ci) => (
									<Item
										key={ci}
										name={child.name}
										icon={child.icon}
										tab={tab}
										indent
										onDragStart={handleDragStart}
										onDoubleClick={(name) => addTrack(name, tab)}
									/>
								))}
						</div>
					);
				})}
			</div>
		</div>
	);
}

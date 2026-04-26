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
import { getAudioCtx } from "@/lib/audio";
import {
	playClap,
	playClosedHihat,
	playKick,
	playPercussion,
	playSnare,
} from "@/lib/sounds";
import { type TrackSubtype, useDAWStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const SOUND_PREVIEWS: Record<string, (time: number) => void> = {
	"808 Kick": playKick,
	"Snare Crack": playSnare,
	"Hi-Hat": playClosedHihat,
	Clap: playClap,
	Perc: playPercussion,
};

// type Tab = "sounds" | "instruments" | "effects";
type Tab = "instruments";

type FlatItem = {
	kind: "item";
	name: string;
	icon: React.ElementType;
	subtype: TrackSubtype;
};
type GroupItem = {
	kind: "group";
	name: string;
	icon: React.ElementType;
	subtype: TrackSubtype;
	children: FlatItem[];
};
type ListEntry = FlatItem | GroupItem;

const TABS: { id: Tab; label: string }[] = [
	// { id: "sounds", label: "Sounds" },
	{ id: "instruments", label: "Instruments" },
	// { id: "effects", label: "Effects" },
];

const CONTENT: Record<Tab, ListEntry[]> = {
	// sounds: [
	// 	{ kind: "item", name: "808 Kick", icon: CircleIcon, subtype: "sound" },
	// 	{ kind: "item", name: "Snare Crack", icon: LiaDrumSolid, subtype: "sound" },
	// 	{ kind: "item", name: "Hi-Hat", icon: MusicNoteIcon, subtype: "sound" },
	// 	{ kind: "item", name: "Clap", icon: HandsClappingIcon, subtype: "sound" },
	// 	{ kind: "item", name: "Perc", icon: MetronomeIcon, subtype: "sound" },
	// ],
	instruments: [
		{ kind: "item", name: "Audio Track", icon: WaveformIcon, subtype: "audio" },
		{
			kind: "group",
			name: "WaveInstrument",
			icon: MusicNotesIcon,
			subtype: "wave",
			children: [
				{ kind: "item", name: "Bass", icon: GuitarIcon, subtype: "wave" },
				{ kind: "item", name: "Guitar", icon: GuitarIcon, subtype: "wave" },
				{ kind: "item", name: "Keys", icon: PianoKeysIcon, subtype: "wave" },
				{
					kind: "item",
					name: "Strings",
					icon: MusicNotesIcon,
					subtype: "wave",
				},
				{ kind: "item", name: "Synths", icon: WaveformIcon, subtype: "wave" },
				{
					kind: "item",
					name: "Tuned Percussion",
					icon: MetronomeIcon,
					subtype: "wave",
				},
				{ kind: "item", name: "Wind & Brass", icon: WindIcon, subtype: "wave" },
			],
		},
		{ kind: "item", name: "Drum Track", icon: LiaDrumSolid, subtype: "drum" },
		{ kind: "item", name: "Slicer", icon: ScissorsIcon, subtype: "slicer" },
		{
			kind: "item",
			name: "Sampler",
			icon: SpeakerHighIcon,
			subtype: "sampler",
		},
	],
	// effects: [
	// 	{ kind: "item", name: "Reverb", icon: SpeakerHighIcon, subtype: "effect" },
	// 	{
	// 		kind: "item",
	// 		name: "Delay",
	// 		icon: ClockCountdownIcon,
	// 		subtype: "effect",
	// 	},
	// 	{
	// 		kind: "item",
	// 		name: "Distortion",
	// 		icon: LightningIcon,
	// 		subtype: "effect",
	// 	},
	// 	{
	// 		kind: "item",
	// 		name: "Compressor",
	// 		icon: ArrowsInSimpleIcon,
	// 		subtype: "effect",
	// 	},
	// 	{
	// 		kind: "item",
	// 		name: "EQ",
	// 		icon: SlidersHorizontalIcon,
	// 		subtype: "effect",
	// 	},
	// ],
};

function Item({
	name,
	icon: Icon,
	subtype,
	indent,
	onDragStart,
	onDoubleClick,
}: {
	name: string;
	icon: React.ElementType;
	subtype: TrackSubtype;
	indent?: boolean;
	onDragStart: (
		e: React.DragEvent,
		name: string,
		subtype: TrackSubtype,
	) => void;
	onDoubleClick: (name: string, subtype: TrackSubtype) => void;
}) {
	const preview = SOUND_PREVIEWS[name];
	const handleClick = () => {
		if (preview) {
			const ac = getAudioCtx();
			preview(ac.currentTime);
		}
	};

	return (
		<button
			type="button"
			draggable
			onClick={handleClick}
			onDragStart={(e) => onDragStart(e, name, subtype)}
			onDoubleClick={() => onDoubleClick(name, subtype)}
			className={cn(
				"flex w-full cursor-grab items-center gap-2 py-1.5 text-left text-xs hover:bg-muted active:cursor-grabbing",
				indent ? "pl-6 pr-2" : "px-2",
			)}
			title="Click to preview · double-click to add"
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

	const handleDragStart = (
		e: React.DragEvent,
		name: string,
		subtype: TrackSubtype,
	) => {
		e.dataTransfer.setData(
			"text/plain",
			JSON.stringify({ name, type: tab, subtype }),
		);
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
								subtype={entry.subtype}
								onDragStart={handleDragStart}
								onDoubleClick={(name, subtype) => addTrack(name, tab, subtype)}
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
										subtype={child.subtype}
										indent
										onDragStart={handleDragStart}
										onDoubleClick={(name, subtype) =>
											addTrack(name, tab, subtype)
										}
									/>
								))}
						</div>
					);
				})}
			</div>
		</div>
	);
}

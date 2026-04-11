"use client";

import { useDAWStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const VIEWS = [
	{ id: "tracks", label: "Tracks" },
	{ id: "piano-roll", label: "Piano Roll" },
	{ id: "mixer", label: "Mixer" },
	{ id: "playlist", label: "Playlist" },
] as const;

export function ViewTabs() {
	const { activeView, setActiveView } = useDAWStore();

	return (
		<div className="flex h-9 shrink-0 items-end gap-0.5 border-b bg-background px-3">
			{VIEWS.map((v) => (
				<button
					key={v.id}
					onClick={() => setActiveView(v.id)}
					className={cn(
						"px-3 py-1 text-xs transition-colors",
						activeView === v.id
							? "bg-muted font-medium text-foreground"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{v.label}
				</button>
			))}
		</div>
	);
}

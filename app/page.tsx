"use client";

import * as React from "react";
import { ChannelRack } from "@/components/channel-rack";
import { Mixer } from "@/components/mixer";
import { PatternList } from "@/components/pattern-list";
import { PianoRoll } from "@/components/piano-roll";
import { Playlist } from "@/components/playlist";
import { ThemeSelector } from "@/components/theme-selector";
import { TracksView } from "@/components/tracks-view";
import { TransportBar } from "@/components/transport-bar";
import { ViewTabs } from "@/components/view-tabs";
import { usePlayback } from "@/hooks/use-playback";
import { useDAWStore } from "@/lib/store";

export default function Page() {
	usePlayback();
	const { activeView, togglePlay, tracks, activeTrack } = useDAWStore();
	const activeSubtype = tracks[activeTrack]?.subtype;
	const [showPanel, setShowPanel] = React.useState(true);
	const [panelTab, setPanelTab] = React.useState<
		"sounds" | "instruments" | "effects"
	>("sounds");

	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;
			if (e.code === "Space") {
				e.preventDefault();
				togglePlay();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [togglePlay]);

	return (
		<>
			<div className="flex h-screen flex-col overflow-hidden bg-background">
				<TransportBar />
				<ViewTabs />
				<div className="flex min-h-0 flex-1 overflow-hidden">
					{showPanel && <PatternList tab={panelTab} setTab={setPanelTab} />}
					<div className="flex flex-1 flex-col overflow-hidden">
						{activeView === "tracks" && (
							<TracksView
								showPanel={showPanel}
								onTogglePanel={() => setShowPanel((p) => !p)}
							/>
						)}
						{activeView === "piano-roll" && <PianoRoll />}
						{activeView === "mixer" && <Mixer />}
						{activeView === "playlist" && <Playlist />}
					</div>
				</div>
				{activeSubtype === "wave" ? <PianoRoll /> : <ChannelRack />}
				<ThemeSelector />
			</div>
		</>
	);
}

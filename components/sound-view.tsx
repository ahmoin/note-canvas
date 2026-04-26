"use client";

import * as React from "react";
import { useFlavor } from "@/hooks/use-flavor";
import { getTrackAnalyser } from "@/lib/audio";
import { FLAVOR_VARS, TRACK_PALETTE } from "@/lib/catppuccin";
import { useDAWStore } from "@/lib/store";

export function SoundView() {
	const { activeTrack, tracks, isPlaying } = useDAWStore();
	const flavor = useFlavor();
	const vars = FLAVOR_VARS[flavor];
	const color = vars[TRACK_PALETTE[activeTrack % TRACK_PALETTE.length]];
	const trackName = tracks[activeTrack]?.name ?? "Sound";

	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const rafRef = React.useRef<number | null>(null);
	const dataRef = React.useRef<Float32Array<ArrayBuffer> | null>(null);
	const colorRef = React.useRef(color);
	colorRef.current = color;

	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ro = new ResizeObserver(() => {
			canvas.width = canvas.offsetWidth * devicePixelRatio;
			canvas.height = canvas.offsetHeight * devicePixelRatio;
		});
		ro.observe(canvas);
		return () => ro.disconnect();
	}, []);

	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const draw = () => {
			const analyser = getTrackAnalyser(activeTrack);
			const w = canvas.width;
			const h = canvas.height;
			const col = colorRef.current;
			ctx.clearRect(0, 0, w, h);

			if (analyser) {
				if (!dataRef.current || dataRef.current.length !== analyser.fftSize) {
					dataRef.current = new Float32Array(
						new ArrayBuffer(analyser.fftSize * 4),
					);
				}
				analyser.getFloatTimeDomainData(dataRef.current);
				const data = dataRef.current;
				const step = Math.max(1, Math.floor(data.length / w));

				ctx.beginPath();
				ctx.fillStyle = `color-mix(in srgb, ${col} 15%, transparent)`;
				ctx.moveTo(0, h / 2);
				for (let x = 0; x < w; x++) {
					let sum = 0;
					for (let j = 0; j < step; j++) sum += data[x * step + j] ?? 0;
					const y = ((1 - sum / step) / 2) * h;
					ctx.lineTo(x, y);
				}
				ctx.lineTo(w, h / 2);
				ctx.closePath();
				ctx.fill();

				ctx.beginPath();
				ctx.lineWidth = 1.5;
				ctx.strokeStyle = col;
				ctx.shadowColor = col;
				ctx.shadowBlur = 8;
				for (let x = 0; x < w; x++) {
					let sum = 0;
					for (let j = 0; j < step; j++) sum += data[x * step + j] ?? 0;
					const y = ((1 - sum / step) / 2) * h;
					if (x === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				}
				ctx.stroke();
			} else {
				ctx.beginPath();
				ctx.lineWidth = 1;
				ctx.strokeStyle = `color-mix(in srgb, ${col} 30%, transparent)`;
				ctx.setLineDash([4, 8]);
				ctx.moveTo(0, h / 2);
				ctx.lineTo(w, h / 2);
				ctx.stroke();
				ctx.setLineDash([]);
			}

			rafRef.current = requestAnimationFrame(draw);
		};

		rafRef.current = requestAnimationFrame(draw);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [activeTrack]);

	return (
		<div
			className="flex shrink-0 flex-col border-t"
			style={{ height: 286, backgroundColor: vars.base }}
		>
			<div
				className="flex h-8 shrink-0 items-center border-b px-3"
				style={{ borderColor: "rgba(255,255,255,0.08)" }}
			>
				<span className="text-xs font-medium" style={{ color: vars.text }}>
					{trackName}
				</span>
				{!isPlaying && (
					<span
						className="ml-2 text-[10px]"
						style={{ color: "rgba(255,255,255,0.3)" }}
					>
						play to see waveform
					</span>
				)}
			</div>
			<div className="flex-1 overflow-hidden">
				<canvas
					ref={canvasRef}
					style={{ width: "100%", height: "100%", display: "block" }}
				/>
			</div>
		</div>
	);
}

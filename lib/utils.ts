import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function gridBg(
	totalSubs: number,
	subW: number,
	subs: number,
	bpb: number,
): string {
	const lines: string[] = [];
	for (let ci = 0; ci < totalSubs; ci++) {
		const x = ci * subW;
		const isBar = ci % (subs * bpb) === 0;
		const isBeat = ci % subs === 0;
		const color = isBar
			? "rgba(255,255,255,0.18)"
			: isBeat
				? "rgba(255,255,255,0.07)"
				: "rgba(255,255,255,0.025)";
		lines.push(
			`linear-gradient(${color},${color}) ${x}px 0 / 1px 100% no-repeat`,
		);
	}
	return lines.join(",");
}

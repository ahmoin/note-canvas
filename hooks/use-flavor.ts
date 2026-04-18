"use client";

import * as React from "react";
import type { Flavor } from "@/lib/catppuccin";

export function useFlavor(): Flavor {
	const [flavor, setFlavor] = React.useState<Flavor>(() => {
		if (typeof window === "undefined") return "mocha";
		return (localStorage.getItem("catppuccin-flavor") as Flavor) || "mocha";
	});

	React.useEffect(() => {
		const handler = () => {
			setFlavor(
				(localStorage.getItem("catppuccin-flavor") as Flavor) || "mocha",
			);
		};
		window.addEventListener("catppuccin-flavor-change", handler);
		return () =>
			window.removeEventListener("catppuccin-flavor-change", handler);
	}, []);

	return flavor;
}

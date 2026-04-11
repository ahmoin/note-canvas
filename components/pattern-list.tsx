"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const PATTERNS = ["Pattern 1", "Pattern 2", "Pattern 3"];

export function PatternList() {
	return (
		<div className="flex w-40 shrink-0 flex-col border-r bg-background">
			<div className="flex h-8 items-center justify-between border-b px-2">
				<span className="text-xs font-medium">Patterns</span>
				<Button variant="ghost" size="icon" className="size-6">
					<Plus className="size-3" />
				</Button>
			</div>
			<div className="flex-1 overflow-y-auto">
				{PATTERNS.map((name, i) => (
					<button
						key={i}
						className="flex w-full items-center px-2 py-1.5 text-left text-xs hover:bg-muted"
					>
						{name}
					</button>
				))}
			</div>
		</div>
	);
}

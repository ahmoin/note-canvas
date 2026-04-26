"use client";

import type * as React from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ClipMenuHandlers = {
	onDuplicate: () => void;
	onMakeUnique: () => void;
	onLoopSelection: () => void;
	onRename: () => void;
	onDisable: () => void;
	onCut: () => void;
	onCopy: () => void;
	onDelete: () => void;
};

export function ClipMenu({
	children,
	handlers,
}: {
	children: React.ReactNode;
	handlers: ClipMenuHandlers;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent side="bottom" align="end" className="w-52">
				<DropdownMenuItem onSelect={handlers.onDuplicate}>
					Duplicate
					<DropdownMenuShortcut>Ctrl D</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={handlers.onMakeUnique}>
					Make unique
					<DropdownMenuShortcut>Ctrl N</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={handlers.onLoopSelection}>
					Loop Selection
					<DropdownMenuShortcut>Ctrl L</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={handlers.onRename}>Rename</DropdownMenuItem>
				<DropdownMenuItem onSelect={handlers.onDisable}>
					Disable
					<DropdownMenuShortcut>O</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={handlers.onCut}>
					Cut
					<DropdownMenuShortcut>Ctrl X</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={handlers.onCopy}>
					Copy
					<DropdownMenuShortcut>Ctrl C</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="text-destructive focus:text-destructive"
					onSelect={handlers.onDelete}
				>
					Delete
					<DropdownMenuShortcut>Backspace / Del</DropdownMenuShortcut>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

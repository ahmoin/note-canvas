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

export function ClipMenu({ children }: { children: React.ReactNode }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent side="bottom" align="end" className="w-52">
				<DropdownMenuItem>
					Duplicate
					<DropdownMenuShortcut>Ctrl D</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuItem>
					Duplicate as new
					<DropdownMenuShortcut>Ctrl ⇧ D</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuItem>
					Make unique
					<DropdownMenuShortcut>Ctrl N</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					Loop Selection
					<DropdownMenuShortcut>Ctrl L</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem>Rename</DropdownMenuItem>
				<DropdownMenuItem>
					Disable
					<DropdownMenuShortcut>O</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					Cut
					<DropdownMenuShortcut>Ctrl X</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuItem>
					Copy
					<DropdownMenuShortcut>Ctrl C</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuItem className="text-destructive focus:text-destructive">
					Delete
					<DropdownMenuShortcut>Backspace / Del</DropdownMenuShortcut>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

"use client";

import { User } from "next-auth";
import { signOutAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";

export function UserMenu({ user }: { user: User }) {
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold p-0"
                    >
                        {user.email?.charAt(0).toUpperCase()}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                    <div className="px-2 py-1.5 text-sm font-semibold border-b border-border mb-1">
                        {user.email}
                    </div>
                    <DropdownMenuItem asChild>
                        <div className="flex items-center justify-between w-full cursor-pointer">
                            <span>Theme</span>
                            <ThemeToggle />
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onSelect={(e) => {
                            e.preventDefault();
                            const form = document.getElementById('navbar-signout-form') as HTMLFormElement;
                            if (form) form.requestSubmit();
                        }}
                    >
                        Sign out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <form id="navbar-signout-form" action={signOutAction} className="hidden" />
        </>
    );
}

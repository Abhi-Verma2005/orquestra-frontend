"use client";

import { User } from "next-auth";
import { LogOut, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions";

import { ThemeToggle } from "./theme-toggle";

export function UserMenu({ user }: { user: User }) {
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="size-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold p-0 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all hover:scale-105"
                    >
                        {user.email?.charAt(0).toUpperCase()}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 bg-[#0C0C0D] border-border/20 rounded-xl mt-2 p-1">
                    {/* User Info Header */}
                    <div className="px-3 py-3 border-b border-border/10 mb-1">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-[15px] font-semibold shadow-md">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-medium text-foreground truncate">{user.email}</div>
                                <div className="text-[11px] text-muted-foreground/50">Free Plan</div>
                            </div>
                        </div>
                    </div>

                    {/* Theme Toggle */}
                    <DropdownMenuItem asChild className="p-0 rounded-lg">
                        <div className="flex items-center justify-between w-full px-3 py-2.5 cursor-pointer hover:bg-muted/20 rounded-lg transition-colors">
                            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                                <Palette className="size-4" />
                                <span>Theme</span>
                            </div>
                            <ThemeToggle />
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-border/10 my-1" />

                    {/* Sign Out */}
                    <DropdownMenuItem
                        className="p-0 rounded-lg"
                        onSelect={(e) => {
                            e.preventDefault();
                            const form = document.getElementById('navbar-signout-form') as HTMLFormElement;
                            if (form) form.requestSubmit();
                        }}
                    >
                        <div className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer">
                            <LogOut className="size-4" />
                            Sign out
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <form id="navbar-signout-form" action={signOutAction} className="hidden" />
        </>
    );
}

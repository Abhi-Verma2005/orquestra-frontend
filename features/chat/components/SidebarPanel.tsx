"use client";

import Link from "next/link";
import { SlashIcon, PlusIcon, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { User } from "next-auth";

import { History } from "@/components/custom/history";
import Logo from "@/components/custom/logo";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { signOutAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SidebarPanelProps {
    user?: User;
    isCollapsed?: boolean;
}

export function SidebarPanel({ user, isCollapsed }: SidebarPanelProps) {
    return (
        <div className={cn("flex flex-col h-full bg-background border-r border-border", isCollapsed && "items-center")}>
            {/* Header */}
            <div className={cn("flex items-center p-4 border-b border-border h-16", isCollapsed ? "justify-center" : "justify-between")}>
                {!isCollapsed ? (
                    <div className="flex items-center gap-2">
                        <Logo href="/" size={24} />
                        <span className="font-semibold text-lg tracking-tight">Orq</span>
                    </div>
                ) : (
                    <Logo href="/" size={24} />
                )}
            </div>

            {/* New Chat Button */}
            <div className="px-3 pb-2 flex flex-col gap-2">
                <Button
                    className={cn("w-full justify-start gap-2", isCollapsed && "justify-center px-0")}
                    variant="outline"
                    asChild
                >
                    <Link href="/chat">
                        <PlusIcon className="size-4" />
                        {!isCollapsed && <span>New Chat</span>}
                    </Link>
                </Button>
                <Button
                    className={cn("w-full justify-start gap-2", isCollapsed && "justify-center px-0 text-muted-foreground")}
                    variant="ghost"
                    asChild
                >
                    <Link href="/marketplace">
                        <ShoppingBag className="size-4" />
                        {!isCollapsed && <span>Marketplace</span>}
                    </Link>
                </Button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {!isCollapsed && <div className="text-xs font-medium text-muted-foreground mb-2 px-1">Recent Activity</div>}
                <History user={user} isCollapsed={isCollapsed} />
            </div>

            {/* Footer / User Profile */}
            <div className="p-3 border-t border-border mt-auto">
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn("w-full justify-start h-auto py-2 px-2", isCollapsed && "justify-center")}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold shrink-0">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                    {!isCollapsed && (
                                        <div className="flex flex-col items-start truncate text-left">
                                            <span className="text-sm font-medium truncate w-full">{user.name || "User"}</span>
                                            <span className="text-xs text-muted-foreground truncate w-full">{user.email}</span>
                                        </div>
                                    )}
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mb-2">
                            <div className="px-2 py-1.5 text-sm font-semibold border-b border-border mb-1">
                                {user.email}
                            </div>
                            <DropdownMenuItem asChild>
                                <div className="flex items-center justify-between w-full cursor-pointer">
                                    <span>Theme</span>
                                    <ThemeToggle />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onSelect={(e) => {
                                e.preventDefault();
                                // We need to submit the form
                                const form = document.getElementById('signout-form') as HTMLFormElement;
                                if (form) form.requestSubmit();
                            }}>
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button asChild className="w-full" variant="secondary">
                        <Link href="/login">Login</Link>
                    </Button>
                )}
                {/* Hidden form for signout action */}
                <form id="signout-form" action={signOutAction} className="hidden" />
            </div>
        </div>
    );
}

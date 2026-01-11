"use client";

import Link from "next/link";
import { SlashIcon, PlusIcon, ShoppingBag, PanelLeft } from "lucide-react";
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
    onToggleCollapse?: () => void;
}

export function SidebarPanel({ user, isCollapsed, onToggleCollapse }: SidebarPanelProps) {
    return (
        <div className={cn("flex flex-col h-full bg-background border-r border-border", isCollapsed && "items-center")}>
            {/* Header */}
            <div className={cn(
                "flex border-b border-border transition-all duration-300",
                isCollapsed ? "flex-col items-center gap-4 py-4 px-2" : "items-center justify-between p-4 h-16"
            )}>
                {!isCollapsed ? (
                    <>
                        <div className="flex items-center gap-2">
                            <Logo href="/" size={24} />
                            <span className="font-semibold text-lg tracking-tight text-foreground">Orq</span>
                        </div>
                        {onToggleCollapse && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={onToggleCollapse}
                            >
                                <PanelLeft className="size-4" />
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        {onToggleCollapse && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={onToggleCollapse}
                            >
                                <PanelLeft className="size-5" />
                            </Button>
                        )}
                        <Logo href="/" size={24} />
                    </>
                )}
            </div>

            {/* New Chat Button */}
            {!isCollapsed ? (
                <div className="px-3 pb-2 pt-3 flex flex-col gap-2">
                    <Button
                        className="w-full justify-start gap-2"
                        variant="secondary"
                        asChild
                    >
                        <Link href="/chat">
                            <PlusIcon className="size-4" />
                            <span>New Chat</span>
                        </Link>
                    </Button>
                    <Button
                        className="w-full justify-start gap-2"
                        variant="secondary"
                        asChild
                    >
                        <Link href="/marketplace">
                            <ShoppingBag className="size-4" />
                            <span>Marketplace</span>
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        asChild
                    >
                        <Link href="/chat">
                            <PlusIcon className="size-5" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        asChild
                    >
                        <Link href="/marketplace">
                            <ShoppingBag className="size-5" />
                        </Link>
                    </Button>
                </div>
            )}

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

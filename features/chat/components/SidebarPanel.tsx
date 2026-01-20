"use client";

import { PlusIcon, Store, PanelLeft, Bot, MessageSquare, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { User } from "next-auth";
import { usePathname } from "next/navigation";

import { History } from "@/components/custom/history";
import Logo from "@/components/custom/logo";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

interface SidebarPanelProps {
    user?: User;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function SidebarPanel({ user, isCollapsed, onToggleCollapse }: SidebarPanelProps) {
    const pathname = usePathname();

    return (
        <div className={cn(
            "flex flex-col h-full bg-background border-r border-border/50",
            isCollapsed && "items-center"
        )}>
            {/* Header */}
            <div className={cn(
                "flex border-b border-border/50 transition-all duration-300",
                isCollapsed ? "flex-col items-center gap-4 py-4 px-2" : "items-center justify-between px-4 h-14"
            )}>
                {!isCollapsed ? (
                    <>
                        <div className="flex items-center gap-2.5">
                            <Logo href="/" size={22} />
                            <span className="font-semibold text-[15px] text-foreground">Orq</span>
                        </div>
                        {onToggleCollapse && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-all rounded-lg"
                                onClick={onToggleCollapse}
                            >
                                <PanelLeft className="size-4" strokeWidth={1.5} />
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        {onToggleCollapse && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-9 text-muted-foreground hover:text-foreground hover:bg-accent transition-all rounded-lg"
                                onClick={onToggleCollapse}
                            >
                                <PanelLeft className="size-5" strokeWidth={1.5} />
                            </Button>
                        )}
                        <Logo href="/" size={22} />
                    </>
                )}
            </div>

            {/* Navigation & Actions */}
            {!isCollapsed ? (
                <div className="px-3 py-3 space-y-1">
                    {/* New Chat - Primary Action */}
                    <Link
                        href="/chat"
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[13px] transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
                    >
                        <PlusIcon className="size-4" strokeWidth={2.5} />
                        <span>New Chat</span>
                    </Link>

                    {/* Nav Links */}
                    <div className="pt-2 space-y-1">
                        <Link
                            href="/marketplace"
                            className={cn(
                                "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] transition-all",
                                pathname?.startsWith("/marketplace")
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                        >
                            <Store className="size-4" strokeWidth={1.5} />
                            <span>Marketplace</span>
                        </Link>
                        <Link
                            href="/agents"
                            className={cn(
                                "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] transition-all",
                                pathname?.startsWith("/agents")
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                        >
                            <Bot className="size-4" strokeWidth={1.5} />
                            <span>Agents</span>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 py-4 px-2">
                    <Link
                        href="/chat"
                        className="flex items-center justify-center size-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-lg shadow-primary/20"
                        title="New Chat"
                    >
                        <PlusIcon className="size-5" strokeWidth={2.5} />
                    </Link>
                    <div className="h-px w-6 bg-border my-1" />
                    <Link
                        href="/marketplace"
                        className={cn(
                            "flex items-center justify-center size-10 rounded-lg transition-all",
                            pathname?.startsWith("/marketplace")
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                        title="Marketplace"
                    >
                        <Store className="size-5" strokeWidth={1.5} />
                    </Link>
                    <Link
                        href="/agents"
                        className={cn(
                            "flex items-center justify-center size-10 rounded-lg transition-all",
                            pathname?.startsWith("/agents")
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                        title="Agents"
                    >
                        <Bot className="size-5" strokeWidth={1.5} />
                    </Link>
                </div>
            )}

            {/* Chat History Section */}
            <div className="flex-1 overflow-y-auto px-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {!isCollapsed && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2 px-1 pt-2">
                        <MessageSquare className="size-3" />
                        <span>Recent</span>
                    </div>
                )}
                <History user={user} isCollapsed={isCollapsed} />
            </div>

            {/* Footer / User Profile */}
            <div className="p-3 border-t border-border/50">
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full h-auto py-2.5 px-2.5 hover:bg-accent rounded-xl transition-all",
                                    isCollapsed ? "justify-center" : "justify-start"
                                )}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-[14px] font-semibold shrink-0 shadow-lg shadow-primary/20">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                    {!isCollapsed && (
                                        <div className="flex flex-col items-start min-w-0 text-left">
                                            <span className="text-[13px] font-medium text-foreground truncate w-full">
                                                {user.name || "User"}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground truncate w-full">
                                                {user.email}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align={isCollapsed ? "center" : "start"}
                            side="top"
                            className="w-56 bg-popover border-border rounded-xl mb-2 p-1"
                        >
                            <div className="px-3 py-2.5 border-b border-border mb-1">
                                <div className="text-[13px] font-medium text-foreground truncate">{user.email}</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <Sparkles className="size-3" />
                                    Free Plan
                                </div>
                            </div>
                            <DropdownMenuItem asChild className="rounded-lg">
                                <div className="flex items-center justify-between w-full px-3 py-2 cursor-pointer hover:bg-accent">
                                    <span className="text-[13px] text-muted-foreground">Theme</span>
                                    <ThemeToggle />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border my-1" />
                            <DropdownMenuItem
                                className="rounded-lg p-0"
                                onSelect={(e) => {
                                    e.preventDefault();
                                    const form = document.getElementById('signout-form') as HTMLFormElement;
                                    if (form) form.requestSubmit();
                                }}
                            >
                                <div className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer">
                                    <LogOut className="size-4" />
                                    Sign out
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Link
                        href="/login"
                        className="flex items-center justify-center w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-medium transition-all"
                    >
                        Sign In
                    </Link>
                )}
                <form id="signout-form" action={signOutAction} className="hidden" />
            </div>
        </div>
    );
}

"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Menu, X, LogOut, Plus, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { History } from "./history";
import Logo from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { signOutAction } from "../../lib/actions";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface LeftSidebarProps {
  user?: any;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

const SheetOverlay = SheetPrimitive.Overlay;

export function LeftSidebar({ user, onCollapseChange }: LeftSidebarProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onCollapseChange?.(!newOpen);
  };

  return (
    <>
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="size-9 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
        title="Open sidebar"
      >
        <Menu className="size-5" />
      </Button>

      <SheetPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <SheetPrimitive.Portal>
          {/* Overlay */}
          <SheetOverlay
            className={cn(
              "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            )}
          />

          {/* Sidebar Content */}
          <SheetPrimitive.Content
            className={cn(
              "fixed z-50 bg-[#0A0A0B] border-r border-border/20",
              "inset-y-0 left-0 h-full w-72",
              "transition ease-in-out",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:duration-300 data-[state=open]:duration-500",
              "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
              "flex flex-col"
            )}
          >
            <VisuallyHidden.Root>
              <SheetPrimitive.Title>Navigation Sidebar</SheetPrimitive.Title>
              <SheetPrimitive.Description>
                Sidebar containing chat history and user settings
              </SheetPrimitive.Description>
            </VisuallyHidden.Root>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border/10">
              <div className="flex items-center gap-3">
                <Logo href="/" size={26} />
                <span className="text-[15px] font-semibold text-foreground">Orq</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="size-8 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <Link
                href="/chat"
                onClick={() => {
                  setOpen(false);
                  onCollapseChange?.(true);
                }}
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-border/20 bg-muted/10 hover:bg-muted/30 hover:border-border/30 px-4 py-3 text-[13px] font-medium text-foreground transition-all"
              >
                <Plus className="size-4" />
                New Chat
              </Link>

              <Link
                href="/agents"
                onClick={() => {
                  setOpen(false);
                  onCollapseChange?.(true);
                }}
                className="flex items-center justify-center gap-2 w-full mt-2 rounded-xl border border-border/20 bg-muted/10 hover:bg-muted/30 hover:border-border/30 px-4 py-3 text-[13px] font-medium text-foreground transition-all"
              >
                <div className="size-4 flex items-center justify-center">🤖</div>
                Agents
              </Link>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-hidden px-3">
              <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-3 px-1">
                <MessageSquare className="size-3" />
                Recent Chats
              </div>
              <div className="h-[calc(100vh-260px)] overflow-y-auto scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent">
                <History
                  user={user}
                  isCollapsed={false}
                  onItemClick={() => {
                    setOpen(false);
                    onCollapseChange?.(true);
                  }}
                />
              </div>
            </div>

            {/* Footer - User */}
            <div className="p-3 border-t border-border/10 bg-[#080808]">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="w-full justify-start gap-3 h-auto py-3 px-3 bg-transparent hover:bg-muted/20 text-foreground border-0 rounded-xl"
                      variant="ghost"
                    >
                      <div className="size-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-[14px] font-semibold shadow-lg shadow-blue-600/20">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[13px] font-medium truncate">{user.email}</div>
                        <div className="text-[11px] text-muted-foreground/50">Free Plan</div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 bg-[#0C0C0D] border-border/20 rounded-xl p-1">
                    <DropdownMenuItem className="p-0 rounded-lg">
                      <ThemeToggle />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/10 my-1" />
                    <DropdownMenuItem className="p-0 rounded-lg">
                      <form className="w-full" action={signOutAction}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <LogOut className="size-4" />
                          Sign out
                        </button>
                      </form>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-[13px] font-medium text-white transition-colors btn-primary-glow"
                >
                  Sign In
                </Link>
              )}
            </div>
          </SheetPrimitive.Content>
        </SheetPrimitive.Portal>
      </SheetPrimitive.Root>
    </>
  );
}

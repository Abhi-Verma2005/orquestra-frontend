import Link from "next/link";

import { auth, signOut } from "@/app/(auth)/auth";

import { History } from "./history";
import Logo from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const Navbar = async () => {
  let session = await auth();

  return (
    <>
      <div className="bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-border/10 absolute top-0 left-0 w-dvw py-3 px-4 justify-between flex flex-row items-center z-30">
        <div className="flex flex-row gap-4 items-center">
          <History user={session?.user} />
          <div className="flex flex-row gap-3 items-center">
            <Logo href="/" size={22} />
            <div className="h-4 w-px bg-border/20" />
            <div className="text-sm text-foreground font-medium">
              Web3 Chat
            </div>
          </div>
        </div>

        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold p-0 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-shadow"
                variant="ghost"
              >
                {session.user?.email?.charAt(0).toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#0C0C0D] border-border/20 rounded-xl mt-2 p-1">
              <div className="px-3 py-2.5 text-[13px] font-medium text-foreground border-b border-border/10 mb-1">
                {session.user?.email}
              </div>
              <DropdownMenuItem className="p-0 rounded-lg">
                <ThemeToggle />
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/10 my-1" />
              <DropdownMenuItem className="p-0 rounded-lg">
                <form
                  className="w-full"
                  action={async () => {
                    "use server";

                    await signOut({
                      redirectTo: "/",
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="w-full text-left px-3 py-2.5 text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-medium btn-primary-glow"
            asChild
          >
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  );
};

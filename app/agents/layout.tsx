import Link from "next/link";

import { auth } from "@/app/(auth)/auth";
import Logo from "@/components/custom/logo";
import { UserMenu } from "@/components/custom/user-menu";
import { Button } from "@/components/ui/button";

export default async function AgentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const user = session?.user;

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0B]">
            {/* Header - Refined Blink Style */}
            <header className="border-b border-border/10 bg-[#0A0A0B]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="container flex h-16 items-center px-6 mx-auto">
                    {/* Logo & Brand */}
                    <div className="mr-8 flex items-center gap-3">
                        <Logo size={26} />
                        <Link href="/" className="text-[16px] font-semibold text-foreground hover:text-foreground/80 transition-colors">
                            Orq
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex items-center gap-1">
                        <Link
                            href="/chat"
                            className="px-4 py-2 text-[13px] font-medium text-muted-foreground/60 hover:text-foreground rounded-lg hover:bg-muted/30 transition-all"
                        >
                            Chat
                        </Link>
                        <Link
                            href="/marketplace"
                            className="px-4 py-2 text-[13px] font-medium text-muted-foreground/60 hover:text-foreground rounded-lg hover:bg-muted/30 transition-all"
                        >
                            Marketplace
                        </Link>
                        <Link
                            href="/agents"
                            className="px-4 py-2 text-[13px] font-medium text-foreground bg-muted/40 rounded-lg transition-all"
                        >
                            Agents
                        </Link>
                    </nav>

                    {/* Right Side */}
                    <div className="flex flex-1 items-center justify-end gap-4">
                        {user ? (
                            <UserMenu user={user} />
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="text-[13px] text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
                                >
                                    <Link href="/login">Sign In</Link>
                                </Button>
                                <Button
                                    size="sm"
                                    asChild
                                    className="text-[13px] rounded-lg bg-blue-600 hover:bg-blue-500 px-4 h-9 btn-primary-glow"
                                >
                                    <Link href="/register">Get Started</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>
            <main className="flex-1">{children}</main>
        </div>
    );
}

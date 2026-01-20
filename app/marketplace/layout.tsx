import Link from "next/link";

import { auth } from "@/app/(auth)/auth";
import Logo from "@/components/custom/logo";
import { UserMenu } from "@/components/custom/user-menu";
import { Button } from "@/components/ui/button";

export default async function MarketplaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const user = session?.user;

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0B]">
            {/* Header - Blink Style */}
            <header className="border-b border-border/20 bg-[#0A0A0B]/95 backdrop-blur-md sticky top-0 z-50">
                <div className="container flex h-14 items-center px-4 mx-auto">
                    <div className="mr-4 flex">
                        <div className="mr-6 flex items-center gap-2">
                            <Logo size={24} />
                            <Link href="/" className="text-[15px] font-semibold text-foreground hover:text-foreground/80 transition-colors">
                                Orq
                            </Link>
                        </div>
                        <nav className="flex items-center gap-6 text-[13px] font-medium">
                            <Link
                                href="/chat"
                                className="text-muted-foreground/70 hover:text-foreground transition-colors"
                            >
                                Chat
                            </Link>
                            <Link
                                href="/marketplace"
                                className="text-foreground"
                            >
                                Marketplace
                            </Link>
                            <Link
                                href="/agents"
                                className="text-muted-foreground/70 hover:text-foreground transition-colors"
                            >
                                Agents
                            </Link>
                        </nav>
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-3">
                        {user ? (
                            <UserMenu user={user} />
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" asChild className="text-[13px] text-muted-foreground hover:text-foreground">
                                    <Link href="/login">Sign In</Link>
                                </Button>
                                <Button size="sm" asChild className="text-[13px] rounded-lg bg-blue-600 hover:bg-blue-700">
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

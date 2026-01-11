import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/custom/logo";

export default function MarketplaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container flex h-16 items-center px-4">
                    <div className="mr-4 flex">
                        <Link href="/" className="mr-6 flex items-center space-x-2">
                            <Logo size={28} />
                            <span className="hidden font-bold sm:inline-block text-lg">AntiGravity</span>
                        </Link>
                        <nav className="flex items-center space-x-6 text-sm font-medium">
                            <Link
                                href="/chat"
                                className="transition-colors hover:text-foreground/80 text-foreground/60"
                            >
                                Chat
                            </Link>
                            <Link
                                href="/marketplace"
                                className="transition-colors hover:text-foreground/80 text-foreground"
                            >
                                Marketplace
                            </Link>
                        </nav>
                    </div>
                    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                        <nav className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/login">Sign In</Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href="/signup">Get Started</Link>
                            </Button>
                        </nav>
                    </div>
                </div>
            </header>
            <main className="flex-1">{children}</main>
        </div>
    );
}

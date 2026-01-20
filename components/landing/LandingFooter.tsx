import { Github, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";

import Logo from "@/components/custom/logo";

export function LandingFooter() {
    return (
        <footer className="border-t border-border bg-background pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2 lg:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <Logo size={32} />
                            <Link href="/" className="font-bold text-xl hover:text-foreground/80 transition-colors">
                                Orq
                            </Link>
                        </div>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            The AI-native development environment for building agentic workflows and next-gen applications.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Github className="size-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Twitter className="size-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Linkedin className="size-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/chat" className="hover:text-foreground transition-colors">Editor</Link></li>
                            <li><Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Workflows</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Changelog</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">API Reference</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Community</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Legal</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} Orq Inc. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
                        <Link href="#" className="hover:text-foreground">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

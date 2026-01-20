"use client";

import { cn } from "@/lib/utils";
import { Database, Lock, Cpu, HardDrive, Globe, Zap, Server } from "lucide-react";

// Feature card with optional UI mockup
interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    iconColor: string;
    className?: string;
    children?: React.ReactNode;
}

function FeatureCard({ title, description, icon: Icon, iconColor, className, children }: FeatureCardProps) {
    return (
        <div className={cn(
            "group relative overflow-hidden rounded-xl border border-border/30 bg-[#0C0C0D] p-6 transition-all hover:border-border/50",
            className
        )}>
            <div className="flex items-center gap-3 mb-3">
                <Icon className={cn("h-5 w-5", iconColor)} />
                <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
            </div>
            <p className="text-[13px] text-muted-foreground/80 leading-relaxed mb-4">
                {description}
            </p>
            {children && (
                <div className="mt-4">
                    {children}
                </div>
            )}
        </div>
    );
}

// Database Table Mockup
function DatabaseMockup() {
    const rows = [
        { id: "1", name: "Sarah Chen", email: "sarah@acme.io", role: "admin", status: "active" },
        { id: "2", name: "John Smith", email: "john@startup.co", role: "editor", status: "active" },
        { id: "3", name: "Alex Park", email: "alex@company.com", role: "viewer", status: "active" },
        { id: "4", name: "Emma Davis", email: "emma@tech.dev", role: "editor", status: "pending" },
    ];

    return (
        <div className="rounded-lg border border-border/20 bg-black/30 overflow-hidden text-[11px]">
            <div className="grid grid-cols-5 gap-4 px-3 py-2 border-b border-border/20 text-muted-foreground/60">
                <span>id</span>
                <span>name</span>
                <span>email</span>
                <span>role</span>
                <span>status</span>
            </div>
            {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 px-3 py-2 border-b border-border/10 text-muted-foreground/80">
                    <span>{row.id}</span>
                    <span className="text-foreground/90">{row.name}</span>
                    <span>{row.email}</span>
                    <span>{row.role}</span>
                    <span className={row.status === "active" ? "text-green-500" : "text-yellow-500"}>{row.status}</span>
                </div>
            ))}
        </div>
    );
}

// Auth Form Mockup
function AuthMockup() {
    return (
        <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[12px] font-medium text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Sign in with Google
            </button>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                <div className="flex-1 h-px bg-border/30" />
                <span>or</span>
                <div className="flex-1 h-px bg-border/30" />
            </div>
            <input
                type="email"
                placeholder="Email"
                className="w-full rounded-lg border border-border/30 bg-black/30 px-3 py-2 text-[12px] text-muted-foreground placeholder:text-muted-foreground/50"
            />
            <button className="w-full rounded-lg border border-border/30 bg-black/30 px-4 py-2 text-[12px] font-medium text-foreground hover:bg-muted/20">
                Sign In
            </button>
        </div>
    );
}

// API Endpoints Mockup
function APIMockup() {
    const endpoints = [
        { method: "POST", path: "/api/stripe-webhook", color: "text-green-500" },
        { method: "POST", path: "/api/send-email", color: "text-green-500" },
        { method: "GET", path: "/api/analytics", color: "text-yellow-500" },
    ];

    return (
        <div className="space-y-2 text-[11px]">
            {endpoints.map((ep, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 border border-border/20">
                    <span className={cn("font-mono font-medium", ep.color)}>{ep.method}</span>
                    <span className="text-muted-foreground/70 font-mono">{ep.path}</span>
                </div>
            ))}
            <div className="flex items-center gap-2 text-muted-foreground/60 mt-3">
                <Zap className="h-3 w-3" />
                <span>Serverless • Auto-deployed</span>
            </div>
        </div>
    );
}

export function FeatureGrid() {
    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
                {/* Section Heading - Elegant Italic Serif */}
                <div className="text-center mb-16">
                    <h2 className="text-[36px] md:text-[48px] font-normal tracking-tight mb-4 italic">
                        Everything You Need, Built-In
                    </h2>
                    <p className="text-[15px] text-muted-foreground/80 max-w-xl mx-auto">
                        Orq is the all-in-one app creation platform for AI-native entrepreneurs and developers.
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
                    {/* Database - Large Card */}
                    <FeatureCard
                        title="Database"
                        description="Automatically setup your database and handle all SQL queries and migrations."
                        icon={Database}
                        iconColor="text-blue-500"
                        className="md:col-span-1"
                    >
                        <DatabaseMockup />
                    </FeatureCard>

                    {/* Authentication */}
                    <FeatureCard
                        title="Authentication"
                        description="Authenticate users with social logins, email/password, and magic links."
                        icon={Lock}
                        iconColor="text-green-500"
                        className="md:col-span-1"
                    >
                        <AuthMockup />
                    </FeatureCard>

                    {/* Edge Functions */}
                    <FeatureCard
                        title="Edge Functions"
                        description="Build and deploy complete backend APIs for your full stack app."
                        icon={Server}
                        iconColor="text-purple-500"
                        className="md:col-span-1"
                    >
                        <APIMockup />
                    </FeatureCard>

                    {/* Storage */}
                    <FeatureCard
                        title="Storage"
                        description="Upload and serve files with built-in CDN and image optimization."
                        icon={HardDrive}
                        iconColor="text-cyan-500"
                    />

                    {/* AI Models */}
                    <FeatureCard
                        title="AI Models"
                        description="Generate text, create images, and synthesize voice with GPT, Whisper, and more."
                        icon={Cpu}
                        iconColor="text-orange-500"
                    />

                    {/* Hosting */}
                    <FeatureCard
                        title="Hosting"
                        description="Deploy your app with custom domains, SSL certificates, and global CDN."
                        icon={Globe}
                        iconColor="text-pink-500"
                    />
                </div>

                {/* CTA Section */}
                <div className="text-center mt-20">
                    <p className="text-[18px] text-foreground mb-2">
                        <span className="font-semibold">You drive. AI builds.</span>{" "}
                        <span className="text-muted-foreground">Orq AI Agent sets up your entire backend—database, auth, APIs, and deployment—while you focus on your vision.</span>
                    </p>
                    <button className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-[14px] font-medium text-white hover:bg-blue-700 transition-colors">
                        Start Building Now
                    </button>
                </div>
            </div>
        </section>
    );
}

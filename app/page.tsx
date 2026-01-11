import MarketplaceLayout from "@/app/marketplace/layout";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";

export default function LandingPage() {
    return (
        // Reusing Marketplace Layout for header consistency for now
        <MarketplaceLayout>
            <div className="flex flex-col min-h-screen">
                <LandingHero />
                <FeatureGrid />

                {/* Social Proof Strip */}
                <div className="border-y border-border bg-background py-10">
                    <div className="container mx-auto px-4 text-center">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">Trusted by developers from</p>
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
                            {/* Text placeholders for logos as creating SVG components for all is verbose */}
                            <span className="text-xl font-bold">ACME Corp</span>
                            <span className="text-xl font-bold">Globex</span>
                            <span className="text-xl font-bold">Soylent Corp</span>
                            <span className="text-xl font-bold">Initech</span>
                            <span className="text-xl font-bold">Umbrella</span>
                        </div>
                    </div>
                </div>

                <LandingFooter />
            </div>
        </MarketplaceLayout>
    );
}

import MarketplaceLayout from "@/app/marketplace/layout";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { Testimonials } from "@/components/landing/Testimonials";

export default function LandingPage() {
    return (
        // Reusing Marketplace Layout for header consistency for now
        <MarketplaceLayout>
            <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
                <LandingHero />
                <FeatureGrid />
                <Testimonials />
                <LandingFooter />
            </div>
        </MarketplaceLayout>
    );
}

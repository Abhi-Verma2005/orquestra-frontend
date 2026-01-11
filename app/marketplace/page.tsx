import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { FilterSidebar } from "@/components/marketplace/FilterSidebar";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";

export default function MarketplacePage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <MarketplaceHero />
            <div className="container mx-auto px-4 py-8 flex gap-8">
                <aside className="w-64 shrink-0 hidden md:block animate-in fade-in slide-in-from-left-4 duration-700 delay-500">
                    <FilterSidebar />
                </aside>
                <main className="flex-1">
                    <MarketplaceGrid />
                </main>
            </div>
        </div>
    );
}

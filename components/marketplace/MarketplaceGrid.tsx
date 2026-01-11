import { MarketplaceCard } from "./MarketplaceCard";

const ITEMS = [
    { id: "1", title: "Next.js SaaS Starter", description: "Complete boilerplate with Auth, Stripe, and Drizzle.", author: "shadcn", rating: 4.9, downloads: 12000, price: 0, category: "Workflows" },
    { id: "2", title: "Python Data Agent", description: "Autonomous agent for data analysis and visualization.", author: "LangChain", rating: 4.8, downloads: 8500, price: 0, category: "Agents" },
    { id: "3", title: "SEO Blog Writer", description: "Generate SEO-optimized blog posts with one click.", author: "OpenAI", rating: 4.7, downloads: 5400, price: 19, category: "Prompts" },
    { id: "4", title: "Rust API Template", description: "High-performance Axum + Tokio backend starter.", author: "Rustacean", rating: 5.0, downloads: 3200, price: 0, category: "Workflows" },
    { id: "5", title: "React Component Generator", description: "Generate React components from text descriptions.", author: "Vercel", rating: 4.6, downloads: 15000, price: 0, category: "Tools" },
    { id: "6", title: "Figma to Code", description: "Convert Figma designs to Tailwind CSS code.", author: "Adobe", rating: 4.5, downloads: 9000, price: 49, category: "Workflows" },
    { id: "7", title: "SQL Query Optimizer", description: "Analyze and optimize slow SQL queries automatically.", author: "Supabase", rating: 4.8, downloads: 6000, price: 0, category: "Tools" },
    { id: "8", title: "Email Marketing Agent", description: "Draft and schedule email campaigns.", author: "Mailchimp", rating: 4.4, downloads: 3000, price: 29, category: "Agents" },
]

export function MarketplaceGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            {ITEMS.map(item => (
                <MarketplaceCard key={item.id} item={item} />
            ))}
        </div>
    )
}

import {
    Bot,
    Workflow,
    ShoppingBag,
    Zap,
    Code2,
    Share2
} from "lucide-react";

const FEATURES = [
    {
        title: "Real-time Orchestration",
        description: "Chain multiple AI models and tools together with a visual workflow builder that executes in real-time.",
        icon: Workflow,
        color: "text-blue-500",
    },
    {
        title: "Agent Skills Marketplace",
        description: "Discover and integrate pre-built skills, prompts, and agent behaviors from the community.",
        icon: ShoppingBag,
        color: "text-purple-500",
    },
    {
        title: "Multi-Model Support",
        description: "Seamlessly switch between GPT-4, Claude 3.5, and open-source models for optimal performance.",
        icon: Bot,
        color: "text-green-500",
    },
    {
        title: "Rust-Powered Performance",
        description: "Built on a high-performance Rust backend for millisecond-latency agent interactions.",
        icon: Zap,
        color: "text-yellow-500",
    },
    {
        title: "Context-Aware Coding",
        description: "Deep integration with your codebase allowing agents to read, understand, and modify files safely.",
        icon: Code2,
        color: "text-orange-500",
    },
    {
        title: "Instant Sharing",
        description: "Package your agent workflows and share them with your team or the world with one click.",
        icon: Share2,
        color: "text-pink-500",
    },
];

export function FeatureGrid() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to build</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        A complete environment designed for the next generation of AI-native software development.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {FEATURES.map((feature, i) => (
                        <div
                            key={i}
                            className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                        >
                            <div className={`size-12 rounded-lg bg-background border border-border flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                                <feature.icon className="size-6" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

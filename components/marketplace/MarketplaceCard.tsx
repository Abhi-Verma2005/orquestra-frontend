"use client";

import { Star, Download } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface Item {
    id: string;
    title: string;
    description: string;
    author: string;
    rating: number;
    downloads: number;
    price: string | number;
    image?: string;
    category: string;
}

export function MarketplaceCard({ item }: { item: Item }) {
    return (
        <Card className="group overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50 cursor-pointer h-full flex flex-col">
            <div className="aspect-video relative bg-muted overflow-hidden">
                {item.image ? (
                    <Image src={item.image} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <span className="text-4xl font-bold opacity-20 text-foreground">{item.title[0]}</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                        Quick View
                    </Badge>
                </div>
            </div>

            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[10px] h-5 bg-background/50">{item.category}</Badge>
                    <div className="flex items-center text-xs text-muted-foreground font-medium">
                        <Star className="size-3 text-yellow-500 fill-yellow-500 mr-1" />
                        {item.rating}
                    </div>
                </div>
                <h3 className="font-semibold leading-tight line-clamp-2 min-h-10 group-hover:text-primary transition-colors">
                    {item.title}
                </h3>
            </CardHeader>

            <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                </p>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground mt-auto">
                <div className="flex items-center">
                    <span className="font-medium text-foreground opacity-80">{item.author}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center" title="Downloads">
                        <Download className="size-3 mr-1" />
                        {item.downloads >= 1000 ? `${(item.downloads / 1000).toFixed(1)}k` : item.downloads}
                    </span>
                    <span className="font-semibold text-primary">
                        {item.price === 0 ? "Free" : `$${item.price}`}
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}

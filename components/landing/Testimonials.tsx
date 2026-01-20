"use client";

import { Star, Linkedin, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
    {
        quote: "In one uninterrupted evening, I was able to build a full-featured, enterprise-grade platform 'Quantum Social AI' from zero to working prototype, entirely on Orq. What used to take a team and a roadmap, I did solo in a few hours. Orq didn't just accelerate the process—it amplified it.",
        author: "Jeff Robinson",
        role: "",
        platform: "linkedin",
        rating: 5,
    },
    {
        quote: "Dude, I'm sure you're getting a lot of messages and people reaching out to you! I wanted to thank you for releasing Orq, I was able yesterday (while on holiday) to build this web app I've been trying to build for the last year. It has everything I need to. I honestly tried them all Bolt, Lovable, Replit, V0, Emergent etc... they get close... but your software actually did it! Not sure how.. but it works!!",
        author: "Riccardo Vincenzi",
        role: "",
        platform: "linkedin",
        rating: 5,
    },
    {
        quote: "The builder is really cool. I have gotten further in 5 days than I have in a year.",
        author: "Chris R. Pettigrew, Sr",
        role: "President, Intellese, LLC",
        platform: "email",
        rating: 5,
    },
    {
        quote: "Wow, Kai, this product is unbelievable! I built a full-featured GPT 4.0 clone, wrote a legal brief, and even analyzed an X-ray image in less than 25 minutes. This would have taken a team weeks.",
        author: "Haroon Hameed MD, MBA, JD",
        role: "Candidate",
        platform: "linkedin",
        rating: 5,
    }
];

export function Testimonials() {
    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
                {/* Section Heading - Elegant Serif */}
                <div className="text-center mb-16">
                    <h2 className="text-[36px] md:text-[48px] font-normal tracking-tight mb-4 italic">
                        Loved by Builders Worldwide
                    </h2>
                    <p className="text-[15px] text-muted-foreground/80 max-w-xl mx-auto">
                        Join thousands of developers and entrepreneurs building their dreams with Orq
                    </p>
                </div>

                {/* Testimonials Grid - Horizontal Scroll on Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
                    {TESTIMONIALS.map((testimonial, i) => (
                        <div
                            key={i}
                            className="flex flex-col justify-between rounded-xl border border-border/30 bg-[#0C0C0D] p-5 min-h-[280px]"
                        >
                            {/* Stars */}
                            <div>
                                <div className="flex gap-0.5 mb-4">
                                    {[...Array(testimonial.rating)].map((_, j) => (
                                        <Star key={j} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                    ))}
                                </div>

                                {/* Quote */}
                                <blockquote className="text-[13px] text-muted-foreground/90 leading-relaxed">
                                    "{testimonial.quote}"
                                </blockquote>
                            </div>

                            {/* Author */}
                            <div className="flex items-end justify-between mt-6 pt-4 border-t border-border/20">
                                <div>
                                    <div className="text-[13px] font-medium text-foreground">{testimonial.author}</div>
                                    {testimonial.role && (
                                        <div className="text-[11px] text-muted-foreground/60 mt-0.5">{testimonial.role}</div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                                    {testimonial.platform === "linkedin" ? (
                                        <>
                                            <Linkedin className="h-3.5 w-3.5" />
                                            <span>LinkedIn</span>
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-3.5 w-3.5" />
                                            <span>Email</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

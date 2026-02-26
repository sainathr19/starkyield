"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface HistoryCardSkeletonProps {
    className?: string;
}

const HistoryCardSkeleton: React.FC<HistoryCardSkeletonProps> = ({ className }) => {
    return (
        <Card willHover={false} className={cn("space-y-4 xs:space-y-6 w-full", className)}>
            {/* Header */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-0">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 xs:gap-3">
                        <div className="w-6 h-6 xs:w-7 xs:h-7 skeleton-shimmer rounded" />
                    </div>
                    <div className="flex items-center gap-1 xs:gap-2">
                        <div className="h-4 w-20 xs:w-24 skeleton-shimmer rounded" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 skeleton-shimmer rounded-full" />
                    <div className="h-3 w-28 xs:w-36 skeleton-shimmer rounded" />
                </div>
            </div>

            {/* Transaction Details - Mobile */}
            <div className="space-y-3 xs:space-y-4 sm:hidden">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div className="space-y-1" key={i}>
                        <div className="h-4 w-40 xs:w-56 skeleton-shimmer rounded" />
                        <div className="h-3 w-24 skeleton-shimmer rounded" />
                    </div>
                ))}

                <div className="space-y-2 pt-2 border-t border-my-grey/20">
                    <div className="space-y-1">
                        <div className="h-5 xs:h-6 w-24 skeleton-shimmer rounded" />
                        <div className="h-3 w-16 skeleton-shimmer rounded" />
                    </div>
                    <div className="h-8 w-full skeleton-shimmer rounded" />
                </div>
            </div>

            {/* Tablet & Desktop Layout */}
            <div className="hidden sm:block space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4">
                    <div className="space-y-1">
                        <div className="h-4 w-40 skeleton-shimmer rounded" />
                        <div className="h-3 w-24 skeleton-shimmer rounded" />
                    </div>
                    <div className="space-y-1">
                        <div className="h-4 w-48 skeleton-shimmer rounded" />
                        <div className="h-3 w-24 skeleton-shimmer rounded" />
                    </div>
                    <div className="space-y-1">
                        <div className="h-4 w-48 skeleton-shimmer rounded" />
                        <div className="h-3 w-24 skeleton-shimmer rounded" />
                    </div>
                    <div className="space-y-1 hidden md:block">
                        <div className="h-4 w-48 skeleton-shimmer rounded" />
                        <div className="h-3 w-24 skeleton-shimmer rounded" />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4">
                    <div className="space-y-1">
                        <div className="h-4 w-48 skeleton-shimmer rounded" />
                        <div className="h-3 w-24 skeleton-shimmer rounded" />
                    </div>
                    <div className="space-y-1">
                        <div className="h-4 w-48 skeleton-shimmer rounded" />
                        <div className="h-3 w-24 skeleton-shimmer rounded" />
                    </div>
                    <div className="space-y-1">
                        <div className="h-4 w-48 skeleton-shimmer rounded" />
                        <div className="h-3 w-24 skeleton-shimmer rounded" />
                    </div>
                    <div className="space-y-2 xs:space-y-3">
                        <div className="space-y-1">
                            <div className="h-5 xs:h-6 w-24 skeleton-shimmer rounded" />
                            <div className="h-3 w-16 skeleton-shimmer rounded" />
                        </div>
                        <div className="h-8 w-full skeleton-shimmer rounded" />
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default HistoryCardSkeleton;



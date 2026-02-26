"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface PortfolioCardSkeletonProps {
    className?: string;
}

const PortfolioCardSkeleton: React.FC<PortfolioCardSkeletonProps> = ({ className }) => {
    return (
        <Card className={cn("text-left space-y-8 xs:space-y-10", className)}>
            {/* Header */}
            <div className="flex flex-col justify-center xs:flex-row items-center xs:justify-between gap-3 xs:gap-0">
                <div className="flex items-center gap-2 xs:gap-3">
                    <div className="w-6 h-6 xs:w-7 xs:h-7 skeleton-shimmer rounded" />
                    <div className="flex items-center gap-1 xs:gap-2">
                        <div className="h-4 w-24 skeleton-shimmer rounded" />
                        <span className="w-1 h-1 skeleton-shimmer rounded-full" />
                        <div className="h-3 w-16 skeleton-shimmer rounded" />
                    </div>
                </div>

                <div className="flex items-center gap-2 xs:gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 xs:w-5 xs:h-5 skeleton-shimmer rounded-full" />
                        <div className="h-3 w-8 skeleton-shimmer rounded" />
                    </div>
                    <div className="w-3 h-3 xs:w-4 xs:h-4 skeleton-shimmer rounded" />
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 xs:w-5 xs:h-5 skeleton-shimmer rounded-full" />
                        <div className="h-3 w-10 skeleton-shimmer rounded" />
                    </div>
                    <div className="w-3 h-3 xs:w-4 xs:h-4 skeleton-shimmer rounded-full" />
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 xs:gap-4 lg:px-4">
                <div className="flex flex-col text-center items-center justify-center gap-2">
                    <div className="h-5 xs:h-6 w-16 skeleton-shimmer rounded" />
                    <div className="h-3 w-20 skeleton-shimmer rounded" />
                </div>

                <div className="flex flex-col text-center items-center justify-center gap-2">
                    <div className="h-5 xs:h-6 w-16 skeleton-shimmer rounded" />
                    <div className="h-3 w-24 skeleton-shimmer rounded" />
                </div>

                <div className="flex flex-col text-center items-center justify-center gap-2">
                    <div className="h-5 xs:h-6 w-24 skeleton-shimmer rounded" />
                    <div className="h-3 w-20 skeleton-shimmer rounded" />
                </div>

                <div className="flex flex-col text-center items-center justify-center gap-2">
                    <div className="h-5 xs:h-6 w-24 skeleton-shimmer rounded" />
                    <div className="h-3 w-20 skeleton-shimmer rounded" />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <div className="h-10 w-full skeleton-shimmer rounded" />
                <div className="h-10 w-full skeleton-shimmer rounded" />
            </div>
        </Card>
    );
};

export default PortfolioCardSkeleton;



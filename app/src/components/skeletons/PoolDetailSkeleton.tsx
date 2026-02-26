import React from "react";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface PoolDetailSkeletonProps {
    className?: string;
}

const PoolDetailSkeleton: React.FC<PoolDetailSkeletonProps> = ({ className }) => {
    return (
        <div className={cn("max-w-7xl mx-auto w-full py-6 relative z-10 pb-8 md:pb-12", className)}>
            {/* Back Navigation Skeleton */}
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 skeleton-shimmer rounded" />
                    <div className="h-4 w-32 skeleton-shimmer rounded" />
                </div>
            </div>

            {/* Pool Header Skeleton */}
            <div className="mb-6 flex items-center justify-between flex-col md:flex-row gap-8 md:gap-0">
                <div className="flex items-center gap-6 justify-start w-full">
                    <div className="w-16 h-16 skeleton-shimmer rounded-full" />
                    <div>
                        <div className="h-8 w-48 skeleton-shimmer rounded mb-2" />
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-16 skeleton-shimmer rounded" />
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 skeleton-shimmer rounded" />
                                <div className="h-4 w-12 skeleton-shimmer rounded" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center w-full">
                    <div className="flex items-center justify-between w-full flex-wrap gap-8">
                        <div className="flex flex-col items-center w-fit justify-center gap-2">
                            <div className="h-8 w-24 skeleton-shimmer rounded" />
                            <div className="h-4 w-28 skeleton-shimmer rounded" />
                        </div>
                        <div className="flex flex-col items-center w-fit justify-center gap-2">
                            <div className="h-8 w-20 skeleton-shimmer rounded" />
                            <div className="h-4 w-24 skeleton-shimmer rounded" />
                        </div>
                        <div className="flex flex-col items-center w-fit justify-center gap-2">
                            <div className="h-8 w-20 skeleton-shimmer rounded" />
                            <div className="h-4 w-24 skeleton-shimmer rounded" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Deposit Input Card Skeleton */}
            <Card willHover={false} className="text-left grid md:grid-cols-3 mt-10 grid-cols-1 gap-8">
                {/* BTC Input Section */}
                <div className="flex flex-col items-center justify-center gap-2 w-full md:border-r border-b md:border-b-0 pb-9 md:pb-0 border-my-grey md:pr-9">
                    <div className="flex items-center justify-between w-full flex-wrap gap-2">
                        <div className="h-5 w-32 skeleton-shimmer rounded" />
                    </div>
                    <div className="flex items-center justify-between w-full border-b border-my-grey pt-4">
                        <div className="h-12 w-32 skeleton-shimmer rounded" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 skeleton-shimmer rounded" />
                            <div className="h-6 w-8 skeleton-shimmer rounded" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between w-full text-sm font-medium">
                        <div className="h-4 w-20 skeleton-shimmer rounded" />
                        <div className="flex items-center gap-1">
                            <div className="h-4 w-16 skeleton-shimmer rounded" />
                            <div className="h-4 w-8 skeleton-shimmer rounded" />
                        </div>
                    </div>
                </div>

                {/* Equivalent Section */}
                <div className="flex flex-col items-center justify-center gap-2 w-full md:border-r border-b md:border-b-0 pb-9 md:pb-0 border-my-grey md:pr-9 md:pl-7">
                    <div className="flex items-center justify-start w-full">
                        <div className="h-5 w-24 skeleton-shimmer rounded" />
                    </div>
                    <div className="flex items-center justify-between w-full border-b border-my-grey pt-4">
                        <div className="h-12 w-24 skeleton-shimmer rounded" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 skeleton-shimmer rounded" />
                            <div className="h-6 w-12 skeleton-shimmer rounded" />
                            <div className="w-5 h-5 skeleton-shimmer rounded" />
                        </div>
                    </div>
                    <div className="flex items-center justify-start w-full text-sm font-medium">
                        <div className="flex items-center gap-1">
                            <div className="h-4 w-12 skeleton-shimmer rounded" />
                            <div className="h-4 w-16 skeleton-shimmer rounded" />
                            <div className="w-3 h-3 skeleton-shimmer rounded" />
                        </div>
                    </div>
                </div>

                {/* Earnings Section */}
                <div className="flex flex-col items-center justify-center gap-2 w-full md:pl-7">
                    <div className="flex items-center justify-between w-full">
                        <div className="h-5 w-32 skeleton-shimmer rounded" />
                        <div className="h-5 w-20 skeleton-shimmer rounded" />
                    </div>
                    <div className="flex items-center justify-between w-full">
                        <div className="h-5 w-28 skeleton-shimmer rounded" />
                        <div className="h-5 w-20 skeleton-shimmer rounded" />
                    </div>
                    <div className="h-12 w-full skeleton-shimmer rounded" />
                </div>
            </Card>

            {/* Divider */}
            <div className="bg-my-grey w-full h-px mt-7" />

            {/* Addresses Section Skeleton */}
            <Card willHover={false} className="mt-7 px-0">
                <div className="px-6 py-4 border-b border-my-grey">
                    <div className="h-6 w-32 skeleton-shimmer rounded" />
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="h-4 w-24 skeleton-shimmer rounded" />
                            <div className="h-10 w-full skeleton-shimmer rounded" />
                            <div className="h-4 w-32 skeleton-shimmer rounded" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-4 w-24 skeleton-shimmer rounded" />
                            <div className="h-10 w-full skeleton-shimmer rounded" />
                            <div className="h-4 w-32 skeleton-shimmer rounded" />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Collateral Exposure Section Skeleton */}
            <Card willHover={false} className="mt-7 px-0">
                <div className="px-6 py-4 border-b border-my-grey">
                    <div className="h-6 w-40 skeleton-shimmer rounded" />
                </div>
                <div className="w-full overflow-x-auto">
                    <div className="w-[160%] sm:w-[120%] md:w-full">
                        <div className="px-6 py-3 border-b border-my-grey">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="h-4 w-16 skeleton-shimmer rounded" />
                                <div className="h-4 w-20 skeleton-shimmer rounded" />
                                <div className="h-4 w-24 skeleton-shimmer rounded" />
                                <div className="h-4 w-20 skeleton-shimmer rounded" />
                            </div>
                        </div>
                        <div className="px-6 py-3">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 skeleton-shimmer rounded" />
                                    <div className="h-5 w-12 skeleton-shimmer rounded" />
                                </div>
                                <div className="h-5 w-16 skeleton-shimmer rounded" />
                                <div className="h-5 w-20 skeleton-shimmer rounded" />
                                <div className="h-5 w-16 skeleton-shimmer rounded" />
                            </div>
                        </div>
                        <div className="px-6 py-3 bg-my-grey/20">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 skeleton-shimmer rounded" />
                                    <div className="h-5 w-12 skeleton-shimmer rounded" />
                                </div>
                                <div className="h-5 w-16 skeleton-shimmer rounded" />
                                <div className="h-5 w-20 skeleton-shimmer rounded" />
                                <div className="h-5 w-16 skeleton-shimmer rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PoolDetailSkeleton;

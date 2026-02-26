import React from 'react';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
    className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ className }) => {
    return (
        <section className={cn('w-full px-3 xs:px-4 sm:px-6 lg:px-8 py-6 xs:py-8 md:py-12', className)}>
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 xs:gap-8 lg:gap-12">
                    <h1 className="font-mono text-xl xs:text-2xl sm:text-3xl lg:text-5xl leading-tight text-center sm:text-left">
                        Earn
                    </h1>
                    <p className="font-mono text-xs xs:text-sm sm:text-md xl:text-lg max-w-md text-center sm:text-right">
                        Put your native BTC to work in one click. Deposit directly (L1 or Lightning),
                        and we&apos;ll handle bridging + yield automatically.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;

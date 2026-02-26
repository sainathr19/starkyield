'use client';
import React from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface CTASectionProps {
    className?: string;
}

const CTASection: React.FC<CTASectionProps> = ({ className }) => {
    const router = useRouter();
    return (
        <section className={cn('w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12', className)}>
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="text-center lg:text-left">
                        <h2 className="font-mono text-xl">
                            Put your Bitcoin to work today.
                        </h2>
                    </div>

                    <div className="flex justify-center lg:justify-end">
                        <Button variant="primary" onClick={() => router.push('/earn')}>
                            Start Earning with BTC
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTASection;

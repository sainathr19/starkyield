import React from 'react';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StepCardProps {
    stepNumber: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

const StepCard: React.FC<StepCardProps> = ({ stepNumber, title, description, icon }) => {
    return (
        <Card className="text-left space-y-10">
            <div className="space-y-1">
            <div className="text-sm font-mono text-my-grey">{stepNumber}</div>
            <h3 className="font-mono text-xl">{title}</h3>
            </div>
            <div className="w-16 h-16 flex items-center justify-center">
                {icon}
            </div>
            <p className="font-mono text-sm">{description}</p>
        </Card>
    );
};

interface HowItWorksSectionProps {
    className?: string;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ className }) => {
    const steps = [
        {
            stepNumber: 'BTC + STRK',
            title: 'Dual-Asset Staking',
            description: 'Stake both BTC and STRK in one place.',
            icon: (
                <Image src="/icons/deposit.svg" alt="Deposit" width={56} height={56} />
            )
        },
        {
            stepNumber: 'Simple UX',
            title: 'Clean Experience',
            description: 'A focused staking product with no unnecessary complexity.',
            icon: (
                <Image src="/icons/bridge.svg" alt="Bridge" width={56} height={56} />
            )
        },
        {
            stepNumber: 'On-Chain',
            title: 'Powered by Starkzap',
            description: 'Built on Starknet with Starkzap staking support.',
            icon: (
                <Image src="/icons/yield.svg" alt="Yield" width={56} height={56} />
            )
        },
        {
            stepNumber: 'Portfolio',
            title: 'Visibility',
            description: 'Track your positions and rewards from a single dashboard.',
            icon: (
                <Image src="/icons/withdraw.svg" alt="Withdraw" width={56} height={56} />
            )
        }
    ];

    return (
        <section className={cn('w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12', className)}>
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {steps.map((step, index) => (
                        <StepCard
                            key={index}
                            stepNumber={step.stepNumber}
                            title={step.title}
                            description={step.description}
                            icon={step.icon}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
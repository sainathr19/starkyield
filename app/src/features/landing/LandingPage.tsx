import React from 'react';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import CTASection from '@/components/landing/CTASection';
import { cn } from '@/lib/utils';

interface LandingPageProps {
    className?: string;
}

const LandingPage: React.FC<LandingPageProps> = ({ className }) => {
    return (
        <div className={cn('min-h-screen', className)}>
            <HeroSection />
            <HowItWorksSection />
            <CTASection />
        </div>
    );
};

export default LandingPage;

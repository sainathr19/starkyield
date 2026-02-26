import React from 'react';
import { cn } from '@/lib/utils';

interface FooterProps {
    className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
    return (
        <footer className={cn('w-full px-4 sm:px-6 lg:px-8 pb-8', className)}>
            <div className="max-w-7xl mx-auto">
                <div className="border-t border-my-grey pb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div className="text-center md:text-left">
                        <p className="font-mono text-sm text-my-grey">
                            @OneSat | One click, one Sat, one journey to yield
                        </p>
                    </div>

                    <div className="text-center md:text-right">
                        <p className="font-mono text-sm text-my-grey">
                            Hackathon Re&#123;solve&#125; submission | Starknet | Team: Oryn finance | 2025
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

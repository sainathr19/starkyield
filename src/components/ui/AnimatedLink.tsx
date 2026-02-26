'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AnimatedLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    underlineClassName?: string;
    onClick?: () => void;
    variant?: 'default' | 'mobile';
}

const AnimatedLink: React.FC<AnimatedLinkProps> = ({
    href,
    children,
    className,
    underlineClassName,
    onClick,
    variant = 'default'
}) => {
    const pathname = usePathname();
    const isActive = pathname === href || (href === '/earn' && pathname.startsWith('/earn/'));

    const getUnderlineClasses = () => {
        if (variant === 'mobile') {
            return cn(
                "absolute bottom-0 h-0.5 bg-gray-900 transition-all duration-200",
                isActive ? "w-[calc(100%-2rem)] left-4" : "w-0 left-4 group-hover:w-[calc(100%-2rem)]",
                underlineClassName
            );
        }
        return cn(
            "absolute bottom-0 left-0 h-0.5 bg-gray-900 transition-all duration-200",
            isActive ? "w-full" : "w-0 group-hover:w-full",
            underlineClassName
        );
    };

    const getTextContainerClasses = () => {
        if (variant === 'mobile') {
            return "absolute top-full left-4 inline-block transition-transform duration-200";
        }
        return "absolute top-full left-0 inline-block transition-transform duration-200";
    };

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "font-mono transition-all duration-200 relative group overflow-hidden inline-block",
                isActive
                    ? "font-semibold"
                    : "hover:font-semibold",
                className
            )}
        >
            {/* Original text layer */}
            <span className={cn(
                "inline-block transition-transform duration-200",
                isActive ? "translate-y-0" : "translate-y-0 group-hover:-translate-y-full"
            )}>
                {children}
            </span>

            {/* Animated text layer */}
            <span className={cn(
                getTextContainerClasses(),
                isActive ? "translate-y-0" : "translate-y-0 group-hover:-translate-y-full"
            )}>
                {children}
            </span>

            {/* Underline */}
            <span className={getUnderlineClasses()}></span>
        </Link>
    );
};

export default AnimatedLink;

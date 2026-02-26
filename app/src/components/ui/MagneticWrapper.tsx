'use client';

import React, { useState, useRef, useEffect } from 'react';

interface MagneticWrapperProps {
    children: React.ReactNode;
    strength?: number;
    disabled?: boolean;
}

const MagneticWrapper: React.FC<MagneticWrapperProps> = ({
    children,
    strength = 3,
    disabled = false
}) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const childRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 900);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!childRef.current || !containerRef.current || isPressed || isMobile || disabled) return;

        const rect = childRef.current.getBoundingClientRect();

        const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
        const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

        setMousePosition({ x: x * strength, y: y * strength });
    };

    const handleMouseEnter = () => {
        if (!isMobile && !disabled) {
            setIsHovered(true);
        }
    };

    const handleMouseLeave = () => {
        if (!isMobile && !disabled) {
            setIsHovered(false);
            setMousePosition({ x: 0, y: 0 });
        }
    };

    const handleMouseDown = () => {
        if (!disabled) {
            setIsPressed(true);
        }
    };

    const handleMouseUp = () => {
        if (!disabled) {
            setIsPressed(false);
        }
    };

    const handleTouchStart = () => {
        if (!disabled) {
            setIsPressed(true);
        }
    };

    const handleTouchEnd = () => {
        if (!disabled) {
            setIsPressed(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className="inline-block relative"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {!isMobile && !disabled && (
                <div
                    className="absolute"
                    style={{
                        top: '-32px',
                        left: '-32px',
                        right: '-32px',
                        bottom: '-32px',
                        pointerEvents: 'auto',
                        zIndex: 1
                    }}
                />
            )}
            <div
                ref={childRef}
                style={{
                    transform: isPressed
                        ? 'translate(4px, 4px)'
                        : isHovered && !isMobile && !disabled
                            ? `translate(${mousePosition.x}px, ${mousePosition.y}px)`
                            : isMobile && !disabled
                                ? 'translate(-4px, -4px)'
                                : 'translate(0px, 0px)',
                    transition: isPressed || !isHovered || isMobile || disabled ? 'transform 0.1s ease-out' : 'none',
                    boxShadow: isPressed || disabled
                        ? 'none'
                        : isHovered && !isMobile
                            ? '4px 4px 0 0 #9ea393'
                            : isMobile
                                ? '4px 4px 0 0 #9ea393'
                                : 'none',
                    position: 'relative',
                    zIndex: 2
                }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
};

export default MagneticWrapper;


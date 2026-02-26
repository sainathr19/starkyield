"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  willHover?: boolean;
  cursorPointer?: boolean;
}

let globalElevatedCardId: string | null = null;
const cardListeners = new Set<(elevatedId: string | null) => void>();

const notifyCardListeners = (elevatedId: string | null) => {
  cardListeners.forEach((listener) => listener(elevatedId));
};

const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  isActive = false,
  disabled = false,
  willHover = true,
  cursorPointer = false,
}) => {
  const [isElevated, setIsElevated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardIdRef = useRef<string>(
    `card-${Math.random().toString(36).substr(2, 9)}`
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 600);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleCardStateChange = (elevatedId: string | null) => {
      setIsElevated(elevatedId === cardIdRef.current);
    };

    cardListeners.add(handleCardStateChange);

    return () => {
      cardListeners.delete(handleCardStateChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (globalElevatedCardId && isMobile) {
        const target = event.target as Element;
        if (!target.closest("[data-card-container]")) {
          globalElevatedCardId = null;
          notifyCardListeners(null);
        }
      }
    };

    if (isMobile) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMobile]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (disabled) return;

    if (onClick) {
      onClick();
    }

    if (isMobile && willHover) {
      e.stopPropagation();
      const newElevatedId = isElevated ? null : cardIdRef.current;
      globalElevatedCardId = newElevatedId;
      notifyCardListeners(newElevatedId);
    }
  };

  return (
    <div
      data-card-container
      className={cn(
        "border-2 border-my-grey p-6 transition-all duration-300 ease-out",
        cursorPointer && "cursor-pointer",
        isActive &&
        willHover &&
        "shadow-[4px_4px_0_0_#9ea393] -translate-x-1 -translate-y-1",
        !isActive &&
        willHover &&
        "sm:hover:shadow-[4px_4px_0_0_#9ea393] sm:hover:-translate-x-1 sm:hover:-translate-y-1",
        isMobile &&
        isElevated &&
        "shadow-[4px_4px_0_0_#9ea393] -translate-x-1 -translate-y-1",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && (isMobile || onClick) && cursorPointer && "cursor-pointer",
        className
      )}
      onClick={handleCardClick}
    >
      {children}
    </div>
  );
};

export default Card;

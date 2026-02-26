import React from "react";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn("w-full px-4 sm:px-6 lg:px-8 pb-8", className)}>
      <div className="max-w-7xl mx-auto">
        <div className="border-t border-my-grey pb-8"></div>
        <div className="grid grid-cols-1 gap-4">
          <div className="text-center md:text-left">
            <p className="font-mono text-sm text-my-grey">
              @OneSat | One click, one Sat, one journey to yield
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}

export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 200,
}: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current?.getBoundingClientRect();
        const tooltipWidth = tooltipRect?.width || 100;
        const tooltipHeight = tooltipRect?.height || 30;

        let x = rect.left + rect.width / 2;
        let y = rect.top;

        switch (side) {
          case "top":
            y = rect.top - tooltipHeight - 8;
            break;
          case "bottom":
            y = rect.bottom + 8;
            break;
          case "left":
            x = rect.left - tooltipWidth - 8;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
          case "right":
            x = rect.right + 8;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
        }

        if (side === "top" || side === "bottom") {
          switch (align) {
            case "start":
              x = rect.left;
              break;
            case "end":
              x = rect.right - tooltipWidth;
              break;
            default:
              x = rect.left + rect.width / 2 - tooltipWidth / 2;
          }
        }

        setPosition({ x, y });
        setIsOpen(true);
      }
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="inline-flex"
      >
        {children}
      </div>
      {isOpen && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            "fixed z-50 max-w-xs rounded-md bg-[var(--text-primary)] px-3 py-1.5 text-xs text-[var(--bg-primary)] shadow-md animate-in fade-in-0 zoom-in-95"
          )}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {content}
        </div>
      )}
    </>
  );
}

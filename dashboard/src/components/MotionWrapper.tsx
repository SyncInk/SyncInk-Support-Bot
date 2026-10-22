"use client";

import React, { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { transition, viewport as vpTokens } from "@/lib/motion-tokens";

interface MotionSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}

export function MotionSection({
  children,
  className = "",
  delay = 0,
  id,
}: MotionSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={vpTokens.once}
      transition={{
        ...transition.section,
        delay,
        duration: shouldReduceMotion ? 0 : transition.section.duration,
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverElevation?: boolean;
}

export function MotionCard({
  children,
  className = "",
  onClick,
  hoverElevation = true,
}: MotionCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      onClick={onClick}
      whileHover={
        hoverElevation && !shouldReduceMotion
          ? { y: -2, transition: transition.hover }
          : undefined
      }
      whileTap={
        !shouldReduceMotion
          ? { scale: 0.99, transition: transition.press }
          : undefined
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface MotionButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function MotionButton({
  children,
  className = "",
  onClick,
  disabled = false,
  type = "button",
}: MotionButtonProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={
        !disabled && !shouldReduceMotion
          ? { scale: 1.015, transition: transition.hover }
          : undefined
      }
      whileTap={
        !disabled && !shouldReduceMotion
          ? { scale: 0.985, transition: transition.press }
          : undefined
      }
      className={`touch-manipulation ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function LivePulseBadge({ label = "Operational", className = "" }: { label?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span>{label}</span>
    </span>
  );
}

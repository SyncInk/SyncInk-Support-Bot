"use client";

import React, { ReactNode, useState, useEffect, useRef } from "react";
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

/* ─── Premium Live Count-Up / Count-Down Number Component ───────────── */
export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  enabled?: boolean;
  className?: string;
  onSettled?: () => void;
}

export function AnimatedCounter({
  value,
  duration = 1700,
  delay = 0,
  enabled = true,
  className = "",
  onSettled,
}: AnimatedCounterProps) {
  const shouldReduceMotion = useReducedMotion();

  // If reduced motion is requested, render value directly without state churn
  const [displayValue, setDisplayValue] = useState<number>(() => (shouldReduceMotion ? value : 0));
  const [isSettled, setIsSettled] = useState<boolean>(false);

  // References to guarantee smooth requestAnimationFrame loop without stale closures
  const currentRef = useRef<number>(shouldReduceMotion ? value : 0);
  const targetRef = useRef<number>(value);
  const rafIdRef = useRef<number | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnimatedInitialRef = useRef<boolean>(false);

  useEffect(() => {
    // If reduced motion is requested, immediately sync to final value
    if (shouldReduceMotion) {
      currentRef.current = value;
      targetRef.current = value;
      setDisplayValue(value);
      return;
    }

    // Hold at 0 until component becomes active/visible
    if (!enabled && !hasAnimatedInitialRef.current) {
      return;
    }

    const previousValue = currentRef.current;
    const nextTarget = value;
    targetRef.current = nextTarget;

    // If already animated once and the target value did not change, ignore
    if (hasAnimatedInitialRef.current && previousValue === nextTarget) {
      return;
    }

    // Cancel ongoing animation loop or pending timers
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (delayTimeoutRef.current !== null) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
    if (settleTimeoutRef.current !== null) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }

    const isInitial = !hasAnimatedInitialRef.current;
    const effectiveDelay = isInitial ? Math.max(0, delay) : 0;
    const effectiveDuration = isInitial ? duration : Math.min(duration, 1200);

    const startAnimation = () => {
      hasAnimatedInitialRef.current = true;
      const startTime = performance.now();
      const startFrom = currentRef.current;
      const delta = nextTarget - startFrom;

      if (delta === 0) {
        currentRef.current = nextTarget;
        setDisplayValue(nextTarget);
        setIsSettled(true);
        if (onSettled) onSettled();
        settleTimeoutRef.current = setTimeout(() => {
          setIsSettled(false);
        }, 400);
        return;
      }

      // Smooth Quartic ease-out: 1 - (1 - t)^4
      const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

      const frame = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / effectiveDuration, 1);
        const eased = easeOutQuart(progress);
        const currentInterp = Math.round(startFrom + delta * eased);

        currentRef.current = currentInterp;
        setDisplayValue(currentInterp);

        if (progress < 1) {
          rafIdRef.current = requestAnimationFrame(frame);
        } else {
          // Finish precisely at target
          currentRef.current = nextTarget;
          setDisplayValue(nextTarget);
          rafIdRef.current = null;

          // Subtle settled emphasis (gentle brightness transition)
          setIsSettled(true);
          if (onSettled) onSettled();
          settleTimeoutRef.current = setTimeout(() => {
            setIsSettled(false);
          }, 450);
        }
      };

      rafIdRef.current = requestAnimationFrame(frame);
    };

    if (effectiveDelay > 0) {
      delayTimeoutRef.current = setTimeout(startAnimation, effectiveDelay);
    } else {
      startAnimation();
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (delayTimeoutRef.current !== null) {
        clearTimeout(delayTimeoutRef.current);
      }
      if (settleTimeoutRef.current !== null) {
        clearTimeout(settleTimeoutRef.current);
      }
    };
  }, [value, duration, delay, enabled, shouldReduceMotion, onSettled]);

  return (
    <span
      className={`inline-block tabular-nums transition-[filter,opacity] duration-300 ${
        isSettled ? "brightness-125 opacity-100" : "brightness-100 opacity-95"
      } ${className}`}
    >
      {displayValue.toLocaleString()}
    </span>
  );
}

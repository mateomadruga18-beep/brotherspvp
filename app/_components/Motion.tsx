"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type MotionProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
};

const easeOut = [0.22, 1, 0.36, 1] as const;

export function MotionHeader({ children, className }: MotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      className={className}
      initial={false}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: easeOut }}
    >
      {children}
    </motion.header>
  );
}

export function FadeIn({ children, className, delay = 0 }: MotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.48, ease: easeOut, delay }}
    >
      {children}
    </motion.div>
  );
}

export function MotionProductCard({
  children,
  className,
  style,
  delay = 0,
}: MotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className={className}
      style={style}
      initial={false}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.14 }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -8,
              rotateX: 0.55,
              rotateY: -0.45,
              transition: { duration: 0.24, ease: easeOut },
            }
      }
      transition={{ duration: 0.52, ease: easeOut, delay }}
    >
      {children}
    </motion.article>
  );
}

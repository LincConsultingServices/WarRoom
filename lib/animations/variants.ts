import type { Variants, Transition } from 'framer-motion'

// Easing curves — mirror the CSS --ease-* vars in globals.css.
export const easeRegal: Transition['ease'] = [0.25, 0.46, 0.45, 0.94]
export const easeDramatic: Transition['ease'] = [0.16, 1, 0.3, 1]
export const easeSharp: Transition['ease'] = [0.4, 0, 0.2, 1]

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeDramatic } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
}

export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.08 } },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: easeDramatic },
  },
}

export const overlayEnter: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.5 } },
}

export const narratorDialogueEnter: Variants = {
  initial: { opacity: 0, scale: 0.92, y: 12 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 26 },
  },
  exit: { opacity: 0, scale: 0.92, y: 6, transition: { duration: 0.22 } },
}

export const verdictStamp: Variants = {
  initial: { scale: 3, opacity: 0, rotate: -15 },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 500, damping: 20 },
  },
}

// SVG stroke-dashoffset draw-in. Use with pathLength={1} and a custom variant trigger.
export const drawSvg: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.9, ease: easeDramatic, opacity: { duration: 0.2 } },
  },
}

// 3s breathing loop for the Narrator orb.
export const orbBreathe: Variants = {
  animate: {
    scale: [1, 1.08, 1],
    y: [0, -4, 0],
    transition: { duration: 3, ease: 'easeInOut', repeat: Infinity },
  },
}

export const investorEnter: Variants = {
  initial: { opacity: 0, x: -40 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: easeDramatic },
  },
  exit: { opacity: 0, x: 40, transition: { duration: 0.4 } },
}

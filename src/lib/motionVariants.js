export const pageMotion = {
  initial: { opacity: 0, y: 26, rotateX: 10, rotateY: -6, scale: 0.975 },
  animate: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -18, rotateX: -8, rotateY: 4, scale: 0.985 },
}

export const introContentMotion = {
  initial: { opacity: 0, y: 18, rotateX: 8, rotateY: -4 },
  animate: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    transition: {
      delay: 0.12,
      duration: 0.55,
      ease: 'easeOut',
      staggerChildren: 0.12,
    },
  },
  exit: { opacity: 0, y: -10, rotateX: -6, rotateY: 3 },
}

export const introItemMotion = {
  initial: { opacity: 0, y: 12, z: -8 },
  animate: { opacity: 1, y: 0, z: 0 },
  exit: { opacity: 0, y: -8, z: -8 },
}

export const gridMotion = {
  animate: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.08,
    },
  },
}

export const rowMotion = {
  initial: { opacity: 0, x: -18, rotateY: -10, rotateX: 4, z: -20 },
  animate: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    rotateX: 0,
    z: 0,
  },
  exit: { opacity: 0, x: 18, rotateY: 10, rotateX: -4, z: -20 },
}

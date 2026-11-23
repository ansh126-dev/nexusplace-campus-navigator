import React from 'react';
import { motion } from 'motion/react';
import {
  Award,
  Briefcase,
  Building2,
  Code2,
  Compass,
  FileCheck2,
  GraduationCap,
} from 'lucide-react';

interface AnimatedPlacementBackdropProps {
  withSidebarOffset?: boolean;
}

const FLOATING_ITEMS = [
  {
    id: 'grad-cap',
    Icon: GraduationCap,
    position: 'top-[10%] left-[6%]',
    size: 'w-11 h-11',
    iconSize: 'w-5 h-5',
    tone: 'text-[#0D5C63] border-[#0D5C63]/20 bg-white/65 dark:bg-[#0e1c18]/70',
    yRange: [-10, 10, -10],
    xRange: [-4, 6, -4],
    rotateRange: [-5, 4, -5],
    duration: 9,
    delay: 0,
  },
  {
    id: 'briefcase',
    Icon: Briefcase,
    position: 'top-[14%] right-[7%]',
    size: 'w-12 h-12',
    iconSize: 'w-5 h-5',
    tone: 'text-[#C96D3B] border-[#C96D3B]/25 bg-white/65 dark:bg-[#0e1c18]/70',
    yRange: [8, -12, 8],
    xRange: [5, -5, 5],
    rotateRange: [4, -5, 4],
    duration: 11,
    delay: 0.6,
  },
  {
    id: 'resume-check',
    Icon: FileCheck2,
    position: 'top-[46%] left-[3.5%]',
    size: 'w-10 h-10',
    iconSize: 'w-4 h-4',
    tone: 'text-[#6D59A6] border-[#6D59A6]/25 bg-white/60 dark:bg-[#0e1c18]/65',
    yRange: [-12, 8, -12],
    xRange: [-3, 5, -3],
    rotateRange: [-3, 5, -3],
    duration: 10,
    delay: 1.1,
  },
  {
    id: 'code-round',
    Icon: Code2,
    position: 'top-[52%] right-[4%]',
    size: 'w-11 h-11',
    iconSize: 'w-5 h-5',
    tone: 'text-[#0D5C63] border-[#0D5C63]/20 bg-white/60 dark:bg-[#0e1c18]/65',
    yRange: [10, -10, 10],
    xRange: [-6, 4, -6],
    rotateRange: [3, -4, 3],
    duration: 12,
    delay: 0.4,
  },
  {
    id: 'campus-hq',
    Icon: Building2,
    position: 'bottom-[12%] left-[9%]',
    size: 'w-11 h-11',
    iconSize: 'w-5 h-5',
    tone: 'text-[#C96D3B] border-[#C96D3B]/20 bg-white/60 dark:bg-[#0e1c18]/65',
    yRange: [-8, 12, -8],
    xRange: [4, -4, 4],
    rotateRange: [-4, 3, -4],
    duration: 13,
    delay: 1.5,
  },
  {
    id: 'offer-award',
    Icon: Award,
    position: 'bottom-[14%] right-[10%]',
    size: 'w-12 h-12',
    iconSize: 'w-5 h-5',
    tone: 'text-[#0D5C63] border-[#0D5C63]/25 bg-white/65 dark:bg-[#0e1c18]/70',
    yRange: [12, -8, 12],
    xRange: [-5, 5, -5],
    rotateRange: [5, -3, 5],
    duration: 10.5,
    delay: 0.9,
  },
  {
    id: 'career-compass',
    Icon: Compass,
    position: 'top-[28%] right-[22%] hidden xl:flex',
    size: 'w-9 h-9',
    iconSize: 'w-4 h-4',
    tone: 'text-[#6D59A6] border-[#6D59A6]/20 bg-white/55 dark:bg-[#0e1c18]/60',
    yRange: [-7, 9, -7],
    xRange: [4, -5, 4],
    rotateRange: [-6, 6, -6],
    duration: 14,
    delay: 1.8,
  },
];

export function AnimatedPlacementBackdrop({
  withSidebarOffset = false,
}: AnimatedPlacementBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-y-0 right-0 ${
        withSidebarOffset ? 'left-0 lg:left-[248px]' : 'left-0'
      } z-0 pointer-events-none overflow-hidden select-none`}
    >
      {/* Atmospheric Radial Color Blooms */}
      <motion.div
        animate={{
          scale: [1, 1.09, 1],
          opacity: [0.55, 0.8, 0.55],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="backdrop-bloom-primary absolute -top-28 -left-24 w-[460px] h-[460px] rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.06, 0.96, 1.06],
          opacity: [0.45, 0.72, 0.45],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="backdrop-bloom-gold absolute top-[22%] -right-24 w-[420px] h-[420px] rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [0.98, 1.08, 0.98],
          opacity: [0.35, 0.6, 0.35],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="backdrop-bloom-indigo absolute -bottom-28 left-[28%] w-[440px] h-[440px] rounded-full blur-3xl"
      />

      {/* Subtle Architectural Dot Matrix */}
      <div className="backdrop-dot-grid absolute inset-0 opacity-45" />

      {/* Animated Career Trajectory Arcs & Orbiting Milestone Nodes */}
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full opacity-55"
        fill="none"
      >
        {/* Soft Career Arc 1 */}
        <motion.path
          d="M -60 620 C 260 510, 480 260, 820 290 C 1020 308, 1140 160, 1270 95"
          className="backdrop-arc-primary"
          strokeWidth="1.5"
          strokeDasharray="6 8"
          animate={{ strokeDashoffset: [0, -56] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        />

        {/* Soft Career Arc 2 */}
        <motion.path
          d="M -40 240 C 240 310, 460 540, 790 480 C 990 444, 1110 560, 1250 510"
          className="backdrop-arc-gold"
          strokeWidth="1.25"
          strokeDasharray="4 10"
          animate={{ strokeDashoffset: [0, 56] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />

        {/* Slowly Rotating Concentric Compass Rings */}
        <motion.g
          style={{ originX: '980px', originY: '210px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 54, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx="980"
            cy="210"
            r="88"
            className="backdrop-ring-stroke"
            strokeWidth="1"
            strokeDasharray="3 7"
          />
          <circle cx="1068" cy="210" r="3.5" className="backdrop-node-gold" />
        </motion.g>

        <motion.g
          style={{ originX: '210px', originY: '610px' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 64, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx="210"
            cy="610"
            r="72"
            className="backdrop-ring-stroke"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <circle cx="282" cy="610" r="3.5" className="backdrop-node-primary" />
        </motion.g>

        {/* Subtle Milestone Nodes */}
        <motion.circle
          cx="340"
          cy="430"
          r="4"
          className="backdrop-node-primary"
          animate={{ scale: [1, 1.5, 1], opacity: [0.45, 0.9, 0.45] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="780"
          cy="292"
          r="4"
          className="backdrop-node-gold"
          animate={{ scale: [1, 1.45, 1], opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        />
        <motion.circle
          cx="620"
          cy="505"
          r="3.5"
          className="backdrop-node-indigo"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 2.1 }}
        />
      </svg>

      {/* Floating Campus-Placement Emblem Cards */}
      {FLOATING_ITEMS.map((item) => {
        const Icon = item.Icon;
        return (
          <motion.div
            key={item.id}
            animate={{
              y: item.yRange,
              x: item.xRange,
              rotate: item.rotateRange,
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: item.delay,
            }}
            className={`absolute ${item.position} ${item.size} rounded-2xl border backdrop-blur-xs flex items-center justify-center shadow-xs opacity-65 dark:opacity-55 ${item.tone}`}
          >
            <Icon strokeWidth={1.65} className={item.iconSize} />
          </motion.div>
        );
      })}
    </div>
  );
}

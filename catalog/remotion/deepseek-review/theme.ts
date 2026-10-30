// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import { FONT_FAMILY } from "./fonts.js";

export const FONT = {
  display: FONT_FAMILY,
  mono: FONT_FAMILY,
  cjk: FONT_FAMILY,
};

// Four text sizes across the review. Brand lettering and data keep dedicated sizes.
export const TYPE = {
  title: 72,
  subheading: 48,
  body: 32,
  label: 24,
  number: 192,
  numberDelta: 96,
  date: 264,
  brand: 168,
  version: 132,
} as const;

export const SPACE = { xs: 16, sm: 24, md: 32, lg: 48, xl: 64, section: 96 } as const;
export const TEXT = {
  title: { fontFamily: FONT.cjk, fontSize: TYPE.title, fontWeight: 700, lineHeight: 1.2, letterSpacing: -1.5 },
  subheading: { fontFamily: FONT.cjk, fontSize: TYPE.subheading, fontWeight: 700, lineHeight: 1.25 },
  body: { fontFamily: FONT.cjk, fontSize: TYPE.body, fontWeight: 300, lineHeight: 1.5 },
  bodyStrong: { fontFamily: FONT.cjk, fontSize: TYPE.body, fontWeight: 700, lineHeight: 1.5 },
  label: { fontFamily: FONT.cjk, fontSize: TYPE.label, fontWeight: 300, lineHeight: 1.4 },
  labelStrong: { fontFamily: FONT.cjk, fontSize: TYPE.label, fontWeight: 700, lineHeight: 1.4 },
  prompt: { fontFamily: FONT.cjk, fontSize: TYPE.label, fontWeight: 300, lineHeight: 1.5 },
  number: { fontFamily: FONT.display, fontSize: TYPE.number, fontWeight: 700, lineHeight: 1, letterSpacing: -6, fontVariantNumeric: "tabular-nums" },
  numberDelta: { fontFamily: FONT.display, fontSize: TYPE.numberDelta, fontWeight: 700, lineHeight: 1.2, letterSpacing: -2, fontVariantNumeric: "tabular-nums" },
  brand: { fontFamily: FONT.display, fontSize: TYPE.brand, fontWeight: 700, lineHeight: 1.4, letterSpacing: -6 },
  version: { fontFamily: FONT.display, fontSize: TYPE.version, fontWeight: 700, lineHeight: 1.4, letterSpacing: -4 },
  date: { fontFamily: FONT.display, fontSize: TYPE.date, fontWeight: 700, lineHeight: 1, letterSpacing: -8, fontVariantNumeric: "tabular-nums" },
} as const;

const BLUE = "#4D6BFE";
const INK = "#0B0B12";
const PAPER = "#FFFFFF";
export const C = { blue: BLUE, ink: INK, paper: PAPER, white: "#FFFFFF", red: "#FF4B2B" };

export type Scheme = {
  bg: string;
  fg: string;
  sub: string;
  line: string;
  accent: string;
  accentInk: string;
};

export type SchemeName = "blue" | "paper" | "ink";

export const SCHEME: Record<SchemeName, Scheme> = {
  blue: { bg: BLUE, fg: "#FFFFFF", sub: "rgba(255,255,255,0.62)", line: "rgba(255,255,255,0.28)", accent: "#FFFFFF", accentInk: BLUE },
  paper: { bg: PAPER, fg: INK, sub: "rgba(11,11,18,0.5)", line: "rgba(11,11,18,0.16)", accent: BLUE, accentInk: "#FFFFFF" },
  ink: { bg: INK, fg: "#F2F0E9", sub: "rgba(242,240,233,0.5)", line: "rgba(242,240,233,0.16)", accent: BLUE, accentInk: "#FFFFFF" },
};

export const WIDTH = 1080;
export const HEIGHT = 1440; // 3:4 portrait
export const PAD = 84;
export const LAYOUT = {
  width: WIDTH - PAD * 2,
  titleTop: 120,
  centerY: HEIGHT / 2,
  contentTop: 384,
  bottom: HEIGHT - PAD,
} as const;
export const FPS = 30;
export const BEAT = 15; // 120 BPM @ 30fps
export const BAR = 60;

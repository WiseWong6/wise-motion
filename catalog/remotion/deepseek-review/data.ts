// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// Original supplied example values; not a live benchmark feed.
// Source: DeepSeek API changelog 2026-10-17 & HF model card DeepSeek-V4.1-Flash-1017.

export type Gain = { name: string; prev: number; next: number };

export const GAINS: Gain[] = [
  { name: "Terminal-Bench 4.0", prev: 31.2, next: 42.3 },
  { name: "ProgramBench", prev: 20.3, next: 29.1 },
  { name: "Apex Bench v1.1", prev: 64.6, next: 72.1 },
  { name: "HLE w/o tools", prev: 36.8, next: 42.6 },
  { name: "Automation-Bench", prev: 54.8, next: 60.5 },
  { name: "Chartography", prev: 78.9, next: 83.0 },
  { name: "Agents' Last Exam", prev: 31.8, next: 35.4 },
  { name: "BabyVision", prev: 89.6, next: 92.5 },
  { name: "DeepSWE v1.1", prev: 74.2, next: 77.0 },
  { name: "NL2Repo-Bench", prev: 65.4, next: 68.2 },
  { name: "ZeroBench-main", prev: 49.0, next: 51.0 },
];

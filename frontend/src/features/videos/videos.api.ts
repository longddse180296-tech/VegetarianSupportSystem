/**
 * videos.api.ts — Parallel legacy API module root (kept for release-branch compatibility).
 * In the `toan` branch, VideoList.tsx has migrated to canonical `./api/videoApi.ts`.
 * This file is intentionally thin: it re-exports the modern helpers plus the legacy
 * `fetchVideos` / `generateAiPlaylist` names still referenced by the `release` branch.
 *
 * ❌ Do NOT delete this file while `release` still imports `../videos.api` from
 *    VideoList.tsx. Doing so causes a merge CONFLICT (modify/delete).
 *
 * ✅ All mock API helpers use 500 ms latency per architecture rule (AGENTS §3).
 */

import type {
  UploadVideoFormState,
  VideoCategory,
  VideoItem,
  VideoListFilter,
  VideoListResponse,
  VideoModerationStatus,
  VideoSortOption,
} from './types/video.types'
import { DEFAULT_VIDEO_FILTER } from './types/video.types'
import {
  getVideos,
  getVideoDetail,
  getVideoDetailComments,
  getVideoDetailMeta,
  getVideoListBrowseHelpers,
  getRelatedVideos,
  uploadVideo,
} from './api/videoApi'

/* ---------- Unified 500 ms delay helper (AGENTS §3 rule) ---------- */
const delay = <T,>(data: T, ms = 500): Promise<T> =>
  new Promise((resolve) => window.setTimeout(() => resolve(data), ms))

/* ====================================================================== */
/* Legacy names used by the `release` branch (VideoList.tsx import path). */
/* ====================================================================== */

/**
 * Alias for the canonical `getVideos`.
 * Keep the signature compatible with the old parallel helper.
 */
export async function fetchVideos(
  filter: Partial<VideoListFilter> = {},
): Promise<VideoListResponse> {
  // Ensure minimum async latency even if upstream helper changes default later.
  const result = await getVideos(filter)
  await new Promise<void>((resolve) => window.setTimeout(resolve, 500))
  return result
}

/**
 * AI-generated auto-playlist helper.
 * Uses a strict typed numeric duration parameter (fixes TS7006 "Parameter 't' implicitly any").
 *
 * @param t playlist length in seconds (strictly typed `number` to satisfy noImplicitAny).
 * @param seed optional deterministic seed.
 */
export async function generateAiPlaylist(
  t: number,
  seed: number = Date.now() & 0xffff_ffff,
): Promise<VideoItem[]> {
  const helpers = await getVideoListBrowseHelpers()
  const base = (await getVideos({ category: helpers.categories[0]?.key as VideoCategory })).items
  // Deterministic shuffle based on seed + numeric duration param `t`.
  const mix = [...base]
  for (let i = mix.length - 1; i > 0; i -= 1) {
    const j = Math.floor(((seed + i + t) * 2_654_435_761) % 2 ** 31) % (i + 1)
    ;[mix[i], mix[j]] = [mix[j], mix[i]]
  }
  // Keep playlist size proportional to `t` clamped.
  const take = Math.max(1, Math.min(mix.length, Math.ceil(Math.max(0, t) / 60) || 6))
  const chosen = mix.slice(0, take)
  return delay(chosen, 500)
}

/* ====================================================================== */
/* Re-export canonical helpers so callers using module-root API stay ok.   */
/* ====================================================================== */

export type {
  UploadVideoFormState,
  VideoCategory,
  VideoItem,
  VideoListFilter,
  VideoListResponse,
  VideoModerationStatus,
  VideoSortOption,
}

export {
  DEFAULT_VIDEO_FILTER,
  getVideos,
  getVideoDetail,
  getVideoDetailComments,
  getVideoDetailMeta,
  getVideoListBrowseHelpers,
  getRelatedVideos,
  uploadVideo,
}

export const STORAGE_KEYS = {
  favorites: 'grace_favorites',
  notes: 'grace_notes',
  highlights: 'grace_highlights',
  progress: 'grace_bible_progress',
  firstVisit: 'grace_first_visit',
  studyMode: 'grace_study_mode',
  settings: 'grace_user_settings',
  chaptersRead: 'grace_chapters_read',
  readingPlan: 'grace_reading_plan_state',
  syncMeta: 'grace_sync_meta',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

import { ReadingPlanDefinition, ReadingPlanDay, ReadingPlanState } from '../types';
import { syncDomain } from './cloudSyncService';
import { dispatchDataUpdated, getStorageJSON, setStorageJSON } from './localStateService';
import { touchSyncDomain } from './syncMetaService';
import { STORAGE_KEYS } from './storageKeys';

let planCache: ReadingPlanDefinition | null = null;

const PLAN_FILE = '/data/readingPlans/bibleInOneYear.json';

const formatDateOnly = (value: Date): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getPlanDefinition = async (): Promise<ReadingPlanDefinition> => {
  if (planCache) return planCache;

  const response = await fetch(PLAN_FILE);
  if (!response.ok) {
    throw new Error('Falha ao carregar plano de leitura.');
  }

  const data = (await response.json()) as ReadingPlanDefinition;
  planCache = data;
  return data;
};

export const getReadingPlanState = (): ReadingPlanState | null => {
  return getStorageJSON<ReadingPlanState | null>(STORAGE_KEYS.readingPlan, null);
};

export const saveReadingPlanState = (state: ReadingPlanState): void => {
  setStorageJSON(STORAGE_KEYS.readingPlan, state);
  touchSyncDomain('plan', state.updatedAt);
  dispatchDataUpdated('plan');
  void syncDomain('plan');
};

export const activatePlan = (date: Date = new Date()): ReadingPlanState => {
  const state: ReadingPlanState = {
    planId: 'bible-1y',
    isActive: true,
    startDate: formatDateOnly(date),
    completedDates: [],
    openedChaptersByDate: {},
    updatedAt: Date.now(),
  };

  saveReadingPlanState(state);
  return state;
};

export const deactivatePlan = (): ReadingPlanState | null => {
  const current = getReadingPlanState();
  if (!current) return null;

  const next = {
    ...current,
    isActive: false,
    updatedAt: Date.now(),
  };

  saveReadingPlanState(next);
  return next;
};

const getDayDiff = (startDate: string, date: Date = new Date()): number => {
  const start = new Date(`${startDate}T00:00:00`);
  const target = new Date(`${formatDateOnly(date)}T00:00:00`);
  const diff = target.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const getTodayPlan = async (
  date: Date = new Date()
): Promise<{ dayIndex: number; day: ReadingPlanDay; completed: boolean } | null> => {
  const state = getReadingPlanState();
  if (!state || !state.isActive) return null;

  const plan = await getPlanDefinition();
  const dayDiff = getDayDiff(state.startDate, date);
  if (dayDiff < 0 || dayDiff >= plan.totalDays) return null;

  const dayIndex = dayDiff + 1;
  const day = plan.days[dayDiff];
  const dateKey = formatDateOnly(date);
  const completed = state.completedDates.includes(dateKey);

  return { dayIndex, day, completed };
};

export const markChapterOpened = async (
  bookAbbrev: string,
  chapter: number,
  date: Date = new Date()
): Promise<ReadingPlanState | null> => {
  const state = getReadingPlanState();
  if (!state || !state.isActive) return state;

  const today = await getTodayPlan(date);
  if (!today) return state;

  const dateKey = formatDateOnly(date);
  const chapterKey = `${bookAbbrev}:${chapter}`;

  const opened = new Set(state.openedChaptersByDate[dateKey] || []);
  opened.add(chapterKey);

  const mustRead = new Set(today.day.chapters.map((item) => `${item.bookAbbrev}:${item.chapter}`));
  const done = Array.from(mustRead).every((item) => opened.has(item));

  const completedDates = new Set(state.completedDates);
  if (done) completedDates.add(dateKey);

  const next: ReadingPlanState = {
    ...state,
    openedChaptersByDate: {
      ...state.openedChaptersByDate,
      [dateKey]: Array.from(opened),
    },
    completedDates: Array.from(completedDates),
    updatedAt: Date.now(),
  };

  saveReadingPlanState(next);
  return next;
};

export const getPlanProgressPercentage = async (date: Date = new Date()): Promise<number> => {
  const state = getReadingPlanState();
  if (!state || !state.isActive) return 0;

  const plan = await getPlanDefinition();
  const dayDiff = getDayDiff(state.startDate, date);
  if (dayDiff < 0) return 0;

  const currentDay = Math.min(plan.totalDays, dayDiff + 1);
  return Math.round((currentDay / plan.totalDays) * 100);
};

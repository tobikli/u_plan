import type { Preferences } from "@/types/preferences";

type PreferencesLike = Pick<Preferences, "trimester"> | null | undefined;

type StudyPeriodLabelOptions = {
  plural?: boolean;
  capitalized?: boolean;
};

export function getStudyPeriodKey(preferences: PreferencesLike) {
  return preferences?.trimester ? "trimester" : "semester";
}

export function getStudyPeriodLabel(
  preferences: PreferencesLike,
  options: StudyPeriodLabelOptions = {}
) {
  const base = getStudyPeriodKey(preferences);
  const label = options.plural ? `${base}s` : base;
  if (!options.capitalized) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

type StudyPeriodFormatOptions = {
  compact?: boolean;
  capitalized?: boolean;
};

export function formatStudyPeriod(
  preferences: PreferencesLike,
  value: number,
  options: StudyPeriodFormatOptions = {}
) {
  if (options.compact) {
    const prefix = getStudyPeriodKey(preferences).charAt(0);
    const compactPrefix = options.capitalized === false
      ? prefix.toLowerCase()
      : prefix.toUpperCase();
    return `${compactPrefix}${value}`;
  }

  const label = getStudyPeriodLabel(preferences, {
    capitalized: options.capitalized,
  });
  return `${label} ${value}`;
}
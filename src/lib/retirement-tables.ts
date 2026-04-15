/**
 * Spanish retirement legislation transitional schedule (Ley 27/2011, RDL 8/2015).
 *
 * Each entry defines the retirement rules for a given year:
 *   - contributionThresholdMonths: total months of contributions required to retire at 65.
 *   - ageIfBelowThreshold: ordinary retirement age when contributions are below the threshold.
 *   - ageIfAboveThreshold: always { years: 65, months: 0 }.
 */

export interface RetirementYearRule {
  year: number;
  contributionThresholdMonths: number;
  ageIfBelowThreshold: { years: number; months: number };
  ageIfAboveThreshold: { years: number; months: number };
}

export const TRANSITIONAL_SCHEDULE: RetirementYearRule[] = [
  { year: 2013, contributionThresholdMonths: 35 * 12 + 3, ageIfBelowThreshold: { years: 65, months: 1 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2014, contributionThresholdMonths: 35 * 12 + 6, ageIfBelowThreshold: { years: 65, months: 2 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2015, contributionThresholdMonths: 35 * 12 + 9, ageIfBelowThreshold: { years: 65, months: 3 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2016, contributionThresholdMonths: 36 * 12, ageIfBelowThreshold: { years: 65, months: 4 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2017, contributionThresholdMonths: 36 * 12 + 3, ageIfBelowThreshold: { years: 65, months: 5 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2018, contributionThresholdMonths: 36 * 12 + 6, ageIfBelowThreshold: { years: 65, months: 6 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2019, contributionThresholdMonths: 36 * 12 + 9, ageIfBelowThreshold: { years: 65, months: 8 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2020, contributionThresholdMonths: 37 * 12, ageIfBelowThreshold: { years: 65, months: 10 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2021, contributionThresholdMonths: 37 * 12 + 3, ageIfBelowThreshold: { years: 66, months: 0 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2022, contributionThresholdMonths: 37 * 12 + 6, ageIfBelowThreshold: { years: 66, months: 2 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2023, contributionThresholdMonths: 37 * 12 + 9, ageIfBelowThreshold: { years: 66, months: 4 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2024, contributionThresholdMonths: 38 * 12, ageIfBelowThreshold: { years: 66, months: 6 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2025, contributionThresholdMonths: 38 * 12 + 3, ageIfBelowThreshold: { years: 66, months: 8 }, ageIfAboveThreshold: { years: 65, months: 0 } },
  { year: 2026, contributionThresholdMonths: 38 * 12 + 3, ageIfBelowThreshold: { years: 66, months: 10 }, ageIfAboveThreshold: { years: 65, months: 0 } },
];

/**
 * From 2027 onward the rules are final and no longer change year-over-year.
 */
export const FINAL_RULES: RetirementYearRule = {
  year: 2027,
  contributionThresholdMonths: 38 * 12 + 6, // 38 years, 6 months
  ageIfBelowThreshold: { years: 67, months: 0 },
  ageIfAboveThreshold: { years: 65, months: 0 },
};

/**
 * Minimum contribution period to qualify for any retirement pension.
 */
export const MINIMUM_CONTRIBUTION_YEARS = 15;
export const MINIMUM_CONTRIBUTION_RECENT_YEARS = 2; // must be within last 15 years

/**
 * Early retirement: voluntary (jubilación anticipada voluntaria).
 * - Minimum 35 years of contributions
 * - Maximum 24 months before ordinary retirement age
 */
export const VOLUNTARY_EARLY_RETIREMENT = {
  minimumContributionYears: 35,
  maxMonthsEarly: 24,
  /** Reduction per quarter early, by total contribution bracket (years) */
  reductionPerQuarter: [
    { minYears: 0, maxYears: 38.5, perQuarter: 1.875 },
    { minYears: 38.5, maxYears: 41.5, perQuarter: 1.750 },
    { minYears: 41.5, maxYears: 44.5, perQuarter: 1.625 },
    { minYears: 44.5, maxYears: Infinity, perQuarter: 1.500 },
  ],
};

/**
 * Early retirement: involuntary (jubilación anticipada involuntaria / forzosa).
 * - Minimum 33 years of contributions
 * - Maximum 48 months before ordinary retirement age
 * - Requires involuntary job loss + 6 months registered as unemployed
 */
export const INVOLUNTARY_EARLY_RETIREMENT = {
  minimumContributionYears: 33,
  maxMonthsEarly: 48,
  reductionPerQuarter: [
    { minYears: 0, maxYears: 38.5, perQuarter: 1.875 },
    { minYears: 38.5, maxYears: 41.5, perQuarter: 1.750 },
    { minYears: 41.5, maxYears: 44.5, perQuarter: 1.625 },
    { minYears: 44.5, maxYears: Infinity, perQuarter: 1.500 },
  ],
};

// Art. 210 LGSS + Disposición Transitoria 9ª RDL 8/2015
// Pension % = 50% at 15 years + tiered rate per additional month
export interface PensionPercentageRule {
  year: number;
  firstTierMonths: number;
  firstTierRate: number;
  secondTierRate: number;
}

export const PENSION_PERCENTAGE_SCHEDULE: PensionPercentageRule[] = [
  { year: 2013, firstTierMonths: 163, firstTierRate: 0.21, secondTierRate: 0.19 },
  { year: 2014, firstTierMonths: 163, firstTierRate: 0.21, secondTierRate: 0.19 },
  { year: 2015, firstTierMonths: 163, firstTierRate: 0.21, secondTierRate: 0.19 },
  { year: 2016, firstTierMonths: 163, firstTierRate: 0.21, secondTierRate: 0.19 },
  { year: 2017, firstTierMonths: 163, firstTierRate: 0.21, secondTierRate: 0.19 },
  { year: 2018, firstTierMonths: 163, firstTierRate: 0.21, secondTierRate: 0.19 },
  { year: 2019, firstTierMonths: 163, firstTierRate: 0.21, secondTierRate: 0.19 },
  { year: 2020, firstTierMonths: 176, firstTierRate: 0.21, secondTierRate: 0.19 },
  { year: 2021, firstTierMonths: 189, firstTierRate: 0.21, secondTierRate: 0.19 },
  { year: 2022, firstTierMonths: 203, firstTierRate: 0.21, secondTierRate: 0.19 },
  { year: 2023, firstTierMonths: 216, firstTierRate: 0.21, secondTierRate: 0.19 },
  { year: 2024, firstTierMonths: 229, firstTierRate: 0.19, secondTierRate: 0.18 },
  { year: 2025, firstTierMonths: 237, firstTierRate: 0.19, secondTierRate: 0.18 },
  { year: 2026, firstTierMonths: 245, firstTierRate: 0.19, secondTierRate: 0.18 },
];

export const FINAL_PENSION_PERCENTAGE_RULE: PensionPercentageRule = {
  year: 2027,
  firstTierMonths: 248,
  firstTierRate: 0.19,
  secondTierRate: 0.18,
};

export const MINIMUM_CONTRIBUTION_MONTHS = MINIMUM_CONTRIBUTION_YEARS * 12;
export const BASE_PENSION_PERCENTAGE = 50;

// 2025 pension caps (monthly, 14 pagas/year) - Revalorización de pensiones RD
export const PENSION_LIMITS_2025 = {
  maximumMonthly: 3267.60,
  minimumMonthlyWithSpouse: 1033.00,
  minimumMonthlyWithoutSpouse: 837.00,
};

export const MAX_CONTRIBUTION_BASE_MONTHLY_2025 = 4720.50;

export const BASE_REGULADORA_PERIOD_YEARS = 25;

export const REFERENCE_BASE_REGULADORA_VALUES = [
  1134, 1500, 2000, 2500, 3000, 3500, 4000, 4720,
];

export function getPensionPercentageRule(year: number): PensionPercentageRule {
  if (year >= 2027) return { ...FINAL_PENSION_PERCENTAGE_RULE, year };
  const rule = PENSION_PERCENTAGE_SCHEDULE.find((r) => r.year === year);
  if (rule) return rule;
  if (year < 2013) {
    return { year, firstTierMonths: 163, firstTierRate: 0.21, secondTierRate: 0.19 };
  }
  return { ...FINAL_PENSION_PERCENTAGE_RULE, year };
}

export function getRuleForYear(year: number): RetirementYearRule {
  if (year >= 2027) return { ...FINAL_RULES, year };
  const rule = TRANSITIONAL_SCHEDULE.find((r) => r.year === year);
  if (rule) return rule;
  // Before 2013 the old rules applied (retirement at 65 unconditionally)
  if (year < 2013) {
    return {
      year,
      contributionThresholdMonths: 0,
      ageIfBelowThreshold: { years: 65, months: 0 },
      ageIfAboveThreshold: { years: 65, months: 0 },
    };
  }
  // Should not happen, but fallback to final rules
  return { ...FINAL_RULES, year };
}

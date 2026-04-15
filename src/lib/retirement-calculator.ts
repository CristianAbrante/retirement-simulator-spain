import type { VidaLaboral, RetirementResult, AgeSpec, PensionEstimate } from "./types";
import {
  getRuleForYear,
  getPensionPercentageRule,
  MINIMUM_CONTRIBUTION_YEARS,
  MINIMUM_CONTRIBUTION_MONTHS,
  BASE_PENSION_PERCENTAGE,
  PENSION_LIMITS_2025,
  BASE_REGULADORA_PERIOD_YEARS,
  REFERENCE_BASE_REGULADORA_VALUES,
  VOLUNTARY_EARLY_RETIREMENT,
  INVOLUNTARY_EARLY_RETIREMENT,
} from "./retirement-tables";

function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function dateToAge(birthDate: Date, atDate: Date): AgeSpec {
  let years = atDate.getFullYear() - birthDate.getFullYear();
  let months = atDate.getMonth() - birthDate.getMonth();
  if (atDate.getDate() < birthDate.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months };
}

function ageToDate(birthDate: Date, age: AgeSpec): Date {
  const date = new Date(birthDate);
  date.setFullYear(date.getFullYear() + age.years);
  date.setMonth(date.getMonth() + age.months);
  return date;
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

function daysToContribution(days: number): { years: number; months: number; days: number } {
  const totalMonths = Math.floor(days / 30);
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days: days - totalMonths * 30,
  };
}

function contributionToMonths(days: number): number {
  return Math.floor(days / 30);
}

function projectContributionDays(
  currentEffectiveDays: number,
  reportDate: Date,
  targetDate: Date,
  isWorking: boolean,
  partTimePercentage: number
): number {
  if (!isWorking || targetDate <= reportDate) return currentEffectiveDays;
  const additionalDays = daysBetween(reportDate, targetDate);
  const effectiveAdditional = Math.round(additionalDays * (partTimePercentage / 100));
  return currentEffectiveDays + effectiveAdditional;
}

function getReductionRange(
  earlyConfig: typeof VOLUNTARY_EARLY_RETIREMENT,
  contributionYears: number
): { min: number; max: number } {
  const bracket = earlyConfig.reductionPerQuarter.find(
    (b) => contributionYears >= b.minYears && contributionYears < b.maxYears
  );
  if (!bracket) return { min: 0, max: 0 };
  return { min: bracket.perQuarter, max: bracket.perQuarter };
}

function calculatePensionEstimate(
  contributionDays: number,
  retirementYear: number,
  meetsMinimumContribution: boolean
): PensionEstimate | null {
  if (!meetsMinimumContribution) return null;

  const totalMonths = contributionToMonths(contributionDays);
  const rule = getPensionPercentageRule(retirementYear);

  let percentage = 0;
  if (totalMonths >= MINIMUM_CONTRIBUTION_MONTHS) {
    const additionalMonths = totalMonths - MINIMUM_CONTRIBUTION_MONTHS;
    const firstTier = Math.min(additionalMonths, rule.firstTierMonths) * rule.firstTierRate;
    const secondTier = Math.max(0, additionalMonths - rule.firstTierMonths) * rule.secondTierRate;
    percentage = Math.min(100, BASE_PENSION_PERCENTAGE + firstTier + secondTier);
  }

  const estimatedPensions = REFERENCE_BASE_REGULADORA_VALUES.map((base) => {
    const raw = base * (percentage / 100);
    const clamped = Math.min(raw, PENSION_LIMITS_2025.maximumMonthly);
    return {
      baseReguladora: base,
      monthlyPension: Math.round(clamped * 100) / 100,
      annualPension: Math.round(clamped * 14 * 100) / 100,
    };
  });

  return {
    percentage: Math.round(percentage * 100) / 100,
    contributionMonthsUsed: totalMonths,
    estimatedPensions,
    minimumPension: {
      withSpouse: PENSION_LIMITS_2025.minimumMonthlyWithSpouse,
      withoutSpouse: PENSION_LIMITS_2025.minimumMonthlyWithoutSpouse,
    },
    maximumPension: PENSION_LIMITS_2025.maximumMonthly,
    baseReguladoraPeriodYears: BASE_REGULADORA_PERIOD_YEARS,
  };
}

export function calculateRetirement(vidaLaboral: VidaLaboral): RetirementResult {
  const { personalData, contributionSummary, workPeriods } = vidaLaboral;
  const { birthDate, reportDate } = personalData;
  const { effectiveDays } = contributionSummary;

  const today = new Date();
  const currentAge = dateToAge(birthDate, today);

  const isCurrentlyWorking = workPeriods.some((p) => p.endDate === null);
  const activePartTime = workPeriods.find((p) => p.endDate === null)?.partTimePercentage ?? 100;

  const year65 = birthDate.getFullYear() + 65;
  const rule = getRuleForYear(year65);

  const date65 = ageToDate(birthDate, { years: 65, months: 0 });
  const projectedDaysAt65 = projectContributionDays(
    effectiveDays, reportDate, date65, isCurrentlyWorking, activePartTime
  );
  const projectedMonthsAt65 = contributionToMonths(projectedDaysAt65);

  const meetsThresholdAt65 = projectedMonthsAt65 >= rule.contributionThresholdMonths;

  const ordinaryRetirementAge: AgeSpec = meetsThresholdAt65
    ? rule.ageIfAboveThreshold
    : rule.ageIfBelowThreshold;

  const ordinaryRetirementDate = ageToDate(birthDate, ordinaryRetirementAge);

  const projectedDaysAtRetirement = projectContributionDays(
    effectiveDays, reportDate, ordinaryRetirementDate, isCurrentlyWorking, activePartTime
  );
  const contributionAtRetirementAge = daysToContribution(projectedDaysAtRetirement);

  const meetsMinimumContribution =
    contributionToMonths(projectedDaysAtRetirement) >= MINIMUM_CONTRIBUTION_YEARS * 12;

  const daysUntilRetirement = Math.max(0, daysBetween(today, ordinaryRetirementDate));
  const alreadyRetired = ordinaryRetirementDate <= today;

  const projectedYearsAtRetirement = projectedDaysAtRetirement / 365;

  const voluntaryEligible =
    projectedYearsAtRetirement >= VOLUNTARY_EARLY_RETIREMENT.minimumContributionYears;
  const voluntaryMinDate = addMonthsToDate(
    ordinaryRetirementDate,
    -VOLUNTARY_EARLY_RETIREMENT.maxMonthsEarly
  );
  const voluntaryMinAge = dateToAge(birthDate, voluntaryMinDate);

  const involuntaryEligible =
    projectedYearsAtRetirement >= INVOLUNTARY_EARLY_RETIREMENT.minimumContributionYears;
  const involuntaryMinDate = addMonthsToDate(
    ordinaryRetirementDate,
    -INVOLUNTARY_EARLY_RETIREMENT.maxMonthsEarly
  );
  const involuntaryMinAge = dateToAge(birthDate, involuntaryMinDate);

  const pensionEstimate = calculatePensionEstimate(
    projectedDaysAtRetirement,
    ordinaryRetirementDate.getFullYear(),
    meetsMinimumContribution
  );

  return {
    ordinaryRetirementAge,
    ordinaryRetirementDate,
    contributionAtRetirementAge,
    meetsMinimumContribution,
    daysUntilRetirement,
    earlyRetirement: {
      voluntary: {
        eligible: voluntaryEligible,
        minimumAge: voluntaryMinAge,
        minimumDate: voluntaryMinDate,
        reductionPerQuarter: getReductionRange(VOLUNTARY_EARLY_RETIREMENT, projectedYearsAtRetirement),
      },
      involuntary: {
        eligible: involuntaryEligible,
        minimumAge: involuntaryMinAge,
        minimumDate: involuntaryMinDate,
        reductionPerQuarter: getReductionRange(INVOLUNTARY_EARLY_RETIREMENT, projectedYearsAtRetirement),
      },
    },
    isCurrentlyWorking,
    currentAge,
    alreadyRetired,
    pensionEstimate,
  };
}

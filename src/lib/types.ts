export interface PersonalData {
  fullName: string;
  birthDate: Date;
  socialSecurityNumber: string;
  dni: string;
  address: string;
  reportDate: Date;
}

export interface ContributionSummary {
  totalDays: number;
  totalYears: number;
  totalMonths: number;
  totalRemainingDays: number;
  overlapDays: number;
  effectiveDays: number;
  effectiveYears: number;
  effectiveMonths: number;
  effectiveRemainingDays: number;
}

export interface WorkPeriod {
  regime: string;
  companyCode: string;
  companyName: string;
  startDate: Date;
  effectiveStartDate: Date;
  endDate: Date | null; // null = still active
  contractType: string | null;
  partTimePercentage: number | null;
  contributionGroup: string | null;
  days: number;
}

export interface VidaLaboral {
  personalData: PersonalData;
  contributionSummary: ContributionSummary;
  workPeriods: WorkPeriod[];
}

export interface AgeSpec {
  years: number;
  months: number;
}

export interface EarlyRetirementInfo {
  eligible: boolean;
  minimumAge: AgeSpec;
  minimumDate: Date;
  reductionPerQuarter: { min: number; max: number };
}

export interface PensionEstimateEntry {
  baseReguladora: number;
  monthlyPension: number;
  annualPension: number;
}

export interface PensionEstimate {
  percentage: number;
  contributionMonthsUsed: number;
  estimatedPensions: PensionEstimateEntry[];
  /** 2025 reference values, paid in 14 pagas/year */
  minimumPension: {
    withSpouse: number;
    withoutSpouse: number;
  };
  /** 2025 reference value, paid in 14 pagas/year */
  maximumPension: number;
  baseReguladoraPeriodYears: number;
}

export interface RetirementResult {
  ordinaryRetirementAge: AgeSpec;
  ordinaryRetirementDate: Date;
  contributionAtRetirementAge: {
    years: number;
    months: number;
    days: number;
  };
  meetsMinimumContribution: boolean;
  daysUntilRetirement: number;
  earlyRetirement: {
    voluntary: EarlyRetirementInfo;
    involuntary: EarlyRetirementInfo;
  };
  isCurrentlyWorking: boolean;
  currentAge: AgeSpec;
  alreadyRetired: boolean;
  pensionEstimate: PensionEstimate | null;
}

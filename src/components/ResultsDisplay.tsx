"use client";

import { useState } from "react";
import type {
  RetirementResult,
  PersonalData,
  ContributionSummary,
  AgeSpec,
  PensionEstimate,
} from "@/lib/types";
import {
  PENSION_LIMITS_2025,
  MAX_CONTRIBUTION_BASE_MONTHLY_2025,
} from "@/lib/retirement-tables";

interface ResultsDisplayProps {
  result: RetirementResult;
  personalData: PersonalData;
  contributionSummary: ContributionSummary;
}

function formatSpanishDate(date: Date): string {
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

function formatAge(age: AgeSpec): string {
  if (age.months === 0) {
    return `${age.years} años`;
  }
  return `${age.years} años y ${age.months} ${age.months === 1 ? "mes" : "meses"}`;
}

function formatSocialSecurity(ssn: string): string {
  if (ssn.length === 12) {
    return `${ssn.slice(0, 2)}/${ssn.slice(2, 10)}/${ssn.slice(10, 12)}`;
  }
  return ssn;
}

function formatEuros(value: number): string {
  return value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function computePersonalizedPension(grossYearly: number, pensionPercentage: number) {
  const rawMonthlyBase = grossYearly / 12;
  const wasCapped = rawMonthlyBase > MAX_CONTRIBUTION_BASE_MONTHLY_2025;
  const monthlyContributionBase = Math.min(rawMonthlyBase, MAX_CONTRIBUTION_BASE_MONTHLY_2025);
  const baseReguladora = (monthlyContributionBase * 300) / 350;
  const rawMonthlyPension = baseReguladora * (pensionPercentage / 100);
  const monthlyPension = Math.min(rawMonthlyPension, PENSION_LIMITS_2025.maximumMonthly);
  const annualPension = monthlyPension * 14;

  return {
    monthlyContributionBase: Math.round(monthlyContributionBase * 100) / 100,
    baseReguladora: Math.round(baseReguladora * 100) / 100,
    monthlyPension: Math.round(monthlyPension * 100) / 100,
    annualPension: Math.round(annualPension * 100) / 100,
    wasCapped,
  };
}

function computeEarlyPension(
  ordinaryMonthlyPension: number,
  ordinaryRetirementDate: Date,
  earlyMinimumDate: Date,
  reductionPerQuarter: number
) {
  const monthsEarly =
    (ordinaryRetirementDate.getFullYear() - earlyMinimumDate.getFullYear()) * 12 +
    (ordinaryRetirementDate.getMonth() - earlyMinimumDate.getMonth());
  const quartersEarly = Math.floor(monthsEarly / 3);
  const totalReduction = quartersEarly * reductionPerQuarter;
  const reducedMonthly = ordinaryMonthlyPension * (1 - totalReduction / 100);
  const clamped = Math.min(Math.max(0, reducedMonthly), PENSION_LIMITS_2025.maximumMonthly);

  return {
    monthlyPension: Math.round(clamped * 100) / 100,
    annualPension: Math.round(clamped * 14 * 100) / 100,
    totalReduction: Math.round(totalReduction * 100) / 100,
    quartersEarly,
  };
}

function PensionSection({ result }: { result: RetirementResult }) {
  const estimate = result.pensionEstimate!;
  const [salaryInput, setSalaryInput] = useState("");

  const salary = parseFloat(salaryInput);
  const hasValidSalary = !isNaN(salary) && salary > 0;

  const personalized = hasValidSalary
    ? computePersonalizedPension(salary, estimate.percentage)
    : null;

  const voluntaryEarlyPension =
    personalized && result.earlyRetirement.voluntary.eligible
      ? computeEarlyPension(
          personalized.monthlyPension,
          result.ordinaryRetirementDate,
          result.earlyRetirement.voluntary.minimumDate,
          result.earlyRetirement.voluntary.reductionPerQuarter.min
        )
      : null;

  const involuntaryEarlyPension =
    personalized && result.earlyRetirement.involuntary.eligible
      ? computeEarlyPension(
          personalized.monthlyPension,
          result.ordinaryRetirementDate,
          result.earlyRetirement.involuntary.minimumDate,
          result.earlyRetirement.involuntary.reductionPerQuarter.min
        )
      : null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg shadow-md border-2 border-emerald-300 p-8">
        <h2 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Estimación de Pensión
        </h2>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div>
            <p className="text-sm font-medium text-emerald-700 mb-1">
              Porcentaje de pensión
            </p>
            <p className="text-4xl font-bold text-emerald-900">
              {estimate.percentage.toLocaleString("es-ES", { maximumFractionDigits: 2 })}%
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-700 mb-1">
              Meses cotizados (proyectados)
            </p>
            <p className="text-2xl font-bold text-emerald-900">
              {estimate.contributionMonthsUsed.toLocaleString("es-ES")} meses
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              {Math.floor(estimate.contributionMonthsUsed / 12)} años y{" "}
              {estimate.contributionMonthsUsed % 12} meses
            </p>
          </div>
        </div>

        <div className="bg-white/60 rounded-lg p-6 mb-6">
          <label
            htmlFor="gross-salary"
            className="block text-sm font-semibold text-emerald-800 mb-2"
          >
            Introduce tu salario bruto anual para calcular tu pensión estimada
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <input
                id="gross-salary"
                type="number"
                min="0"
                step="500"
                placeholder="Ej: 30000"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                className="w-full rounded-lg border border-emerald-300 bg-white px-4 py-2.5 pr-10 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                €/año
              </span>
            </div>
          </div>
          {personalized && (
            <div className="mt-3 text-xs text-emerald-700 space-x-4">
              <span>
                Base cotización: {formatEuros(personalized.monthlyContributionBase)}/mes
                {personalized.wasCapped && " (topada al máximo)"}
              </span>
              <span>
                Base reguladora: {formatEuros(personalized.baseReguladora)}/mes
              </span>
            </div>
          )}
        </div>

        {personalized && (
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="bg-emerald-600 text-white rounded-lg p-5">
              <p className="text-xs font-medium text-emerald-200 uppercase tracking-wide mb-1">
                Jubilación Ordinaria
              </p>
              <p className="text-3xl font-bold">
                {formatEuros(personalized.monthlyPension)}
                <span className="text-sm font-normal text-emerald-200">/mes</span>
              </p>
              <p className="text-sm text-emerald-100 mt-1">
                {formatEuros(personalized.annualPension)}/año
              </p>
            </div>

            <div
              className={`rounded-lg p-5 ${
                voluntaryEarlyPension
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <p
                className={`text-xs font-medium uppercase tracking-wide mb-1 ${
                  voluntaryEarlyPension ? "text-amber-200" : "text-slate-400"
                }`}
              >
                Anticipada Voluntaria
              </p>
              {voluntaryEarlyPension ? (
                <>
                  <p className="text-3xl font-bold">
                    {formatEuros(voluntaryEarlyPension.monthlyPension)}
                    <span className="text-sm font-normal text-amber-200">/mes</span>
                  </p>
                  <p className="text-sm text-amber-100 mt-1">
                    {formatEuros(voluntaryEarlyPension.annualPension)}/año
                  </p>
                  <p className="text-xs text-amber-200 mt-2">
                    -{voluntaryEarlyPension.totalReduction}% ({voluntaryEarlyPension.quartersEarly} trimestres)
                  </p>
                </>
              ) : (
                <p className="text-sm mt-2">No elegible</p>
              )}
            </div>

            <div
              className={`rounded-lg p-5 ${
                involuntaryEarlyPension
                  ? "bg-orange-600 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <p
                className={`text-xs font-medium uppercase tracking-wide mb-1 ${
                  involuntaryEarlyPension ? "text-orange-200" : "text-slate-400"
                }`}
              >
                Anticipada Involuntaria
              </p>
              {involuntaryEarlyPension ? (
                <>
                  <p className="text-3xl font-bold">
                    {formatEuros(involuntaryEarlyPension.monthlyPension)}
                    <span className="text-sm font-normal text-orange-200">/mes</span>
                  </p>
                  <p className="text-sm text-orange-100 mt-1">
                    {formatEuros(involuntaryEarlyPension.annualPension)}/año
                  </p>
                  <p className="text-xs text-orange-200 mt-2">
                    -{involuntaryEarlyPension.totalReduction}% ({involuntaryEarlyPension.quartersEarly} trimestres)
                  </p>
                </>
              ) : (
                <p className="text-sm mt-2">No elegible</p>
              )}
            </div>
          </div>
        )}

        <details className="bg-white/60 rounded-lg">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-emerald-800 hover:text-emerald-900 select-none">
            Ver tabla de referencia según base reguladora
          </summary>
          <div className="px-4 pb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-200">
                  <th className="text-left py-2 px-3 font-semibold text-emerald-800">
                    Base Reguladora
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-emerald-800">
                    Pensión Mensual
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-emerald-800">
                    Pensión Anual
                  </th>
                </tr>
              </thead>
              <tbody>
                {estimate.estimatedPensions.map((row) => (
                  <tr
                    key={row.baseReguladora}
                    className="border-b border-emerald-100 last:border-0"
                  >
                    <td className="py-2 px-3 text-slate-700">
                      {formatEuros(row.baseReguladora)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-900">
                      {formatEuros(row.monthlyPension)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-900">
                      {formatEuros(row.annualPension)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">
            Pensión Mínima (2025)
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Con cónyuge a cargo</dt>
              <dd className="font-medium text-slate-900">
                {formatEuros(estimate.minimumPension.withSpouse)}/mes
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Sin cónyuge a cargo</dt>
              <dd className="font-medium text-slate-900">
                {formatEuros(estimate.minimumPension.withoutSpouse)}/mes
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">
            Pensión Máxima (2025)
          </h3>
          <p className="text-2xl font-bold text-slate-900">
            {formatEuros(estimate.maximumPension)}/mes
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {formatEuros(estimate.maximumPension * 14)}/año (14 pagas)
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-amber-800">
            Esta estimación asume un salario constante durante los últimos{" "}
            {estimate.baseReguladoraPeriodYears} años. La pensión real depende
            del historial de bases de cotización (no disponible en la Vida
            Laboral). Consulte con la Seguridad Social para un cálculo exacto.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResultsDisplay({
  result,
  personalData,
  contributionSummary,
}: ResultsDisplayProps) {
  const progressPercentage = result.alreadyRetired
    ? 100
    : Math.min(
        100,
        (result.currentAge.years * 12 + result.currentAge.months) /
          (result.ordinaryRetirementAge.years * 12 +
            result.ordinaryRetirementAge.months) *
          100
      );

  return (
    <div className="w-full max-w-5xl space-y-6">
      {result.alreadyRetired && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-lg p-6 text-center">
          <p className="text-2xl font-bold text-emerald-700">
            ¡Ya puedes jubilarte!
          </p>
          <p className="text-sm text-emerald-600 mt-2">
            Has alcanzado la edad ordinaria de jubilación
          </p>
        </div>
      )}

      {!result.meetsMinimumContribution && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-base font-semibold text-amber-800">
                Período de cotización insuficiente
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Es posible que no cumplas con el período mínimo de cotización
                requerido (15 años).
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Datos Personales
          </h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Nombre</dt>
              <dd className="font-medium text-slate-900 mt-0.5">
                {personalData.fullName}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Fecha de Nacimiento</dt>
              <dd className="font-medium text-slate-900 mt-0.5">
                {formatSpanishDate(personalData.birthDate)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Número de Seguridad Social</dt>
              <dd className="font-medium text-slate-900 mt-0.5 font-mono">
                {formatSocialSecurity(personalData.socialSecurityNumber)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Resumen de Cotización
          </h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Días efectivos cotizados</dt>
              <dd className="font-semibold text-slate-900 mt-0.5 text-lg">
                {contributionSummary.effectiveDays.toLocaleString("es-ES")} días
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Equivalente a</dt>
              <dd className="font-medium text-slate-900 mt-0.5">
                {contributionSummary.effectiveYears} años,{" "}
                {contributionSummary.effectiveMonths} meses,{" "}
                {contributionSummary.effectiveRemainingDays} días
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Estado actual</dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    result.isCurrentlyWorking
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {result.isCurrentlyWorking
                    ? "Trabajando actualmente"
                    : "No trabajando actualmente"}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md border-2 border-blue-300 p-8">
        <h2 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Jubilación Ordinaria
        </h2>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">
              Edad de jubilación
            </p>
            <p className="text-3xl font-bold text-blue-900">
              {formatAge(result.ordinaryRetirementAge)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">
              Fecha de jubilación
            </p>
            <p className="text-2xl font-bold text-blue-900">
              {formatSpanishDate(result.ordinaryRetirementDate)}
            </p>
          </div>
        </div>

        {!result.alreadyRetired && (
          <>
            <div className="mb-4">
              <div className="flex justify-between text-sm font-medium text-blue-800 mb-2">
                <span>Progreso hacia jubilación</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-white/60 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-1">
                Días restantes
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {result.daysUntilRetirement.toLocaleString("es-ES")} días
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Aproximadamente{" "}
                {Math.round(result.daysUntilRetirement / 365)} años
              </p>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Jubilación Anticipada Voluntaria
          </h3>
          {result.earlyRetirement.voluntary.eligible ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Elegible
              </div>
              <div>
                <dt className="text-slate-500">Edad mínima</dt>
                <dd className="font-medium text-slate-900 mt-0.5">
                  {formatAge(result.earlyRetirement.voluntary.minimumAge)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Fecha mínima</dt>
                <dd className="font-medium text-slate-900 mt-0.5">
                  {formatSpanishDate(result.earlyRetirement.voluntary.minimumDate)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Reducción por trimestre</dt>
                <dd className="font-medium text-slate-900 mt-0.5">
                  {result.earlyRetirement.voluntary.reductionPerQuarter.min}% -{" "}
                  {result.earlyRetirement.voluntary.reductionPerQuarter.max}%
                </dd>
              </div>
              <details className="mt-3 pt-3 border-t border-slate-100">
                <summary className="text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700 select-none">
                  Ver condiciones de acceso
                </summary>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span>
                    Tener al menos 35 años de cotización efectiva
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span>
                    Máximo 24 meses antes de la edad ordinaria de jubilación
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span>
                    La pensión resultante debe superar la pensión mínima vigente
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span>
                    No es necesario estar en situación de desempleo
                  </li>
                </ul>
              </details>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-slate-600">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">
                No cumples los requisitos para jubilación anticipada voluntaria
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Jubilación Anticipada Involuntaria
          </h3>
          {result.earlyRetirement.involuntary.eligible ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Elegible
              </div>
              <div>
                <dt className="text-slate-500">Edad mínima</dt>
                <dd className="font-medium text-slate-900 mt-0.5">
                  {formatAge(result.earlyRetirement.involuntary.minimumAge)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Fecha mínima</dt>
                <dd className="font-medium text-slate-900 mt-0.5">
                  {formatSpanishDate(
                    result.earlyRetirement.involuntary.minimumDate
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Reducción por trimestre</dt>
                <dd className="font-medium text-slate-900 mt-0.5">
                  {result.earlyRetirement.involuntary.reductionPerQuarter.min}%
                  - {result.earlyRetirement.involuntary.reductionPerQuarter.max}%
                </dd>
              </div>
              <details className="mt-3 pt-3 border-t border-slate-100">
                <summary className="text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700 select-none">
                  Ver condiciones de acceso
                </summary>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span>
                    Tener al menos 33 años de cotización efectiva
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span>
                    Máximo 48 meses antes de la edad ordinaria de jubilación
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span>
                    Cese por causa no imputable al trabajador (despido, ERE, etc.)
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">•</span>
                    Inscrito como demandante de empleo al menos 6 meses antes
                  </li>
                </ul>
              </details>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-slate-600">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">
                No cumples los requisitos para jubilación anticipada involuntaria
              </span>
            </div>
          )}
        </div>
      </div>

      {result.pensionEstimate && (
        <PensionSection result={result} />
      )}
    </div>
  );
}

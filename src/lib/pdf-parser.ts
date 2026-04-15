import type { VidaLaboral, PersonalData, ContributionSummary, WorkPeriod } from "./types";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

type PdfjsLib = typeof import("pdfjs-dist");

let pdfjsLibInstance: PdfjsLib | null = null;

async function getPdfjsLib(): Promise<PdfjsLib> {
  if (pdfjsLibInstance) return pdfjsLibInstance;
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/pdf.worker.min.mjs`;
  pdfjsLibInstance = lib;
  return lib;
}

function parseSpanishDateLong(text: string): Date {
  const MONTHS: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };
  const match = text.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
  if (!match) throw new Error(`Cannot parse date: "${text}"`);
  const day = parseInt(match[1], 10);
  const month = MONTHS[match[2].toLowerCase()];
  if (month === undefined) throw new Error(`Unknown month: "${match[2]}"`);
  const year = parseInt(match[3], 10);
  return new Date(year, month, day);
}

function parseDotDate(text: string): Date {
  const [day, month, year] = text.split(".").map(Number);
  return new Date(year, month - 1, day);
}

function parseSpanishNumber(text: string): number {
  return parseInt(text.replace(/\./g, ""), 10);
}

async function extractPageText(page: import("pdfjs-dist").PDFPageProxy): Promise<string> {
  const content = await page.getTextContent();
  const items = content.items.filter(
    (item): item is TextItem => "str" in item
  );

  if (items.length === 0) return "";

  const lineMap = new Map<number, { x: number; str: string }[]>();
  for (const item of items) {
    const y = Math.round(item.transform[5]);
    const x = item.transform[4];
    if (!lineMap.has(y)) lineMap.set(y, []);
    lineMap.get(y)!.push({ x, str: item.str });
  }

  return [...lineMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, parts]) =>
      parts.sort((a, b) => a.x - b.x).map((p) => p.str).join(" ")
    )
    .join("\n");
}

function extractPersonalData(text: string): PersonalData {
  const nameMatch = text.match(/D\/D[ªa]\s+(.+?)\s*,\s*nacido/s);
  const fullName = nameMatch ? nameMatch[1].replace(/\s+/g, " ").trim() : "Desconocido";

  const birthMatch = text.match(/nacido\/a el\s+(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/);
  const birthDate = birthMatch ? parseSpanishDateLong(birthMatch[1]) : new Date();

  const ssMatch = text.match(/Seguridad Social\s+(\d+)/);
  const socialSecurityNumber = ssMatch ? ssMatch[1] : "";

  const dniMatch = text.match(/D\.N\.I\.\s*(\S+)/);
  const dni = dniMatch ? dniMatch[1] : "";

  const addressMatch = text.match(/domicilio en\s+(.+?)\s*\n\s*ha figurado/s);
  const address = addressMatch ? addressMatch[1].replace(/\s+/g, " ").trim() : "";

  const reportDateMatch = text.match(/(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/);
  const reportDate = reportDateMatch ? parseSpanishDateLong(reportDateMatch[1]) : new Date();

  return { fullName, birthDate, socialSecurityNumber, dni, address, reportDate };
}

function extractContributionSummary(text: string): ContributionSummary {
  const totalBlock = text.match(
    /durante un total de[\s\S]*?(\d+)\s+Años\s*\n?\s*([\d.]+)\s+días\s+(\d+)\s+meses\s*\n?\s*(\d+)\s+días/
  );

  let totalYears = 0, totalDays = 0, totalMonths = 0, totalRemainingDays = 0;
  if (totalBlock) {
    totalYears = parseInt(totalBlock[1], 10);
    totalDays = parseSpanishNumber(totalBlock[2]);
    totalMonths = parseInt(totalBlock[3], 10);
    totalRemainingDays = parseInt(totalBlock[4], 10);
  }

  const overlapMatch = text.match(/durante un total de\s+([\d.]+)\s+días,\s*por lo que/);
  const overlapDays = overlapMatch ? parseSpanishNumber(overlapMatch[1]) : 0;

  const effectiveBlock = text.match(
    /computables[\s\S]*?(\d+)\s+Años\s*\n?\s*([\d.]+)\s+días\s+(\d+)\s+meses\s*\n?\s*(\d+)\s+días/
  );

  let effectiveYears = 0, effectiveDays = 0, effectiveMonths = 0, effectiveRemainingDays = 0;
  if (effectiveBlock) {
    effectiveYears = parseInt(effectiveBlock[1], 10);
    effectiveDays = parseSpanishNumber(effectiveBlock[2]);
    effectiveMonths = parseInt(effectiveBlock[3], 10);
    effectiveRemainingDays = parseInt(effectiveBlock[4], 10);
  }

  return {
    totalDays, totalYears, totalMonths, totalRemainingDays,
    overlapDays,
    effectiveDays, effectiveYears, effectiveMonths, effectiveRemainingDays,
  };
}

function extractWorkPeriods(text: string): WorkPeriod[] {
  const periods: WorkPeriod[] = [];
  const lines = text.split("\n");

  const REGIMES = ["GENERAL", "AUTÓNOMOS", "AGRARIO", "MAR", "CARBÓN", "HOGAR"];

  for (const line of lines) {
    const trimmed = line.trim();
    const regimeMatch = REGIMES.find((r) => trimmed.startsWith(r));
    if (!regimeMatch) continue;

    const afterRegime = trimmed.substring(regimeMatch.length).trim();

    const datePattern = /\d{2}\.\d{2}\.\d{4}/g;
    const dates: { value: string; index: number }[] = [];
    let match: RegExpExecArray | null;
    while ((match = datePattern.exec(afterRegime)) !== null) {
      dates.push({ value: match[0], index: match.index });
    }

    if (dates.length < 2) continue;

    const codeAndName = afterRegime.substring(0, dates[0].index).trim();
    const firstSpace = codeAndName.indexOf(" ");
    const companyCode = firstSpace > 0 ? codeAndName.substring(0, firstSpace) : codeAndName;
    const companyName = firstSpace > 0 ? codeAndName.substring(firstSpace).trim() : "";

    const startDate = parseDotDate(dates[0].value);
    const effectiveStartDate = parseDotDate(dates[1].value);

    const lastDateEnd = dates[dates.length - 1].index + dates[dates.length - 1].value.length;
    const afterDates = afterRegime.substring(lastDateEnd).trim();

    let endDate: Date | null = null;
    let restFields: string;

    if (dates.length >= 3) {
      endDate = parseDotDate(dates[2].value);
      const thirdDateEnd = dates[2].index + dates[2].value.length;
      restFields = afterRegime.substring(thirdDateEnd).trim();
    } else {
      restFields = afterDates;
    }

    const hasDashBaja = restFields.startsWith("---");
    if (hasDashBaja) {
      endDate = null;
      restFields = restFields.substring(3).trim();
    }

    const parts = restFields.split(/\s+/).filter(Boolean);

    let contractType: string | null = null;
    let partTimePercentage: number | null = null;
    let contributionGroup: string | null = null;
    let days = 0;

    if (parts.length >= 4) {
      contractType = parts[0] === "---" ? null : parts[0];
      partTimePercentage = parts[1] === "---" ? null : parseInt(parts[1], 10);
      contributionGroup = parts[2] === "--" ? null : parts[2];
      days = parseSpanishNumber(parts[3]);
    } else if (parts.length >= 1) {
      days = parseSpanishNumber(parts[parts.length - 1]);
      if (parts.length >= 2) contributionGroup = parts[parts.length - 2] === "--" ? null : parts[parts.length - 2];
      if (parts.length >= 3) partTimePercentage = parts[parts.length - 3] === "---" ? null : parseInt(parts[parts.length - 3], 10);
    }

    periods.push({
      regime: regimeMatch,
      companyCode,
      companyName,
      startDate,
      effectiveStartDate,
      endDate,
      contractType,
      partTimePercentage,
      contributionGroup,
      days,
    });
  }

  return periods;
}

export async function parseVidaLaboral(file: File): Promise<VidaLaboral> {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const firstPage = await pdf.getPage(1);
  const firstPageText = await extractPageText(firstPage);

  const personalData = extractPersonalData(firstPageText);
  const contributionSummary = extractContributionSummary(firstPageText);

  let allWorkText = "";
  for (let i = 2; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const pageText = await extractPageText(page);
    allWorkText += pageText + "\n";
  }

  const workPeriods = extractWorkPeriods(allWorkText);

  return { personalData, contributionSummary, workPeriods };
}

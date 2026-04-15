"use client";

import { useState, useEffect } from "react";
import FileUploader from "@/components/FileUploader";
import ResultsDisplay from "@/components/ResultsDisplay";
import WorkHistoryTable from "@/components/WorkHistoryTable";
import { parseVidaLaboral } from "@/lib/pdf-parser";
import { calculateRetirement } from "@/lib/retirement-calculator";
import { saveVidaLaboral, loadVidaLaboral, clearVidaLaboral } from "@/lib/storage";
import type { VidaLaboral, RetirementResult } from "@/lib/types";

export default function Home() {
  const [vidaLaboral, setVidaLaboral] = useState<VidaLaboral | null>(null);
  const [retirementResult, setRetirementResult] =
    useState<RetirementResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = loadVidaLaboral();
    if (cached) {
      setVidaLaboral(cached);
      setRetirementResult(calculateRetirement(cached));
    }
  }, []);

  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setVidaLaboral(null);
    setRetirementResult(null);

    try {
      const parsedData = await parseVidaLaboral(file);
      saveVidaLaboral(parsedData);
      setVidaLaboral(parsedData);

      const result = calculateRetirement(parsedData);
      setRetirementResult(result);
    } catch (err) {
      console.error("Error processing file:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al procesar el archivo. Por favor, verifica que sea un informe de Vida Laboral válido."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    clearVidaLaboral();
    setVidaLaboral(null);
    setRetirementResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Simulador de Jubilación
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Calcula tu edad de jubilación según la legislación española
              </p>
            </div>
            {(vidaLaboral || error) && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Nuevo archivo
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center gap-8">
          {!vidaLaboral && !error && (
            <FileUploader
              onFileSelected={handleFileSelected}
              isLoading={isLoading}
            />
          )}

          {error && (
            <div className="w-full max-w-2xl bg-red-50 border-2 border-red-300 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-base font-semibold text-red-800">
                    Error al procesar el archivo
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {vidaLaboral && retirementResult && (
            <>
              <ResultsDisplay
                result={retirementResult}
                personalData={vidaLaboral.personalData}
                contributionSummary={vidaLaboral.contributionSummary}
              />
              <WorkHistoryTable workPeriods={vidaLaboral.workPeriods} />
            </>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <svg
              className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
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
            <p>
              <strong>Aviso:</strong> Esta herramienta es solo orientativa.
              Consulte con la Seguridad Social para información oficial sobre
              su jubilación.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

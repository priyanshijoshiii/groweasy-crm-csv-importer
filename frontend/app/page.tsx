"use client";

import { useState, useEffect } from "react";
import CsvUploader from "@/components/CsvUploader";
import PreviewTable from "@/components/PreviewTable";
import ResultTable from "@/components/ResultTable";
import { extractCrmRecords, getProgress } from "@/lib/api";
import type { CsvRow, ExtractResponse } from "@/lib/types";



export default function Home() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleParsed = (parsedRows: CsvRow[], name: string) => {
    setRows(parsedRows);
    setFileName(name);
    setResult(null);
    setError(null);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);
    setProgress(null);

    const jobId = crypto.randomUUID();

    const pollInterval = setInterval(async () => {
      try {
        const prog = await getProgress(jobId);
        setProgress({ current: prog.current, total: prog.total });
        if (prog.done) {
          clearInterval(pollInterval);
        }
      } catch {
        // Progress endpoint might 404 briefly before the job starts — ignore and keep polling
      }
    }, 1500);

    try {
      const response = await extractCrmRecords(rows, jobId);
      setResult(response);
    } catch (err) {
      setError("Something went wrong while processing your CSV. Please try again.");
      console.error(err);
    } finally {
      clearInterval(pollInterval);
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleReset = () => {
    setRows([]);
    setFileName("");
    setResult(null);
    setError(null);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="flex justify-end max-w-5xl mx-auto mb-4">
        <button
          onClick={toggleDarkMode}
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {isDark ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          GrowEasy CRM CSV Importer
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Upload any CSV — our AI maps it into your CRM format automatically.
        </p>
      </div>

      {rows.length === 0 && <CsvUploader onParsed={handleParsed} />}

      {rows.length > 0 && !result && (
        <>
          <div className="text-center mb-2 text-sm text-gray-500 dark:text-gray-400">
            {fileName} — {rows.length} rows found
          </div>
          <PreviewTable rows={rows} />
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handleReset}
              className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing
                ? progress
                  ? `Processing batch ${progress.current} of ${progress.total}...`
                  : "Starting..."
                : "Confirm Import"}
            </button>
          </div>
        </>
      )}

      {error && (
        <p className="text-red-500 text-center mt-4">{error}</p>
      )}

      {result && (
        <>
          <ResultTable
            records={result.imported}
            totalImported={result.totalImported}
            totalSkipped={result.totalSkipped}
          />
          <div className="flex justify-center mt-6">
            <button
              onClick={handleReset}
              className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Import Another CSV
            </button>
          </div>
        </>
      )}
    </main>
  );
}
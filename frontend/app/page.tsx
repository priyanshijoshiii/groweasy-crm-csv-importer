"use client";

import { useState } from "react";
import CsvUploader from "@/components/CsvUploader";
import PreviewTable from "@/components/PreviewTable";
import ResultTable from "@/components/ResultTable";
import { extractCrmRecords } from "@/lib/api";
import type { CsvRow, ExtractResponse } from "@/lib/types";


export default function Home() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  const handleParsed = (parsedRows: CsvRow[], name: string) => {
    setRows(parsedRows);
    setFileName(name);
    setResult(null);
    setError(null);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await extractCrmRecords(rows);
      setResult(response);
    } catch (err) {
      setError("Something went wrong while processing your CSV. Please try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setRows([]);
    setFileName("");
    setResult(null);
    setError(null);
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
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
              {isProcessing ? "Processing with AI..." : "Confirm Import"}
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
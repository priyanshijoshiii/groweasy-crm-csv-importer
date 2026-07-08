"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";

import type { CsvRow } from "@/lib/types";

interface CsvUploaderProps {
  onParsed: (rows: CsvRow[], fileName: string) => void;
}

export default function CsvUploader({ onParsed }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Please upload a valid .csv file.");
        return;
      }

      Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data.length) {
            setError("This CSV appears to be empty.");
            return;
          }
          onParsed(results.data, file.name);
        },
        error: (err) => {
          setError(`Failed to parse CSV: ${err.message}`);
        },
      });
    },
    [onParsed]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 dark:border-gray-700"
        }`}
        onClick={() => document.getElementById("csv-input")?.click()}
      >
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileInput}
        />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
          Drag & drop your CSV here
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          or click to browse
        </p>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
      )}
    </div>
  );
}
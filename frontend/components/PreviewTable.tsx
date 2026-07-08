"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMemo } from "react";
import type { CsvRow } from "./CsvUploader";

interface PreviewTableProps {
  rows: CsvRow[];
}

export default function PreviewTable({ rows }: PreviewTableProps) {
  const columnHelper = createColumnHelper<CsvRow>();

  // Column names come from the CSV itself — we don't know them ahead of time.
  const columns = useMemo(() => {
    if (!rows.length) return [];
    const keys = Object.keys(rows[0]);
    return keys.map((key) =>
      columnHelper.accessor(key, {
        header: key,
        cell: (info) => info.getValue() ?? "",
      })
    );
  }, [rows]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!rows.length) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 border rounded-xl overflow-hidden">
      <div className="overflow-auto max-h-[500px]">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap border-b"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 px-4 py-2 bg-gray-50 dark:bg-gray-900">
        Showing {rows.length} row{rows.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
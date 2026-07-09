"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";
import type { CsvRow } from "@/lib/types";

interface PreviewTableProps {
  rows: CsvRow[];
}

export default function PreviewTable({ rows }: PreviewTableProps) {
  const columnHelper = createColumnHelper<CsvRow>();
  const tableContainerRef = useRef<HTMLDivElement>(null);

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

  const { rows: tableRows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 41, // approximate row height in px
    overscan: 10,
  });

  if (!rows.length) return null;

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 border rounded-xl overflow-hidden">
      <div
        ref={tableContainerRef}
        className="overflow-auto max-h-[500px]"
      >
        <table className="w-full text-sm text-left border-collapse" style={{ tableLayout: "fixed" }}>
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap border-b overflow-hidden text-ellipsis"
                    style={{ width: `${header.getSize()}px` }}
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
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = tableRows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className="border-b hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300 overflow-hidden text-ellipsis"
                  style={{ width: `${cell.column.getSize()}px` }}
                >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 px-4 py-2 bg-gray-50 dark:bg-gray-900">
        Showing {rows.length} row{rows.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
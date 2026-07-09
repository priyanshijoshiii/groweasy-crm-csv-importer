"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import type { CrmRecord } from "@/lib/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";

interface ResultTableProps {
  records: CrmRecord[];
  totalImported: number;
  totalSkipped: number;
}

const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  DID_NOT_CONNECT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  BAD_LEAD: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  SALE_DONE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

function StatusPill({ status }: { status: string }) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;
  const style = STATUS_STYLES[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${style}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function ResultTable({
  records,
  totalImported,
  totalSkipped,
}: ResultTableProps) {
  const columnHelper = createColumnHelper<CrmRecord>();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", { header: "Name" }),
      columnHelper.accessor("email", { header: "Email" }),
      columnHelper.accessor("mobile_without_country_code", { header: "Mobile" }),
      columnHelper.accessor("city", { header: "City" }),
      columnHelper.accessor("company", { header: "Company" }),
      columnHelper.accessor("crm_status", {
        header: "Status",
        cell: (info) => <StatusPill status={info.getValue() as string} />,
      }),
      columnHelper.accessor("data_source", { header: "Source" }),
      columnHelper.accessor("crm_note", { header: "Notes" }),
    ],
    []
  );

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows: tableRows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 41,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <div className="w-full max-w-5xl mx-auto mt-8">
      <div className="flex gap-4 mb-4">
        <div className="px-4 py-2 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm font-medium">
          {totalImported} Imported
        </div>
        <div className="px-4 py-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm font-medium">
          {totalSkipped} Skipped
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <div ref={tableContainerRef} className="overflow-auto max-h-[500px]">
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
                      {flexRender(header.column.columnDef.header, header.getContext())}
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
                  <tr key={row.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
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
      </div>
    </div>
  );
}
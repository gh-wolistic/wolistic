"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import { useState, Fragment } from "react";
import { ChevronDown, ChevronUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AuditLog } from "@/types/admin";

interface AuditLogTableProps {
  logs: AuditLog[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function AuditLogTable({
  logs,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: AuditLogTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-white/5"
          >
            Timestamp
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return (
          <div className="text-sm">
            <div className="text-white">{date.toLocaleDateString()}</div>
            <div className="text-slate-400">{date.toLocaleTimeString()}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "admin_email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-white/5"
          >
            Admin
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        return <span className="text-sm text-white">{row.original.admin_email}</span>;
      },
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.original.action;
        // Color-code by action type
        const variant = action.includes("delete")
          ? "destructive"
          : action.includes("create") || action.includes("approve")
          ? "default"
          : "secondary";
        return (
          <Badge variant={variant} className="font-mono text-xs">
            {action}
          </Badge>
        );
      },
    },
    {
      accessorKey: "resource_type",
      header: "Resource",
      cell: ({ row }) => {
        return (
          <span className="text-sm text-slate-300">{row.original.resource_type}</span>
        );
      },
    },
    {
      accessorKey: "resource_id",
      header: "Resource ID",
      cell: ({ row }) => {
        const id = row.original.resource_id;
        // Truncate long IDs
        const displayId = id.length > 12 ? `${id.slice(0, 12)}...` : id;
        return (
          <code className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
            {displayId}
          </code>
        );
      },
    },
    {
      accessorKey: "request_method",
      header: "Method",
      cell: ({ row }) => {
        const method = row.original.request_method;
        const colorClass =
          method === "POST"
            ? "text-green-400"
            : method === "PATCH" || method === "PUT"
            ? "text-yellow-400"
            : method === "DELETE"
            ? "text-red-400"
            : "text-slate-400";
        return (
          <span className={`text-xs font-semibold ${colorClass}`}>{method}</span>
        );
      },
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => {
        const isExpanded = expandedRows.has(row.original.id);
        const hasPayload = row.original.payload && Object.keys(row.original.payload).length > 0;
        
        if (!hasPayload && !row.original.client_ip && !row.original.user_agent) {
          return <span className="text-xs text-slate-500">No details</span>;
        }

        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => toggleRow(row.original.id)}
          >
            {isExpanded ? "Hide" : "Show"}
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: logs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-white/10 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-slate-400">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-400">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isExpanded = expandedRows.has(row.original.id);
                return (
                  <Fragment key={row.id}>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="border-white/10 bg-slate-800/30">
                        <TableCell colSpan={columns.length} className="p-4">
                          <div className="space-y-2 text-sm">{/* Request Path */}
                            <div>
                              <span className="text-slate-400">Path:</span>{" "}
                              <code className="text-cyan-400 bg-slate-800/50 px-2 py-1 rounded">
                                {row.original.request_path}
                              </code>
                            </div>

                            {/* Client IP */}
                            {row.original.client_ip && (
                              <div>
                                <span className="text-slate-400">IP:</span>{" "}
                                <code className="text-slate-300">{row.original.client_ip}</code>
                              </div>
                            )}

                            {/* User Agent */}
                            {row.original.user_agent && (
                              <div>
                                <span className="text-slate-400">User Agent:</span>{" "}
                                <span className="text-slate-300 text-xs">{row.original.user_agent}</span>
                              </div>
                            )}

                            {/* Payload */}
                            {row.original.payload && Object.keys(row.original.payload).length > 0 && (
                              <div>
                                <span className="text-slate-400 block mb-1">Payload:</span>
                                <pre className="bg-slate-900/50 p-3 rounded-lg overflow-x-auto text-xs text-slate-300">
                                  {JSON.stringify(row.original.payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(0);
            }}
            className="rounded-md border border-white/10 bg-slate-800/50 px-2 py-1 text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            Page {page + 1} of {totalPages || 1}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="border-white/10 hover:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="border-white/10 hover:bg-white/5"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

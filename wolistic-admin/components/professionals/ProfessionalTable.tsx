"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowUpDown, Eye, CheckCircle, Ban, Crown, Shield } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Professional } from "@/types/admin";

interface ProfessionalTableProps {
  professionals: Professional[];
  loading: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onApprove: (userId: string) => void;
  onSuspend: (userId: string) => void;
  onUpdateTier: (userId: string, tier: string) => void;
  onViewDetails: (userId: string) => void;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function ProfessionalTable({
  professionals,
  loading,
  selectedIds,
  onSelectionChange,
  onApprove,
  onSuspend,
  onUpdateTier,
  onViewDetails,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: ProfessionalTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Professional>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            if (value) {
              onSelectionChange(new Set(professionals.map((p) => p.id)));
            } else {
              onSelectionChange(new Set());
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={(value) => {
            const newSet = new Set(selectedIds);
            if (value) {
              newSet.add(row.original.id);
            } else {
              newSet.delete(row.original.id);
            }
            onSelectionChange(newSet);
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-white/5"
          >
            Email
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
        const email = row.original.email;
        const name = row.original.full_name;
        return (
          <div>
            <div className="font-medium text-white">{name || email}</div>
            {name && <div className="text-sm text-slate-400">{email}</div>}
          </div>
        );
      },
    },
    {
      accessorKey: "user_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.user_status || "pending";
        const variant =
          status === "approved"
            ? "default"
            : status === "pending"
            ? "secondary"
            : "destructive";
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      accessorKey: "profile.membership_tier",
      header: "Tier",
      cell: ({ row }) => {
        const tier = row.original.profile?.membership_tier || "free";
        const isAdminUpgraded = row.original.profile?.is_admin_upgraded || false;
        const color =
          tier === "celeb"
            ? "text-amber-400"
            : tier === "elite"
            ? "text-emerald-400"
            : tier === "pro"
            ? "text-cyan-400"
            : "text-slate-400";
        return (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${color}`}>
              {tier !== "free" && <Crown className="h-3.5 w-3.5" />}
              <span className="capitalize">{tier}</span>
            </div>
            {isAdminUpgraded && (
              <Badge
                variant="outline"
                className="border-purple-500/50 bg-purple-950/30 text-purple-300 text-[10px] px-1.5 py-0 h-5 gap-1"
              >
                <Shield className="h-2.5 w-2.5" />
                Admin
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "profile.profile_completeness",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-white/5"
          >
            Completeness
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
        const completeness = row.original.profile?.profile_completeness || 0;
        const color =
          completeness >= 90
            ? "text-emerald-400"
            : completeness >= 70
            ? "text-cyan-400"
            : completeness >= 50
            ? "text-amber-400"
            : "text-red-400";
        return <span className={color}>{completeness}%</span>;
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-white/5"
          >
            Joined
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
          <span className="text-slate-300">
            {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const professional = row.original;
        const isPending = !professional.user_status || professional.user_status === "pending";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onViewDetails(professional.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {isPending && (
                <DropdownMenuItem onClick={() => onApprove(professional.id)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-400" />
                  Approve
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => onSuspend(professional.id)}>
                <Ban className="mr-2 h-4 w-4 text-red-400" />
                Suspend
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Change Tier</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={() => onUpdateTier(professional.id, "free")}>
                Free
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateTier(professional.id, "pro")}>
                Pro (₹999/mo)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateTier(professional.id, "elite")}>
                Elite (₹2,499/mo)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateTier(professional.id, "celeb")}>
                Celeb (₹9,999/mo)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: professionals,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-white/10 hover:bg-white/5">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-slate-300">
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <span className="text-slate-400">Loading...</span>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={selectedIds.has(row.original.id) && "selected"}
                  className="border-white/10 hover:bg-white/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-slate-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <span className="text-slate-400">No professionals found.</span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} professionals
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
          >
            Previous
          </Button>
          <div className="text-sm text-slate-300">
            Page {page + 1} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

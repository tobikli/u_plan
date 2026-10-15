"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowHref?: (row: TData) => string | undefined;
}

export function CourseTable<TData, TValue>({
  columns,
  data,
  getRowHref,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-w-0 overflow-hidden border-t">
      <Table>
        <TableHeader className="bg-muted/25 [&_th]:px-5 [&_th]:text-[11px] [&_th]:font-medium [&_th]:text-muted-foreground">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                role={getRowHref ? "link" : undefined}
                tabIndex={getRowHref ? 0 : undefined}
                className={
                  getRowHref
                    ? "cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&_td]:px-5 [&_td]:py-4"
                    : "[&_td]:px-5 [&_td]:py-4"
                }
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("a, button, input"))
                    return;
                  const href = getRowHref?.(row.original);
                  if (href) router.push(href);
                }}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (!getRowHref) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    const href = getRowHref(row.original);
                    if (href) router.push(href);
                  }
                }}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-40 text-center">
                <p className="font-medium">No matching courses</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a different name, code, program, or tag, or reset your
                  search.
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

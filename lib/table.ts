// TanStack v9 supplies the v8 API through its supported legacy entry point.
export {
  useLegacyTable as useReactTable,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type LegacyColumnDef as ColumnDef,
  type LegacyRow as Row,
} from "@tanstack/react-table/legacy";
export {
  flexRender,
  type ColumnFiltersState,
  type SortingState,
  type ColumnVisibilityState as VisibilityState,
} from "@tanstack/react-table";

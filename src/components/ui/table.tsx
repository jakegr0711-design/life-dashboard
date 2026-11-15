import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Table = ({ className, ...p }: HTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-x-auto">
    <table className={cn("w-full border-collapse text-sm", className)} {...p} />
  </div>
);
export const TableHeader = (p: HTMLAttributes<HTMLTableSectionElement>) => <thead {...p} />;
export const TableBody = (p: HTMLAttributes<HTMLTableSectionElement>) => <tbody {...p} />;
export const TableRow = ({ className, ...p }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b border-line last:border-0", className)} {...p} />
);
export const TableHead = ({ className, ...p }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("px-3 py-2.5 text-left text-xs font-semibold text-muted-fg", className)} {...p} />
);
export const TableCell = ({ className, ...p }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-3 py-3 align-top", className)} {...p} />
);

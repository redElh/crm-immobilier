import * as React from "react";
import { cn } from "../../lib/utils";

const Table = ({ className, children, ...props }: React.HTMLAttributes<HTMLTableElement>) => {
  return (
    <div className="table-container">
      <table className={cn("w-full border-collapse text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
};

const Header = ({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <thead className={cn("bg-background/50", className)} {...props}>
      {children}
    </thead>
  );
};

const Body = ({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <tbody className={cn("divide-y divide-border/40", className)} {...props}>
      {children}
    </tbody>
  );
};

const Row = ({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => {
  return (
    <tr className={cn("transition-colors hover:bg-background/50", className)} {...props}>
      {children}
    </tr>
  );
};

const Column = ({ className, children, align = "left", width, ...props }: any) => {
  const alignment = { left: "text-left", center: "text-center", right: "text-right" };

  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider first:pl-6 last:pr-6",
        alignment[align as keyof typeof alignment],
        className
      )}
      style={{ width }}
      {...props}
    >
      {children}
    </th>
  );
};

const Cell = ({ className, children, align = "left", ...props }: any) => {
  const alignment = { left: "text-left", center: "text-center", right: "text-right" };

  return (
    <td
      className={cn(
        "px-4 py-3 text-sm first:pl-6 last:pr-6",
        alignment[align as keyof typeof alignment],
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
};

Table.Header = Header;
Table.Body = Body;
Table.Row = Row;
Table.Column = Column;
Table.Cell = Cell;

export { Table };

// src/components/ui/Table.tsx
import * as React from "react";
import { cn } from "../../lib/utils";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  className?: string;
  children: React.ReactNode;
  striped?: boolean;
  hover?: boolean;
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
  children: React.ReactNode;
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string;
  children: React.ReactNode;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string;
  children: React.ReactNode;
}

interface TableColumnProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  className?: string;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string | number;
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  className?: string;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}

const Table = ({ 
  className, 
  children, 
  striped = true,
  hover = true,
  ...props 
}: TableProps) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 shadow-sm">
      <table
        className={cn(
          "w-full border-collapse text-sm",
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

const Header = ({ className, children, ...props }: TableHeaderProps) => {
  return (
    <thead
      className={cn(
        "bg-white/5 text-left font-medium text-b/80",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
};

const Body = ({ className, children, ...props }: TableBodyProps) => {
  return (
    <tbody
      className={cn(
        "divide-y divide-white/5",
        className
      )}
      {...props}
    >
      {children}
    </tbody>
  );
};

const Row = ({ 
  className, 
  children, 
  ...props 
}: TableRowProps) => {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-white/5",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

const Column = ({
  className,
  children,
  align = "left",
  width,
  ...props
}: TableColumnProps) => {
  const alignment = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 font-medium first:pl-6 last:pr-6",
        alignment[align],
        className
      )}
      style={{ width }}
      {...props}
    >
      {children}
    </th>
  );
};

const Cell = ({
  className,
  children,
  align = "left",
  ...props
}: TableCellProps) => {
  const alignment = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <td
      className={cn(
        "px-4 py-3 first:pl-6 last:pr-6",
        alignment[align],
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
};

// Assign subcomponents to Table
Table.Header = Header;
Table.Body = Body;
Table.Row = Row;
Table.Column = Column;
Table.Cell = Cell;

export { Table };
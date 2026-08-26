"use client";

import { useState } from "react";

const LIMIT = 5;

function ToggleButton({ open, hiddenCount, onClick, more, less }: { open: boolean; hiddenCount: number; onClick: () => void; more: string; less: string }) {
  return (
    <button type="button" onClick={onClick} className="text-petrol-700 font-semibold text-[0.85rem] hover:underline">
      {open ? less : `${more} (${hiddenCount})`}
    </button>
  );
}

/** Corpo di tabella che si accorcia: mostra i primi 5 elementi, il resto si apre a richiesta. */
export function ExpandableTableBody({
  total, colSpan, more, less, summaryRow, children,
}: {
  total: number;
  colSpan: number;
  more: string;
  less: string;
  /** Riga di totale/riepilogo, sempre visibile, esclusa dal conteggio che si accorcia. */
  summaryRow?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const collapsible = total > LIMIT;
  return (
    <>
      <tbody className={collapsible && !open ? "list-collapsed" : ""}>{children}</tbody>
      {(collapsible || summaryRow) && (
        <tfoot>
          {collapsible && (
            <tr>
              <td colSpan={colSpan} className="px-6 py-3 border-t border-[#e9eff1]">
                <ToggleButton open={open} hiddenCount={total - LIMIT} onClick={() => setOpen((o) => !o)} more={more} less={less} />
              </td>
            </tr>
          )}
          {summaryRow}
        </tfoot>
      )}
    </>
  );
}

/** Lista o griglia che si accorcia allo stesso modo, per contenitori non tabellari. */
export function ExpandableList({
  total, more, less, className = "", tag = "div", children,
}: {
  total: number;
  more: string;
  less: string;
  className?: string;
  tag?: "div" | "ol" | "ul";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const collapsible = total > LIMIT;
  const Tag = tag;
  return (
    <>
      <Tag className={`${className} ${collapsible && !open ? "list-collapsed" : ""}`}>{children}</Tag>
      {collapsible && (
        <div className="px-6 py-3 border-t border-[#e9eff1]">
          <ToggleButton open={open} hiddenCount={total - LIMIT} onClick={() => setOpen((o) => !o)} more={more} less={less} />
        </div>
      )}
    </>
  );
}

"use client";

export default function PrintButton({ label = "🖨 Drucken / PDF" }: { label?: string }) {
  return (
    <button className="btn" type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}

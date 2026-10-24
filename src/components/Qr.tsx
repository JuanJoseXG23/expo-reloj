import { QRCodeSVG } from 'qrcode.react';

/** Enlace de entrada para los estudiantes (la raíz del sitio). */
export function joinUrl(): string {
  return `${window.location.origin}${window.location.pathname}#/`;
}

export function JoinQr({ size = 280 }: { size?: number }) {
  const url = joinUrl();
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-3xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
        <QRCodeSVG value={url} size={size} fgColor="#1F3A5F" level="M" marginSize={0} />
      </div>
      <div className="max-w-full break-all rounded-xl bg-white/70 px-3 py-1 font-mono text-sm font-bold text-navy">{url}</div>
    </div>
  );
}

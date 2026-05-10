import Link from "next/link";
import { formatUsd, getProductById } from "../../lib/catalog";

export type SummaryLine = { productId: string; quantity: number };

export function OrderSummary({
  lines,
  subtotalUsd,
  totalUsd,
  compact = false,
}: {
  lines: SummaryLine[];
  subtotalUsd: number;
  totalUsd: number;
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-white">Resumen del pedido</div>
          <div className="mt-1 text-xs font-semibold text-white/60">
            Entrega automatica despues de confirmar el pago.
          </div>
        </div>
        {!compact && (
          <Link className="text-xs font-semibold text-white/70 transition hover:text-white" href="/cart">
            Editar carrito
          </Link>
        )}
      </div>

      {lines.length > 0 ? (
        <div className="mt-5 space-y-3">
          {lines.map((line) => {
            const product = getProductById(line.productId);
            if (!product) return null;
            return (
              <div
                key={line.productId}
                className="flex items-start justify-between gap-3 rounded-md border border-white/10 bg-black/25 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-black text-white">{product.name}</div>
                  <div className="mt-0.5 text-xs font-semibold text-white/60">
                    Cantidad {line.quantity}
                  </div>
                </div>
                <div className="text-sm font-black text-white">
                  {formatUsd(product.priceUsd * line.quantity)}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-sm font-semibold text-white/70">
          <span>Subtotal</span>
          <span className="font-black text-white">{formatUsd(subtotalUsd)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-semibold text-white/70">
          <span>Cargos extra</span>
          <span className="font-black text-white">{formatUsd(0)}</span>
        </div>
        <div className="h-px bg-white/10" />
        <div className="flex items-center justify-between text-sm font-semibold text-white/70">
          <span>Total</span>
          <span className="text-lg font-black text-white">{formatUsd(totalUsd)}</span>
        </div>
      </div>
    </div>
  );
}

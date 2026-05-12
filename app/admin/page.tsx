import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { CartItem } from "../lib/storeTypes";
import { formatUsd, getProductById } from "../lib/catalog";
import { hasAdminSession, isAdminAuthConfigured } from "../server/adminAuth";
import {
  getAdminDashboard,
  type AdminOrderStatusFilter,
  type AdminPaymentProviderFilter,
} from "../server/repositories/adminRepository";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asStatus(value: string | undefined): AdminOrderStatusFilter {
  return value === "pending" || value === "paid" || value === "failed" ? value : "all";
}

function asProvider(value: string | undefined): AdminPaymentProviderFilter {
  return value === "paypal" || value === "mercadopago" ? value : "all";
}

function asPage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function formatDate(value: Date | null) {
  if (!value) return "No registrado";
  return new Intl.DateTimeFormat("es-UY", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Montevideo",
  }).format(value);
}

function statusLabel(status: string) {
  if (status === "paid") return "Pagado";
  if (status === "failed") return "Fallido";
  if (status === "delivered") return "Entregado";
  if (status === "pending") return "Pendiente";
  return status;
}

function statusClass(status: string) {
  if (status === "paid" || status === "delivered") {
    return "border-emerald-300/25 bg-emerald-400/12 text-emerald-100";
  }
  if (status === "failed") {
    return "border-red-300/25 bg-red-400/12 text-red-100";
  }
  return "border-amber-300/25 bg-amber-400/12 text-amber-100";
}

function parseItems(value: unknown): CartItem[] {
  return Array.isArray(value)
    ? value
        .map((item) => ({
          productId: typeof item?.productId === "string" ? item.productId : "",
          quantity: typeof item?.quantity === "number" ? item.quantity : 0,
        }))
        .filter((item) => item.productId && item.quantity > 0)
    : [];
}

function metadataPreview(value: unknown) {
  if (!value || typeof value !== "object") return "Sin metadata";
  return JSON.stringify(value);
}

function pageHref(page: number, filters: { status: string; provider: string; query: string }) {
  const params = new URLSearchParams();
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.provider !== "all") params.set("provider", filters.provider);
  if (filters.query) params.set("q", filters.query);
  params.set("page", String(page));
  return `/admin?${params.toString()}`;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!isAdminAuthConfigured()) {
    redirect("/admin/login?setup=missing");
  }
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }

  const query = await searchParams;
  const filters = {
    status: asStatus(first(query.status)),
    provider: asProvider(first(query.provider)),
    query: (first(query.q) ?? "").trim().slice(0, 120),
    page: asPage(first(query.page)),
  };
  const dashboard = await getAdminDashboard(filters);

  return (
    <main className="min-h-screen bg-[#07080b] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase text-emerald-200">BrotherSPvP Admin</div>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Pagos y entregas</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
              Historial real desde PostgreSQL: ordenes, referencias de pago, email/IP cuando el proveedor lo informa, estado RCON y logs de entrega.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/">
              Ver tienda
            </Link>
            <form action="/admin/logout" method="post">
              <button className="mc-button h-10 px-4 text-sm" type="submit">
                Salir
              </button>
            </form>
          </div>
        </header>

        <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Metric label="Total ordenes" value={String(dashboard.summary.totalCount)} />
          <Metric label="Pagadas" value={String(dashboard.summary.paidCount)} tone="emerald" />
          <Metric label="Pendientes" value={String(dashboard.summary.pendingCount)} tone="amber" />
          <Metric label="Fallidas" value={String(dashboard.summary.failedCount)} tone="red" />
          <Metric label="Ingresos pagados" value={formatUsd(dashboard.summary.paidTotalUsd)} tone="emerald" />
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
            <div className="text-xs font-black uppercase text-white/55">Por metodo</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {dashboard.summary.providerTotals.length ? (
                dashboard.summary.providerTotals.map((row) => (
                  <div key={row.provider} className="rounded-md border border-white/10 bg-black/25 px-3 py-3">
                    <div className="text-sm font-black uppercase">{row.provider}</div>
                    <div className="mt-1 text-xs text-white/60">
                      {row.count} pagos, {formatUsd(row.totalUsd)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/55">Sin pagos confirmados.</div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
            <div className="text-xs font-black uppercase text-white/55">Entregas RCON</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {dashboard.summary.deliveryCounts.length ? (
                dashboard.summary.deliveryCounts.map((row) => (
                  <div key={row.status} className={`rounded-md border px-3 py-3 ${statusClass(row.status)}`}>
                    <div className="text-sm font-black">{statusLabel(row.status)}</div>
                    <div className="mt-1 text-xs opacity-80">{row.count} tareas</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/55">Sin entregas registradas.</div>
              )}
            </div>
          </div>
        </section>

        <form className="mt-6 grid gap-3 rounded-lg border border-white/10 bg-white/[0.055] p-4 lg:grid-cols-[1fr_12rem_12rem_auto]" method="get">
          <input
            className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none placeholder:text-white/35"
            name="q"
            placeholder="Buscar por orden, usuario, email, IP o payment ID"
            defaultValue={filters.query}
          />
          <select className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white" name="status" defaultValue={filters.status}>
            <option value="all">Todos los estados</option>
            <option value="paid">Pagados</option>
            <option value="pending">Pendientes</option>
            <option value="failed">Fallidos</option>
          </select>
          <select className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white" name="provider" defaultValue={filters.provider}>
            <option value="all">Todos los metodos</option>
            <option value="paypal">PayPal</option>
            <option value="mercadopago">Mercado Pago</option>
          </select>
          <button className="mc-button h-11 px-5 text-sm" type="submit">
            Filtrar
          </button>
        </form>

        <section className="mt-5 grid gap-4">
          {dashboard.orders.length ? (
            dashboard.orders.map((order) => {
              const items = parseItems(order.items);
              return (
                <article key={order.id} className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
                  <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md border px-2.5 py-1 text-xs font-black ${statusClass(order.status)}`}>
                          {statusLabel(order.status)}
                        </span>
                        <span className="rounded-md border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-black uppercase text-white/75">
                          {order.gateway}
                        </span>
                      </div>
                      <h2 className="mt-3 break-all text-xl font-black">{order.id}</h2>
                      <div className="mt-2 text-sm text-white/60">
                        Creada: {formatDate(order.createdAt)} | Pagada: {formatDate(order.paidAt)}
                      </div>
                    </div>
                    <div className="rounded-md border border-white/10 bg-black/30 px-4 py-3 text-left lg:text-right">
                      <div className="text-xs font-black uppercase text-white/50">Monto</div>
                      <div className="text-xl font-black">{formatUsd(Number(order.total))}</div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    <InfoPanel title="Comprador">
                      <InfoLine label="Jugador" value={order.username} strong />
                      <InfoLine label="Email" value={order.payerEmail ?? "No informado por proveedor"} />
                      <InfoLine label="Nombre pagador" value={order.payerName ?? "No informado"} />
                      <InfoLine label="Payer ID" value={order.payerId ?? "No informado"} />
                      <InfoLine label="Estado proveedor" value={order.providerStatus ?? "No informado"} />
                    </InfoPanel>

                    <InfoPanel title="Evidencia tecnica">
                      <InfoLine label="IP checkout" value={order.clientIp ?? "No registrada"} />
                      <InfoLine label="IP hash" value={order.clientIpHash ?? "No registrado"} mono />
                      <InfoLine label="Request ID" value={order.checkoutRequestId ?? "No registrado"} mono />
                      <InfoLine label="User agent" value={order.userAgent ?? "No registrado"} />
                    </InfoPanel>

                    <InfoPanel title="Items comprados">
                      {items.length ? (
                        items.map((item) => {
                          const product = getProductById(item.productId);
                          return (
                            <InfoLine
                              key={`${order.id}-${item.productId}`}
                              label={`x${item.quantity}`}
                              value={product ? product.name : item.productId}
                              strong
                            />
                          );
                        })
                      ) : (
                        <InfoLine label="Items" value="Sin items parseables" />
                      )}
                    </InfoPanel>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    <InfoPanel title="Referencias de pago">
                      {order.paymentReferences.length ? (
                        order.paymentReferences.map((ref) => (
                          <div key={ref.id} className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                            <div className="text-xs font-black uppercase text-white/45">{ref.provider}</div>
                            <div className="mt-1 break-all font-mono text-xs text-white/80">{ref.providerPaymentId}</div>
                            <div className="mt-1 text-xs text-white/45">{formatDate(ref.createdAt)}</div>
                          </div>
                        ))
                      ) : (
                        <InfoLine label="Pago" value="Sin referencia aun" />
                      )}
                    </InfoPanel>

                    <InfoPanel title="Historial de pago">
                      {order.paymentStatusHistory.length ? (
                        order.paymentStatusHistory.map((entry) => (
                          <div key={entry.id} className={`rounded-md border px-3 py-2 ${statusClass(entry.status)}`}>
                            <div className="text-xs font-black">{statusLabel(entry.status)}</div>
                            <div className="mt-1 text-xs opacity-80">{formatDate(entry.createdAt)}</div>
                            <div className="mt-1 break-all font-mono text-[11px] opacity-80">
                              {entry.paymentId ?? "sin payment id"}
                            </div>
                            <div className="mt-1 break-all text-[11px] opacity-70">
                              {metadataPreview(entry.metadata)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <InfoLine label="Estado" value="Sin historial" />
                      )}
                    </InfoPanel>

                    <InfoPanel title="Entregado al jugador">
                      {order.deliveryTasks.length ? (
                        order.deliveryTasks.map((task) => (
                          <div key={task.id} className={`rounded-md border px-3 py-2 ${statusClass(task.status)}`}>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-black">{statusLabel(task.status)}</span>
                              <span className="text-[11px] opacity-75">Intentos: {task.retryCount}</span>
                            </div>
                            <div className="mt-2 break-all font-mono text-[11px] leading-5 opacity-90">
                              {task.command}
                            </div>
                            {task.lastError ? (
                              <div className="mt-2 break-all text-[11px] text-red-100">Error: {task.lastError}</div>
                            ) : null}
                            {task.logs.length ? (
                              <div className="mt-2 grid gap-1 border-t border-white/10 pt-2">
                                {task.logs.map((log) => (
                                  <div key={log.id} className="text-[11px] leading-5 opacity-75">
                                    {formatDate(log.createdAt)} | {log.message}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <InfoLine label="Entrega" value="Sin tareas de entrega aun" />
                      )}
                    </InfoPanel>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.055] p-8 text-center text-sm text-white/60">
              No hay pagos con esos filtros.
            </div>
          )}
        </section>

        <nav className="mt-6 flex items-center justify-between gap-3 text-sm">
          <Link
            className={`rounded-md border border-white/10 px-4 py-2 font-bold ${dashboard.pagination.page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-white/10"}`}
            href={pageHref(Math.max(1, dashboard.pagination.page - 1), filters)}
          >
            Anterior
          </Link>
          <div className="text-white/55">
            Pagina {dashboard.pagination.page} de {dashboard.pagination.totalPages} | {dashboard.pagination.filteredCount} resultados
          </div>
          <Link
            className={`rounded-md border border-white/10 px-4 py-2 font-bold ${dashboard.pagination.page >= dashboard.pagination.totalPages ? "pointer-events-none opacity-40" : "hover:bg-white/10"}`}
            href={pageHref(Math.min(dashboard.pagination.totalPages, dashboard.pagination.page + 1), filters)}
          >
            Siguiente
          </Link>
        </nav>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "emerald" | "amber" | "red";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-200"
      : tone === "amber"
        ? "text-amber-200"
        : tone === "red"
          ? "text-red-200"
          : "text-white";

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
      <div className="text-xs font-black uppercase text-white/45">{label}</div>
      <div className={`mt-2 text-2xl font-black ${toneClass}`}>{value}</div>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="text-xs font-black uppercase text-white/45">{title}</div>
      <div className="mt-3 grid gap-2">{children}</div>
    </section>
  );
}

function InfoLine({
  label,
  value,
  strong = false,
  mono = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 rounded-md border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[11px] font-black uppercase text-white/40">{label}</div>
      <div className={`break-all text-sm ${strong ? "font-black text-white" : "font-semibold text-white/75"} ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </div>
    </div>
  );
}

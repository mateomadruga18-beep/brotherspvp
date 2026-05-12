import { redirect } from "next/navigation";
import { hasAdminSession, isAdminAuthConfigured } from "../../server/adminAuth";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  const query = await searchParams;
  const error = first(query.error);
  const setup = first(query.setup);
  const configured = isAdminAuthConfigured();

  return (
    <main className="min-h-screen bg-[#07080b] px-4 py-12 text-white">
      <section className="mx-auto max-w-md rounded-lg border border-white/10 bg-white/[0.065] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
        <div className="text-xs font-black uppercase text-emerald-200">BrotherSPvP Admin</div>
        <h1 className="mt-3 text-3xl font-black">Panel privado</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">
          Ingresa la contraseña configurada en el servidor para ver pagos, compradores y entregas.
        </p>

        {!configured || setup === "missing" ? (
          <div className="mt-5 rounded-md border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-semibold leading-6 text-amber-100">
            Falta configurar <span className="font-black">ADMIN_PASSWORD</span> en el entorno.
          </div>
        ) : null}

        {error === "invalid" ? (
          <div className="mt-5 rounded-md border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">
            Contraseña incorrecta.
          </div>
        ) : null}

        <form className="mt-6 grid gap-4" action="/admin/session" method="post">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase text-white/55">Contraseña</span>
            <input
              className="h-12 rounded-md border border-white/10 bg-black/35 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/50"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={!configured}
            />
          </label>

          <button className="mc-button h-12" type="submit" disabled={!configured}>
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}

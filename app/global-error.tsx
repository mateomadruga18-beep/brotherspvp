"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isProduction = process.env.NODE_ENV === "production";
  const message = isProduction
    ? "La tienda tuvo un error inesperado. Intenta nuevamente."
    : error.message;

  return (
    <html lang="es">
      <body className="min-h-screen bg-neutral-950 text-white">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
          <div className="rounded-lg border border-white/10 bg-white/5 p-8">
            <h1 className="text-2xl font-black">Error de la tienda</h1>
            <p className="mt-3 text-sm font-medium text-white/70">{message}</p>
            {!isProduction && error.digest ? (
              <p className="mt-2 text-xs text-white/45">Digest: {error.digest}</p>
            ) : null}
            <button
              type="button"
              className="mc-button mt-6"
              onClick={() => reset()}
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

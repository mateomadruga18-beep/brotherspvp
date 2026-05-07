import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="animated-bg" aria-hidden="true">
        <div className="bg-grid" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/5">
              <span className="text-lg font-black tracking-tight">⛏</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-wide text-white">
                BrotherSPvP
              </div>
              <div className="text-xs text-white/60">store.brotherspvp.gg</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-white/70 md:flex">
            <Link className="transition hover:text-white" href="/ranks">
              Ranks
            </Link>
            <Link className="transition hover:text-white" href="/crates">
              Crates
            </Link>
            <Link className="transition hover:text-white" href="/coins">
              Coins
            </Link>
            <Link className="transition hover:text-white" href="/cart">
              Cart
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/cart">
              Cart
            </Link>
            <Link className="mc-button h-10 px-4 text-sm" href="/store">
              Open store
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative">
          <div className="container py-16 sm:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Online perks, instant delivery, safe checkout
                </div>

                <h1 className="mt-6 text-balance text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl">
                  Upgrade your server experience with{" "}
                  <span className="bg-gradient-to-r from-violet-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                    VIP ranks
                  </span>
                  , crates, and coins.
                </h1>

                <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-white/70 sm:text-lg">
                  A modern storefront inspired by the best Minecraft networks:
                  clean UI, beautiful gradients, and snappy hover animations —
                  built with Next.js + Tailwind.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link className="mc-button w-full sm:w-auto" href="/ranks">
                    Browse VIP ranks
                  </Link>
                  <Link
                    className="mc-button mc-button-secondary w-full sm:w-auto"
                    href="/crates"
                  >
                    View crates
                  </Link>
                  <Link className="mc-button mc-button-ghost w-full sm:w-auto" href="/coins">
                    Buy coins
                  </Link>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="glass rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-white/20">
                    <div className="text-xs font-semibold text-white/60">
                      Delivery
                    </div>
                    <div className="mt-1 text-sm font-bold text-white">
                      Instant
                    </div>
                  </div>
                  <div className="glass rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-white/20">
                    <div className="text-xs font-semibold text-white/60">
                      Support
                    </div>
                    <div className="mt-1 text-sm font-bold text-white">
                      24/7 tickets
                    </div>
                  </div>
                  <div className="glass rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-white/20">
                    <div className="text-xs font-semibold text-white/60">
                      Payments
                    </div>
                    <div className="mt-1 text-sm font-bold text-white">
                      Secure
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative">
                  <div
                    className="absolute -inset-8 rounded-[2.25rem] opacity-90 blur-2xl"
                    style={{
                      background:
                        "radial-gradient(60% 60% at 50% 40%, rgba(168,85,247,.35), rgba(59,130,246,.18), rgba(16,185,129,.10), transparent 70%)",
                    }}
                  />

                  <div className="glass relative overflow-hidden rounded-[2rem] p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-white/60">
                          Featured bundle
                        </div>
                        <div className="mt-1 text-xl font-black tracking-tight text-white">
                          VIP+
                          <span className="ml-2 text-sm font-semibold text-white/60">
                            (best value)
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                        <div className="text-[11px] font-semibold text-white/60">
                          From
                        </div>
                        <div className="text-lg font-black text-white">$9.99</div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3">
                      {[
                        "Priority queue + join fast",
                        "Rank tag + chat cosmetics",
                        "Monthly crate key bonus",
                        "Extra homes + /craft access",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <span className="mt-0.5 inline-grid size-6 place-items-center rounded-md bg-emerald-400/15 text-emerald-200">
                            ✓
                          </span>
                          <div className="text-sm font-semibold text-white/80">
                            {item}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <Link className="mc-button w-full" href="/ranks">
                        Buy VIP+
                      </Link>
                      <Link className="mc-button mc-button-ghost w-full" href="/store">
                        More deals
                      </Link>
                    </div>

                    <div className="mt-6 text-xs text-white/55">
                      Purchases are applied automatically to your account after
                      checkout.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="vips" className="container py-14 sm:py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                VIP ranks
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                Stand out with cosmetic perks, quality-of-life commands, and
                monthly bonuses. Hover cards for a smooth, premium feel.
              </p>
            </div>
            <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/ranks">
              See ranks
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              {
                name: "VIP",
                price: "$4.99",
                tone: "from-amber-300/25 via-orange-300/15 to-transparent",
                bullets: ["+2 homes", "Colored chat", "Daily coin bonus"],
                cta: "Get VIP",
                ctaClass: "mc-button-ghost",
              },
              {
                name: "VIP+",
                price: "$9.99",
                tone: "from-violet-300/25 via-sky-300/15 to-transparent",
                bullets: ["Queue priority", "+6 homes", "Monthly crate key"],
                cta: "Get VIP+",
                ctaClass: "",
              },
              {
                name: "MVP",
                price: "$19.99",
                tone: "from-emerald-300/25 via-cyan-300/15 to-transparent",
                bullets: ["Exclusive cosmetics", "+12 homes", "2 monthly keys"],
                cta: "Get MVP",
                ctaClass: "mc-button-secondary",
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className="group glass relative overflow-hidden rounded-3xl p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tier.tone} opacity-0 transition duration-300 group-hover:opacity-100`}
                />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-white/60">
                      Rank
                    </div>
                    <div className="mt-1 text-2xl font-black tracking-tight text-white">
                      {tier.name}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                    <div className="text-[11px] font-semibold text-white/60">
                      Price
                    </div>
                    <div className="text-lg font-black text-white">
                      {tier.price}
                    </div>
                  </div>
                </div>

                <div className="relative mt-6 space-y-3">
                  {tier.bullets.map((b) => (
                    <div
                      key={b}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span className="inline-grid size-6 place-items-center rounded-md bg-white/10 text-white/80">
                        ✦
                      </span>
                      <div className="text-sm font-semibold text-white/80">
                        {b}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative mt-6">
                  <Link className={`mc-button w-full ${tier.ctaClass}`} href="/cart">
                    {tier.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="crates" className="container py-14 sm:py-16">
          <div className="glass overflow-hidden rounded-3xl">
            <div className="grid gap-0 lg:grid-cols-12">
              <div className="relative p-7 sm:p-10 lg:col-span-5">
                <div
                  className="absolute inset-0 opacity-90"
                  style={{
                    background:
                      "radial-gradient(80% 60% at 35% 20%, rgba(99,102,241,.25), transparent 60%), radial-gradient(70% 50% at 80% 60%, rgba(16,185,129,.15), transparent 60%)",
                  }}
                />
                <div className="relative">
                  <div className="text-xs font-semibold text-white/60">
                    Crates
                  </div>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Limited-time drops and rare cosmetics
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base">
                    Grab keys to unlock pets, gadgets, trails, and seasonal
                    loot. Smooth hover animations keep everything feeling
                    premium.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link className="mc-button w-full sm:w-auto" href="/crates">
                      Buy crate keys
                    </Link>
                    <Link className="mc-button mc-button-ghost w-full sm:w-auto" href="/store">
                      Browse store
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-7 sm:p-10 lg:col-span-7">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      name: "Mythic Crate",
                      desc: "Top-tier cosmetics + pets",
                      tag: "Best loot",
                      tone:
                        "from-fuchsia-400/25 via-sky-400/15 to-transparent",
                    },
                    {
                      name: "Season Crate",
                      desc: "Limited seasonal rewards",
                      tag: "Limited",
                      tone: "from-emerald-400/22 via-cyan-400/12 to-transparent",
                    },
                    {
                      name: "Classic Crate",
                      desc: "Solid mix of cosmetics",
                      tag: "Popular",
                      tone: "from-amber-400/20 via-orange-400/12 to-transparent",
                    },
                    {
                      name: "Builder Crate",
                      desc: "Particles + building flair",
                      tag: "Style",
                      tone: "from-indigo-400/22 via-violet-400/12 to-transparent",
                    },
                  ].map((c) => (
                    <Link
                      key={c.name}
                      href="/crates"
                      className="group glass relative overflow-hidden rounded-3xl p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
                    >
                      <div
                        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.tone} opacity-0 transition duration-300 group-hover:opacity-100`}
                      />
                      <div className="relative flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-white/60">
                            {c.tag}
                          </div>
                          <div className="mt-1 text-lg font-black text-white">
                            {c.name}
                          </div>
                          <div className="mt-2 text-sm font-semibold text-white/70">
                            {c.desc}
                          </div>
                        </div>
                        <div className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition group-hover:scale-105">
                          ➜
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="coins" className="container py-14 sm:py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Coins
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                Stock up for auctions, cosmetics, and in-game bundles. Simple,
                fast checkout, designed for mobile and desktop.
              </p>
            </div>
            <Link className="mc-button mc-button-ghost h-10 px-4 text-sm" href="/coins">
              See packs
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                amount: "10,000",
                price: "$3.99",
                bonus: "+0%",
                tone: "from-sky-400/22 via-indigo-400/12 to-transparent",
              },
              {
                amount: "50,000",
                price: "$14.99",
                bonus: "+10%",
                tone: "from-violet-400/22 via-fuchsia-400/12 to-transparent",
              },
              {
                amount: "150,000",
                price: "$39.99",
                bonus: "+25%",
                tone: "from-emerald-400/20 via-cyan-400/12 to-transparent",
              },
            ].map((p) => (
              <div
                key={p.amount}
                className="group glass relative overflow-hidden rounded-3xl p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${p.tone} opacity-0 transition duration-300 group-hover:opacity-100`}
                />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-white/60">
                      Coins pack
                    </div>
                    <div className="mt-1 text-2xl font-black text-white">
                      {p.amount}
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                      Bonus <span className="text-emerald-200">{p.bonus}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                    <div className="text-[11px] font-semibold text-white/60">
                      Price
                    </div>
                    <div className="text-lg font-black text-white">
                      {p.price}
                    </div>
                  </div>
                </div>

                <div className="relative mt-6">
                  <Link className="mc-button w-full" href="/coins">
                    Buy coins
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="container py-14 sm:py-16">
          <div className="glass rounded-3xl p-7 sm:p-10">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              FAQ
            </h2>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {[
                {
                  q: "How do I receive my purchase?",
                  a: "After checkout, perks apply automatically to the username you selected. Delivery is usually instant.",
                },
                {
                  q: "Are payments secure?",
                  a: "Yes. This is a frontend demo, but the UI is built to match production-grade checkout flows and trust cues.",
                },
                {
                  q: "Can I upgrade later?",
                  a: "Absolutely. Most stores support rank upgrades by paying the difference, keeping it fair and simple.",
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20"
                >
                  <div className="text-sm font-black text-white">{item.q}</div>
                  <div className="mt-2 text-sm leading-6 text-white/70">
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/20">
        <div className="container flex flex-col gap-3 py-10 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <div>
            © BrotherSPvP. Not affiliated with Mojang or Microsoft.
          </div>
          <div className="flex items-center gap-5">
            <a className="transition hover:text-white" href="#">
              Terms
            </a>
            <a className="transition hover:text-white" href="#">
              Privacy
            </a>
            <a className="transition hover:text-white" href="#">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

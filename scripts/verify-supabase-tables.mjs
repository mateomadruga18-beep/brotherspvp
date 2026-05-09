import pg from "pg";

const { Client } = pg;
const required = [
  "Order",
  "WebhookEvent",
  "PaymentReference",
  "DeliveryTask",
  "DeliveryLog",
  "PaymentStatusHistory",
  "RateLimitBucket",
];

async function main() {
  const url = process.env.DIRECT_URL;
  if (!url) throw new Error("DIRECT_URL is not set.");

  const client = new Client({ connectionString: url });
  await client.connect();
  const res = await client.query("select tablename from pg_tables where schemaname = 'public'");
  const existing = new Set(res.rows.map((r) => r.tablename));
  const report = required.map((table) => ({ table, exists: existing.has(table) }));
  console.log(JSON.stringify(report));
  await client.end();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

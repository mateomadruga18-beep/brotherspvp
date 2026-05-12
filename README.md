This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin Panel

The private payment panel is available at `/admin`.

Required environment variables:

```bash
ADMIN_PASSWORD=use_a_long_private_password
ADMIN_SESSION_SECRET=use_a_random_32_byte_secret
DELIVERY_MODE=agent
DELIVERY_AGENT_TOKEN=use_the_same_token_in_the_minecraft_plugin
```

After deploying schema changes, run:

```bash
npm run prisma:migrate
```

The panel reads orders, payment references, status history, client IP/user-agent evidence, payer email/name when the payment provider returns it, and delivery/RCON logs from PostgreSQL.

## Minecraft Delivery Plugin

For protected Minecraft servers, keep RCON private and use the Paper plugin in `minecraft-delivery-agent`.

Build it with Java 21 and Maven:

```bash
cd minecraft-delivery-agent
mvn package
```

Install `target/minecraft-delivery-agent-1.0.0.jar` in the Paper 1.21.4 `plugins` folder and set the plugin `agent-token` to the same value as `DELIVERY_AGENT_TOKEN`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

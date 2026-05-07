import { Client, Environment, LogLevel, OrdersController } from "@paypal/paypal-server-sdk";
import { env } from "../env";

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

let cached:
  | {
      client: Client;
      orders: OrdersController;
    }
  | undefined;

export function getPayPal() {
  if (cached) return cached;

  const client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: requireEnv("PAYPAL_CLIENT_ID", env.PAYPAL_CLIENT_ID),
      oAuthClientSecret: requireEnv("PAYPAL_CLIENT_SECRET", env.PAYPAL_CLIENT_SECRET),
    },
    environment:
      env.PAYPAL_ENVIRONMENT === "live" ? Environment.Production : Environment.Sandbox,
    logging: {
      logLevel: env.NODE_ENV === "production" ? LogLevel.Warn : LogLevel.Info,
    },
  });

  cached = {
    client,
    orders: new OrdersController(client),
  };

  return cached;
}


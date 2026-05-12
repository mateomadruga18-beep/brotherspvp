# BrothersPvP Delivery Agent

Paper 1.21.4 plugin for store deliveries. It keeps Minecraft protected by pulling paid delivery tasks from the Vercel store over HTTPS and running the commands inside the server console.

## Requirements

- Paper 1.21.4
- Java 21
- Maven 3.9+

## Build

```bash
mvn package
```

The plugin jar is created at:

```txt
target/minecraft-delivery-agent-1.0.0.jar
```

## Install

1. Copy the jar to the Minecraft server `plugins` folder.
2. Start the server once so `plugins/BrothersPvPDeliveryAgent/config.yml` is created.
3. Edit the config:

```yaml
store-url: "https://brotherspvp.vercel.app"
agent-token: "same_value_as_DELIVERY_AGENT_TOKEN"
agent-id: "paper-main"
poll-seconds: 5
max-tasks-per-poll: 10
request-timeout-seconds: 10
```

4. Restart the server or run:

```txt
/storeagent reload
```

## Commands

```txt
/storeagent status
/storeagent poll
/storeagent reload
```

All commands require `brotherspvp.delivery.admin` and default to operators.

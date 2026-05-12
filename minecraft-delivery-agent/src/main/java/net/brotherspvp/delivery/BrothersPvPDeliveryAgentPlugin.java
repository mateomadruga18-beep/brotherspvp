package net.brotherspvp.delivery;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public final class BrothersPvPDeliveryAgentPlugin extends JavaPlugin {
    private static final Gson GSON = new Gson();

    private final AtomicBoolean polling = new AtomicBoolean(false);
    private HttpClient httpClient;
    private BukkitTask pollTask;
    private Settings settings;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        reloadSettings();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(settings.requestTimeoutSeconds))
                .build();
        startPolling();
        getLogger().info("Delivery agent enabled. Mode: pull tasks from " + settings.storeUrl);
    }

    @Override
    public void onDisable() {
        stopPolling();
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (args.length == 0 || args[0].equalsIgnoreCase("status")) {
            sender.sendMessage("BrothersPvPDeliveryAgent store=" + settings.storeUrl
                    + " pollSeconds=" + settings.pollSeconds
                    + " tokenConfigured=" + settings.isTokenConfigured());
            return true;
        }

        if (args[0].equalsIgnoreCase("reload")) {
            reloadConfig();
            reloadSettings();
            startPolling();
            sender.sendMessage("BrothersPvPDeliveryAgent reloaded.");
            return true;
        }

        if (args[0].equalsIgnoreCase("poll")) {
            Bukkit.getScheduler().runTaskAsynchronously(this, this::pollSafely);
            sender.sendMessage("Manual poll started.");
            return true;
        }

        return false;
    }

    private void reloadSettings() {
        this.settings = Settings.from(this);
    }

    private void startPolling() {
        stopPolling();
        if (!settings.isTokenConfigured()) {
            getLogger().warning("agent-token is not configured. Delivery polling is disabled.");
            return;
        }

        long periodTicks = Math.max(20L, settings.pollSeconds * 20L);
        this.pollTask = Bukkit.getScheduler().runTaskTimerAsynchronously(
                this,
                this::pollSafely,
                40L,
                periodTicks
        );
    }

    private void stopPolling() {
        if (pollTask != null) {
            pollTask.cancel();
            pollTask = null;
        }
    }

    private void pollSafely() {
        if (!polling.compareAndSet(false, true)) {
            return;
        }

        try {
            List<DeliveryTask> tasks = fetchTasks();
            for (DeliveryTask task : tasks) {
                processTask(task);
            }
        } catch (Exception error) {
            getLogger().warning("Delivery poll failed: " + error.getMessage());
        } finally {
            polling.set(false);
        }
    }

    private List<DeliveryTask> fetchTasks() throws IOException, InterruptedException {
        URI uri = URI.create(settings.storeUrl + "/api/delivery-agent/tasks?limit=" + settings.maxTasksPerPoll);
        HttpRequest request = baseRequest(uri)
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IOException("Task fetch returned HTTP " + response.statusCode() + ": " + trim(response.body(), 240));
        }

        TasksResponse parsed = GSON.fromJson(response.body(), TasksResponse.class);
        if (parsed == null || !parsed.ok || parsed.data == null || parsed.data.tasks == null) {
            throw new IOException("Task fetch returned an invalid response.");
        }

        return parsed.data.tasks;
    }

    private void processTask(DeliveryTask task) {
        if (task == null || !isSafeCommand(task.command)) {
            reportFailed(task == null ? "unknown" : task.id, "Invalid command from delivery API.");
            return;
        }

        boolean delivered;
        try {
            delivered = dispatchConsoleCommand(task.command);
        } catch (Exception error) {
            reportFailed(task.id, "Command dispatch failed: " + error.getMessage());
            return;
        }

        if (delivered) {
            reportDelivered(task.id, "executed:" + task.command);
            getLogger().info("Delivered task " + task.id + " for " + task.username);
        } else {
            reportFailed(task.id, "Bukkit rejected command: " + task.command);
        }
    }

    private boolean dispatchConsoleCommand(String command) throws Exception {
        Future<Boolean> future = Bukkit.getScheduler().callSyncMethod(this, () ->
                Bukkit.dispatchCommand(Bukkit.getConsoleSender(), command)
        );
        return future.get(settings.requestTimeoutSeconds, TimeUnit.SECONDS);
    }

    private void reportDelivered(String taskId, String message) {
        report(taskId, "delivered", message);
    }

    private void reportFailed(String taskId, String message) {
        report(taskId, "failed", message);
    }

    private void report(String taskId, String status, String message) {
        if (taskId == null || taskId.isBlank() || taskId.equals("unknown")) {
            getLogger().warning("Could not report delivery status because task id is missing: " + message);
            return;
        }

        try {
            JsonObject body = new JsonObject();
            body.addProperty("status", status);
            body.addProperty("message", message);

            String encodedTaskId = URLEncoder.encode(taskId, StandardCharsets.UTF_8).replace("+", "%20");
            URI uri = URI.create(settings.storeUrl + "/api/delivery-agent/tasks/" + encodedTaskId);
            HttpRequest request = baseRequest(uri)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(GSON.toJson(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                getLogger().warning("Status report for task " + taskId + " returned HTTP "
                        + response.statusCode() + ": " + trim(response.body(), 240));
            }
        } catch (Exception error) {
            getLogger().warning("Could not report task " + taskId + ": " + error.getMessage());
        }
    }

    private HttpRequest.Builder baseRequest(URI uri) {
        return HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(settings.requestTimeoutSeconds))
                .header("Authorization", "Bearer " + settings.agentToken)
                .header("X-Delivery-Agent-Id", settings.agentId)
                .header("User-Agent", "BrothersPvPDeliveryAgent/1.0.0");
    }

    private static boolean isSafeCommand(String command) {
        return command != null
                && !command.isBlank()
                && command.length() <= 500
                && command.indexOf('\r') < 0
                && command.indexOf('\n') < 0
                && command.indexOf('\0') < 0;
    }

    private static String trim(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private static final class Settings {
        final String storeUrl;
        final String agentToken;
        final String agentId;
        final int pollSeconds;
        final int maxTasksPerPoll;
        final int requestTimeoutSeconds;

        private Settings(
                String storeUrl,
                String agentToken,
                String agentId,
                int pollSeconds,
                int maxTasksPerPoll,
                int requestTimeoutSeconds
        ) {
            this.storeUrl = storeUrl;
            this.agentToken = agentToken;
            this.agentId = agentId;
            this.pollSeconds = pollSeconds;
            this.maxTasksPerPoll = maxTasksPerPoll;
            this.requestTimeoutSeconds = requestTimeoutSeconds;
        }

        static Settings from(JavaPlugin plugin) {
            String storeUrl = plugin.getConfig().getString("store-url", "https://brotherspvp.vercel.app");
            String normalizedStoreUrl = storeUrl == null ? "" : storeUrl.trim().replaceAll("/+$", "");
            String agentToken = plugin.getConfig().getString("agent-token", "");
            String agentId = plugin.getConfig().getString("agent-id", "paper-main");
            int pollSeconds = Math.max(2, plugin.getConfig().getInt("poll-seconds", 5));
            int maxTasksPerPoll = Math.max(1, Math.min(plugin.getConfig().getInt("max-tasks-per-poll", 10), 25));
            int requestTimeoutSeconds = Math.max(3, plugin.getConfig().getInt("request-timeout-seconds", 10));

            return new Settings(
                    normalizedStoreUrl,
                    agentToken == null ? "" : agentToken.trim(),
                    sanitizeAgentId(agentId),
                    pollSeconds,
                    maxTasksPerPoll,
                    requestTimeoutSeconds
            );
        }

        boolean isTokenConfigured() {
            return agentToken.length() >= 32
                    && !agentToken.toLowerCase(Locale.ROOT).contains("replace_with");
        }

        private static String sanitizeAgentId(String value) {
            String normalized = value == null ? "paper-main" : value.trim();
            if (normalized.isEmpty()) {
                return "paper-main";
            }
            return normalized.replaceAll("[^A-Za-z0-9_.-]", "-");
        }
    }

    private static final class TasksResponse {
        boolean ok;
        TasksData data;
    }

    private static final class TasksData {
        List<DeliveryTask> tasks = new ArrayList<>();
    }

    private static final class DeliveryTask {
        String id;
        String orderId;
        String username;
        String command;
        int retryCount;
    }
}

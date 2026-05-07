export function validateMinecraftUsername(username: string) {
  const value = username.trim();
  if (!value) return { ok: false as const, reason: "Enter your Minecraft username." };
  if (value.length < 3 || value.length > 16) {
    return { ok: false as const, reason: "Username must be 3-16 characters." };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return {
      ok: false as const,
      reason: "Only letters, numbers, and underscore are allowed.",
    };
  }
  return { ok: true as const, value };
}

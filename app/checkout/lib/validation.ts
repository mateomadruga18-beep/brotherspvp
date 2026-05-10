export function validateMinecraftUsername(username: string) {
  const value = username.trim();
  if (!value) return { ok: false as const, reason: "Ingresa tu usuario de Minecraft." };
  if (value.length < 3 || value.length > 16) {
    return { ok: false as const, reason: "El usuario debe tener entre 3 y 16 caracteres." };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return {
      ok: false as const,
      reason: "Solo se permiten letras, numeros y guion bajo.",
    };
  }
  return { ok: true as const, value };
}

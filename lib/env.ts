export class MissingEnvError extends Error {
  constructor(public readonly envName: string) {
    super(`Missing environment variable: ${envName}`);
    this.name = "MissingEnvError";
  }
}

export function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

export function getRequiredEnv(name: string): string {
  const value = getOptionalEnv(name);

  if (!value) {
    throw new MissingEnvError(name);
  }

  return value;
}

export function getPublicSupabaseUrl(): string {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getPublicSupabaseKey(): string {
  const publishableKey = getOptionalEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (publishableKey) return publishableKey;

  const legacyAnonKey = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (legacyAnonKey) return legacyAnonKey;

  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

export function getSupabaseAdminEnv() {
  return {
    url: getOptionalEnv("SUPABASE_URL") ?? getPublicSupabaseUrl(),
    serviceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function getWhatsAppEnv() {
  return {
    accessToken: getRequiredEnv("WHATSAPP_ACCESS_TOKEN"),
    phoneNumberId: getRequiredEnv("WHATSAPP_PHONE_NUMBER_ID"),
    graphApiVersion: getOptionalEnv("WHATSAPP_GRAPH_API_VERSION") ?? "v21.0",
  };
}

export function getWhatsAppVerifyToken(): string {
  return getRequiredEnv("WHATSAPP_VERIFY_TOKEN");
}

export function getWorkerApiKey(): string {
  return getRequiredEnv("WORKER_API_KEY");
}

export function getAppBaseUrl(): string {
  return (
    getOptionalEnv("APP_BASE_URL") ??
    getOptionalEnv("NEXT_PUBLIC_APP_URL") ??
    "http://localhost:3000"
  );
}

export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof MissingEnvError) {
    return `${error.envName} ortam değişkeni eksik.`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Beklenmeyen hata oluştu.";
}

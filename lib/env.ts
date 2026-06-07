function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  whatsappVerifyToken: requireEnv("WHATSAPP_VERIFY_TOKEN"),
  whatsappAccessToken: requireEnv("WHATSAPP_ACCESS_TOKEN"),
  whatsappPhoneNumberId: requireEnv("WHATSAPP_PHONE_NUMBER_ID"),
  whatsappGraphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION ?? "v20.0",
  workerApiKey: requireEnv("WORKER_API_KEY")
};

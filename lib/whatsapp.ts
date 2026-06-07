import { getWhatsAppEnv } from "./env";

type SendTextMessageInput = {
  to: string;
  message: string;
};

type SendDocumentMessageInput = {
  to: string;
  documentUrl: string;
  filename?: string;
  caption?: string;
};

export async function sendWhatsappTextMessage(input: SendTextMessageInput) {
  const { accessToken, phoneNumberId, graphApiVersion } = getWhatsAppEnv();
  const response = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: input.to,
        type: "text",
        text: {
          preview_url: false,
          body: input.message,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`WhatsApp gönderimi başarısız oldu. HTTP ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

export async function sendWhatsappDocumentMessage(
  _input: SendDocumentMessageInput,
): Promise<never> {
  throw new Error("WhatsApp belge gönderimi henüz uygulanmadı.");
}

export type WhatsAppWebhookMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: "text";
  text: { body: string };
};

export function extractTextMessagesFromWebhook(payload: unknown): WhatsAppWebhookMessage[] {
  const root = payload as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{
            from?: unknown;
            id?: unknown;
            timestamp?: unknown;
            type?: unknown;
            text?: { body?: unknown };
          }>;
        };
      }>;
    }>;
  };

  const messages: WhatsAppWebhookMessage[] = [];

  for (const entry of root.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        if (
          message.type === "text" &&
          typeof message.from === "string" &&
          typeof message.id === "string" &&
          typeof message.text?.body === "string"
        ) {
          messages.push({
            from: message.from,
            id: message.id,
            timestamp: typeof message.timestamp === "string" ? message.timestamp : "",
            type: "text",
            text: { body: message.text.body },
          });
        }
      }
    }
  }

  return messages;
}

export { sendWhatsappTextMessage as sendWhatsAppTextMessage };

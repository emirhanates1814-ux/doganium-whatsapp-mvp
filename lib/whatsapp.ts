import { env } from "./env";

type SendTextMessageInput = {
  to: string;
  body: string;
};

export async function sendWhatsAppTextMessage(input: SendTextMessageInput) {
  const response = await fetch(`https://graph.facebook.com/${env.whatsappGraphApiVersion}/${env.whatsappPhoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.whatsappAccessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.to,
      type: "text",
      text: {
        preview_url: false,
        body: input.body
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp send failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

type WhatsAppWebhookMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body?: string };
};

export function extractTextMessagesFromWebhook(payload: unknown): WhatsAppWebhookMessage[] {
  const root = payload as any;
  const entries = root?.entry ?? [];
  const messages: WhatsAppWebhookMessage[] = [];

  for (const entry of entries) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      for (const message of value?.messages ?? []) {
        if (message?.type === "text" && message?.text?.body) {
          messages.push({
            from: message.from,
            id: message.id,
            timestamp: message.timestamp,
            type: message.type,
            text: { body: message.text.body }
          });
        }
      }
    }
  }

  return messages;
}

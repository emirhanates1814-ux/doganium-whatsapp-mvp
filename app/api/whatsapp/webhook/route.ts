import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { extractTextMessagesFromWebhook, sendWhatsAppTextMessage } from "@/lib/whatsapp";
import { parseTrafficMessage, getMissingTrafficFields } from "@/lib/traffic-parser";
import { buildMissingFieldsMessage } from "@/lib/message-templates";
import { createTrafficQuoteRequest } from "@/lib/traffic-jobs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.whatsappVerifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Webhook verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const messages = extractTextMessagesFromWebhook(payload);

  for (const message of messages) {
    const body = message.text?.body ?? "";
    const parsed = parseTrafficMessage(body);
    const missingFields = getMissingTrafficFields(parsed);
    const status = missingFields.length > 0 ? "missing_fields" : "ready_for_worker";

    await createTrafficQuoteRequest({
      customerPhone: message.from,
      whatsappMessageId: message.id,
      rawMessage: body,
      parsed,
      status,
      missingFields
    });

    if (missingFields.length > 0) {
      await sendWhatsAppTextMessage({
        to: message.from,
        body: buildMissingFieldsMessage(missingFields)
      });
    } else {
      await sendWhatsAppTextMessage({
        to: message.from,
        body: "Bilgileriniz alınmıştır. Trafik sigortası teklif çalışmanız başlatılıyor."
      });
    }
  }

  return NextResponse.json({ ok: true });
}

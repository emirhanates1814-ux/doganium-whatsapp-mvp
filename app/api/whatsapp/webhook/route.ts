import { NextRequest, NextResponse } from "next/server";
import { getSafeErrorMessage, getWhatsAppVerifyToken } from "@/lib/env";
import { buildMissingFieldsMessage } from "@/lib/message-templates";
import { createTrafficQuoteRequest, recordWhatsAppMessage } from "@/lib/traffic-jobs";
import { getMissingTrafficFields, parseTrafficMessage } from "@/lib/traffic-parser";
import { extractTextMessagesFromWebhook, sendWhatsappTextMessage } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  let verifyToken: string;

  try {
    verifyToken = getWhatsAppVerifyToken();
  } catch (error) {
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const messages = extractTextMessagesFromWebhook(payload);

    for (const message of messages) {
      const body = message.text.body;
      const parsed = parseTrafficMessage(body);
      const missingFields = getMissingTrafficFields(parsed);
      const status = missingFields.length > 0 ? "missing_fields" : "ready_for_worker";

      const requestRow = await createTrafficQuoteRequest({
        customerPhone: message.from,
        whatsappMessageId: message.id,
        rawMessage: body,
        parsed,
        status,
        missingFields,
      });

      await recordWhatsAppMessage({
        customerPhone: message.from,
        whatsappMessageId: message.id,
        direction: "incoming",
        body,
        status: "received",
        requestId: requestRow.id,
      });

      const reply =
        missingFields.length > 0
          ? buildMissingFieldsMessage(missingFields)
          : "Bilgileriniz alınmıştır. Trafik sigortası teklif çalışmanız başlatılıyor.";

      try {
        await sendWhatsappTextMessage({ to: message.from, message: reply });
        await recordWhatsAppMessage({
          customerPhone: message.from,
          direction: "outgoing",
          body: reply,
          status: "sent",
          requestId: requestRow.id,
        });
      } catch {
        await recordWhatsAppMessage({
          customerPhone: message.from,
          direction: "outgoing",
          body: reply,
          status: "send_failed",
          requestId: requestRow.id,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}

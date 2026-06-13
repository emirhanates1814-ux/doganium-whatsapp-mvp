import { NextRequest, NextResponse } from "next/server";
import { getSafeErrorMessage, getWhatsAppVerifyToken } from "@/lib/env";
import { createTrafficJob, recordWhatsAppMessage } from "@/lib/traffic-jobs";
import { parseTrafficMessage } from "@/lib/traffic-parser";
import { extractTextMessagesFromWebhook } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  let verifyToken: string;

  try {
    verifyToken = getWhatsAppVerifyToken();
  } catch (error) {
    return NextResponse.json({ ok: false, error: getSafeErrorMessage(error) }, { status: 500 });
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ ok: false, error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const messages = extractTextMessagesFromWebhook(payload);
    const results = [];

    for (const message of messages) {
      const body = message.text.body;
      const parsed = parseTrafficMessage(body);

      await recordWhatsAppMessage({
        customerPhone: message.from,
        whatsappMessageId: message.id,
        direction: "incoming",
        body,
        status: parsed.ok ? "parsed" : "missing_fields",
      });

      if (!parsed.ok) {
        results.push({
          ok: false,
          customerPhone: message.from,
          whatsappMessageId: message.id,
          error: "Traffic message is missing required fields.",
          details: {
            missingFields: parsed.missingFields ?? [],
            errors: parsed.errors ?? [],
            data: parsed.data ?? {},
          },
        });
        continue;
      }

      const created = await createTrafficJob({
        customerPhone: message.from,
        tckn: parsed.data?.tckn,
        plate: parsed.data?.plate,
        documentSerial: parsed.data?.documentSerial,
        birthDate: parsed.data?.birthDate,
        rawMessage: body,
        source: "whatsapp",
        status: "pending",
      });

      results.push({
        ok: created.ok,
        customerPhone: message.from,
        whatsappMessageId: message.id,
        data: created.ok ? created.data : undefined,
        error: created.ok ? undefined : created.error,
        details: created.ok ? undefined : created.details,
      });
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      ignored: messages.length === 0,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: getSafeErrorMessage(error) },
      { status: 500 },
    );
  }
}

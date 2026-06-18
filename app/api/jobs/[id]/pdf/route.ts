import { readFile, realpath } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getTrafficJobResult } from "@/lib/traffic-jobs";

export const runtime = "nodejs";

const runtimeRoots = [
  path.join(/*turbopackIgnore: true*/ process.cwd(), ".data"),
  path.join(/*turbopackIgnore: true*/ process.cwd(), ".downloads"),
];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const rawQuoteIndex = request.nextUrl.searchParams.get("quoteIndex") ?? "0";

  if (!/^\d+$/.test(rawQuoteIndex)) {
    return NextResponse.json({ ok: false, error: "Invalid quote index." }, { status: 400 });
  }

  const quoteIndex = Number(rawQuoteIndex);
  if (!Number.isSafeInteger(quoteIndex) || quoteIndex > 499) {
    return NextResponse.json({ ok: false, error: "Invalid quote index." }, { status: 400 });
  }

  const result = await getTrafficJobResult(id);
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }

  const quote = result.data?.quotes[quoteIndex];
  const pdfPath = quote?.pdfPath?.trim();
  if (!pdfPath) {
    return NextResponse.json({ ok: false, error: "Quote PDF not found." }, { status: 404 });
  }

  const candidatePath = path.isAbsolute(pdfPath)
    ? path.resolve(/*turbopackIgnore: true*/ pdfPath)
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), pdfPath);

  if (
    path.extname(candidatePath).toLowerCase() !== ".pdf" ||
    !runtimeRoots.some((root) => isInsideRoot(candidatePath, root))
  ) {
    return NextResponse.json({ ok: false, error: "PDF path is not allowed." }, { status: 403 });
  }

  try {
    const [resolvedPdfPath, resolvedRoots] = await Promise.all([
      realpath(/*turbopackIgnore: true*/ candidatePath),
      Promise.all(
        runtimeRoots.map((root) => realpath(/*turbopackIgnore: true*/ root).catch(() => null)),
      ),
    ]);

    if (
      path.extname(resolvedPdfPath).toLowerCase() !== ".pdf" ||
      !resolvedRoots.some((root) => root && isInsideRoot(resolvedPdfPath, root))
    ) {
      return NextResponse.json({ ok: false, error: "PDF path is not allowed." }, { status: 403 });
    }

    const pdf = await readFile(/*turbopackIgnore: true*/ resolvedPdfPath);
    const safeJobId = id.replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 80) || "quote";

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${safeJobId}-${quoteIndex + 1}.pdf"`,
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Quote PDF not found." }, { status: 404 });
  }
}

function isInsideRoot(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

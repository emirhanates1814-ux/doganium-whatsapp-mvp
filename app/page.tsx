import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: todos } = await supabase
    .from("todos")
    .select("id, name")
    .limit(10);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold text-emerald-700">Ares Sigorta Otomasyon MVP</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Doganium + WhatsApp Trafik Teklif Otomasyonu
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Bu iskelet proje; WhatsApp mesajından müşteri verisi alma, talep oluşturma,
            Doganium worker kuyruğu, PDF sonucu ve müşteriye güvenli teklif mesajı gönderme akışını içerir.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-950">1. Mesaj Al</h2>
            <p className="mt-2 text-sm text-slate-600">WhatsApp webhook gelen mesajı kaydeder ve alanları parse eder.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-950">2. Doganium Sorgula</h2>
            <p className="mt-2 text-sm text-slate-600">Windows worker pending işleri alır ve RPA adapter üzerinden çalıştırır.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-950">3. Teklif Gönder</h2>
            <p className="mt-2 text-sm text-slate-600">PDF sonucu okunur, fiyat özeti hazırlanır ve WhatsApp cevabı gönderilir.</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-950">Supabase Todos</h2>
          {todos?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {todos.map((todo) => (
                <li key={todo.id}>{todo.name}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Henüz todo kaydı yok.</p>
          )}
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Dashboard'a Git
          </Link>
        </div>
      </section>
    </main>
  );
}

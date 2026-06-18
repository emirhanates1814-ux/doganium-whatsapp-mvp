"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  Activity,
  BarChart3,
  ClipboardList,
  FileText,
  History,
  Settings,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type AppShellProps = {
  active: "dashboard" | "desktop";
  title: string;
  description: string;
  badge?: string;
  actions?: ReactNode;
  children: ReactNode;
};

const navItems = [
  { label: "Operasyon Paneli", href: "/dashboard", key: "dashboard", enabled: true, icon: BarChart3 },
  { label: "Doganium Teknik Paneli", href: "/desktop", key: "desktop", enabled: true, icon: Wrench },
  { label: "İşler", href: "#", key: "jobs", enabled: false, icon: ClipboardList },
  { label: "Sonuçlar", href: "#", key: "results", enabled: false, icon: FileText },
  { label: "Loglar", href: "#", key: "logs", enabled: false, icon: History },
  { label: "Ayarlar", href: "#", key: "settings", enabled: false, icon: Settings },
] as const;

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function AppShell({
  active,
  title,
  description,
  badge,
  actions,
  children,
}: AppShellProps) {
  return (
    <main className="ares-shell flex h-screen overflow-hidden">
      <motion.aside
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: easeOut }}
        className="ares-sidebar hidden w-[260px] shrink-0 border-r text-white shadow-2xl shadow-black/30 lg:flex lg:flex-col"
      >
        <div className="p-4">
          <div className="ares-panel rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.035 }}
                transition={{ duration: 0.16, ease: easeOut }}
                className="ares-button-primary flex size-12 items-center justify-center rounded-2xl text-base font-black shadow-lg shadow-emerald-950/40 ring-1 ring-white/20"
              >
                AS
              </motion.div>
              <div className="min-w-0">
                <p className="ares-title truncate text-base font-bold">
                  Ares Trafik Masası
                </p>
                <p className="text-xs font-medium text-emerald-100/75">Yerel teklif operasyonu</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--ares-border-strong)] bg-emerald-400/10 p-3 shadow-inner shadow-emerald-950/10">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-emerald-100/80">
                <ShieldCheck className="size-3.5" />
                Ares Yerel MVP
              </div>
              <p className="mt-1 text-xs leading-5 text-white/80">
                Trafik teklif kuyruğu, mock/manuel sonuçlar ve MFA güvenli Doganium hazırlığı.
              </p>
            </div>
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = active === item.key;

            return item.enabled ? (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.17, delay: 0.03 + index * 0.02, ease: easeOut }}
                whileHover={{ x: 2 }}
              >
                <Button
                  asChild
                  variant="ghost"
                  className={
                    isActive
                      ? "ares-button-primary relative h-11 w-full justify-start gap-3 overflow-hidden rounded-2xl px-3 text-sm font-semibold shadow-lg shadow-emerald-950/35 hover:opacity-90 hover:text-white before:absolute before:left-0 before:top-1/2 before:h-7 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-white"
                      : "h-11 w-full justify-start gap-3 rounded-2xl px-3 text-sm font-medium text-emerald-50/78 hover:bg-white/10 hover:text-white"
                  }
                >
                  <a href={item.href}>
                    <Icon className="size-4" />
                    <span className="truncate">{item.label}</span>
                  </a>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.17, delay: 0.03 + index * 0.02, ease: easeOut }}
                className="flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-emerald-50/32"
                aria-disabled="true"
              >
                <Icon className="size-4" />
                <span className="truncate">{item.label}</span>
              </motion.div>
            );
          })}
        </nav>

        <div className="shrink-0 p-3">
          <Separator className="mb-3 bg-white/10" />
          <div className="ares-panel max-h-40 overflow-hidden rounded-3xl p-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-100">
                <Activity className="size-4" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase text-emerald-100/70">
                  Sistem
                </p>
                <p className="text-sm font-semibold text-white">Yerel MVP</p>
              </div>
            </div>
            <div className="mt-3 grid gap-1.5 text-xs text-emerald-50/70">
              <div className="flex items-center justify-between gap-2">
                <span>Store</span>
                <span className="font-semibold text-white">JSON / Prisma</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Doganium</span>
                <span className="font-semibold text-amber-100">MFA manuel</span>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: easeOut }}
          className="sticky top-0 z-30 border-b border-[var(--ares-border)] bg-[rgba(7,21,33,0.78)] px-4 py-4 shadow-lg shadow-black/10 backdrop-blur-xl sm:px-6 lg:px-7"
        >
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 lg:hidden">
                <Button
                  asChild
                  variant={active === "dashboard" ? "default" : "outline"}
                  size="sm"
                  className="rounded-lg"
                >
                  <a href="/dashboard">Operasyon Paneli</a>
                </Button>
                <Button
                  asChild
                  variant={active === "desktop" ? "default" : "outline"}
                  size="sm"
                  className="rounded-lg"
                >
                  <a href="/desktop">Doganium Teknik Paneli</a>
                </Button>
              </div>
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3 lg:mt-0">
                <h2 className="ares-title truncate text-2xl font-black">
                  {title}
                </h2>
                {badge ? (
                  <Badge
                    variant="outline"
                    className="h-7 border-emerald-300/20 bg-emerald-400/12 px-3 text-emerald-100"
                  >
                    {badge}
                  </Badge>
                ) : null}
              </div>
              <p className="ares-muted mt-1 max-w-3xl text-sm leading-6">{description}</p>
            </div>
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        </motion.header>

        <ScrollArea className="relative min-h-0 flex-1">
          <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent_78%)]" />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: easeOut }}
            className="relative z-10 min-w-0 space-y-5 p-4 sm:p-5 lg:p-6"
          >
            {children}
          </motion.div>
        </ScrollArea>
      </section>
    </main>
  );
}

create extension if not exists pgcrypto;

create table if not exists public.traffic_quote_requests (
  id uuid primary key default gen_random_uuid(),
  customer_phone text not null,
  whatsapp_message_id text,
  raw_message text not null,
  tckn text,
  tckn_masked text,
  plate text,
  document_serial_no text,
  document_serial_no_masked text,
  birth_date text,
  birth_date_masked text,
  status text not null default 'pending' check (
    status in (
      'pending',
      'missing_fields',
      'ready_for_worker',
      'running_doganium',
      'pdf_downloaded',
      'parsed',
      'sent_to_customer',
      'manual_review',
      'failed'
    )
  ),
  missing_fields text[] not null default '{}',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.traffic_quote_results (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.traffic_quote_requests(id) on delete cascade,
  pdf_url text,
  cheapest_company text not null,
  cheapest_price numeric(12,2) not null,
  highest_company text,
  highest_price numeric(12,2),
  recommended_company text,
  recommended_price numeric(12,2),
  raw_result_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_traffic_quote_requests_status_created
on public.traffic_quote_requests(status, created_at);

create index if not exists idx_traffic_quote_requests_customer_phone
on public.traffic_quote_requests(customer_phone);

create index if not exists idx_traffic_quote_results_request_id
on public.traffic_quote_results(request_id);

alter table public.traffic_quote_requests enable row level security;
alter table public.traffic_quote_results enable row level security;

-- MVP notu:
-- Next.js API route'ları service role key ile çalışır.
-- Panel auth eklendiğinde RLS politikaları user/team bazlı sıkılaştırılmalı.
create policy "service_role_can_manage_traffic_quote_requests"
on public.traffic_quote_requests
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service_role_can_manage_traffic_quote_results"
on public.traffic_quote_results
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

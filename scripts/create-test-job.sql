insert into public.traffic_quote_requests (
  customer_phone,
  raw_message,
  tckn,
  tckn_masked,
  plate,
  document_serial_no,
  document_serial_no_masked,
  birth_date,
  birth_date_masked,
  status,
  missing_fields
)
values (
  '905551112233',
  'TCKN: 12345678910 Plaka: 34ABC123 Belge Seri No: AB123456 Doğum Tarihi: 01.01.1990',
  '12345678910',
  '123*****910',
  '34ABC123',
  'AB123456',
  'AB***56',
  '01.01.1990',
  '**.**.1990',
  'ready_for_worker',
  '{}'
);

-- Seed the starter storefront packages. Prices are read server-side by create-order.
insert into public.products (id, title, amount_label, price, active, sort_order)
values
  ('p1', 'คูปองแพ็กเล็ก', 'แพ็กเกจเริ่มต้น', 35, true, 1),
  ('p2', 'คูปองแพ็กกลาง', 'แพ็กเกจคุ้มค่า', 99, true, 2),
  ('p3', 'คูปองแพ็กใหญ่', 'แพ็กเกจสุดคุ้ม', 299, true, 3)
on conflict (id) do update set
  title = excluded.title,
  amount_label = excluded.amount_label,
  price = excluded.price,
  active = excluded.active,
  sort_order = excluded.sort_order;

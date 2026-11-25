import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const id = String(body.id ?? "").trim();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) return reply({ error: "รูปแบบเลขคำสั่งซื้อไม่ถูกต้อง" }, 400);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return reply({ error: "ระบบยังตั้งค่าไม่สมบูรณ์" }, 500);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await admin
      .from("orders")
      .select("id,status,queue_number,created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("lookup-order query failed", error);
      return reply({ error: "ค้นหารายการไม่สำเร็จ กรุณาลองใหม่" }, 500);
    }
    if (!data) return reply({ error: "ไม่พบรายการ กรุณาตรวจสอบเลขคำสั่งซื้อ" }, 404);
    return reply(data);
  } catch (error) {
    console.error("lookup-order error", error);
    return reply({ error: "ข้อมูลค้นหาไม่ถูกต้อง" }, 400);
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ADMIN_EMAIL = "nongwapwap@gmail.com";
const allowedStatuses = ["awaiting_payment", "queued", "processing", "completed", "cancelled"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      return json({ error: "ไม่มีสิทธิ์ใช้งานส่วนผู้ดูแล" }, 403);
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const body = await req.json();

    if (body.action === "list") {
      const { data, error } = await admin.from("orders")
        .select("id,product_name,amount_label,price,player_uid,player_name,customer_contact,payment_method,status,queue_number,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return json({ orders: data || [] });
    }

    if (body.action === "update") {
      const orderId = String(body.order_id || "");
      const status = String(body.status || "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
        return json({ error: "เลขคำสั่งซื้อไม่ถูกต้อง" }, 400);
      }
      if (!allowedStatuses.includes(status)) return json({ error: "สถานะไม่ถูกต้อง" }, 400);

      const { data: existing, error: findError } = await admin.from("orders")
        .select("id,queue_number").eq("id", orderId).maybeSingle();
      if (findError) throw findError;
      if (!existing) return json({ error: "ไม่พบคำสั่งซื้อ" }, 404);

      let queueNumber = existing.queue_number;
      if (status === "queued" && !queueNumber) {
        const { data: nextNumber, error: sequenceError } = await admin.rpc("next_topup_queue_number");
        if (sequenceError) throw sequenceError;
        queueNumber = nextNumber;
      }
      const { error: updateError } = await admin.from("orders")
        .update({ status, queue_number: queueNumber, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (updateError) throw updateError;
      return json({ success: true, queue_number: queueNumber });
    }

    return json({ error: "คำสั่งไม่ถูกต้อง" }, 400);
  } catch (error) {
    console.error("admin-orders:", error);
    return json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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
    const productId = String(body.product_id ?? "");
    const playerUid = String(body.player_uid ?? "").trim();
    const playerName = String(body.player_name ?? "").trim();
    const contact = String(body.customer_contact ?? "").trim();
    const paymentMethod = String(body.payment_method ?? "");

    if (!["p1", "p2", "p3"].includes(productId)) return reply({ error: "แพ็กเกจไม่ถูกต้อง" }, 400);
    if (!playerUid || playerUid.length > 40) return reply({ error: "กรุณาตรวจสอบ UID ผู้เล่น" }, 400);
    if (!contact || contact.length > 120) return reply({ error: "กรุณากรอกช่องทางติดต่อให้ถูกต้อง" }, 400);
    if (playerName.length > 80) return reply({ error: "ชื่อในเกมยาวเกินไป" }, 400);
    if (!["promptpay", "bank_transfer"].includes(paymentMethod)) return reply({ error: "วิธีชำระเงินไม่ถูกต้อง" }, 400);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return reply({ error: "ระบบยังตั้งค่าไม่สมบูรณ์ กรุณาติดต่อร้าน" }, 500);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: product, error: productError } = await admin
      .from("products")
      .select("id,title,amount_label,price")
      .eq("id", productId)
      .eq("active", true)
      .maybeSingle();

    if (productError || !product) return reply({ error: "ไม่พบแพ็กเกจหรือแพ็กเกจปิดให้บริการ" }, 400);

    const { data: order, error: insertError } = await admin
      .from("orders")
      .insert({
        product_id: product.id,
        product_name: product.title,
        amount_label: product.amount_label,
        price: product.price,
        player_uid: playerUid,
        player_name: playerName || null,
        customer_contact: contact,
        payment_method: paymentMethod,
        status: "awaiting_payment",
      })
      .select("id,status,queue_number")
      .single();

    if (insertError || !order) {
      console.error("create-order insert failed", insertError);
      return reply({ error: "บันทึกคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่" }, 500);
    }

    return reply(order, 201);
  } catch (error) {
    console.error("create-order error", error);
    return reply({ error: "ข้อมูลคำสั่งซื้อไม่ถูกต้อง" }, 400);
  }
});

import React, { useMemo, useState } from "react";
import {
  Sparkles, ShoppingBag, ClipboardList, MessageCircle, Menu, X,
  ChevronRight, Clock3, CheckCircle2, CircleHelp, Copy, Gamepad2,
  ShieldCheck, Heart, ArrowRight, Bell, WalletCards
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

const starterPackages = [
  { id: "p1", title: "คูปองแพ็กเล็ก", amount: "แพ็กเกจเริ่มต้น", price: 35, tag: "ยอดนิยม" },
  { id: "p2", title: "คูปองแพ็กกลาง", amount: "แพ็กเกจคุ้มค่า", price: 99, tag: "" },
  { id: "p3", title: "คูปองแพ็กใหญ่", amount: "แพ็กเกจสุดคุ้ม", price: 299, tag: "คุ้มค่า" },
];

const statusText = {
  awaiting_payment: "รอตรวจสอบการชำระเงิน",
  queued: "รอคิวเติม",
  processing: "กำลังเติมคูปอง",
  completed: "เติมสำเร็จ",
  cancelled: "ยกเลิกรายการ"
};

export default function App() {
  const [tab, setTab] = useState("home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selected, setSelected] = useState(starterPackages[0]);
  const [form, setForm] = useState({ playerUid: "", playerName: "", contact: "", payment: "promptpay" });
  const [order, setOrder] = useState(null);
  const [lookupId, setLookupId] = useState("");
  const [lookup, setLookup] = useState(null);
  const [notice, setNotice] = useState("");

  const nav = [
    ["home", "หน้าหลัก", Sparkles],
    ["topup", "เติมคูปอง", ShoppingBag],
    ["queue", "ติดตามคิว", ClipboardList],
    ["contact", "ติดต่อร้าน", MessageCircle],
  ];

  const changeTab = (key) => { setTab(key); setMobileMenu(false); setNotice(""); };

  async function submitOrder(e) {
    e.preventDefault();
    if (!form.playerUid.trim() || !form.contact.trim()) {
      setNotice("กรุณากรอก UID และช่องทางติดต่อให้ครบค่ะ");
      return;
    }
    const payload = {
      product_id: selected.id,
      product_name: selected.title,
      amount_label: selected.amount,
      price: selected.price,
      player_uid: form.playerUid.trim(),
      player_name: form.playerName.trim() || null,
      customer_contact: form.contact.trim(),
      payment_method: form.payment,
      status: "awaiting_payment"
    };

    if (supabase) {
      const { data, error } = await supabase.functions.invoke("create-order", { body: payload });
      if (error || !data?.id) {
        setNotice(data?.error || "ส่งคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่หรือติดต่อร้าน");
        return;
      }
      setOrder(data);
    } else {
      const demo = { id: "DEMO-" + Math.random().toString(36).slice(2, 8).toUpperCase(), status: "awaiting_payment", queue_number: null };
      setOrder(demo);
      setNotice("โหมดตัวอย่าง: เชื่อมต่อ Supabase ก่อนเปิดรับออเดอร์จริง");
    }
    setTab("queue");
    setLookupId("");
  }

  async function findOrder(e) {
    e?.preventDefault();
    if (!lookupId.trim()) return;
    if (!supabase) {
      setLookup({ id: lookupId.trim(), status: "awaiting_payment", queue_number: null, demo: true });
      return;
    }
    const { data, error } = await supabase.functions.invoke("lookup-order", {
      body: { id: lookupId.trim() }
    });
    setLookup(error || !data?.id ? null : data);
    if (error || !data?.id) setNotice(data?.error || "ไม่พบรายการ กรุณาตรวจสอบเลขคำสั่งซื้อ");
  }

  const activeOrder = lookup || order;
  const queueNumber = activeOrder?.queue_number ? `Q${String(activeOrder.queue_number).padStart(3, "0")}` : "รอยืนยัน";

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => changeTab("home")}>
          <span className="brand-mark"><Gamepad2 size={22}/></span>
          <span><b>PASTEL TOP-UP</b><small>ROV COUPON SERVICE</small></span>
        </a>
        <nav className="desktop-nav">
          {nav.map(([key, label, Icon]) => <button key={key} className={tab === key ? "nav-link active" : "nav-link"} onClick={() => changeTab(key)}><Icon size={16}/>{label}</button>)}
        </nav>
        <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="เมนู">{mobileMenu ? <X/> : <Menu/>}</button>
      </header>
      {mobileMenu && <nav className="mobile-nav">{nav.map(([key,label,Icon]) => <button key={key} onClick={() => changeTab(key)}><Icon size={17}/>{label}</button>)}</nav>}

      <main>
        {tab === "home" && <Home onStart={() => changeTab("topup")} onQueue={() => changeTab("queue")}/>}
        {tab === "topup" && <section className="section">
          <div className="section-heading"><span className="eyebrow">ROV COUPON</span><h1>เลือกแพ็กเกจที่ต้องการ <span>เติมคูปอง</span></h1><p>เลือกแพ็กเกจ กรอกข้อมูลผู้เล่น แล้วส่งคำสั่งซื้อได้เลย</p></div>
          <div className="package-grid">{starterPackages.map(p => <button key={p.id} className={selected.id === p.id ? "package-card selected" : "package-card"} onClick={() => setSelected(p)}>
            {p.tag && <span className="package-tag">{p.tag}</span>}<span className="package-icon"><WalletCards/></span><b>{p.title}</b><small>{p.amount}</small><strong>฿{p.price.toLocaleString("th-TH")}</strong><span className="choose">{selected.id === p.id ? "เลือกแล้ว ✓" : "เลือกแพ็กเกจ"}</span>
          </button>)}</div>
          <form className="panel order-form" onSubmit={submitOrder}>
            <div className="panel-title"><span className="step">01</span><div><h2>ข้อมูลสำหรับเติม</h2><p>ตรวจสอบ UID ให้ถูกต้องก่อนส่งคำสั่งซื้อ</p></div></div>
            <label>UID ผู้เล่น <input required value={form.playerUid} onChange={e => setForm({...form, playerUid:e.target.value})} placeholder="กรอก UID เกม RoV"/></label>
            <label>ชื่อในเกม (ถ้ามี) <input value={form.playerName} onChange={e => setForm({...form, playerName:e.target.value})} placeholder="ชื่อผู้เล่น"/></label>
            <label>ช่องทางติดต่อ <input required value={form.contact} onChange={e => setForm({...form, contact:e.target.value})} placeholder="LINE ID หรือ Facebook"/></label>
            <div className="panel-title payment-title"><span className="step">02</span><div><h2>เลือกวิธีชำระเงิน</h2><p>แนบหลักฐานการชำระเงินหลังสร้างรายการ</p></div></div>
            <div className="payment-options">
              <button type="button" className={form.payment === "promptpay" ? "payment-option chosen" : "payment-option"} onClick={() => setForm({...form,payment:"promptpay"})}><WalletCards/><span><b>QR PromptPay</b><small>สแกน QR เพื่อชำระเงิน</small></span></button>
              <button type="button" className={form.payment === "bank_transfer" ? "payment-option chosen" : "payment-option"} onClick={() => setForm({...form,payment:"bank_transfer"})}><ShieldCheck/><span><b>โอนธนาคาร</b><small>โอนแล้วแนบสลิป</small></span></button>
            </div>
            <div className="order-total"><span>ยอดชำระทั้งหมด</span><strong>฿{selected.price.toLocaleString("th-TH")}</strong></div>
            {notice && <p className="notice">{notice}</p>}
            <button className="primary-btn full" type="submit">ยืนยันรายการสั่งซื้อ <ArrowRight size={18}/></button>
            <p className="fine-print"><ShieldCheck size={14}/> คำสั่งซื้อจะเข้าคิวหลังแอดมินตรวจสอบการชำระเงินแล้วเท่านั้น</p>
          </form>
        </section>}
        {tab === "queue" && <section className="section narrow">
          <div className="section-heading"><span className="eyebrow">QUEUE TRACKER</span><h1>ติดตามสถานะ <span>คิวของคุณ</span></h1><p>กรอกเลขคำสั่งซื้อเพื่อดูสถานะล่าสุด</p></div>
          {order && <div className="panel current-order"><div><small>คำสั่งซื้อล่าสุดของคุณ</small><b>{order.id}</b></div><button className="soft-btn" onClick={() => setLookup(order)}>ดูคิวนี้</button></div>}
          <form className="lookup-form" onSubmit={findOrder}><input value={lookupId} onChange={e => setLookupId(e.target.value)} placeholder="กรอกเลขคำสั่งซื้อ"/><button className="primary-btn" type="submit">ค้นหา</button></form>
          {notice && <p className="notice">{notice}</p>}
          {activeOrder ? <div className="panel queue-panel">
            <div className="queue-top"><span className="eyebrow">YOUR QUEUE NUMBER</span><span className="status-pill">{statusText[activeOrder.status] || "กำลังตรวจสอบ"}</span></div>
            <div className="queue-number">{activeOrder.queue_number ? `Q${String(activeOrder.queue_number).padStart(3,"0")}` : "— — —"}</div>
            <p className="muted">{activeOrder.queue_number ? "หมายเลขคิวของคุณ" : "รอแอดมินตรวจสอบยอดชำระและยืนยันคิว"}</p>
            <div className="timeline">
              {["รับคำสั่งซื้อแล้ว","ตรวจสอบการชำระเงิน","รอคิวเติม","กำลังเติมคูปอง","เติมสำเร็จ"].map((s,i) => <div className={`timeline-item ${i === 0 || (activeOrder.status === "queued" && i < 3) || (activeOrder.status === "processing" && i < 4) || (activeOrder.status === "completed") ? "done" : ""}`} key={s}><span>{i < 2 && (i === 0 || activeOrder.status !== "awaiting_payment") ? <CheckCircle2 size={17}/> : <span className="timeline-dot"/>}</span>{s}</div>)}
            </div>
            <p className="fine-print"><Bell size={14}/> สถานะจะอัปเดตเมื่อร้านดำเนินการ กรุณาบันทึกเลขคำสั่งซื้อไว้</p>
          </div> : <div className="empty-state"><ClipboardList size={34}/><b>ยังไม่มีรายการให้แสดง</b><p>เมื่อสั่งซื้อแล้ว นำเลขคำสั่งซื้อมาค้นหาได้ที่นี่</p></div>}
        </section>}
        {tab === "contact" && <section className="section narrow"><div className="section-heading"><span className="eyebrow">WE ARE HERE</span><h1>ติดต่อ <span>ทางร้าน</span></h1><p>มีข้อสงสัยเกี่ยวกับรายการเติม ติดต่อเราได้เลย</p></div><div className="contact-card"><div className="contact-icon"><MessageCircle/></div><h2>ยินดีให้บริการค่ะ ♡</h2><p>ช่องทางติดต่อร้านจะเพิ่มได้จากระบบหลังบ้าน</p><div className="contact-placeholder">LINE · FACEBOOK · INSTAGRAM</div></div></section>}
      </main>

      <footer><div className="footer-brand"><span className="brand-mark"><Gamepad2 size={18}/></span><b>PASTEL TOP-UP</b></div><p>เติมคูปอง RoV ง่าย ๆ ติดตามคิวได้ทุกเวลา</p><small>© {new Date().getFullYear()} Pastel Top-up. All rights reserved.</small></footer>
      <div className="bottom-nav">{nav.map(([key,label,Icon]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => changeTab(key)}><Icon size={19}/><span>{label}</span></button>)}</div>
      {!isSupabaseConfigured && <div className="dev-ribbon">DEMO PREVIEW · ยังไม่ได้เชื่อมฐานข้อมูล</div>}
    </div>
  );
}

function Home({onStart,onQueue}) {
  return <><section className="hero">
    <div className="hero-copy"><span className="eyebrow"><Sparkles size={14}/> EASY · FAST · CUTE</span><h1>เติมคูปอง RoV<br/><span>ง่ายกว่าที่เคย</span></h1><p>เลือกแพ็กเกจ สั่งซื้อ และติดตามคิวเติมได้ในเว็บไซต์เดียว สะดวกทุกขั้นตอน ♡</p><div className="hero-actions"><button className="primary-btn" onClick={onStart}>เริ่มเติมคูปอง <ArrowRight size={18}/></button><button className="secondary-btn" onClick={onQueue}>เช็กคิวของฉัน</button></div><div className="trust-row"><span><ShieldCheck size={15}/> ตรวจสอบรายการ</span><span><Clock3 size={15}/> ติดตามคิวได้</span></div></div>
    <div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="game-card"><div className="game-card-top"><span>ROV TOP-UP</span><Sparkles size={18}/></div><div className="gem"><div className="gem-shape">✦</div></div><b>เติมง่าย สบายใจ</b><small>YOUR GAME · YOUR QUEUE</small><div className="card-stats"><span>FAST ORDER</span><span>♡ PASTEL SERVICE</span></div></div><span className="float-star star-a">✧</span><span className="float-star star-b">✦</span><span className="float-pill">Queue online ♡</span></div>
  </section>
  <section className="benefits"><div><span className="benefit-icon pink"><ShoppingBag/></span><b>สั่งซื้อสะดวก</b><small>เลือกแพ็กเกจได้ในไม่กี่ขั้นตอน</small></div><div><span className="benefit-icon purple"><ClipboardList/></span><b>มีหมายเลขคิว</b><small>รู้สถานะรายการของตัวเอง</small></div><div><span className="benefit-icon blue"><Bell/></span><b>อัปเดตสถานะ</b><small>ติดตามความคืบหน้าได้ง่าย</small></div></section>
  <section className="home-cta"><div><span className="eyebrow">LET'S GET STARTED</span><h2>พร้อมเติมคูปองแล้วหรือยัง?</h2><p>เริ่มต้นเลือกแพ็กเกจที่คุณต้องการได้เลย</p></div><button className="primary-btn" onClick={onStart}>เลือกแพ็กเกจ <ChevronRight size={18}/></button></section>
  </>;
}
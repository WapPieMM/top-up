import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { ArrowLeft, RefreshCw, Search, LogOut, ShieldCheck, ClipboardList } from "lucide-react";

const ADMIN_EMAIL = "nongwapwap@gmail.com";
const ADMIN_USERNAME = "admin";
const statusLabels = {
  awaiting_payment: "รอตรวจสอบการชำระเงิน",
  queued: "รอคิวเติม",
  processing: "กำลังเติมคูปอง",
  completed: "เติมสำเร็จ",
  cancelled: "ยกเลิกรายการ",
};
const statusOptions = Object.entries(statusLabels);

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState(ADMIN_USERNAME);
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.email?.toLowerCase() === ADMIN_EMAIL) loadOrders();
  }, [session]);

  async function signIn(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (username.trim() !== ADMIN_USERNAME) {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    if (!supabase) {
      setError("ยังไม่ได้เชื่อมต่อ Supabase");
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });
    setLoading(false);
    if (authError || !data.user) setError("เข้าสู่ระบบไม่สำเร็จ ตรวจสอบชื่อผู้ใช้และรหัสผ่านอีกครั้ง");
    else if (data.user.email?.toLowerCase() !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setError("บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ");
    }
  }

  async function callAdmin(body) {
    const { data, error: invokeError } = await supabase.functions.invoke("admin-orders", { body });
    if (invokeError) throw new Error(data?.error || invokeError.message || "ทำรายการไม่สำเร็จ");
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const data = await callAdmin({ action: "list" });
      setOrders(data.orders || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(order, status) {
    setBusyId(order.id);
    setError("");
    setNotice("");
    try {
      await callAdmin({ action: "update", order_id: order.id, status });
      setNotice(status === "queued" ? "รายการได้รับการยืนยันและจัดคิวแล้ว" : "อัปเดตสถานะเรียบร้อย");
      await loadOrders();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId("");
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setOrders([]);
  }

  if (!session) return (
    <div className="admin-shell">
      <div className="admin-login panel">
        <a className="admin-back" href="/"><ArrowLeft size={16}/> กลับหน้าร้าน</a>
        <div className="admin-mark"><ShieldCheck size={27}/></div>
        <span className="eyebrow">PASTEL TOP-UP · ADMIN</span>
        <h1>เข้าสู่ระบบหลังบ้าน</h1>
        <p>สำหรับผู้ดูแลร้านที่ได้รับอนุญาตเท่านั้น</p>
        <form onSubmit={signIn}>
          <label>ชื่อผู้ใช้<input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required /></label>
          <label>รหัสผ่าน<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          {error && <p className="admin-alert">{error}</p>}
          <button className="primary-btn full" disabled={loading}>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</button>
        </form>
        <small className="admin-footnote">ระบบตรวจสอบสิทธิ์ผู้ดูแลผ่าน Supabase Authentication</small>
      </div>
    </div>
  );

  if (session.user?.email?.toLowerCase() !== ADMIN_EMAIL) return (
    <div className="admin-shell"><div className="admin-login panel"><h2>ไม่มีสิทธิ์เข้าถึง</h2><p>บัญชีนี้ไม่ได้รับอนุญาตให้ใช้งานหลังบ้าน</p><button className="primary-btn" onClick={signOut}>ออกจากระบบ</button></div></div>
  );

  const filtered = orders.filter(o => [o.id, o.product_name, o.player_uid, o.player_name, o.customer_contact].join(" ").toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div><span className="eyebrow">PASTEL TOP-UP</span><h1>จัดการคำสั่งซื้อ</h1><p>เข้าสู่ระบบในชื่อ {ADMIN_USERNAME}</p></div>
        <div className="admin-header-actions"><a className="soft-btn" href="/">หน้าร้าน</a><button className="soft-btn" onClick={signOut}><LogOut size={15}/> ออกจากระบบ</button></div>
      </header>
      <main className="admin-main">
        <div className="admin-toolbar">
          <div className="admin-count"><ClipboardList size={19}/><b>{orders.length}</b><span>รายการทั้งหมด</span></div>
          <button className="soft-btn" onClick={loadOrders} disabled={loading}><RefreshCw size={15}/> รีเฟรช</button>
        </div>
        <div className="admin-search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาเลขออเดอร์, UID, ชื่อลูกค้า หรือช่องทางติดต่อ"/></div>
        {error && <p className="admin-alert">{error}</p>}
        {notice && <p className="admin-success">{notice}</p>}
        {loading && orders.length === 0 ? <div className="admin-empty">กำลังโหลดรายการ...</div> : filtered.length === 0 ? <div className="admin-empty">ไม่พบคำสั่งซื้อ</div> :
          <div className="admin-order-list">{filtered.map(order => (
            <article className="admin-order panel" key={order.id}>
              <div className="admin-order-top"><div><span className="eyebrow">ORDER</span><b className="admin-order-id">{order.id}</b></div><span className={"admin-status status-" + order.status}>{statusLabels[order.status] || order.status}</span></div>
              <div className="admin-order-grid">
                <div><small>แพ็กเกจ</small><b>{order.product_name}</b></div>
                <div><small>ยอดชำระ</small><b>฿{Number(order.price).toLocaleString("th-TH")}</b></div>
                <div><small>UID ผู้เล่น</small><b>{order.player_uid}</b></div>
                <div><small>ชื่อในเกม</small><b>{order.player_name || "—"}</b></div>
                <div><small>ช่องทางติดต่อ</small><b>{order.customer_contact}</b></div>
                <div><small>วิธีชำระเงิน</small><b>{order.payment_method === "promptpay" ? "PromptPay" : "โอนธนาคาร"}</b></div>
                <div><small>หมายเลขคิว</small><b>{order.queue_number ? "Q" + String(order.queue_number).padStart(3,"0") : "ยังไม่จัดคิว"}</b></div>
                <div><small>วันที่สั่งซื้อ</small><b>{new Date(order.created_at).toLocaleString("th-TH")}</b></div>
              </div>
              <div className="admin-order-actions">
                <label>เปลี่ยนสถานะ<select value={order.status} disabled={busyId === order.id} onChange={e => changeStatus(order, e.target.value)}>{statusOptions.map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                {busyId === order.id && <small>กำลังบันทึก...</small>}
              </div>
            </article>
          ))}</div>
        }
      </main>
    </div>
  );
}

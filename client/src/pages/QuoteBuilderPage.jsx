import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRequest } from "../api/requestApi";
import { estimateQuote, createQuote } from "../api/quoteApi";
import { fmtNumber } from "../utils/format";

const VEHICLES = [
  { value: "truck_750kg", label: "Xe tải 750kg" },
  { value: "truck_1t25",  label: "Xe tải 1.25 tấn" },
  { value: "truck_2t",    label: "Xe tải 2 tấn" },
];

const PACKS = [
  { value: "customer_self_pack", label: "Tự đóng gói" },
  { value: "standard_pack",      label: "Đóng gói tiêu chuẩn" },
  { value: "premium_pack",       label: "Đóng gói cao cấp" },
];

const SPEEDS = [
  { value: "standard", label: "Thường" },
  { value: "express",  label: "Hỏa tốc" },
];

export default function QuoteBuilderPage() {
  const { id } = useParams(); // requestId
  const nav = useNavigate();

  const [reqData, setReqData] = useState(null);
  const [items, setItems] = useState([
    { name: "Thùng carton", qty: 10, bulky: false, floorsFrom: 0, floorsTo: 0 },
  ]);
  const [vehicleType, setVehicleType] = useState("truck_750kg");
  const [workers, setWorkers] = useState(2);
  const [packOption, setPackOption] = useState("customer_self_pack");
  const [speed, setSpeed] = useState("standard");
  const [manualDistanceKm, setManualDistanceKm] = useState("");

  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState("");

  // Load Request (nếu có route từ trước)
  useEffect(() => {
    (async () => {
      try {
        const r = await getRequest(id);
        setReqData(r);
      } catch (e) {
        setMsg("Không tải được Request.");
      }
    })();
  }, [id]);

  const distanceKm = useMemo(() => {
    const d = reqData?.routeSummary?.distance
      ? reqData.routeSummary.distance / 1000
      : null;
    return d;
  }, [reqData]);

  const durationMin = useMemo(() => {
    const t = reqData?.routeSummary?.duration
      ? Math.round(reqData.routeSummary.duration / 60)
      : manualDistanceKm
        ? manualDistanceKm * 2 // fallback tạm tính
        : null;
    return t;
  }, [reqData, manualDistanceKm]);

  const movingTime = reqData?.movingTime || new Date().toISOString();

  const estimate = async () => {
    setMsg("");
    try {
      const effectiveDistance = distanceKm ?? parseFloat(manualDistanceKm);
      if (!effectiveDistance || isNaN(effectiveDistance)) {
        setMsg("Chưa có khoảng cách. Hãy nhập tay hoặc tạo route trước.");
        return;
      }

      const payload = {
        items,
        vehicleType,
        workers,
        packOption,
        speed,
        distanceKm: effectiveDistance,
        durationMin,
        movingTime,
      };
      const r = await estimateQuote(payload);
      setPreview(r);
    } catch (e) {
      setMsg("Không tính được giá tham khảo.");
    }
  };

  const saveQuote = async () => {
    setMsg("");
    try {
      if (!preview) { setMsg("Hãy bấm 'Tính giá' trước."); return; }
      const payload = {
        items,
        vehicleType,
        workers,
        packOption,
        speed,
        distanceKm: distanceKm ?? parseFloat(manualDistanceKm),
        durationMin,
        movingTime,
      };
      await createQuote(id, payload);
      setMsg("✅ Đã lưu báo giá (DRAFT).");
      setTimeout(() => nav(`/my-requests`), 800);
    } catch (e) {
      setMsg("Lưu báo giá thất bại.");
    }
  };

  const addItem = () => setItems(s => s.concat({ name: "", qty: 1, bulky: false, floorsFrom: 0, floorsTo: 0 }));
  const delItem = (idx) => setItems(s => s.filter((_, i) => i !== idx));
  const updItem = (idx, patch) => setItems(s => s.map((it, i) => i === idx ? { ...it, ...patch } : it));

  return (
    <div style={{ padding: 24, display: "grid", gap: 16, maxWidth: 960 }}>
      <h1>Báo giá vận chuyển</h1>

      {/* 1) Danh sách đồ */}
      <section style={panel}>
        <h3>1) Danh sách đồ</h3>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <th style={th}>Tên đồ</th>
              <th style={th}>SL</th>
              <th style={th}>Cồng kềnh</th>
              <th style={th}>Tầng đi</th>
              <th style={th}>Tầng đến</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td style={td}>
                  <input value={it.name} onChange={e=>updItem(idx,{name:e.target.value})} style={ipt}/>
                </td>
                <td style={td}>
                  <input type="number" min={1} value={it.qty} onChange={e=>updItem(idx,{qty:Number(e.target.value)})} style={ipt}/>
                </td>
                <td style={td}>
                  <input type="checkbox" checked={it.bulky} onChange={e=>updItem(idx,{bulky:e.target.checked})}/>
                </td>
                <td style={td}>
                  <input type="number" min={0} value={it.floorsFrom} onChange={e=>updItem(idx,{floorsFrom:Number(e.target.value)})} style={ipt}/>
                </td>
                <td style={td}>
                  <input type="number" min={0} value={it.floorsTo} onChange={e=>updItem(idx,{floorsTo:Number(e.target.value)})} style={ipt}/>
                </td>
                <td style={td}><button onClick={()=>delItem(idx)} style={btnSmall}>Xóa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div><button onClick={addItem} style={btn}>+ Thêm đồ</button></div>
      </section>

      {/* 2) Tuỳ chọn */}
      <section style={panel}>
        <h3>2) Tuỳ chọn</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(180px, 1fr))", gap: 12 }}>
          <label>Loại xe
            <select value={vehicleType} onChange={e=>setVehicleType(e.target.value)} style={ipt}>
              {VEHICLES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </label>
          <label>Công nhân
            <input type="number" min={0} value={workers} onChange={e=>setWorkers(Number(e.target.value))} style={ipt}/>
          </label>
          <label>Đóng gói
            <select value={packOption} onChange={e=>setPackOption(e.target.value)} style={ipt}>
              {PACKS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
          <label>Tốc độ
            <select value={speed} onChange={e=>setSpeed(e.target.value)} style={ipt}>
              {SPEEDS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {/* 3) Khoảng cách fallback */}
      <section style={panel}>
        <h3>3) Khoảng cách</h3>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <div>Tuyến: {distanceKm ? distanceKm.toFixed(1) : "-"} km • {durationMin ?? "-"} phút</div>
          {!distanceKm && (
            <input
              type="number"
              placeholder="Nhập khoảng cách (km)"
              value={manualDistanceKm}
              onChange={e => setManualDistanceKm(e.target.value)}
              style={ipt}
            />
          )}
        </div>
      </section>

      {/* 4) Kết quả */}
      <section style={panel}>
        <h3>4) Kết quả</h3>
        <div style={{ display:"flex", gap: 16, alignItems:"center" }}>
          <button onClick={estimate} style={btn}>Tính giá</button>
          <button onClick={saveQuote} style={btnHollow}>Lưu báo giá</button>
        </div>
        {preview && (
          <div style={{ marginTop: 12, lineHeight: 1.7 }}>
            <div>Cước đường: <b>{fmtNumber(preview.distanceFee)} đ</b></div>
            <div>Công bốc xếp: <b>{fmtNumber(preview.laborFee)} đ</b></div>
            <div>Đóng gói: <b>{fmtNumber(preview.packingFee)} đ</b></div>
            <div>Phí tầng: <b>{fmtNumber(preview.stairsFee)} đ</b></div>
            <div>Phụ phí đêm: <b>{fmtNumber(preview.nightFee)} đ</b></div>
            <div>Hệ số tốc độ: x{preview.speedMultiplier}</div>
            <div style={{ marginTop:6, fontSize:18 }}>
              Tổng dự kiến: <b>{fmtNumber(preview.total)} đ</b>
            </div>
          </div>
        )}
      </section>

      {msg && <div style={{ color:"#c00" }}>{msg}</div>}
    </div>
  );
}

const panel = { padding:12, border:"1px dashed #aaa", borderRadius:8 };
const th = { textAlign:"left", padding:8, borderBottom:"1px solid #ddd" };
const td = { padding:8, borderBottom:"1px solid #eee" };
const ipt = { padding:8, border:"1px solid #ccc", borderRadius:6, width:"100%" };
const btn = { padding:"8px 12px", border:"1px solid #111", background:"#111", color:"#fff", borderRadius:8 };
const btnHollow = { padding:"8px 12px", border:"1px solid #111", background:"#fff", color:"#111", borderRadius:8 };
const btnSmall = { padding:"4px 8px", border:"1px solid #444", background:"#fff", borderRadius:6 };

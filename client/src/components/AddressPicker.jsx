import { useEffect, useState } from "react";

const API = "https://provinces.open-api.vn/api";

export default function AddressPicker({ value, onChange }) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const v = value || { province: null, district: null, ward: null, street: "" };

  useEffect(() => {
    fetch(`${API}/p/`)
      .then(r => r.json())
      .then(setProvinces)
      .catch(() => setProvinces([]));
  }, []);

  const onProvince = async (e) => {
    const code = e.target.value;
    if (!code) return;
    const province = provinces.find(p => String(p.code) === code);
    onChange?.({ ...v, province: { code: String(province.code), name: province.name }, district: null, ward: null });
    // load districts
    const ds = await fetch(`${API}/p/${code}?depth=2`).then(r => r.json());
    setDistricts(ds.districts || []);
    setWards([]);
  };

  const onDistrict = async (e) => {
    const code = e.target.value;
    if (!code) return;
    const district = districts.find(d => String(d.code) === code);
    onChange?.({ ...v, district: { code: String(district.code), name: district.name }, ward: null });
    // load wards
    const ws = await fetch(`${API}/d/${code}?depth=2`).then(r => r.json());
    setWards(ws.wards || []);
  };

  const onWard = (e) => {
    const code = e.target.value;
    const ward = wards.find(w => String(w.code) === code);
    onChange?.({ ...v, ward: { code: String(ward.code), name: ward.name } });
  };

  const onStreet = (e) => onChange?.({ ...v, street: e.target.value });

  return (
    <div className="space-y-2">
      <div>
        <label>Tỉnh/Thành phố</label><br/>
        <select value={v.province?.code || ""} onChange={onProvince}>
          <option value="">-- Chọn tỉnh/thành --</option>
          {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label>Quận/Huyện</label><br/>
        <select value={v.district?.code || ""} onChange={onDistrict} disabled={!v.province}>
          <option value="">-- Chọn quận/huyện --</option>
          {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
        </select>
      </div>

      <div>
        <label>Phường/Xã</label><br/>
        <select value={v.ward?.code || ""} onChange={onWard} disabled={!v.district}>
          <option value="">-- Chọn phường/xã --</option>
          {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
        </select>
      </div>

      <div>
        <label>Số nhà, tên đường</label><br/>
        <input value={v.street} onChange={onStreet} placeholder="VD: 12 Nguyễn Huệ" style={{width:"100%"}}/>
      </div>
    </div>
  );
}

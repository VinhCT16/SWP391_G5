import { useEffect, useRef, useState } from "react";

export default function AddressPicker({ value, onChange }) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [loadingP, setLoadingP] = useState(false);
  const [loadingD, setLoadingD] = useState(false);
  const [loadingW, setLoadingW] = useState(false);

  const provinceCode = value?.province?.code || "";
  const districtCode = value?.district?.code || "";
  const wardCode     = value?.ward?.code || "";
  const street       = value?.street || "";

  // Flags để chỉ hydrate 1 lần lúc mở form (tránh reset khi prefill)
  const didHydrateDistrictsRef = useRef(false);
  const didHydrateWardsRef = useRef(false);

  // --- API helpers ---
  async function fetchProvinces() {
    const res = await fetch("https://provinces.open-api.vn/api/?depth=1");
    return res.json();
  }
  async function fetchDistrictsAPI(pCode) {
    const res = await fetch(`https://provinces.open-api.vn/api/p/${pCode}?depth=2`);
    const data = await res.json();
    return data?.districts || [];
  }
  async function fetchWardsAPI(dCode) {
    const res = await fetch(`https://provinces.open-api.vn/api/d/${dCode}?depth=2`);
    const data = await res.json();
    return data?.wards || [];
  }

  // Load provinces on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingP(true);
      try {
        const list = await fetchProvinces();
        if (!alive) return;
        setProvinces(list);
      } finally {
        setLoadingP(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // HYDRATE khi mở form: nếu đã có provinceCode mà districts đang rỗng -> fetch districts
  useEffect(() => {
    if (!provinceCode) {
      setDistricts([]);
      setWards([]);
      // mở lại quyền hydrate khi clear
      didHydrateDistrictsRef.current = false;
      didHydrateWardsRef.current = false;
      return;
    }
    if (!didHydrateDistrictsRef.current && districts.length === 0) {
      (async () => {
        setLoadingD(true);
        try {
          const list = await fetchDistrictsAPI(provinceCode);
          setDistricts(list);
        } finally {
          setLoadingD(false);
          didHydrateDistrictsRef.current = true; // chỉ hydrate 1 lần lúc mở form
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceCode]);

  // HYDRATE khi mở form: nếu đã có districtCode mà wards đang rỗng -> fetch wards
  useEffect(() => {
    if (!districtCode) {
      setWards([]);
      didHydrateWardsRef.current = false;
      return;
    }
    if (!didHydrateWardsRef.current && wards.length === 0) {
      (async () => {
        setLoadingW(true);
        try {
          const list = await fetchWardsAPI(districtCode);
          setWards(list);
        } finally {
          setLoadingW(false);
          didHydrateWardsRef.current = true; // chỉ hydrate 1 lần lúc mở form
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtCode]);

  // --- User interactions: đây là NHÁNH "user đổi", phải reset con ---
  const onProvinceChange = (code) => {
    // Khi user đổi tỉnh -> reset district & ward (đây KHÔNG phải hydrate)
    didHydrateDistrictsRef.current = false;
    didHydrateWardsRef.current = false;
    onChange?.({
      ...value,
      province: code ? provinces.find(p => String(p.code) === String(code)) : undefined,
      district: undefined,
      ward: undefined,
    });
    setDistricts([]);
    setWards([]);
    if (code) {
      (async () => {
        setLoadingD(true);
        try {
          const list = await fetchDistrictsAPI(code);
          setDistricts(list);
        } finally {
          setLoadingD(false);
        }
      })();
    }
  };

  const onDistrictChange = (code) => {
    // Khi user đổi quận -> reset ward
    didHydrateWardsRef.current = false;
    onChange?.({
      ...value,
      district: code ? districts.find(d => String(d.code) === String(code)) : undefined,
      ward: undefined,
    });
    setWards([]);
    if (code) {
      (async () => {
        setLoadingW(true);
        try {
          const list = await fetchWardsAPI(code);
          setWards(list);
        } finally {
          setLoadingW(false);
        }
      })();
    }
  };

  const onWardChange = (code) => {
    onChange?.({
      ...value,
      ward: code ? wards.find(w => String(w.code) === String(code)) : undefined,
    });
  };

  const onStreetChange = (s) => {
    onChange?.({ ...value, street: s });
  };

  return (
    <div className="grid gap-2">
      <select
        value={provinceCode}
        onChange={(e) => onProvinceChange(e.target.value)}
        disabled={loadingP}
      >
        <option value="">-- Chọn Tỉnh/Thành --</option>
        {provinces.map(p => (
          <option key={p.code} value={p.code}>{p.name}</option>
        ))}
      </select>

      <select
        value={districtCode}
        onChange={(e) => onDistrictChange(e.target.value)}
        disabled={!provinceCode || loadingD}
      >
        <option value="">-- Chọn Quận/Huyện --</option>
        {districts.map(d => (
          <option key={d.code} value={d.code}>{d.name}</option>
        ))}
      </select>

      <select
        value={wardCode}
        onChange={(e) => onWardChange(e.target.value)}
        disabled={!districtCode || loadingW}
      >
        <option value="">-- Chọn Phường/Xã --</option>
        {wards.map(w => (
          <option key={w.code} value={w.code}>{w.name}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Số nhà, đường..."
        value={street}
        onChange={(e) => onStreetChange(e.target.value)}
      />
    </div>
  );
}

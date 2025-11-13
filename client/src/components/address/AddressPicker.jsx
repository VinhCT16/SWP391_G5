import { useEffect, useRef, useState } from "react";

export default function AddressPicker({ value, onChange }) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [loadingP, setLoadingP] = useState(false);
  const [loadingD, setLoadingD] = useState(false);
  const [loadingW, setLoadingW] = useState(false);
  const [error, setError] = useState(null);

  const provinceCode = value?.province?.code || "";
  const districtCode = value?.district?.code || "";
  const wardCode     = value?.ward?.code || "";
  const street       = value?.street || "";

  // Flags để chỉ hydrate 1 lần lúc mở form (tránh reset khi prefill)
  const didHydrateDistrictsRef = useRef(false);
  const didHydrateWardsRef = useRef(false);

  // --- API helpers ---
  async function fetchProvinces() {
    try {
      const res = await fetch("https://provinces.open-api.vn/api/?depth=1");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    } catch (error) {
      console.error("Error fetching provinces:", error);
      // Return empty array on error to prevent crashes
      return [];
    }
  }
  async function fetchDistrictsAPI(pCode) {
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${pCode}?depth=2`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      return data?.districts || [];
    } catch (error) {
      console.error("Error fetching districts:", error);
      return [];
    }
  }
  async function fetchWardsAPI(dCode) {
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${dCode}?depth=2`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      return data?.wards || [];
    } catch (error) {
      console.error("Error fetching wards:", error);
      return [];
    }
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
        setError(null);
        if (list.length === 0) {
          setError("Không thể tải danh sách tỉnh/thành. Vui lòng kiểm tra kết nối mạng.");
          console.warn("No provinces loaded. Check network connection or API availability.");
        }
      } catch (error) {
        console.error("Failed to load provinces:", error);
        setProvinces([]);
        setError("Không thể tải danh sách địa chỉ. Vui lòng thử lại sau.");
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
      {error && (
        <div style={{ 
          padding: '8px', 
          background: '#fee', 
          color: '#c33', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      <select
        value={provinceCode}
        onChange={(e) => onProvinceChange(e.target.value)}
        disabled={loadingP || provinces.length === 0}
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

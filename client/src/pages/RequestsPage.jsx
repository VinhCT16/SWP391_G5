import { useState } from "react";
import CreateRequestForm from "../components/CreateRequestForm";
import RequestList from "../components/RequestList";

export default function RequestsPage() {
  const [phone, setPhone] = useState("");
  const [inputPhone, setInputPhone] = useState("");

  return (
    <div>
      <h1>Quản lý Request của tôi</h1>
      <input placeholder="Nhập số điện thoại" value={inputPhone} onChange={e => setInputPhone(e.target.value)} />
      <button onClick={() => setPhone(inputPhone)}>Tải</button>
      <button onClick={() => setPhone("")}>Tạo mới</button>

      {!phone && <CreateRequestForm onCreated={() => setPhone(inputPhone)} />}
      {phone && <RequestList phone={phone} />}
    </div>
  );
}

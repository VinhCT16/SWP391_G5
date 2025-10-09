const API_URL = "http://localhost:3000/contracts"; 
export const getContracts = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Không thể tải danh sách hợp đồng");
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi tải danh sách hợp đồng:", error);
    return [];
  }
};

export const getContractById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error("Không thể tải chi tiết hợp đồng");
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi tải chi tiết hợp đồng:", error);
    return null;
  }
};

export const createContract = async (contractData) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contractData),
    });
    if (!response.ok) throw new Error("Không thể tạo hợp đồng mới");
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi tạo hợp đồng:", error);
    throw error;
  }
};

export const updateContract = async (id, updatedData) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) throw new Error("Không thể cập nhật hợp đồng");
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi cập nhật hợp đồng:", error);
    throw error;
  }
};

export const deleteContract = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Không thể xóa hợp đồng");
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa hợp đồng:", error);
    throw error;
  }
};

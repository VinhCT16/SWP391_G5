import Quote from "../models/quote.model.js";

/**
 * Tạo quote mới (staff tạo)
 */
export async function createQuote(req, res) {
  try {
    const { requestId } = req.params;
    const data = req.body;
    const quote = await Quote.create({
      ...data,
      requestId,
      basePrice: data.basePrice ?? 0,
    });
    res.json(quote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi tạo báo giá" });
  }
}

/**
 * Lấy danh sách quote theo request
 */
export async function listQuotes(req, res) {
  try {
    const { requestId } = req.params;
    const quotes = await Quote.find({ requestId }).sort({ updatedAt: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi tải báo giá" });
  }
}

/**
 * Lấy chi tiết 1 quote
 */
export async function getQuote(req, res) {
  try {
    const { id } = req.params;
    const q = await Quote.findById(id);
    if (!q) return res.status(404).json({ error: "Không tìm thấy quote" });
    res.json(q);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy báo giá" });
  }
}

/**
 * Gửi đề xuất giá từ customer
 */
export async function negotiateQuote(req, res) {
  try {
    const { id } = req.params;
    const { price } = req.body;
    const q = await Quote.findById(id);
    if (!q) return res.status(404).json({ error: "Không tìm thấy quote" });

    q.negotiatedPrice = price;
    q.status = "NEGOTIATING";
    q.negotiationHistory.push({ from: "customer", price });
    await q.save();

    res.json(q);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi thương lượng giá" });
  }
}

/**
 * Phản hồi từ staff: accept hoặc counter
 */
export async function respondQuote(req, res) {
  try {
    const { id } = req.params;
    const { action, price } = req.body;
    const q = await Quote.findById(id);
    if (!q) return res.status(404).json({ error: "Không tìm thấy quote" });

    if (action === "accept") {
      q.finalPrice = q.negotiatedPrice;
      q.status = "CONFIRMED";
    } else if (action === "counter") {
      q.negotiatedPrice = price;
      q.negotiationHistory.push({ from: "staff", price });
      q.status = "NEGOTIATING";
    }
    await q.save();

    res.json(q);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi phản hồi báo giá" });
  }
}

/**
 * Xác nhận giá cuối cùng
 */
export async function confirmQuote(req, res) {
  try {
    const { id } = req.params;
    const q = await Quote.findById(id);
    if (!q) return res.status(404).json({ error: "Không tìm thấy quote" });

    q.finalPrice = q.finalPrice || q.basePrice;
    q.status = "CONFIRMED";
    await q.save();

    res.json(q);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xác nhận báo giá" });
  }
}

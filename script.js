/* ---------- Lượt xem (Đếm chung toàn cầu qua CounterAPI có dự phòng) ---------- */
const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
};

(async function views(){
  const base = `https://api.counterapi.dev/v1/bio-${DISCORD_ID}/views`;
  const first = !store.get("viewed");
  try {
    let r = await fetch(first ? base + "/up" : base);
    if (!r.ok) {
      // Nếu chưa khởi tạo, gọi lệnh up để tạo mới
      r = await fetch(base + "/up");
    }
    const j = await r.json();
    $("views").textContent = j.count || 0;
    if (first) store.set("viewed", "1");
  } catch (e) { 
    $("views").textContent = "0"; 
  }
})();

/* ---------- Thích / Tim (Đếm chung toàn cầu có dự phòng) ---------- */
const likeBase = `https://api.counterapi.dev/v1/bio-${DISCORD_ID}/likes`;

async function updateLikeUI(isLiked) {
  $("likeBtn").classList.toggle("liked", isLiked);
}

(async function initLikes(){
  try {
    let r = await fetch(likeBase);
    if (!r.ok) {
      r = await fetch(likeBase + "/up"); // Khởi tạo nếu chưa có
      await fetch(likeBase + "/down"); // Trả lại số lượng ban đầu
    }
    const j = await r.json();
    $("likes").textContent = j.count || 0;
  } catch (e) {
    $("likes").textContent = "0";
  }
  
  const hasLiked = store.get("liked") === "1";
  updateLikeUI(hasLiked);
})();

$("likeBtn").onclick = async () => {
  let hasLiked = store.get("liked") === "1";
  const endpoint = hasLiked ? `${likeBase}/down` : `${likeBase}/up`;
  
  try {
    const r = await fetch(endpoint);
    const j = await r.json();
    $("likes").textContent = j.count || 0;
    
    hasLiked = !hasLiked;
    store.set("liked", hasLiked ? "1" : "0");
    updateLikeUI(hasLiked);
  } catch (e) {
    console.error("Lỗi kết nối tim:", e);
  }
};

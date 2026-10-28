const DISCORD_ID = "1279063616150310957";
const NAME = "Toilathangtoi?";
// Khung avatar chuyển động
const FRAMES = ["frames/1.png", "frames/2.png", "frames/3.png"];
const $ = id => document.getElementById(id);

/* ---------- Gõ chữ chạy ---------- */
function startTyping(){
  let i = 0, dir = 1;
  const el = $("typed");
  (function tick(){
    el.textContent = NAME.slice(0, i);
    if (dir === 1 && i === NAME.length) { dir = -1; return setTimeout(tick, 2500); }
    if (dir === -1 && i === 0) { dir = 1; return setTimeout(tick, 600); }
    i += dir;
    setTimeout(tick, dir === 1 ? 140 : 70);
  })();
}

/* ---------- Khung avatar đổi liên tục ---------- */
(function frames(){
  const ok = [];
  let loaded = 0;
  FRAMES.forEach(src => {
    const im = new Image();
    im.onload = () => { ok.push(src); done(); };
    im.onerror = done;
    im.src = src;
  });
  function done(){
    if (++loaded < FRAMES.length || !ok.length) return;
    let k = 0;
    const f = $("frame");
    (function next(){ f.src = ok[k++ % ok.length]; f.hidden = false; setTimeout(next, 2500); })();
  }
})();

/* ---------- Discord (Lanyard API) ---------- */
let gameStart = null;
const fmt = ms => {
  const s = Math.floor(ms / 1000), p = n => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s % 3600 / 60))}:${p(s % 60)}`;
};
const DIAMOND = '<svg width="18" height="18" viewBox="0 0 24 24"><rect x="4.5" y="4.5" width="15" height="15" rx="3" transform="rotate(45 12 12)" fill="#3ddc97"/><path d="M8 11l4 4 4-4" fill="none" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function renderDiscord(d){
  const u = d.discord_user;
  $("dcName").textContent = u.global_name || u.username;
  $("dcAvatar").src = u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`
    : "https://cdn.discordapp.com/embed/avatars/0.png";
  $("dcStatus").className = "status " + d.discord_status;
  $("avatar").src = $("dcAvatar").src;

  const deco = u.avatar_decoration_data;
  if (deco && deco.asset) {
    $("dcDeco").src = `https://cdn.discordapp.com/avatar-decoration-presets/${deco.asset}.png?size=128&passthrough=true`;
    $("dcDeco").hidden = false;
  } else $("dcDeco").hidden = true;

  const g = u.primary_guild;
  $("dcTag").innerHTML = g && g.tag
    ? (g.badge ? `<img src="https://cdn.discordapp.com/clan-badges/${g.identity_guild_id}/${g.badge}.png?size=32" width="16" height="16" alt="">` : "") + g.tag
    : "";
  $("dcBadge").innerHTML = (u.public_flags & 4194304) ? DIAMOND : "";

  const game = d.activities.find(a => a.type === 0);
  if (game) {
    $("dcGame").textContent = game.name;
    gameStart = game.timestamps && game.timestamps.start;
  } else {
    $("dcGame").textContent = d.discord_status === "offline" ? "Offline" : "Không chơi game";
    gameStart = null;
  }
  $("dcTimeWrap").hidden = !gameStart;
}
async function loadDiscord(){
  try {
    const r = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
    const j = await r.json();
    if (j.success) renderDiscord(j.data);
    else $("dcName").textContent = "Hãy vào server Lanyard để kết nối";
  } catch (e) { $("dcName").textContent = "Không tải được Discord"; }
}
loadDiscord(); setInterval(loadDiscord, 30000);
setInterval(() => { if (gameStart) $("dcTime").textContent = fmt(Date.now() - gameStart); }, 1000);

/* ---------- Local Storage & Bộ nhớ đệm an toàn ---------- */
const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
};

const NAMESPACE = `bio-${DISCORD_ID}`;

async function callApi(key, action = "") {
  try {
    const url = `https://api.counterapi.dev/v1/${NAMESPACE}/${key}${action ? '/' + action : ''}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.count;
  } catch (err) {
    return null; // Trả về null để kích hoạt cơ chế dự phòng bên dưới
  }
}

/* ---------- Quản lý Lượt xem (Views) ---------- */
async function initViews() {
  const viewedKey = "viewed_status";
  const isFirstTime = !store.get(viewedKey);
  
  let count = await callApi("views", isFirstTime ? "up" : "");
  
  if (count === null) {
    // Dự phòng: Nếu API lỗi/chặn, dùng bộ đếm ẩn trên trình duyệt để không bao giờ hiện số 0
    let localViews = parseInt(store.get("local_views") || "120");
    if (isFirstTime) {
      localViews++;
      store.set("local_views", localViews);
      store.set(viewedKey, "1");
    }
    $("views").textContent = localViews;
  } else {
    $("views").textContent = count;
    if (isFirstTime) store.set(viewedKey, "1");
  }
}
initViews();

/* ---------- Quản lý Tim (Likes) ---------- */
async function initLikes() {
  let count = await callApi("likes");
  if (count === null) {
    count = parseInt(store.get("local_likes") || "5");
  }
  $("likes").textContent = count;

  const liked = store.get("liked") === "1";
  $("likeBtn").classList.toggle("liked", liked);
}
initLikes();

$("likeBtn").onclick = async () => {
  let liked = store.get("liked") === "1";
  const action = liked ? "down" : "up";
  
  let count = await callApi("likes", action);
  
  if (count === null) {
    // Dự phòng khi API lỗi
    let localLikes = parseInt(store.get("local_likes") || "5");
    localLikes = liked ? Math.max(0, localLikes - 1) : localLikes + 1;
    store.set("local_likes", localLikes);
    $("likes").textContent = localLikes;
  } else {
    $("likes").textContent = count;
  }

  liked = !liked;
  store.set("liked", liked ? "1" : "0");
  $("likeBtn").classList.toggle("liked", liked);
};

/* ---------- Trình phát nhạc & âm lượng ---------- */
const audio = $("audio"), seek = $("seek"), vol = $("volumeSlider");
const t = s => isNaN(s) ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const setPlayIcon = playing => $("playIcon").setAttribute("icon", playing ? "ri:pause-fill" : "ri:play-fill");
const setMuteIcon = () => $("muteIcon").setAttribute("icon", (audio.muted || audio.volume == 0) ? "ri:volume-mute-line" : "ri:volume-up-line");
const paintSeek = () => seek.style.setProperty("--p", seek.value + "%");

audio.addEventListener("loadedmetadata", () => { $("dur").textContent = t(audio.duration); audio.volume = vol.value; });
audio.addEventListener("timeupdate", () => {
  $("cur").textContent = t(audio.currentTime);
  seek.value = (audio.currentTime / audio.duration) * 100 || 0;
  paintSeek();
});
seek.oninput = () => { audio.currentTime = (seek.value / 100) * audio.duration; paintSeek(); };
vol.oninput = () => { audio.volume = vol.value; audio.muted = false; setMuteIcon(); };
audio.addEventListener("error", () => { $("songTitle").textContent = "Lỗi: không tìm thấy file music.mp3"; setPlayIcon(false); });

$("play").onclick = async () => {
  if (audio.paused) {
    try { await audio.play(); setPlayIcon(true); }
    catch (e) { $("songTitle").textContent = "Lỗi: " + e.name + (audio.error ? " | mã " + audio.error.code : ""); }
  } else { audio.pause(); setPlayIcon(false); }
};
$("prev").onclick = () => audio.currentTime = Math.max(0, audio.currentTime - 10);
$("next").onclick = () => audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
$("muteBtn").onclick = () => { audio.muted = !audio.muted; setMuteIcon(); };

/* ---------- Màn hình "click to enter" ---------- */
$("enter").addEventListener("click", () => {
  $("enter").classList.add("gone");
  document.body.classList.remove("pre");
  document.body.classList.add("in");
  startTyping();
  audio.volume = vol.value;
  audio.play().then(() => setPlayIcon(true)).catch(() => {});
}, { once: true });

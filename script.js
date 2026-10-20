const DISCORD_ID = "1279063616150310957";
const NAME = "Toilathangngu";
const $ = id => document.getElementById(id);

/* ---------- Gõ chữ chạy ---------- */
(function typing(){
  let i = 0, dir = 1;
  const el = $("typed");
  (function tick(){
    el.textContent = NAME.slice(0, i);
    if (dir === 1 && i === NAME.length) { dir = -1; return setTimeout(tick, 2500); }
    if (dir === -1 && i === 0) { dir = 1; return setTimeout(tick, 600); }
    i += dir;
    setTimeout(tick, dir === 1 ? 140 : 70);
  })();
})();

/* ---------- Discord (Lanyard API) ----------
   Cần vào server Discord của Lanyard: https://discord.gg/lanyard
   để API theo dõi được tài khoản của bạn. */
let gameStart = null;
function fmt(ms){
  const s = Math.floor(ms/1000), h = String(Math.floor(s/3600)).padStart(2,"0");
  return `${h}:${String(Math.floor(s%3600/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}
function renderDiscord(d){
  const u = d.discord_user;
  $("dcName").textContent = u.global_name || u.username;
  $("dcAvatar").src = u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;
  $("dcStatus").className = "status " + d.discord_status;
  $("avatar").src = $("dcAvatar").src;

  // Viền avatar Discord (avatar decoration)
  const deco = u.avatar_decoration_data;
  if (deco && deco.asset) {
    $("dcDeco").src = `https://cdn.discordapp.com/avatar-decoration-presets/${deco.asset}.png?size=128&passthrough=true`;
    $("dcDeco").hidden = false;
  } else $("dcDeco").hidden = true;

  // Tag clan (vd: "Trẩu")
  const g = u.primary_guild;
  $("dcTag").innerHTML = g && g.tag
    ? (g.badge ? `<img src="https://cdn.discordapp.com/clan-badges/${g.identity_guild_id}/${g.badge}.png?size=32" style="width:14px;vertical-align:middle;margin-right:3px">` : "") + g.tag
    : "";
  const game = d.activities.find(a => a.type === 0);
  if (game) {
    $("dcGame").textContent = game.name;
    gameStart = game.timestamps && game.timestamps.start;
  } else {
    $("dcGame").textContent = d.discord_status === "offline" ? "Offline" : "Không chơi game";
    gameStart = null;
    $("dcTime").textContent = "";
  }
}
async function loadDiscord(){
  try {
    const r = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
    const j = await r.json();
    if (j.success) renderDiscord(j.data);
    else $("dcName").textContent = "Hãy vào server Lanyard để kết nối";
  } catch(e){ $("dcName").textContent = "Không tải được Discord"; }
}
loadDiscord(); setInterval(loadDiscord, 30000);
setInterval(() => { if (gameStart) $("dcTime").textContent = "🎮 " + fmt(Date.now() - gameStart); }, 1000);

/* ---------- Lượt xem / thích (lưu trong trình duyệt) ---------- */
const store = (k, v) => { try { if (v === undefined) return +localStorage.getItem(k)||0; localStorage.setItem(k, v); } catch(e){ return 0; } };
store("views", store("views") + 1);
$("views").textContent = store("views");
let liked = store("liked") === 1;
$("likes").textContent = liked ? 1 : 0;
$("likeBtn").classList.toggle("liked", liked);
$("likeBtn").onclick = () => {
  liked = !liked; store("liked", liked ? 1 : 0);
  $("likes").textContent = liked ? 1 : 0;
  $("likeBtn").classList.toggle("liked", liked);
};

/* ---------- Trình phát nhạc ---------- */
const audio = $("audio"), seek = $("seek");
const t = s => isNaN(s) ? "0:00" : `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
audio.addEventListener("loadedmetadata", () => $("dur").textContent = t(audio.duration));
audio.addEventListener("timeupdate", () => {
  $("cur").textContent = t(audio.currentTime);
  seek.value = (audio.currentTime / audio.duration) * 100 || 0;
});
seek.oninput = () => audio.currentTime = (seek.value / 100) * audio.duration;
audio.addEventListener("error", () => {
  $("songTitle").textContent = "Lỗi: không tìm thấy file music.mp3";
  $("play").textContent = "▶";
});
$("play").onclick = async () => {
  if (audio.paused) {
    try { await audio.play(); $("play").textContent = "⏸"; }
    catch (e) {
      const code = audio.error ? " | mã " + audio.error.code : "";
      $("songTitle").textContent = "Lỗi: " + e.name + code;
    }
  } else { audio.pause(); $("play").textContent = "▶"; }
};
$("prev").onclick = () => audio.currentTime = Math.max(0, audio.currentTime - 10);
$("next").onclick = () => audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
$("muteBtn").onclick = () => { audio.muted = !audio.muted; $("muteBtn").textContent = audio.muted ? "🔇" : "🔊"; };
/* main.js: page rendering, navigation, sound, and loading the 3D robot.
   Content lives in content.js; the arm lives in robot.js. */
(() => {
const STATIONS = [
  {id:"home",label:"Home"},{id:"about",label:"About"},{id:"projects",label:"Projects"},
  {id:"experience",label:"Experience"},{id:"skills",label:"Skills"},{id:"contact",label:"Contact"}
];

/* ============ Rendering ============ */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

$("#rail").innerHTML = STATIONS.map((s,i)=>`<li><button class="stop" type="button" data-goto="${i}"><i></i>${s.label}</button></li>`).join("") + `<span class="carriage" id="carriage"></span>`;

$("#filters").innerHTML = [["all","All"],...Object.entries(CATS).filter(([k])=>PROJECTS.some(p=>p.cat===k))]
  .map(([k,v],i)=>`<button class="filter" type="button" data-filter="${k}" aria-pressed="${i===0}">${v}</button>`).join("");

$("#projectList").innerHTML = PROJECTS.map((p,i)=>`
<article class="fixture" data-cat="${p.cat}">
  <h3 class="fixture-title"><button type="button" class="fixture-btn" aria-expanded="false" aria-controls="pb-${i}">
    <span class="fx-name">${esc(p.name)}</span><span class="fx-cat">${esc(CATS[p.cat])}</span><span class="fx-sum">${esc(p.summary)}</span>
  </button></h3>
  <div class="fixture-body" id="pb-${i}" hidden>
    ${p.media ? `<figure class="media">${p.media.type==="video"
      ? `<video src="${esc(p.media.src)}" controls preload="none" playsinline></video>`
      : `<img src="${esc(p.media.src)}" alt="${esc(p.media.alt||"")}" loading="lazy">`}</figure>` : ""}
    <p>${esc(p.description)}</p>
    <dl class="spec">
      <div><dt>My role</dt><dd>${esc(p.role)}</dd></div>
      <div><dt>Built with</dt><dd><ul class="tags">${p.tech.map(t=>`<li>${esc(t)}</li>`).join("")}</ul></dd></div>
    </dl>
    ${p.links && p.links.length ? `<p class="links">${p.links.map(l=>`<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</p>` : ""}
  </div>
</article>`).join("");

$("#timeline").innerHTML = EXPERIENCE.map((e,i)=>`
<li class="tl${e.now?" now":""}">
  <button type="button" class="tl-btn" aria-expanded="false" aria-controls="tb-${i}">
    <span class="tl-org">${esc(e.org)}</span><span class="tl-when">${esc(e.when)}</span><span class="tl-role">${esc(e.role)}</span>
  </button>
  <div class="tl-body" id="tb-${i}" hidden><p>${esc(e.body)}</p></div>
</li>`).join("");

$("#bins").innerHTML = SKILLS.map(b=>`<button type="button" class="bin" aria-pressed="false"><span class="bin-name">${esc(b.name)}</span>${b.items.map(s=>`<span class="ic">${esc(s)}</span>`).join("")}</button>`).join("");

const contactItems = [
  ["Email", PROFILE.email, "mailto:"+PROFILE.email],
  ["GitHub", PROFILE.github.replace(/^https?:\/\//,""), PROFILE.github],
  ["LinkedIn", PROFILE.linkedin.replace(/^https?:\/\/(www\.)?/,""), PROFILE.linkedin],
  PROFILE.resume ? ["Resume", "PDF", PROFILE.resume] : ["Resume", "Request a copy by email", "mailto:"+PROFILE.email+"?subject=Resume%20request"]
];
$("#controls").innerHTML = contactItems.map(([k,v,h])=>`<a class="ctl" href="${esc(h)}"${h.startsWith("http")?' target="_blank" rel="noopener"':""}><span class="btn" aria-hidden="true"></span><span><b>${k}</b><small>${esc(v)}</small></span></a>`).join("");

/* ============ Navigation state ============ */
const sections = STATIONS.map(s => document.getElementById(s.id));
const stops = $$(".stop");
const statusEl = $("#status"), announceEl = $("#announce");
const rm = matchMedia("(prefers-reduced-motion: reduce)");
let travelOn = !rm.matches;
let robot = null;
let current = indexFromHash();
let busy = false, queued = null;
window.__timeScale = 1;

function indexFromHash(){ const i = STATIONS.findIndex(s => "#"+s.id === location.hash); return i < 0 ? 0 : i; }
function setStatus(t){ statusEl.textContent = t; }

function setTravel(on){
  travelOn = on;
  $("#travelToggle").setAttribute("aria-pressed", String(on));
  document.documentElement.classList.toggle("motion-off", !on);
  if (robot) robot.setMotion(on);
}
setTravel(travelOn);
$("#travelToggle").addEventListener("click", () => setTravel(!travelOn));

function setNav(i){ stops.forEach((b,k)=>b.setAttribute("aria-current", String(k===i))); }

function resetPlate(s){
  s.classList.remove("is-active","in-transit","held","settling","dropping");
  s.style.transform = "";
}
function hidePanel(i){
  const s = sections[i];
  resetPlate(s);
  s.setAttribute("aria-hidden","true"); s.inert = true;
}
function showPanel(i, focus){
  sections.forEach((s,k)=>{ if (k !== i){ resetPlate(s); s.setAttribute("aria-hidden","true"); s.inert = true; } });
  const s = sections[i];
  s.removeAttribute("aria-hidden"); s.inert = false;
  if (!s.classList.contains("is-active")){
    s.querySelector(".scroll").scrollTop = 0;
    s.classList.add("is-active");
  }
  if (focus) { const h = s.querySelector("h1,h2"); h && h.focus({preventScroll:true}); }
}

let markerX = [];
function measureRail(){
  const railBox = $("#rail").getBoundingClientRect();
  markerX = stops.map(b => { const r = b.querySelector("i").getBoundingClientRect(); return r.left + r.width/2 - railBox.left; });
}
function placeCarriage(p){
  if (!markerX.length) return;
  const a = Math.max(0, Math.min(markerX.length-1, Math.floor(p))), b = Math.min(markerX.length-1, a+1), f = Math.max(0, Math.min(1, p-a));
  $("#carriage").style.transform = `translateX(${markerX[a] + (markerX[b]-markerX[a])*f}px)`;
}

async function goTo(i, {push=true} = {}){
  if (i < 0 || i >= STATIONS.length) return;
  if (busy){ queued = i; window.__timeScale = 2.6; return; }
  if (i === current){ showPanel(i, true); return; }
  if (push) history.pushState(null, "", "#"+STATIONS[i].id);
  busy = true; setNav(i); collapseAll();
  const from = current;
  if (robot && travelOn){
    await robot.transport(from, i, STATIONS[i].label);
  } else {
    if (robot) robot.snapTo(i);
    placeCarriage(i);
    setStatus("Now at " + STATIONS[i].label);
  }
  current = i;
  showPanel(i, true);
  announceEl.textContent = "Now at " + STATIONS[i].label;
  busy = false; window.__timeScale = 1;
  if (queued !== null){ const q = queued; queued = null; if (q !== current) goTo(q); }
}

document.addEventListener("click", e => {
  const g = e.target.closest("[data-goto]");
  if (!g) return;
  e.preventDefault();
  goTo(+g.dataset.goto);
});
window.addEventListener("popstate", () => goTo(indexFromHash(), {push:false}));
document.addEventListener("keydown", e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest("input,textarea,select,[contenteditable]")) return;
  const base = busy && queued !== null ? queued : current;
  if (e.key === "ArrowRight") { e.preventDefault(); goTo(Math.min(STATIONS.length-1, base + 1)); }
  if (e.key === "ArrowLeft")  { e.preventDefault(); goTo(Math.max(0, base - 1)); }
});

$("#filters").addEventListener("click", e => {
  const b = e.target.closest(".filter"); if (!b) return;
  $$(".filter").forEach(f => f.setAttribute("aria-pressed", String(f===b)));
  const k = b.dataset.filter;
  $$(".fixture").forEach(a => { a.hidden = !(k==="all" || a.dataset.cat===k); });
});
function toggleItem(btn, itemSel){
  const item = btn.closest(itemSel);
  const open = btn.getAttribute("aria-expanded") !== "true";
  $$(itemSel, item.parentElement).forEach(o => {
    const ob = o.querySelector("[aria-expanded]");
    ob.setAttribute("aria-expanded","false"); o.classList.remove("open");
    document.getElementById(ob.getAttribute("aria-controls")).hidden = true;
  });
  if (open){
    btn.setAttribute("aria-expanded","true"); item.classList.add("open");
    document.getElementById(btn.getAttribute("aria-controls")).hidden = false;
    if (robot) robot.pointAt(item);
  } else if (robot) robot.clearPoint();
}
$("#projectList").addEventListener("click", e => { const b = e.target.closest(".fixture-btn"); if (b) toggleItem(b, ".fixture"); });
$("#timeline").addEventListener("click", e => { const b = e.target.closest(".tl-btn"); if (b) toggleItem(b, ".tl"); });
$("#bins").addEventListener("click", e => {
  const b = e.target.closest(".bin"); if (!b) return;
  const on = b.getAttribute("aria-pressed") !== "true";
  $$(".bin").forEach(x => x.setAttribute("aria-pressed","false"));
  b.setAttribute("aria-pressed", String(on));
  if (robot) on ? robot.pointAt(b) : robot.clearPoint();
});
$("#controls").addEventListener("pointerover", e => { const c = e.target.closest(".ctl"); if (c && robot && e.pointerType === "mouse") robot.pointAt(c); });
$("#controls").addEventListener("focusin", e => { const c = e.target.closest(".ctl"); if (c && robot) robot.pointAt(c); });
function collapseAll(){
  $$("[aria-expanded='true']").forEach(b => { b.setAttribute("aria-expanded","false"); const p = document.getElementById(b.getAttribute("aria-controls")); if (p) p.hidden = true; });
  $$(".fixture.open,.tl.open").forEach(x => x.classList.remove("open"));
  $$(".bin").forEach(x => x.setAttribute("aria-pressed","false"));
  if (robot) robot.clearPoint();
}

/* ============ Sound (off by default) ============ */
const Sound = {
  on:false, ctx:null,
  start(){
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
    if (!this.ctx){
      this.ctx = new C();
      const o = this.ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 60;
      const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 380; f.Q.value = 3;
      const g = this.ctx.createGain(); g.gain.value = 0;
      o.connect(f); f.connect(g); g.connect(this.ctx.destination); o.start();
      this.o = o; this.g = g;
    }
    this.ctx.resume(); this.on = true; return true;
  },
  stop(){ this.on = false; if (this.g) this.g.gain.setTargetAtTime(0, this.ctx.currentTime, .05); },
  update(speed){
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime, s = Math.min(speed, 6);
    this.g.gain.setTargetAtTime(s > .08 ? Math.min(s*.011, .04) : 0, t, .08);
    this.o.frequency.setTargetAtTime(52 + s*34, t, .1);
  },
  click(){
    if (!this.on || !this.ctx) return;
    const n = this.ctx.createBufferSource(), len = this.ctx.sampleRate * .05;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 4);
    const bp = this.ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value = 1900; bp.Q.value = 2;
    const g = this.ctx.createGain(); g.gain.value = .25;
    n.buffer = buf; n.connect(bp); bp.connect(g); g.connect(this.ctx.destination); n.start();
  }
};
$("#soundToggle").addEventListener("click", e => {
  const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
  if (on && !Sound.start()) return;
  if (!on) Sound.stop();
  e.currentTarget.setAttribute("aria-pressed", String(on));
});

/* ============ Initial state ============ */
setNav(current);
showPanel(current, false);
setStatus("Now at " + STATIONS[current].label);
requestAnimationFrame(() => { measureRail(); placeCarriage(current); });
window.addEventListener("resize", () => { measureRail(); placeCarriage(robot ? robot.railPos() : current); });


/* Interface the robot module uses to read and drive the page */
const App = {
  get current(){ return current; }, get busy(){ return busy; }, get travelOn(){ return travelOn; },
  sections, STATIONS, $, setStatus, showPanel, hidePanel, resetPlate, placeCarriage, Sound
};

/* ============ 3D robot (lazy loaded, optional) ============ */
function hasWebGL(){
  try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }
  catch(e){ return false; }
}
function fallback(){ document.documentElement.classList.add("no-3d"); }

if (!hasWebGL()) { fallback(); return; }
const sc = document.createElement("script");
sc.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
sc.async = true;
sc.onload = () => {
  const ready = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r=>setTimeout(r,1500))]) : Promise.resolve();
  ready.then(() => {
    try { robot = buildRobot(window.THREE, App); document.documentElement.classList.add("robot-on"); }
    catch(err){ console.error(err); fallback(); }
  });
};
sc.onerror = fallback;
document.head.appendChild(sc);
})();

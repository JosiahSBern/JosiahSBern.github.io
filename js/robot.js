/* robot.js: the Three.js arm, its kinematics, and the page-grabbing sequences.
   Loaded before main.js; main.js calls buildRobot(THREE, App) once Three.js arrives. */
function buildRobot(THREE, App){
  const { sections, STATIONS, $, setStatus, showPanel, hidePanel, resetPlate, placeCarriage, Sound } = App;
  const V3 = THREE.Vector3, PI = Math.PI;
  const SPACING = 9;
  const L1 = 1.8, L2 = 1.6, TIP = .52, H = 1.1, REACH = L1 + L2 + TIP - .1;
  const READY = new V3(1.55, 2.45, .85), READY_PITCH = -.5;
  const ROLL = PI/2;          // fingers pinch the tab from above and below
  const GRIP_TAB = .08;

  const stage = $("#stage");
  const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0a11);
  scene.fog = new THREE.Fog(0x0c0a11, 13, 32);
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  const camBase = new V3(), look = new V3();

  scene.add(new THREE.HemisphereLight(0xb4a6d6, 0x07060a, .55));
  const key = new THREE.DirectionalLight(0xf6efff, 1.05);
  key.position.set(4.5, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left:-7,right:7,top:7,bottom:-7,near:1,far:30});
  key.shadow.bias = -.0006;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xa56bff, .8); rim.position.set(-6, 4, -5); scene.add(rim);

  const M = (o) => new THREE.MeshStandardMaterial(o);
  const paint = M({color:0x141218, roughness:.3, metalness:.35});
  const dark = M({color:0x2a2633, roughness:.45, metalness:.5});
  const trim = M({color:0x6a3fd0, roughness:.4, metalness:.2, emissive:0x2a1060, emissiveIntensity:.5});
  const steel = M({color:0x5b5469, roughness:.36, metalness:.55});
  const rubber = M({color:0x0d0b11, roughness:.9});

  const mesh = (g, m, cast=true) => { const x = new THREE.Mesh(g, m); x.castShadow = cast; x.receiveShadow = true; return x; };
  const cylZ = (r, len, m) => { const g = new THREE.CylinderGeometry(r, r, len, 36); g.rotateX(PI/2); return mesh(g, m); };
  const cylX = (r, len, m, x0=0) => { const g = new THREE.CylinderGeometry(r, r, len, 28); g.rotateZ(-PI/2); g.translate(x0 + len/2, 0, 0); return mesh(g, m); };
  const boxX = (l, h, w, m, x0=0) => { const g = new THREE.BoxGeometry(l, h, w); g.translate(x0 + l/2, 0, 0); return mesh(g, m); };

  /* Track: floor, rail and station plates slide past the arm */
  const track = new THREE.Group(); scene.add(track);
  const gc = document.createElement("canvas"); gc.width = gc.height = 128;
  const gx = gc.getContext("2d");
  gx.fillStyle = "#0e0c13"; gx.fillRect(0,0,128,128);
  gx.strokeStyle = "#261d36"; gx.lineWidth = 2; gx.strokeRect(0,0,128,128);
  gx.strokeStyle = "#17121f"; gx.lineWidth = 1; gx.beginPath(); gx.moveTo(64,0); gx.lineTo(64,128); gx.moveTo(0,64); gx.lineTo(128,64); gx.stroke();
  const gridTex = new THREE.CanvasTexture(gc);
  gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping; gridTex.repeat.set(80, 20);
  gridTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const floor = mesh(new THREE.PlaneGeometry(160, 40), M({map:gridTex, roughness:.92, metalness:0}), false);
  floor.rotation.x = -PI/2; floor.position.x = 22; track.add(floor);

  [-.36, .36].forEach(z => { const r = mesh(new THREE.BoxGeometry(160, .07, .09), steel); r.position.set(22, .085, z); track.add(r); });
  const sleeperCount = 170, sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(.16, .05, 1.2), dark, sleeperCount);
  const dummy = new THREE.Object3D();
  for (let i=0;i<sleeperCount;i++){ dummy.position.set(-50 + i*.9, .025, 0); dummy.updateMatrix(); sleepers.setMatrixAt(i, dummy.matrix); }
  sleepers.receiveShadow = true; track.add(sleepers);

  function plateTexture(label){
    const c = document.createElement("canvas"); c.width = 1024; c.height = 320;
    const x = c.getContext("2d");
    x.fillStyle = "#15111d"; x.fillRect(0,0,1024,320);
    x.save(); x.beginPath(); x.rect(0,0,70,320); x.clip();
    for (let i=-4;i<16;i++){ x.fillStyle = i%2 ? "#a56bff" : "#15111d"; x.beginPath(); x.moveTo(0, i*40); x.lineTo(70, i*40-40); x.lineTo(70, i*40); x.lineTo(0, i*40+40); x.fill(); }
    x.restore();
    x.fillStyle = "#eeeaf6"; x.font = "800 150px Archivo, Arial, sans-serif"; x.textBaseline = "middle";
    x.fillText(label, 120, 170);
    const t = new THREE.CanvasTexture(c); t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
  }
  STATIONS.forEach((s, i) => {
    const plate = mesh(new THREE.PlaneGeometry(3.2, 1), M({map:plateTexture(s.label), roughness:.8}), false);
    plate.rotation.x = -PI/2; plate.position.set(i*SPACING + 2.4, .012, 2.4); track.add(plate);
  });

  /* The arm */
  const carriage = mesh(new THREE.BoxGeometry(1.5, .32, 1.1), dark); carriage.position.y = .25; scene.add(carriage);
  [-.5, .5].forEach(x => [-.36, .36].forEach(z => { const w = cylZ(.09, .12, rubber); w.position.set(x, .12, z); scene.add(w); }));
  const base = mesh(new THREE.CylinderGeometry(.42, .48, .4, 40), paint); base.position.y = .61; scene.add(base);

  const yawG = new THREE.Group(); yawG.position.y = .81; scene.add(yawG);
  const turret = mesh(new THREE.CylinderGeometry(.38, .4, .28, 40), dark); turret.position.y = .14; yawG.add(turret);
  const shoulderG = new THREE.Group(); shoulderG.position.y = .29; yawG.add(shoulderG);
  shoulderG.add(cylZ(.3, .58, dark)); shoulderG.add(cylZ(.2, .62, steel));
  shoulderG.add(boxX(L1, .34, .3, paint));
  shoulderG.add(boxX(L1*.55, .05, .31, trim, L1*.22));
  const cable = cylX(.03, L1*.8, rubber, L1*.1); cable.position.set(0, .2, .1); shoulderG.add(cable);
  const elbowG = new THREE.Group(); elbowG.position.x = L1; shoulderG.add(elbowG);
  elbowG.add(cylZ(.24, .44, dark)); elbowG.add(cylZ(.15, .47, steel));
  elbowG.add(cylX(.15, L2, paint));
  const wristG = new THREE.Group(); wristG.position.x = L2; elbowG.add(wristG);
  wristG.add(cylZ(.15, .36, dark));
  const rollG = new THREE.Group(); wristG.add(rollG);
  rollG.add(cylX(.12, .16, steel, .1));
  rollG.add(boxX(.1, .16, .38, dark, .26));
  const fingers = [-1, 1].map(s => {
    const f = new THREE.Group();
    f.add(boxX(.32, .07, .05, steel, .34));
    const pad = boxX(.14, .075, .02, rubber, .52); pad.position.z = -s*.03; f.add(pad);
    rollG.add(f); f.userData.s = s; return f;
  });
  const tip = new THREE.Object3D(); tip.position.x = TIP; rollG.add(tip);
  const tipLight = new THREE.PointLight(0xb98aff, .7, 3); tipLight.position.x = TIP; rollG.add(tipLight);

  /* Kinematics */
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  function ik(p, pitch, roll){
    const q1 = Math.atan2(-p.z, p.x);
    const r = Math.hypot(p.x, p.z), y = p.y - H;
    const wx = r - TIP*Math.cos(pitch), wy = y - TIP*Math.sin(pitch);
    const d = clamp(Math.hypot(wx, wy), Math.abs(L1-L2) + .05, L1 + L2 - .02);
    const q3 = -Math.acos(clamp((d*d - L1*L1 - L2*L2) / (2*L1*L2), -1, 1));
    const q2 = clamp(Math.atan2(wy, wx) - Math.atan2(L2*Math.sin(q3), L1 + L2*Math.cos(q3)), -.4, 2.8);
    return [q1, q2, q3, pitch - q2 - q3, roll];
  }

  const q = ik(READY, READY_PITCH, 0), cmd = q.slice(), v = [0,0,0,0,0], dist = [0,0,0,0,0];
  let g = .05, gCmd = .05;
  const K = 240, D = 2*.74*Math.sqrt(K);

  let armToken = 0;
  const claim = () => ++armToken;
  const tweens = new Set();
  const minJerk = s => s*s*s*(10 - 15*s + 6*s*s);
  function tween(dur, fn, token){ return new Promise(res => tweens.add({t:0, dur:Math.max(dur, .001), fn, token, res})); }
  const sleepS = (s, token) => tween(s, () => {}, token);
  function moveJ(target, dur, token){
    const from = cmd.slice();
    return tween(dur, e => { for (let i=0;i<5;i++) cmd[i] = from[i] + (target[i]-from[i])*e; }, token);
  }
  function moveL(p0, p1, pitch0, pitch1, roll, dur, token){
    const p = new V3();
    return tween(dur, e => { p.copy(p0).lerp(p1, e); const t = ik(p, pitch0 + (pitch1-pitch0)*e, roll); for (let i=0;i<5;i++) cmd[i] = t[i]; }, token);
  }
  function grip(target, dur, token){ const from = gCmd; return tween(dur, e => { gCmd = from + (target-from)*e; }, token); }

  /* Screen <-> workspace */
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), shoulder = new V3(0, H, 0);
  function screenTo3D(sx, sy){
    const cr = canvas.getBoundingClientRect();
    ndc.set(((sx - cr.left)/cr.width)*2 - 1, -((sy - cr.top)/cr.height)*2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const o = raycaster.ray.origin, d = raycaster.ray.direction;
    // the point on this sight line closest to the shoulder keeps the tip exactly under the cursor point
    let t = Math.max(0, shoulder.clone().sub(o).dot(d));
    let p = o.clone().addScaledVector(d, t);
    if (p.y < .35 && d.y < 0){ t = (.35 - o.y)/d.y; p = o.clone().addScaledVector(d, t); }
    const off = p.clone().sub(shoulder);
    if (off.length() > REACH) p = shoulder.clone().addScaledVector(off.normalize(), REACH);
    return p;
  }
  function approach(p, back=.38){
    const off = p.clone().sub(shoulder), L = off.length() || 1;
    const pitch = clamp(Math.asin(off.y / L), -1.35, .9);
    const hr = Math.hypot(p.x, p.z) || 1;
    const a = new V3(p.x/hr*Math.cos(pitch), Math.sin(pitch), p.z/hr*Math.cos(pitch));
    return { pitch, pre: p.clone().addScaledVector(a, -back) };
  }
  const tipW = new V3(), tipS = {x:0, y:0};
  function tipScreen(){
    const cr = canvas.getBoundingClientRect();
    tip.getWorldPosition(tipW).project(camera);
    tipS.x = cr.left + (tipW.x + 1)/2*cr.width; tipS.y = cr.top + (1 - tipW.y)/2*cr.height;
    return tipS;
  }
  function tabCenter(el){ const r = el.querySelector(".grab-tab").getBoundingClientRect(); return {x:r.left + r.width/2, y:r.top + r.height/2}; }

  /* Holding a page: the plate follows the gripper tip every frame */
  let held = null;
  function hold(el, bx, by, r0){
    const t = tipScreen();
    held = {el, bx, by, r0, t0x:t.x, t0y:t.y, d0:Math.hypot(bx, by) || 1, x:bx, y:by, r:r0};
    el.classList.remove("settling"); el.classList.add("held");
  }
  function updateHeld(){
    if (!held) return;
    const t = tipScreen();
    const x = held.bx + t.x - held.t0x, y = held.by + t.y - held.t0y;
    const r = held.r0 ? held.r0 * Math.min(1, Math.hypot(x, y)/held.d0) : clamp(-x*.02 + y*.012, -7, 7);
    held.x = x; held.y = y; held.r = r;
    held.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${r.toFixed(2)}deg)`;
  }
  function drop(el){
    const h = held; held = null;
    el.classList.remove("held"); el.classList.add("dropping");
    el.style.transform = `translate(${h.x - 60}px,${h.y + innerHeight}px) rotate(${h.r + 12}deg)`;
  }
  function release(el){
    held = null;
    el.classList.remove("held"); el.classList.add("settling");
    el.style.transform = "translate(0px,0px) rotate(0deg)";
    setTimeout(() => { el.classList.remove("settling"); el.style.transform = ""; }, 480);
  }
  function present(el, start){
    resetPlate(el);
    el.style.transform = `translate(${start.dx}px,${start.dy + innerHeight*.6}px) rotate(${start.r}deg)`;
    el.classList.add("in-transit");
    void el.offsetWidth;
    el.classList.add("settling");
    el.style.transform = `translate(${start.dx}px,${start.dy}px) rotate(${start.r}deg)`;
  }

  /* Track motion */
  let trackX = -App.current*SPACING, trackV = 0, trackA = 0, prevTrackX = trackX, prevTrackV = 0;
  track.position.x = trackX;
  function travelTrack(from, to, dur){ return tween(dur, e => { trackX = -(from + (to-from)*e) * SPACING; }); }

  let motionOn = App.travelOn, mobile = false;
  let pointing = false, pointUntil = 0, laserEl = null;

  async function transport(from, to, label){
    const tk = claim(); pointing = false; laserEl = null; hideLaser();
    const W = innerWidth, Hh = innerHeight;
    const oldEl = sections[from], newEl = sections[to];

    // 1. Reach for the current page's tab and grab it
    const hA = tabCenter(oldEl);
    const pA = screenTo3D(hA.x, hA.y), aA = approach(pA);
    setStatus("Grabbing the page");
    await Promise.all([moveJ(ik(aA.pre, aA.pitch, ROLL), .8, tk), grip(1, .4, tk)]);
    await moveL(aA.pre, pA, aA.pitch, aA.pitch, ROLL, .34, tk);
    await sleepS(.05, tk);
    await grip(GRIP_TAB, .18, tk); Sound.click();
    hold(oldEl, 0, 0, 0);

    // 2. Yank it out of the way and let it fall
    setStatus("Taking you to " + label);
    const pull = mobile ? {x:hA.x - .2*W, y:hA.y + .14*Hh} : {x:hA.x - .08*W, y:hA.y + .24*Hh};
    const pP = screenTo3D(pull.x, pull.y), aP = approach(pP);
    await moveL(pA, pP, aA.pitch, aP.pitch, ROLL, .55, tk);
    await grip(1, .12, tk); Sound.click();
    drop(oldEl);
    setTimeout(() => { if (!oldEl.classList.contains("is-active") || oldEl.classList.contains("dropping")) hidePanel(from); }, 820);

    // 3. Ride the rail to the next station; the next page rises into reach
    const tdur = 1.2 + .28*Math.abs(to - from);
    const hB = tabCenter(newEl);
    const start = mobile ? {dx:.2*W, dy:.16*Hh, r:5} : {dx:-.03*W, dy:.32*Hh, r:-6};
    const pS = screenTo3D(hB.x + start.dx, hB.y + start.dy), aS = approach(pS);
    const pB = screenTo3D(hB.x, hB.y), aB = approach(pB);
    await Promise.all([
      (async () => {
        await moveJ(ik(READY, READY_PITCH, 0), .7, tk);
        await sleepS(Math.max(0, tdur - 1.3), tk);
        await moveJ(ik(aS.pre, aS.pitch, ROLL), .8, tk);
      })(),
      travelTrack(from, to, tdur),
      (async () => { await sleepS(Math.max(0, tdur - .55)); present(newEl, start); })()
    ]);

    // 4. Grab the new page and pull it into place
    setStatus("Bringing in " + label);
    await sleepS(.2, tk);
    await moveL(aS.pre, pS, aS.pitch, aS.pitch, ROLL, .34, tk);
    await grip(GRIP_TAB, .18, tk); Sound.click();
    hold(newEl, start.dx, start.dy, start.r);
    await moveL(pS, pB, aS.pitch, aB.pitch, ROLL, .75, tk);
    await sleepS(.05, tk);
    await grip(1, .14, tk); Sound.click();
    release(newEl);
    newEl.classList.remove("in-transit");
    showPanel(to, true);
    setStatus("Now at " + label);
    await moveL(pB, aB.pre, aB.pitch, aB.pitch, ROLL, .3, tk);
    moveJ(ik(READY, READY_PITCH, 0), 1.0, tk);
    grip(.05, .45, tk);
  }

  function snapTo(i){
    claim(); tweens.forEach(tw => tw.res(false)); tweens.clear();
    if (held){ held.el.classList.remove("held"); held.el.style.transform = ""; held = null; }
    trackX = -i*SPACING; prevTrackX = trackX; trackV = trackA = prevTrackV = 0;
    const t = ik(READY, READY_PITCH, 0);
    for (let k=0;k<5;k++){ cmd[k] = q[k] = t[k]; v[k] = 0; }
    gCmd = g = .05;
    pointing = false; laserEl = null; hideLaser();
  }

  /* Pointing at page elements, with a laser line */
  async function pointAt(el){
    if (App.busy) return;
    const tk = claim();
    pointing = true; pointUntil = performance.now() + 7000; laserEl = null; hideLaser();
    const r = el.getBoundingClientRect();
    const target = screenTo3D(r.left + Math.min(r.width/2, 60), r.top + Math.min(r.height/2, 40));
    const a = approach(target, .9);
    if (motionOn){
      await Promise.all([moveJ(ik(a.pre, a.pitch, 0), .8, tk), grip(.45, .4, tk)]);
    } else {
      const t = ik(a.pre, a.pitch, 0); for (let k=0;k<5;k++){ cmd[k] = q[k] = t[k]; v[k] = 0; } gCmd = g = .45;
    }
    if (tk === armToken) laserEl = el;
  }
  function clearPoint(){ laserEl = null; hideLaser(); pointUntil = 0; }

  const laser = $("#laser"), lLine = $("#laserLine"), lDot = $("#laserDot");
  function hideLaser(){ laser.classList.remove("on"); }
  function updateLaser(){
    if (!laserEl || !laserEl.isConnected || laserEl.closest("[inert]") || laserEl.hidden){ if (laser.classList.contains("on")) hideLaser(); return; }
    const r = laserEl.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight || r.width === 0){ hideLaser(); return; }
    const t = tipScreen();
    const tx = clamp(t.x, r.left, r.right), ty = clamp(t.y, r.top + 10, Math.max(r.top + 10, Math.min(r.bottom - 10, r.top + 40)));
    lLine.setAttribute("x1", t.x); lLine.setAttribute("y1", t.y); lLine.setAttribute("x2", tx); lLine.setAttribute("y2", ty);
    lDot.setAttribute("cx", tx); lDot.setAttribute("cy", ty);
    laser.classList.add("on");
  }

  /* Idle: look around, flex the gripper */
  (async function idle(){
    for (;;){
      await new Promise(r => setTimeout(r, 2400 + Math.random()*2600));
      if (App.busy || !motionOn || document.hidden) continue;
      if (pointing && performance.now() < pointUntil) continue;
      if (pointing){ pointing = false; laserEl = null; hideLaser(); }
      const tk = claim();
      const p = READY.clone().add(new V3((Math.random()-.5)*.9, (Math.random()-.5)*.6, (Math.random()-.5)*1.2));
      await moveJ(ik(p, READY_PITCH + (Math.random()-.5)*.8, (Math.random()-.5)*1.2), 1.6 + Math.random()*.8, tk);
      if (tk === armToken && Math.random() < .45){ await grip(.75, .35, tk); await grip(.05, .35, tk); }
    }
  })();

  function resize(){
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    mobile = innerWidth <= 820;
    camera.aspect = w / h;
    if (mobile){
      camera.fov = 44; camBase.set(1.5, 4.4, 11.5); look.set(1.4, 1.5, .6); camera.setViewOffset(w, h, 0, h*.2, w, h);
    } else {
      camera.fov = 36; camBase.set(1.2, 3.6, 9.8); look.set(1.4, 1.45, .6); camera.setViewOffset(w, h, w*.2, 0, w, h);
    }
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  const els = [0,1,2,3,4].map(i => $("#j"+i)), railEl = $("#railPos"), gripEl = $("#gripState");
  let last = performance.now(), frame = 0, camOff = 0, time = 0;
  function loop(now){
    requestAnimationFrame(loop);
    const rdt = Math.min((now - last)/1000, 1/20); last = now;
    const dt = rdt * window.__timeScale; time += rdt;

    for (const tw of tweens){
      if (tw.token !== undefined && tw.token !== armToken){ tweens.delete(tw); tw.res(false); continue; }
      tw.t += dt; const s = Math.min(tw.t / tw.dur, 1);
      tw.fn(minJerk(s));
      if (s >= 1){ tweens.delete(tw); tw.res(true); }
    }

    track.position.x = trackX;
    trackV = dt > 0 ? (trackX - prevTrackX)/dt : 0;
    trackA = dt > 0 ? (trackV - prevTrackV)/dt : 0;
    prevTrackX = trackX; prevTrackV = trackV;
    dist[0] = clamp(trackA, -40, 40) * .55;
    dist[3] = clamp(trackA, -40, 40) * .4;

    let speed = Math.abs(trackV)*.06;
    const hstep = dt/2;
    for (let n=0;n<2;n++) for (let i=0;i<5;i++){
      const a = K*(cmd[i]-q[i]) - D*v[i] + dist[i];
      v[i] += a*hstep; q[i] += v[i]*hstep;
    }
    for (let i=0;i<5;i++) speed += Math.abs(v[i]);
    g += (gCmd - g) * Math.min(1, dt*14);

    const jit = i => motionOn && !held ? Math.sin(time*(1.7+i*.37) + i*2.1)*.004 : 0;
    yawG.rotation.y = q[0] + jit(0);
    shoulderG.rotation.z = q[1] + jit(1);
    elbowG.rotation.z = q[2] + jit(2);
    wristG.rotation.z = q[3] + jit(3);
    rollG.rotation.x = q[4];
    fingers.forEach(f => { f.position.z = f.userData.s * (.075 + g*.13); });

    camOff += ((-trackV*.035) - camOff) * Math.min(1, rdt*3);
    camera.position.set(camBase.x + camOff, camBase.y + Math.sin(time*.35)*.04, camBase.z);
    camera.lookAt(look.x + camOff*.5, look.y, look.z);

    renderer.render(scene, camera);
    updateHeld();
    updateLaser();
    Sound.update(speed);

    if ((frame++ & 3) === 0){
      for (let i=0;i<5;i++) els[i].textContent = (q[i]*180/PI).toFixed(1) + "°";
      railEl.textContent = (-trackX).toFixed(2) + " m";
      gripEl.textContent = held ? "Holding page" : (g > .6 ? "Open" : "Closed");
    }
    if (App.busy) placeCarriage(-trackX / SPACING);
  }
  requestAnimationFrame(loop);

  return {
    transport, snapTo, pointAt, clearPoint,
    railPos: () => -trackX / SPACING,
    setMotion(on){ motionOn = on; if (!on && !App.busy) snapTo(App.current); }
  };
}

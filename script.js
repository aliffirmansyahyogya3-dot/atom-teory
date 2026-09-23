/* ============================================================
   THE EVOLUTION OF THE ATOM — script.js
   Vanilla JS: model data, 3D-via-CSS rendering, drag/zoom controls,
   timeline, comparison table, gold-foil demo, scroll reveals.
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. Model data ---------- */
const MODELS = [
  { id:'dalton', name:'Dalton Model', short:'Solid Sphere', scientist:'John Dalton', year:'1803',
    tagline:'Matter is made of tiny, indivisible solid spheres.',
    points:[
      'Matter is composed of tiny particles called atoms.',
      'Atoms of the same element are identical to one another.',
      'Atoms of different elements differ in mass and properties.',
      'Atoms combine in simple, whole-number ratios to form compounds.',
      'Atoms were considered indivisible, with no internal structure.'
    ],
    structure:'Solid, indivisible sphere', electron:'Not part of the model',
    contribution:'First evidence-based atomic theory',
    limitation:'No internal structure; cannot explain electric charge',
    why:'The discovery of the electron in 1897 showed atoms have parts inside them.' },
  { id:'thomson', name:'Thomson Model', short:'Plum Pudding', scientist:'J. J. Thomson', year:'1904',
    tagline:'Negatively charged electrons embedded in a positive sphere.',
    points:[
      'Thomson discovered the electron using cathode ray tubes.',
      'The atom contains negatively charged electrons.',
      'Positive charge is believed to be spread evenly through the atom.',
      'Electrons sit inside the positive charge, like plums in a pudding.'
    ],
    structure:'Diffuse positive sphere with embedded electrons', electron:'Scattered points of negative charge',
    contribution:'First model to include a subatomic particle',
    limitation:'Could not explain the gold foil scattering results',
    why:"Rutherford's 1909 gold foil experiment revealed a concentrated nucleus." },
  { id:'rutherford', name:'Rutherford Model', short:'Nuclear Model', scientist:'Ernest Rutherford', year:'1911',
    tagline:'A tiny, dense nucleus surrounded by mostly empty space.',
    points:[
      "The atom has a tiny, dense, positively charged nucleus.",
      "Most of the atom's volume is empty space.",
      'Electrons move around the nucleus at a distance.',
      'Proposed after the gold foil scattering experiment.'
    ],
    structure:'Dense nucleus with distant orbiting electrons', electron:'Orbiting particles, path unspecified',
    contribution:'Discovered the atomic nucleus',
    limitation:"Could not explain why electrons don't spiral into the nucleus",
    why:'Classical physics predicted orbiting electrons should lose energy and collapse.' },
  { id:'bohr', name:'Bohr Model', short:'Planetary / Shell', scientist:'Niels Bohr', year:'1913',
    tagline:'Electrons occupy fixed energy levels around the nucleus.',
    points:[
      'Electrons occupy specific, quantized energy levels (shells).',
      'Electrons jump between levels by absorbing or emitting energy.',
      'Each shell has a fixed energy and radius.',
      "Explained hydrogen's line emission spectrum."
    ],
    structure:'Nucleus with electrons in fixed circular shells', electron:'Quantized circular orbits (n = 1, 2, 3…)',
    contribution:'Explained atomic spectra with quantized energy',
    limitation:'Only accurate for hydrogen; orbits are too simple',
    why:"Quantum mechanics showed electrons don't follow fixed circular paths." },
  { id:'quantum', name:'Quantum Mechanical Model', short:'Electron Cloud', scientist:'Schrödinger, Heisenberg, de Broglie', year:'1926 onward',
    tagline:'Electrons exist as probability clouds, not fixed paths.',
    points:[
      'Electrons are described by probability distributions called orbitals.',
      "Heisenberg's uncertainty principle: position and momentum can't both be known precisely.",
      'Electrons behave as waves, described by wavefunctions.',
      'Orbitals (s, p, d…) are regions of high probability, not orbits.'
    ],
    structure:'Nucleus surrounded by probability-cloud orbitals', electron:'Wave-like probability distributions',
    contribution:'Most accurate model; foundation of modern chemistry',
    limitation:'Abstract and mathematically complex',
    why:'Currently the accepted model — refined further, but not replaced.' }
];

/* ---------- 2. State ---------- */
const state = { index:0, autoRotate:true, playing:true, zoom:1, rotX:-15, rotY:0,
  dragging:false, lastX:0, lastY:0, shellCount:3, electronCount:8, speed:6, orbital:'s', density:1 };

const $ = id => document.getElementById(id);
const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };

/* ---------- 3. Starfield background (hero) ---------- */
function initStarfield(){
  const canvas = $('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize(){
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    stars = Array.from({length:90}, () => ({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height,
      r:Math.random()*1.4+.3, s:Math.random()*.6+.15, p:Math.random()*Math.PI*2
    }));
  }
  window.addEventListener('resize', resize); resize();
  function draw(t){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#eaf2ff';
    stars.forEach(st=>{
      const twinkle = reduceMotion ? .8 : .5 + Math.sin(t/900 + st.p)*.4;
      ctx.globalAlpha = Math.max(.15, twinkle) * st.s + .2;
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

/* ---------- 4. Building an atom visual for a given model ---------- */
function buildAtom(container, model, opts={}){
  container.innerHTML = '';
  container.className = 'atom-3d model-' + model.id;
  const nucleus = el('div', 'nucleus');
  container.appendChild(nucleus);

  if (model.id === 'dalton'){
    nucleus.addEventListener('click', () => nucleus.classList.toggle('pulse'));
    return;
  }
  if (model.id === 'thomson'){
    nucleus.classList.add('cloudy');
    const count = opts.electronCount || state.electronCount;
    for (let i=0;i<count;i++){
      const e = el('div','electron embedded');
      const a = Math.random()*Math.PI*2, r = 18+Math.random()*55;
      e.style.setProperty('--ex', (Math.cos(a)*r)+'px');
      e.style.setProperty('--ey', (Math.sin(a)*r)+'px');
      e.style.setProperty('--ez', (Math.random()*70-35)+'px');
      if (opts.hideElectrons) e.style.display = 'none';
      container.appendChild(e);
    }
    return;
  }
  if (model.id === 'rutherford'){
    nucleus.classList.add('small');
    const speed = opts.speed || state.speed;
    for (let i=0;i<3;i++){
      const ring = el('div','orbit-ring' + (opts.paused ? ' paused':''));
      ring.style.setProperty('--tilt', (58+i*10)+'deg');
      ring.style.setProperty('--radius', (85+i*34)+'px');
      ring.style.setProperty('--dur', Math.max(1, speed - i)+'s');
      const spin = el('div','orbit-spin');
      const e = el('div','electron orbiting');
      spin.appendChild(e); ring.appendChild(spin);
      container.appendChild(ring);
    }
    return;
  }
  if (model.id === 'bohr'){
    const shells = opts.shellCount || state.shellCount;
    for (let s=0;s<shells;s++){
      const radius = 55 + s*38;
      const label = el('div','shell-label');
      label.style.setProperty('--radius', radius+'px');
      label.textContent = 'n=' + (s+1);
      container.appendChild(label);

      const ring = el('div','orbit-ring');
      ring.style.setProperty('--tilt','68deg');
      ring.style.setProperty('--radius', radius+'px');
      ring.style.setProperty('--dur', (3.5 + s*1.6)+'s');
      const spin = el('div','orbit-spin');
      const e = el('div','electron shell-electron');
      e.title = 'Click to trigger a transition';
      e.addEventListener('click', () => triggerTransition(e));
      spin.appendChild(e); ring.appendChild(spin);
      container.appendChild(ring);
    }
    return;
  }
  if (model.id === 'quantum'){
    nucleus.classList.add('small');
    const canvas = el('canvas','cloud-canvas');
    container.appendChild(canvas);
    startCloud(canvas, opts.orbital || state.orbital, opts.density || state.density);
    return;
  }
}

function triggerTransition(electronEl){
  if (reduceMotion) return;
  electronEl.style.boxShadow = '0 0 22px 8px #fff, 0 0 10px var(--purple)';
  setTimeout(()=> electronEl.style.boxShadow = '', 350);
}

/* Quantum probability cloud, drawn on a canvas layered inside the atom */
let cloudRAF = null;
function startCloud(canvas, orbital, density){
  if (cloudRAF) cancelAnimationFrame(cloudRAF);
  function size(){ canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  size(); window.addEventListener('resize', size);
  const ctx = canvas.getContext('2d');
  const count = Math.round(220 * density);
  function frame(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const cx = canvas.width/2, cy = canvas.height/2;
    for (let i=0;i<count;i++){
      let x, y;
      if (orbital === 'p'){
        const lobe = Math.random() < .5 ? -1 : 1;
        const t = Math.random()*Math.PI*2, r = Math.abs(randNorm())*46;
        x = Math.sin(t)*r*.5;
        y = lobe*(20 + Math.abs(randNorm())*55);
      } else {
        const r = Math.abs(randNorm())*70;
        const t = Math.random()*Math.PI*2;
        x = Math.cos(t)*r; y = Math.sin(t)*r;
      }
      ctx.globalAlpha = .18 + Math.random()*.25;
      ctx.fillStyle = orbital === 'p' ? '#a78bfa' : '#60a5fa';
      ctx.beginPath(); ctx.arc(cx+x, cy+y, 1.6, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!reduceMotion) cloudRAF = requestAnimationFrame(frame); else cloudRAF = null;
  }
  frame();
  if (reduceMotion){ // draw a couple of static frames for texture
    for(let i=0;i<3;i++) frame();
  }
}
function randNorm(){ // quick Gaussian-ish via sum of uniforms
  return (Math.random()+Math.random()+Math.random()-1.5)/1.5;
}

/* ---------- 5. Drag-to-rotate + zoom (generic, reused by hero & model stage) ---------- */
function attachControls(stageEl, atomEl, rot){
  function apply(){ atomEl.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${rot.zoom})`; }
  function start(x,y){ rot.dragging = true; rot.lastX = x; rot.lastY = y; }
  function move(x,y){
    if (!rot.dragging) return;
    rot.y += (x - rot.lastX) * .4;
    rot.x -= (y - rot.lastY) * .4;
    rot.x = Math.max(-80, Math.min(80, rot.x));
    rot.lastX = x; rot.lastY = y; apply();
  }
  function end(){ rot.dragging = false; }
  stageEl.addEventListener('pointerdown', e => { start(e.clientX, e.clientY); stageEl.setPointerCapture(e.pointerId); });
  stageEl.addEventListener('pointermove', e => move(e.clientX, e.clientY));
  stageEl.addEventListener('pointerup', end);
  stageEl.addEventListener('pointercancel', end);
  apply();
  if (!reduceMotion){
    (function auto(){
      if (rot.autoRotate && !rot.dragging) { rot.y += .15; apply(); }
      requestAnimationFrame(auto);
    })();
  }
  return apply;
}

/* ---------- 6. Timeline + model panel wiring ---------- */
const heroRot = { x:-15, y:0, zoom:1, dragging:false, lastX:0, lastY:0, autoRotate:true };
const modelRot = { x:-15, y:0, zoom:1, dragging:false, lastX:0, lastY:0, autoRotate:true };
let applyModelTransform;

function buildTimeline(){
  const track = $('timelineTrack');
  MODELS.forEach((m, i) => {
    const btn = el('button','tl-item');
    btn.setAttribute('role','option');
    btn.innerHTML = `<div class="tl-year">${m.year}</div><div class="tl-name">${m.short}</div>`;
    btn.addEventListener('click', () => selectModel(i));
    track.appendChild(btn);
  });
}

function buildExtras(model){
  const box = $('modelExtra'); box.innerHTML = '';
  const make = (labelText, inputEl) => { const l = el('label'); l.append(labelText, inputEl); box.appendChild(l); return inputEl; };

  if (model.id === 'dalton'){
    const slider = document.createElement('input');
    slider.type='range'; slider.min='40'; slider.max='110'; slider.value='70';
    slider.addEventListener('input', () => {
      $('modelAtom').querySelector('.nucleus').style.width = slider.value+'px';
      $('modelAtom').querySelector('.nucleus').style.height = slider.value+'px';
      $('modelAtom').querySelector('.nucleus').style.margin = (-slider.value/2)+'px 0 0 '+(-slider.value/2)+'px';
    });
    make('Atom size', slider);
  }
  if (model.id === 'thomson'){
    const slider = document.createElement('input');
    slider.type='range'; slider.min='2'; slider.max='16'; slider.value=state.electronCount;
    slider.addEventListener('input', () => { state.electronCount = +slider.value; rebuildModel(); });
    make('Number of electrons', slider);
    const toggle = document.createElement('button'); toggle.className='ctrl-btn'; toggle.textContent='Toggle electrons';
    toggle.addEventListener('click', () => {
      $('modelAtom').querySelectorAll('.electron').forEach(e => e.style.display = e.style.display==='none' ? '' : 'none');
    });
    box.appendChild(toggle);
  }
  if (model.id === 'rutherford'){
    const toggle = document.createElement('button'); toggle.className='ctrl-btn'; toggle.textContent='Start / stop motion';
    toggle.addEventListener('click', () => $('modelAtom').querySelectorAll('.orbit-ring').forEach(r => r.classList.toggle('paused')));
    box.appendChild(toggle);
    const slider = document.createElement('input');
    slider.type='range'; slider.min='2'; slider.max='10'; slider.value=state.speed;
    slider.addEventListener('input', () => { state.speed = +slider.value; rebuildModel(); });
    make('Electron speed', slider);
  }
  if (model.id === 'bohr'){
    const addBtn = document.createElement('button'); addBtn.className='ctrl-btn'; addBtn.textContent='+ Shell';
    const rmBtn = document.createElement('button'); rmBtn.className='ctrl-btn'; rmBtn.textContent='– Shell';
    addBtn.addEventListener('click', () => { state.shellCount = Math.min(5, state.shellCount+1); rebuildModel(); });
    rmBtn.addEventListener('click', () => { state.shellCount = Math.max(1, state.shellCount-1); rebuildModel(); });
    box.append(rmBtn, addBtn);
  }
  if (model.id === 'quantum'){
    const sBtn = document.createElement('button'); sBtn.className='ctrl-btn'; sBtn.textContent='s orbital';
    const pBtn = document.createElement('button'); pBtn.className='ctrl-btn'; pBtn.textContent='p orbital';
    sBtn.addEventListener('click', () => { state.orbital='s'; rebuildModel(); });
    pBtn.addEventListener('click', () => { state.orbital='p'; rebuildModel(); });
    box.append(sBtn, pBtn);
    const slider = document.createElement('input');
    slider.type='range'; slider.min='.4'; slider.max='2'; slider.step='.1'; slider.value=state.density;
    slider.addEventListener('input', () => { state.density = +slider.value; rebuildModel(); });
    make('Probability density', slider);
  }
}

function rebuildModel(){
  const model = MODELS[state.index];
  buildAtom($('modelAtom'), model, state);
  applyModelTransform && applyModelTransform();
}

function selectModel(i){
  state.index = (i + MODELS.length) % MODELS.length;
  const model = MODELS[state.index];

  document.querySelectorAll('.tl-item').forEach((btn, idx) => btn.classList.toggle('active', idx === state.index));
  document.querySelectorAll('#compareBody tr').forEach(tr => tr.classList.toggle('active-row', tr.dataset.id === model.id));

  $('modelCount').textContent = `Model ${state.index+1} of ${MODELS.length}`;
  $('modelTitle').textContent = model.name;
  $('modelScientist').textContent = model.scientist;
  $('modelYear').textContent = model.year;
  $('modelTagline').textContent = model.tagline;
  $('modelWhy').textContent = model.why;
  const list = $('modelPoints'); list.innerHTML = '';
  model.points.forEach(p => { const li = document.createElement('li'); li.textContent = p; list.appendChild(li); });

  buildAtom($('modelAtom'), model, state);
  buildExtras(model);
}

/* ---------- 7. Model view controls ---------- */
function initModelControls(){
  $('prevBtn').addEventListener('click', () => selectModel(state.index-1));
  $('nextBtn').addEventListener('click', () => selectModel(state.index+1));
  $('autoRotateBtn').addEventListener('click', () => {
    modelRot.autoRotate = !modelRot.autoRotate;
    $('autoRotateBtn').setAttribute('aria-pressed', modelRot.autoRotate);
  });
  $('playPauseBtn').addEventListener('click', () => {
    state.playing = !state.playing;
    $('playPauseBtn').textContent = state.playing ? 'Pause motion' : 'Play motion';
    $('playPauseBtn').setAttribute('aria-pressed', state.playing);
    $('modelAtom').querySelectorAll('.orbit-ring').forEach(r => r.classList.toggle('paused', !state.playing));
  });
  $('zoomInBtn').addEventListener('click', () => { modelRot.zoom = Math.min(2, modelRot.zoom+.15); applyModelTransform(); });
  $('zoomOutBtn').addEventListener('click', () => { modelRot.zoom = Math.max(.5, modelRot.zoom-.15); applyModelTransform(); });
  $('resetViewBtn').addEventListener('click', () => { modelRot.x=-15; modelRot.y=0; modelRot.zoom=1; applyModelTransform(); });
}

/* ---------- 8. Comparison table ---------- */
function buildCompareTable(){
  const body = $('compareBody');
  MODELS.forEach((m, i) => {
    const tr = document.createElement('tr'); tr.dataset.id = m.id;
    tr.innerHTML = `<td>${m.name}</td><td>${m.scientist}</td><td>${m.year}</td><td>${m.structure}</td><td>${m.electron}</td><td>${m.contribution}</td><td>${m.limitation}</td>`;
    tr.addEventListener('click', () => { selectModel(i); document.getElementById('models').scrollIntoView({behavior:'smooth'}); });
    body.appendChild(tr);
  });
}

/* ---------- 9. Gold foil demo ---------- */
function initFoilDemo(){
  const canvas = $('foilCanvas'), ctx = canvas.getContext('2d');
  let straight=0, deflected=0, bounced=0, particles=[];
  const nucleusX = canvas.width*0.55, nucleusY = canvas.height/2;

  function drawFoilScene(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='rgba(167,139,250,.18)';
    ctx.fillRect(canvas.width*0.5-3,0,6,canvas.height);
    ctx.fillStyle='#a78bfa'; ctx.font='11px sans-serif'; ctx.fillText('gold foil', canvas.width*0.5-22, 14);
    // sparse nuclei dots along the foil
    ctx.fillStyle='rgba(167,139,250,.9)';
    for (let y=10;y<canvas.height;y+=canvas.height/5){ ctx.beginPath(); ctx.arc(canvas.width*0.5, y, 3, 0, 7); ctx.fill(); }
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, 7); ctx.fill();
    });
  }
  function fire(){
    for (let i=0;i<14;i++){
      const y = 20 + Math.random()*(canvas.height-40);
      const roll = Math.random();
      let outcome;
      if (roll < 0.85) outcome='straight'; else if (roll < 0.98) outcome='deflect'; else outcome='bounce';
      particles.push({ x:0, y, vy:0, outcome, color:'#22d3ee', started:false, delay:i*60 });
    }
  }
  let last = performance.now();
  function loop(now){
    const dt = now-last; last=now;
    particles.forEach(p => {
      if (p.delay > 0){ p.delay -= dt; return; }
      p.started = true;
      const nearFoil = Math.abs(p.x - canvas.width*0.5) < 40;
      if (p.outcome==='deflect' && nearFoil && !p.turned){ p.vy = (p.y < nucleusY ? -0.4 : 0.4); p.turned = true; }
      if (p.outcome==='bounce' && nearFoil && !p.turned){ p.vx = -1.4; p.turned = true; bounced++; updateStats(); p.color='#f87171'; }
      p.vx = p.vx===undefined ? 1.6 : p.vx;
      p.x += p.vx * (dt/16); p.y += (p.vy||0) * (dt/16);
      if (p.turned && p.outcome==='deflect' && !p.counted){ p.counted=true; deflected++; p.color='#facc15'; updateStats(); }
      if (p.outcome==='straight' && p.x > canvas.width*0.5 && !p.counted){ p.counted=true; straight++; updateStats(); }
    });
    particles = particles.filter(p => p.x > -10 && p.x < canvas.width+10);
    drawFoilScene();
    requestAnimationFrame(loop);
  }
  function updateStats(){ $('foilStats').textContent = `Straight through: ${straight} · Deflected: ${deflected} · Bounced back: ${bounced}`; }
  $('fireBtn').addEventListener('click', fire);
  $('resetFoilBtn').addEventListener('click', () => { particles=[]; straight=deflected=bounced=0; updateStats(); });
  drawFoilScene();
  requestAnimationFrame(loop);
}

/* ---------- 10. Nav + scroll reveals ---------- */
function initNav(){
  $('navToggle').addEventListener('click', () => {
    const open = $('navLinks').classList.toggle('open');
    $('navToggle').setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => $('navLinks').classList.remove('open')));
  $('startBtn').addEventListener('click', () => document.getElementById('timeline').scrollIntoView({behavior:'smooth'}));
}

function initReveal(){
  const targets = document.querySelectorAll('.fade-target');
  if (!('IntersectionObserver' in window)){ targets.forEach(t=>t.classList.add('in-view')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
  }, { threshold:.15 });
  targets.forEach(t => io.observe(t));
}

/* ---------- 11. Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  initNav();
  initReveal();

  buildAtom($('heroAtom'), MODELS[3]); // hero shows the Bohr model as the iconic "atom" image
  attachControls($('heroStage'), $('heroAtom'), heroRot);

  buildTimeline();
  applyModelTransform = attachControls($('modelStage'), $('modelAtom'), modelRot);
  buildCompareTable();
  selectModel(0);
  initModelControls();
  initFoilDemo();
});

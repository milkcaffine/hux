(function () {
  var canvas = document.getElementById('spaceBgCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var pillAudio = document.getElementById('spaceAudioBtn');
  var pillCount = document.getElementById('spaceSalvageCount');

  var w = 0;
  var h = 0;
  var dpr = 1;
  var mouseX = 0.5;
  var mouseY = 0.5;
  var salvaged = 0;

  var stars = [];
  var junk = [];
  var bursts = [];

  var JUNK_TYPES = ['sat', 'panel', 'capsule', 'bolt', 'shard'];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initStars() {
    stars = [];
    var count = Math.min(130, Math.floor((w * h) / 11000) + 45);
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        baseA: Math.random() * 0.45 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.008,
        depth: Math.random() * 0.8 + 0.2
      });
    }
  }

  function spawnJunk(randomPos) {
    var fromLeft = Math.random() > 0.5;
    var speed = Math.random() * 0.35 + 0.15;
    return {
      x: randomPos ? Math.random() * w : (fromLeft ? -30 : w + 30),
      y: Math.random() * h * 0.9 + h * 0.05,
      vx: (fromLeft ? 1 : -1) * speed,
      vy: (Math.random() - 0.5) * 0.14,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.012,
      size: Math.random() * 4 + 6,
      type: JUNK_TYPES[Math.floor(Math.random() * JUNK_TYPES.length)],
      glow: Math.random() > 0.4 ? 'rgba(56, 189, 248, 0.55)' : 'rgba(245, 185, 66, 0.5)'
    };
  }

  function initJunk() {
    junk = [];
    var count = w < 640 ? 9 : 16;
    for (var i = 0; i < count; i++) {
      junk.push(spawnJunk(true));
    }
  }

  // ===== Web Audio (Quiet Night/Space Synth + Salvage Chime) =====
  var audioCtx = null;
  var masterGain = null;
  var ambientOn = true;

  function ensureAudio() {
    if (!audioCtx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function syncAmbientNodes() {
    var ac = ensureAudio();
    if (!ac) return;
    if (!masterGain) {
      masterGain = ac.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ac.destination);

      var lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 230;
      lp.connect(masterGain);

      var lfo = ac.createOscillator();
      lfo.frequency.value = 0.06;
      var lfoG = ac.createGain();
      lfoG.gain.value = 85;
      lfo.connect(lfoG);
      lfoG.connect(lp.frequency);
      lfo.start();

      [55.0, 82.41, 110.0, 164.81].forEach(function (freq, idx) {
        var osc = ac.createOscillator();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        var g = ac.createGain();
        g.gain.value = [0.18, 0.08, 0.05, 0.025][idx];
        osc.connect(g);
        g.connect(lp);
        osc.start();
      });
    }
    masterGain.gain.setTargetAtTime(ambientOn ? 0.55 : 0, ac.currentTime, 0.25);
  }

  function toggleAmbient() {
    ambientOn = !ambientOn;
    syncAmbientNodes();
    if (pillAudio) {
      pillAudio.classList.toggle('is-on', ambientOn);
      pillAudio.textContent = ambientOn ? '♪ SPACE: ON' : '♪ SPACE: OFF';
    }
  }

  function unlockDefaultAmbient() {
    if (ambientOn && !masterGain) {
      syncAmbientNodes();
    }
    window.removeEventListener('pointerdown', unlockDefaultAmbient);
    window.removeEventListener('keydown', unlockDefaultAmbient);
  }
  window.addEventListener('pointerdown', unlockDefaultAmbient, { passive: true });
  window.addEventListener('keydown', unlockDefaultAmbient, { passive: true });

  function playChime(hit) {
    var ac = ensureAudio();
    if (!ac) return;
    var now = ac.currentTime;
    var osc = ac.createOscillator();
    var g = ac.createGain();
    osc.type = 'sine';
    if (hit) {
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
      g.gain.setValueAtTime(0.09, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    } else {
      osc.frequency.setValueAtTime(329.63, now);
      g.gain.setValueAtTime(0.025, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    }
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  function drawJunkItem(d) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.strokeStyle = d.glow;
    ctx.fillStyle = 'rgba(20, 24, 34, 0.85)';
    ctx.lineWidth = 1.1;

    var s = d.size;
    if (d.type === 'sat') {
      ctx.strokeRect(-s * 0.45, -s * 0.45, s * 0.9, s * 0.9);
      ctx.beginPath();
      ctx.moveTo(-s * 1.4, 0); ctx.lineTo(-s * 0.45, 0);
      ctx.moveTo(s * 0.45, 0); ctx.lineTo(s * 1.4, 0);
      ctx.stroke();
    } else if (d.type === 'panel') {
      ctx.fillRect(-s, -s * 0.45, s * 2, s * 0.9);
      ctx.strokeRect(-s, -s * 0.45, s * 2, s * 0.9);
    } else if (d.type === 'capsule') {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (d.type === 'bolt') {
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, -s * 0.2); ctx.lineTo(s * 0.6, -s * 0.2);
      ctx.lineTo(s * 0.6, s * 0.2); ctx.lineTo(-s * 0.6, s * 0.2);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.7);
      ctx.lineTo(s * 0.6, s * 0.4);
      ctx.lineTo(-s * 0.5, s * 0.5);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  function render() {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, w, h);

    // Subtle radial night-sky glow
    var skyGrad = ctx.createRadialGradient(w * 0.5, h * 0.25, 20, w * 0.5, h * 0.4, Math.max(w, h) * 0.75);
    skyGrad.addColorStop(0, 'rgba(30, 41, 59, 0.14)');
    skyGrad.addColorStop(1, 'rgba(9, 9, 11, 0)');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars with gentle parallax
    var pxOff = (mouseX - 0.5) * 18;
    var pyOff = (mouseY - 0.5) * 18;
    ctx.fillStyle = '#e4e4e7';
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      st.phase += st.speed;
      var a = st.baseA + Math.sin(st.phase) * 0.15;
      ctx.globalAlpha = Math.max(0.05, a);
      var sx = (st.x - pxOff * st.depth + w) % w;
      var sy = (st.y - pyOff * st.depth + h) % h;
      ctx.fillRect(sx, sy, st.r, st.r);
    }
    ctx.globalAlpha = 1;

    // Drifting space junk
    for (var j = 0; j < junk.length; j++) {
      var d = junk[j];
      d.x += d.vx;
      d.y += d.vy;
      d.rot += d.vRot;
      if (d.x < -50 || d.x > w + 50 || d.y < -50 || d.y > h + 50) {
        junk[j] = spawnJunk(false);
      }
      drawJunkItem(d);
    }

    // Capture bursts & ripples
    for (var b = bursts.length - 1; b >= 0; b--) {
      var bt = bursts[b];
      bt.r += bt.hit ? 1.6 : 1.1;
      bt.alpha -= 0.03;
      if (bt.alpha <= 0) {
        bursts.splice(b, 1);
        continue;
      }
      ctx.save();
      ctx.strokeStyle = bt.hit ? 'rgba(56, 189, 248, ' + bt.alpha + ')' : 'rgba(148, 163, 184, ' + (bt.alpha * 0.4) + ')';
      ctx.lineWidth = bt.hit ? 1.4 : 1;
      ctx.beginPath();
      ctx.arc(bt.x, bt.y, bt.r, 0, Math.PI * 2);
      ctx.stroke();
      if (bt.hit && bt.label) {
        ctx.font = '600 10px ui-monospace, monospace';
        ctx.fillStyle = 'rgba(56, 189, 248, ' + bt.alpha + ')';
        ctx.textAlign = 'center';
        ctx.fillText(bt.label, bt.x, bt.y - bt.r - 4);
      }
      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  // Pointer events
  window.addEventListener('mousemove', function (e) {
    mouseX = e.clientX / (w || 1);
    mouseY = e.clientY / (h || 1);
  }, { passive: true });

  document.addEventListener('pointerdown', function (e) {
    // Ignore clicks on interactive UI elements
    if (e.target.closest('a, button, input, .feed > li, .space-hud')) return;

    var cx = e.clientX;
    var cy = e.clientY;
    var bestIdx = -1;
    var bestDist = 42;
    for (var i = 0; i < junk.length; i++) {
      var dist = Math.hypot(junk[i].x - cx, junk[i].y - cy);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1) {
      salvaged++;
      if (pillCount) pillCount.textContent = String(salvaged);
      bursts.push({ x: junk[bestIdx].x, y: junk[bestIdx].y, r: 4, alpha: 0.95, hit: true, label: '+1' });
      junk[bestIdx] = spawnJunk(false);
      playChime(true);
    } else {
      bursts.push({ x: cx, y: cy, r: 2, alpha: 0.55, hit: false });
      playChime(false);
    }
  });

  if (pillAudio) {
    pillAudio.addEventListener('click', toggleAmbient);
  }

  window.addEventListener('resize', function () {
    resize();
    initStars();
  });

  resize();
  initStars();
  initJunk();
  requestAnimationFrame(render);
})();

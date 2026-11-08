/**
 * HighTide Team 4414 — 2026 Technical Binder Interactive Engine
 * Based on https://2026.team4414.com/
 */

const SUBSYSTEMS = {
  full: {
    title: 'RIPCURRENT',
    category: 'FULL ROBOT ASSEMBLY',
    desc: 'Team 4414 HighTide\'s 2026 championship robot designed for high-speed cycle times, sub-second shot latency, and structural unibody integration.',
    image: 'assets/robot-full.webp',
    specs: [
      { label: 'Weight', value: '114.8 lbs' },
      { label: 'Footprint', value: '25″ × 32″' },
      { label: 'Drive Ratio', value: '7.67 : 1' },
      { label: 'Motors', value: '14× Kraken' }
    ]
  },
  turret: {
    title: 'Continuous Turret',
    category: 'TRACKING & TARGETING',
    desc: '55.7:1 reduction with a flex-wheel cable-chain tensioner. Vision-guided continuous 360° target tracking while moving full speed.',
    image: 'assets/detail-turret.webp',
    specs: [
      { label: 'Reduction', value: '55.7 : 1' },
      { label: 'Tensioner', value: 'Flex-Wheel' },
      { label: 'Rotation', value: '360° Continuous' },
      { label: 'Aim Latency', value: '< 20 ms' }
    ]
  },
  shooter: {
    title: 'Flywheel Shooter',
    category: 'BALLISTIC LAUNCHER',
    desc: 'Four Kraken X44s on a 3″ flywheel with independent dual hood geometry for accurate, flat trajectories across the field.',
    image: 'assets/detail-shooter.webp',
    specs: [
      { label: 'Flywheel', value: '3.0″ Balanced' },
      { label: 'Motors', value: '4× Kraken X44' },
      { label: 'Surface Speed', value: '88 ft/s' },
      { label: 'Spin Up', value: '0.35 sec' }
    ]
  },
  drivetrain: {
    title: 'Swerve Drivetrain',
    category: 'MOBILITY & TRACTION',
    desc: '25×32″ swerve drive, geared 7.67:1 for lower current draw and rapid field crossing. Chamfered billet plates with fused AprilTag vision odometry.',
    image: 'assets/detail-drivetrain.webp',
    specs: [
      { label: 'Gear Ratio', value: '7.67 : 1' },
      { label: 'Footprint', value: '25″ × 32″' },
      { label: 'Top Speed', value: '17.4 ft/s' },
      { label: 'Swerve Mod', value: 'Billet Chamfered' }
    ]
  },
  'dye-rotor': {
    title: 'Dye Rotor Agitator',
    category: 'FEEDER & SERIALIZER',
    desc: 'Paintball-inspired dye rotor mechanism optimized for high BPS (balls per second) single-stream loading with zero jamming.',
    image: 'assets/detail-dye-rotor.webp',
    specs: [
      { label: 'Throughput', value: '18+ BPS' },
      { label: 'Anti-Jam', value: 'Dynamic Reverse' },
      { label: 'Geometry', value: 'Centrifugal Spiral' },
      { label: 'Drive', value: 'Direct Planetary' }
    ]
  },
  bumpers: {
    title: 'Structural Bumpers',
    category: 'CHASSIS & INTEGRATION',
    desc: 'Structural bumpers that double as hopper walls and shooter mount, providing superior torsional rigidity and rapid battery access.',
    image: 'assets/detail-bumpers.webp',
    specs: [
      { label: 'Structure', value: 'Carbon / Ply Hybrid' },
      { label: 'Dual Function', value: 'Hopper Wall + Mount' },
      { label: 'Swap Time', value: '15 seconds' },
      { label: 'Mounting', value: 'Quick-Pin' }
    ]
  },
  intake: {
    title: 'High-Throughput Intake',
    category: 'ACQUISITION SYSTEM',
    desc: 'Powered by 2 X60s and 1 X44 bottom bar. Compliant roller geometry for instantaneous touch-and-grab ball acquisition.',
    image: 'assets/detail-intake.webp',
    specs: [
      { label: 'Motors', value: '2× X60 + 1× X44' },
      { label: 'Roller Material', value: '40A Silicone' },
      { label: 'Deploy Time', value: '0.18 sec' },
      { label: 'Coverage', value: 'Full Width' }
    ]
  }
};

class Team4414Wallpaper {
  constructor() {
    this.stageInner = document.getElementById('hero-stage-inner');
    this.images = document.querySelectorAll('.hero-stage-images img');
    this.callouts = document.querySelectorAll('.callout');
    this.svgLeaders = document.getElementById('hero-stage-leaders');
    this.pillsContainer = document.getElementById('pills-container');
    this.pillIndicator = document.getElementById('pill-indicator');
    this.pills = document.querySelectorAll('.pill');

    this.activeKey = 'full';
    this.isOrbiting = true;
    this.orbitAngle = 0;
    this.audioEnabled = false;
    this.theme = 'cream';
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isUserHovering = false;
    this.idleTimer = null;

    this.initAudio();
    this.initCanvas();
    this.initLeaderLines();
    this.initEvents();
    this.initClock();
    this.setActiveSubsystem('full', false);
    this.updatePillIndicator();
    this.animate();
  }

  initAudio() {
    this.audioCtx = null;
  }

  playClick() {
    if (!this.audioEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  initLeaderLines() {
    if (!this.svgLeaders || !this.stageInner) return;
    this.svgLeaders.innerHTML = '';
    const rect = this.stageInner.getBoundingClientRect();
    const w = rect.width || this.stageInner.offsetWidth;
    const h = rect.height || this.stageInner.offsetHeight;

    this.callouts.forEach(callout => {
      const key = callout.dataset.key;
      const style = window.getComputedStyle(callout);
      const parsePct = (val, max) => (parseFloat(val) / 100) * max;

      const lx = parsePct(style.getPropertyValue('--lx'), w);
      const ly = parsePct(style.getPropertyValue('--ly'), h);
      const dx = parsePct(style.getPropertyValue('--dx'), w);
      const dy = parsePct(style.getPropertyValue('--dy'), h);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(lx));
      line.setAttribute('y1', String(ly));
      line.setAttribute('x2', String(dx));
      line.setAttribute('y2', String(dy));
      line.setAttribute('class', 'leader-line');
      line.dataset.key = key;
      this.svgLeaders.appendChild(line);
    });
  }

  setActiveSubsystem(key, sound = true) {
    if (!SUBSYSTEMS[key]) return;
    this.activeKey = key;
    if (sound) this.playClick();

    // 1. Images
    this.images.forEach(img => {
      const k = img.dataset.key;
      img.classList.toggle('active', k === key);
    });

    // 2. Callouts
    this.callouts.forEach(c => {
      c.classList.toggle('is-active', c.dataset.key === key);
    });

    // 3. SVG Leaders
    const lines = this.svgLeaders.querySelectorAll('.leader-line');
    lines.forEach(l => {
      l.classList.toggle('is-active', l.dataset.key === key);
    });

    // 4. Pills
    this.pills.forEach(p => {
      p.classList.toggle('active', p.dataset.key === key);
    });
    this.updatePillIndicator();

    // 5. Side Inspector Card
    const data = SUBSYSTEMS[key];
    document.getElementById('card-category').innerText = data.category;
    document.getElementById('card-title').innerText = data.title;
    document.getElementById('card-desc').innerText = data.desc;
    document.getElementById('card-detail-img').src = data.image;
    document.getElementById('card-detail-img').alt = data.title;

    const specsWrap = document.getElementById('card-specs');
    specsWrap.innerHTML = data.specs.map(s => `
      <div class="spec-item">
        <span class="spec-item-label">${s.label}</span>
        <span class="spec-item-val">${s.value}</span>
      </div>
    `).join('');
  }

  updatePillIndicator() {
    const activePill = document.querySelector('.pill.active');
    if (!activePill || !this.pillIndicator) return;
    const parentRect = this.pillsContainer.getBoundingClientRect();
    const pillRect = activePill.getBoundingClientRect();

    const x = pillRect.left - parentRect.left;
    const y = pillRect.top - parentRect.top;
    const width = pillRect.width;
    const height = pillRect.height;

    this.pillsContainer.style.setProperty('--indicator-x', `${x}px`);
    this.pillsContainer.style.setProperty('--indicator-y', `${y}px`);
    this.pillsContainer.style.setProperty('--indicator-width', `${width}px`);
    this.pillsContainer.style.setProperty('--indicator-height', `${height}px`);
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.initLeaderLines();
      this.updatePillIndicator();
    });

    // Parallax mousemove
    window.addEventListener('mousemove', (e) => {
      this.isUserHovering = true;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      this.mouse.targetX = nx * 6;
      this.mouse.targetY = ny * -5;

      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        this.isUserHovering = false;
      }, 4000);
    });

    // Callout click/hover
    this.callouts.forEach(c => {
      c.addEventListener('click', (e) => {
        e.preventDefault();
        this.setActiveSubsystem(c.dataset.key);
      });
      c.addEventListener('mouseenter', () => {
        this.setActiveSubsystem(c.dataset.key);
      });
    });

    // Pill clicks
    this.pills.forEach(p => {
      p.addEventListener('click', () => {
        this.setActiveSubsystem(p.dataset.key);
      });
    });

    // Brand logo returns to full robot
    document.getElementById('brand-logo').addEventListener('click', () => {
      this.setActiveSubsystem('full');
    });

    // Top action buttons
    document.getElementById('btn-orbit').addEventListener('click', (e) => {
      this.isOrbiting = !this.isOrbiting;
      e.currentTarget.classList.toggle('is-active', this.isOrbiting);
      this.playClick();
    });

    document.getElementById('btn-audio').addEventListener('click', (e) => {
      this.audioEnabled = !this.audioEnabled;
      e.currentTarget.classList.toggle('is-active', this.audioEnabled);
      if (this.audioEnabled) this.playClick();
    });

    document.getElementById('btn-theme').addEventListener('click', () => {
      this.theme = this.theme === 'cream' ? 'dark' : 'cream';
      document.documentElement.setAttribute('data-theme', this.theme);
      this.playClick();
    });

    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
      this.playClick();
    });
  }

  initClock() {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const clockEl = document.getElementById('clock-display');
      if (clockEl) clockEl.innerHTML = `${h}:${m}<span>:${s}</span>`;

      const dateEl = document.getElementById('date-display');
      if (dateEl) {
        const opts = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
        dateEl.innerText = now.toLocaleDateString('en-US', opts).toUpperCase();
      }
    };
    updateTime();
    setInterval(updateTime, 1000);

    // Simulated FRC Telemetry
    setInterval(() => {
      const voltEl = document.getElementById('telemetry-volt');
      const canEl = document.getElementById('telemetry-can');
      if (voltEl) voltEl.innerText = `${(12.45 + Math.random() * 0.35).toFixed(2)}V`;
      if (canEl) canEl.innerText = `${Math.floor(48 + Math.random() * 12)}%`;
    }, 2500);
  }

  initCanvas() {
    this.canvas = document.getElementById('bg-canvas');
    this.ctx = this.canvas.getContext('2d');
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 1,
        alpha: Math.random() * 0.4 + 0.1
      });
    }
  }

  renderCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const color = this.theme === 'dark' ? '0, 229, 220' : '0, 182, 174';

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
      this.ctx.fill();
    });
  }

  animate() {
    // Parallax Interpolation
    if (this.isOrbiting && !this.isUserHovering) {
      this.orbitAngle += 0.01;
      this.mouse.targetX = Math.sin(this.orbitAngle) * 4;
      this.mouse.targetY = Math.cos(this.orbitAngle * 0.8) * 2.5;
    }

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

    if (this.stageInner) {
      this.stageInner.style.transform = `rotateX(${this.mouse.y}deg) rotateY(${this.mouse.x}deg)`;
    }

    this.renderCanvas();
    requestAnimationFrame(() => this.animate());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Team4414Wallpaper();
});

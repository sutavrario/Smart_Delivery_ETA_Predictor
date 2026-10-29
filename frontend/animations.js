/**
 * FOOD EXPRESS AI • KINETIC ANIMATION ENGINE
 * Handles:
 * 1. Fullscreen Weather Canvas (Sun rays, Wind, Rain Streaks, Thunderstorm & Branching Lightning)
 * 2. Perspective Road Canvas (Moving asphalt, lane lines, wet road reflections, puddles)
 * 3. Traffic Vehicle Simulator (Dynamic cars, lane changes, brake lights, honks)
 * 4. Delivery Scooter Rider Physics (Wheel speed, suspension bob, exhaust particles, raincoat)
 * 5. Kitchen Dynamics (Burner flames, pan toss velocity, steam generation, oven heat)
 * 6. Procedural Web Audio FX (Synthesized scooter revs, rain ambience, thunder rumble, sizzle)
 */

class RioAnimationEngine {
  constructor() {
    // DOM Elements
    this.weatherCanvas = document.getElementById('weatherCanvas');
    this.weatherCtx = this.weatherCanvas ? this.weatherCanvas.getContext('2d') : null;
    
    this.roadCanvas = document.getElementById('roadCanvas');
    this.roadCtx = this.roadCanvas ? this.roadCanvas.getContext('2d') : null;

    this.lightningOverlay = document.getElementById('lightningOverlay');
    this.trafficContainer = document.getElementById('trafficContainer');
    this.honkContainer = document.getElementById('honkAlerts');
    this.exhaustGroup = document.getElementById('exhaustGroup');
    this.riderContainer = document.getElementById('riderContainer');
    this.riderRaincoat = document.getElementById('riderRaincoat');
    this.headlightBeam = document.getElementById('headlightBeam');
    this.backWheel = document.getElementById('backWheel');
    this.frontWheel = document.getElementById('frontWheel');

    // Kitchen Elements
    this.gasBurner = document.getElementById('gasBurner');
    this.fryingPan = document.getElementById('fryingPan');
    this.ovenGlow = document.getElementById('ovenGlow');
    this.steamContainer = document.getElementById('steamContainer');
    this.prepMeterFill = document.getElementById('prepMeterFill');
    this.prepVelocityText = document.getElementById('prepVelocityText');
    this.prepHeatText = document.getElementById('prepHeatText');
    this.speedReadout = document.getElementById('speedReadout');
    this.roadStatusBadge = document.getElementById('roadStatusBadge');
    this.weatherStatusBadge = document.getElementById('weatherStatusBadge');
    this.kitchenStatusBadge = document.getElementById('kitchenStatusBadge');

    // State Variables
    this.weatherSeverity = 0; // 0: Clear, 1: Cloudy, 2: Rain, 3: Storm
    this.trafficLevel = 2;    // 1: Light, 2: Moderate, 3: Heavy, 4: Gridlock
    this.prepTime = 15;       // 5 to 30 mins
    this.simulatedSpeed = 42; // km/h
    this.riderBonus = 3;      // experience years
    this.isDispatching = false;
    this.soundEnabled = false;

    // Particle Collections
    this.rainDrops = [];
    this.rainSplashes = [];
    this.sunMotes = [];
    this.exhaustPuffs = [];
    this.trafficCars = [];

    // Road Animation State
    this.roadOffset = 0;
    this.lastTime = performance.now();
    this.nextLightningTime = performance.now() + 5000;
    this.nextHonkTime = performance.now() + 3000;

    // Web Audio Synthesizer
    this.audioCtx = null;

    this.init();
  }

  init() {
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    
    // Setup initial particles
    this.initWeatherParticles();
    this.initTraffic();

    // Start main animation loops
    requestAnimationFrame((t) => this.renderLoop(t));
    
    // Interval for exhaust puffs
    setInterval(() => this.spawnExhaustPuff(), 120);
  }

  handleResize() {
    if (this.weatherCanvas) {
      this.weatherCanvas.width = window.innerWidth;
      this.weatherCanvas.height = window.innerHeight;
    }
    if (this.roadCanvas) {
      const rect = this.roadCanvas.getBoundingClientRect();
      this.roadCanvas.width = rect.width * window.devicePixelRatio || window.innerWidth;
      this.roadCanvas.height = rect.height * window.devicePixelRatio || 150;
    }
  }

  // ---------------- SOUND SYNTHESIS (Zero External Assets) ----------------
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    if (this.soundEnabled) {
      this.initAudio();
      this.playBeep(880, 0.08);
    }
    return this.soundEnabled;
  }

  playBeep(freq = 440, duration = 0.1, type = 'sine') {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  }

  playThunderSound() {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      const bufferSize = this.audioCtx.sampleRate * 1.5;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioCtx.sampleRate * 0.4));
      }
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, this.audioCtx.currentTime);
      filter.frequency.linearRampToValueAtTime(60, this.audioCtx.currentTime + 1.2);
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 1.4);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      noise.start();
    } catch (e) {}
  }

  playHonkSound() {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc1.frequency.value = 340;
      osc2.frequency.value = 410;
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(this.audioCtx.currentTime + 0.3);
      osc2.stop(this.audioCtx.currentTime + 0.3);
    } catch (e) {}
  }

  playSizzleSound() {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      const bufferSize = this.audioCtx.sampleRate * 0.4;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      filter.Q.value = 3.0;
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      noise.start();
    } catch (e) {}
  }

  // ---------------- WEATHER PARTICLES ----------------
  initWeatherParticles() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Rain particles
    this.rainDrops = [];
    for (let i = 0; i < 450; i++) {
      this.rainDrops.push({
        x: Math.random() * (w + 400) - 200,
        y: Math.random() * h,
        len: Math.random() * 24 + 14,
        speed: Math.random() * 12 + 18,
        thickness: Math.random() * 1.5 + 0.8,
        opacity: Math.random() * 0.5 + 0.3
      });
    }

    // Sun motes (for clear weather)
    this.sunMotes = [];
    for (let i = 0; i < 50; i++) {
      this.sunMotes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 3 + 1,
        alpha: Math.random() * 0.4 + 0.1,
        vx: Math.random() * 0.6 - 0.3,
        vy: -Math.random() * 0.5 - 0.2
      });
    }
  }

  setWeather(severity) {
    this.weatherSeverity = parseInt(severity, 10);
    const body = document.body;
    body.classList.remove('weather-clear', 'weather-cloudy', 'weather-rain', 'weather-storm');

    if (this.weatherSeverity === 0) {
      body.classList.add('weather-clear');
      if (this.riderRaincoat) this.riderRaincoat.style.opacity = '0';
      if (this.weatherStatusBadge) this.weatherStatusBadge.innerHTML = 'Clear Skies ☀️';
      if (this.headlightBeam) this.headlightBeam.style.opacity = '0.7';
    } else if (this.weatherSeverity === 1) {
      body.classList.add('weather-cloudy');
      if (this.riderRaincoat) this.riderRaincoat.style.opacity = '0';
      if (this.weatherStatusBadge) this.weatherStatusBadge.innerHTML = 'Overcast & Wind ⛅';
      if (this.headlightBeam) this.headlightBeam.style.opacity = '0.85';
    } else if (this.weatherSeverity === 2) {
      body.classList.add('weather-rain');
      if (this.riderRaincoat) this.riderRaincoat.style.opacity = '0.92';
      if (this.weatherStatusBadge) this.weatherStatusBadge.innerHTML = 'Heavy Rain 🌧️';
      if (this.headlightBeam) this.headlightBeam.style.opacity = '1';
      this.playBeep(220, 0.2, 'sawtooth');
    } else {
      body.classList.add('weather-storm');
      if (this.riderRaincoat) this.riderRaincoat.style.opacity = '1';
      if (this.weatherStatusBadge) this.weatherStatusBadge.innerHTML = 'Thunderstorm ⛈️';
      if (this.headlightBeam) this.headlightBeam.style.opacity = '1';
      this.triggerLightning();
    }

    this.recomputeVelocity();
  }

  triggerLightning() {
    if (!this.lightningOverlay) return;
    this.lightningOverlay.classList.add('flash');
    this.playThunderSound();

    setTimeout(() => {
      this.lightningOverlay.classList.remove('flash');
      // Secondary strike flicker
      setTimeout(() => {
        this.lightningOverlay.classList.add('flash');
        setTimeout(() => this.lightningOverlay.classList.remove('flash'), 50);
      }, 90);
    }, 70);
  }

  // ---------------- TRAFFIC SIMULATION ----------------
  initTraffic() {
    this.trafficCars = [
      { id: 1, type: 'sedan', color: '#29B6F6', lane: 1, x: 80, speedFactor: 0.8, honking: false },
      { id: 2, type: 'taxi', color: '#FFD600', lane: 2, x: 380, speedFactor: 0.95, honking: false },
      { id: 3, type: 'suv', color: '#EF5350', lane: 1, x: 680, speedFactor: 0.75, honking: false }
    ];
    this.renderTrafficDOM();
  }

  setTraffic(level) {
    this.trafficLevel = parseInt(level, 10);
    
    // Adjust rider position on road based on traffic congestion
    if (this.riderContainer) {
      if (this.trafficLevel === 1) {
        this.riderContainer.style.left = '32%';
        if (this.roadStatusBadge) this.roadStatusBadge.innerHTML = '🟢 Cruising Fast (Free Road)';
      } else if (this.trafficLevel === 2) {
        this.riderContainer.style.left = '35%';
        if (this.roadStatusBadge) this.roadStatusBadge.innerHTML = '🟡 Steady Flow (Moderate)';
      } else if (this.trafficLevel === 3) {
        this.riderContainer.style.left = '42%';
        if (this.roadStatusBadge) this.roadStatusBadge.innerHTML = '🟠 Dense Traffic (Lane Splitting)';
      } else {
        this.riderContainer.style.left = '48%';
        if (this.roadStatusBadge) this.roadStatusBadge.innerHTML = '🔴 Gridlock Alert (Bumper to Bumper)';
      }
    }

    this.recomputeVelocity();
    this.renderTrafficDOM();
  }

  renderTrafficDOM() {
    if (!this.trafficContainer) return;
    this.trafficContainer.innerHTML = '';

    const carCount = this.trafficLevel === 1 ? 0 : (this.trafficLevel === 2 ? 1 : (this.trafficLevel === 3 ? 3 : 5));

    for (let i = 0; i < carCount; i++) {
      const carData = this.trafficCars[i % this.trafficCars.length];
      const carEl = document.createElement('div');
      carEl.className = `traffic-car ${this.trafficLevel >= 3 ? 'brake-on' : ''}`;
      carEl.id = `car_${i}`;
      
      const bottomPos = (i % 2 === 0) ? 15 : 55;
      carEl.style.bottom = `${bottomPos}px`;
      carEl.style.left = `${(i * 240 + 60) % 900}px`;

      // Vehicle SVG (Sedan / Taxi with glowing brake lights)
      carEl.innerHTML = `
        <svg viewBox="0 0 120 50" width="110" height="46">
          <defs>
            <linearGradient id="carGrad_${i}" x1="0" y1="0" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${i === 1 ? '#FFD54F' : (i === 2 ? '#EF5350' : '#42A5F5')}"/>
              <stop offset="100%" stop-color="${i === 1 ? '#F57F17' : (i === 2 ? '#B71C1C' : '#1565C0')}"/>
            </linearGradient>
          </defs>
          <!-- Wheels -->
          <circle cx="28" cy="40" r="9" fill="#212121" stroke="#424242" stroke-width="2"/>
          <circle cx="92" cy="40" r="9" fill="#212121" stroke="#424242" stroke-width="2"/>
          <!-- Chassis -->
          <path d="M 12 36 L 24 36 A 10 10 0 0 1 32 36 L 88 36 A 10 10 0 0 1 96 36 L 110 36 C 115 36, 118 32, 116 26 L 105 24 L 88 12 L 40 12 L 20 22 L 8 26 C 6 30, 8 36, 12 36 Z" fill="url(#carGrad_${i})"/>
          <!-- Windows -->
          <polygon points="42,14 85,14 78,22 34,22" fill="#B3E5FC" opacity="0.85"/>
          <!-- Tail light -->
          <rect x="6" y="24" width="5" height="7" rx="2" fill="#FF1744" class="tail-light"/>
          <!-- Headlight -->
          <rect x="110" y="24" width="5" height="7" rx="2" fill="#FFF59D"/>
          ${i === 1 ? '<rect x="54" y="6" width="18" height="6" rx="2" fill="#212121"/><text x="63" y="11" font-size="5" fill="#FFD600" text-anchor="middle" font-weight="bold">TAXI</text>' : ''}
        </svg>
      `;
      this.trafficContainer.appendChild(carEl);
    }
  }

  spawnHonkAlert(x, y, text = 'BEEP! 📢') {
    if (!this.honkContainer) return;
    const honk = document.createElement('div');
    honk.className = 'honk-bubble';
    honk.style.left = `${x}px`;
    honk.style.top = `${y}px`;
    honk.textContent = text;
    this.honkContainer.appendChild(honk);
    this.playHonkSound();

    setTimeout(() => honk.remove(), 1200);
  }

  // ---------------- KITCHEN DYNAMICS ----------------
  setPrepTime(minutes) {
    this.prepTime = parseInt(minutes, 10);
    const fraction = (this.prepTime - 5) / (30 - 5); // 0.0 to 1.0

    // Gas flames scale
    if (this.gasBurner) {
      const flames = this.gasBurner.querySelectorAll('.flame');
      flames.forEach((flame, idx) => {
        const height = 14 + fraction * 22;
        flame.style.height = `${height}px`;
        flame.style.animationDuration = `${Math.max(0.08, 0.25 - fraction * 0.15)}s`;
      });
    }

    // Frying pan shake velocity
    if (this.fryingPan) {
      const panSpeed = Math.max(0.18, 0.45 - fraction * 0.25);
      this.fryingPan.style.animationDuration = `${panSpeed}s`;
    }

    // Oven glow intensity
    if (this.ovenGlow) {
      this.ovenGlow.style.opacity = `${0.3 + fraction * 0.7}`;
      this.ovenGlow.style.animationDuration = `${Math.max(0.4, 1.4 - fraction * 0.8)}s`;
    }

    // Steam rate
    if (this.steamContainer) {
      const steams = this.steamContainer.querySelectorAll('.steam');
      steams.forEach(s => {
        s.style.opacity = `${0.3 + fraction * 0.6}`;
        s.style.animationDuration = `${Math.max(0.6, 1.6 - fraction * 0.9)}s`;
      });
    }

    // Prep Meter UI
    const percent = Math.round(fraction * 100);
    if (this.prepMeterFill) this.prepMeterFill.style.width = `${percent}%`;
    if (this.prepHeatText) this.prepHeatText.textContent = `Heat: ${percent}%`;

    let velocityLabel = 'Quick Snack Assembly';
    if (percent > 70) velocityLabel = 'Gourmet Sizzle & Roasting 🔥';
    else if (percent > 35) velocityLabel = 'Active Wok Stir-Fry 🍳';
    if (this.prepVelocityText) this.prepVelocityText.textContent = velocityLabel;

    if (this.kitchenStatusBadge) {
      this.kitchenStatusBadge.innerHTML = percent > 60 ? 'Heavy Sizzle 🔥' : 'Simmering 🍳';
    }

    this.playSizzleSound();
  }

  // ---------------- VELOCITY & WHEEL PHYSICS ----------------
  setRiderBonus(years) {
    this.riderBonus = parseFloat(years);
    this.recomputeVelocity();
  }

  recomputeVelocity() {
    // Base speed ~ 48 km/h
    let speed = 48;

    // Traffic slowdown
    if (this.trafficLevel === 2) speed -= 8;
    else if (this.trafficLevel === 3) speed -= 20;
    else if (this.trafficLevel === 4) speed -= 32;

    // Weather slowdown
    if (this.weatherSeverity === 2) speed -= 6;
    else if (this.weatherSeverity === 3) speed -= 12;

    // Rider experience boost
    speed += this.riderBonus * 1.2;

    if (this.isDispatching) speed += 25; // boost on live run

    this.simulatedSpeed = Math.max(12, Math.round(speed));

    if (this.speedReadout) {
      this.speedReadout.innerHTML = `${this.simulatedSpeed} <small>km/h</small>`;
    }

    // Adjust SVG wheel spin animation duration
    const spinDuration = Math.max(0.12, 18 / this.simulatedSpeed);
    if (this.backWheel) this.backWheel.style.animationDuration = `${spinDuration}s`;
    if (this.frontWheel) this.frontWheel.style.animationDuration = `${spinDuration}s`;
  }

  spawnExhaustPuff() {
    if (!this.exhaustGroup) return;
    const puff = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    puff.setAttribute('cx', '24');
    puff.setAttribute('cy', '118');
    puff.setAttribute('r', '3');
    puff.setAttribute('fill', '#ECEFF1');
    puff.setAttribute('opacity', '0.7');
    this.exhaustGroup.appendChild(puff);

    let progress = 0;
    const animPuff = () => {
      progress += 0.05;
      puff.setAttribute('cx', `${24 - progress * 35}`);
      puff.setAttribute('cy', `${118 - progress * 10}`);
      puff.setAttribute('r', `${3 + progress * 8}`);
      puff.setAttribute('opacity', `${0.7 * (1 - progress)}`);
      if (progress < 1) {
        requestAnimationFrame(animPuff);
      } else {
        puff.remove();
      }
    };
    requestAnimationFrame(animPuff);
  }

  // ---------------- DISPATCH SPRINT ANIMATION ----------------
  triggerDispatchSprint() {
    this.isDispatching = true;
    this.recomputeVelocity();
    this.playBeep(520, 0.4, 'triangle');

    if (this.riderContainer) {
      this.riderContainer.style.transform = 'translateX(90px) scale(1.05)';
    }

    // Confetti or speed lines effect
    setTimeout(() => {
      if (this.riderContainer) {
        this.riderContainer.style.transform = 'translateX(0) scale(1)';
      }
      this.isDispatching = false;
      this.recomputeVelocity();
    }, 2800);
  }

  // ---------------- MAIN CANVAS RENDER LOOP ----------------
  renderLoop(timestamp) {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.renderWeather(dt);
    this.renderRoad(dt);

    // Periodic lightning during thunderstorm
    if (this.weatherSeverity === 3 && timestamp > this.nextLightningTime) {
      this.triggerLightning();
      this.nextLightningTime = timestamp + 3500 + Math.random() * 5000;
    }

    // Periodic traffic honking during heavy gridlock
    if (this.trafficLevel >= 3 && timestamp > this.nextHonkTime) {
      const x = 200 + Math.random() * 500;
      const y = 80 + Math.random() * 80;
      const texts = ['HONK! 🚗', 'BEEP BEEP!', 'MOVE! ⏱️', 'RUSH HOUR!'];
      this.spawnHonkAlert(x, y, texts[Math.floor(Math.random() * texts.length)]);
      this.nextHonkTime = timestamp + 2500 + Math.random() * 4000;
    }

    requestAnimationFrame((t) => this.renderLoop(t));
  }

  renderWeather(dt) {
    if (!this.weatherCtx || !this.weatherCanvas) return;
    const ctx = this.weatherCtx;
    const w = this.weatherCanvas.width;
    const h = this.weatherCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // 0: Sunny Clear - Golden floating sun motes
    if (this.weatherSeverity === 0) {
      ctx.fillStyle = 'rgba(255, 238, 88, 0.35)';
      for (const mote of this.sunMotes) {
        mote.x += mote.vx;
        mote.y += mote.vy;
        if (mote.y < -10) mote.y = h + 10;
        if (mote.x < -10) mote.x = w + 10;
        if (mote.x > w + 10) mote.x = -10;

        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    // 1: Overcast Windy - Drifting horizontal wind streaks
    if (this.weatherSeverity === 1) {
      ctx.strokeStyle = 'rgba(207, 216, 220, 0.18)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 25; i++) {
        const y = (i * 45 + (this.roadOffset * 0.4)) % h;
        const x = (i * 120 + (this.roadOffset * 1.5)) % (w + 200) - 100;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 80, y + 4);
        ctx.stroke();
      }
      return;
    }

    // 2 & 3: Rain & Storm Streaks
    const isStorm = this.weatherSeverity === 3;
    const windAngle = isStorm ? 0.35 : 0.18; // slanted wind
    const count = isStorm ? this.rainDrops.length : Math.floor(this.rainDrops.length * 0.65);

    ctx.lineWidth = isStorm ? 1.8 : 1.2;
    ctx.strokeStyle = isStorm ? 'rgba(179, 229, 252, 0.75)' : 'rgba(129, 212, 250, 0.55)';

    for (let i = 0; i < count; i++) {
      const drop = this.rainDrops[i];
      drop.y += drop.speed * (isStorm ? 1.4 : 1.0);
      drop.x -= drop.speed * windAngle;

      if (drop.y > h) {
        drop.y = -drop.len;
        drop.x = Math.random() * (w + 400) - 100;

        // Spawn splash ripple on ground
        if (Math.random() < 0.25) {
          this.rainSplashes.push({
            x: drop.x,
            y: h - Math.random() * 80,
            r: 2,
            maxR: Math.random() * 9 + 4,
            alpha: 0.6
          });
        }
      }

      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.len * windAngle, drop.y + drop.len);
      ctx.stroke();
    }

    // Render splash ripples
    ctx.strokeStyle = 'rgba(225, 245, 254, 0.4)';
    ctx.lineWidth = 1;
    for (let i = this.rainSplashes.length - 1; i >= 0; i--) {
      const splash = this.rainSplashes[i];
      splash.r += 0.6;
      splash.alpha -= 0.04;
      if (splash.alpha <= 0) {
        this.rainSplashes.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.ellipse(splash.x, splash.y, splash.r * 2, splash.r * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderRoad(dt) {
    if (!this.roadCtx || !this.roadCanvas) return;
    const ctx = this.roadCtx;
    const w = this.roadCanvas.width;
    const h = this.roadCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Speed-based horizontal road movement
    const roadSpeed = (this.simulatedSpeed / 20) * (dt / 16);
    this.roadOffset = (this.roadOffset + roadSpeed * 14) % 120;

    // Road Base Color
    const isWet = this.weatherSeverity >= 2;
    ctx.fillStyle = isWet ? '#0f141e' : '#181e2b';
    ctx.fillRect(0, 0, w, h);

    // Wet road reflective sheen gradient
    if (isWet) {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Top Curb / Guardrail
    ctx.fillStyle = '#263238';
    ctx.fillRect(0, 0, w, 8);
    ctx.fillStyle = '#FFB300';
    for (let x = -this.roadOffset; x < w; x += 60) {
      ctx.fillRect(x, 0, 30, 8);
    }

    // Bottom Curb
    ctx.fillStyle = '#263238';
    ctx.fillRect(0, h - 8, w, 8);

    // Moving Dashed Center White & Yellow Lines (Lane Dividers)
    const lane1Y = h * 0.35;
    const lane2Y = h * 0.68;

    // Lane 1 divider (White dashes)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let x = -this.roadOffset; x < w + 80; x += 90) {
      ctx.fillRect(x, lane1Y, 45, 4);
    }

    // Lane 2 divider (Double Yellow dashes)
    ctx.fillStyle = '#FFD600';
    for (let x = -this.roadOffset; x < w + 80; x += 110) {
      ctx.fillRect(x, lane2Y - 2, 55, 3);
      ctx.fillRect(x, lane2Y + 3, 55, 3);
    }
  }
}

// Attach engine globally
window.RioAnimationEngine = RioAnimationEngine;


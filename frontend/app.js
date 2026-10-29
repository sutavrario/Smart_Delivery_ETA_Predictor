/**
 * FOOD EXPRESS AI • APPLICATION CONTROLLER
 * Connects user interactive controls to the kinetic animation engine
 * and real-time machine learning prediction engine (Rio.pkl).
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Kinetic Animation Engine
  const animEngine = new window.RioAnimationEngine();

  // Model Parameters directly extracted from Rio.pkl
  const MODEL_PARAMS = {
    intercept: 4.941061934648722,
    coefs: {
      distance_km: 3.0070754239156874,
      preparation_time_min: 0.9971851750685399,
      traffic_level: 3.9803274702838536,
      weather_severity: 1.979153325961974,
      rider_experience_years: -0.357787649300093
    }
  };

  // State
  const state = {
    distance_km: 5.0,
    preparation_time_min: 15,
    traffic_level: 2,
    weather_severity: 0,
    rider_experience_years: 3
  };

  // DOM Inputs
  const distanceSlider = document.getElementById('distanceSlider');
  const distanceBadge = document.getElementById('distanceBadge');
  const prepSlider = document.getElementById('prepSlider');
  const prepBadge = document.getElementById('prepBadge');
  const ticketPrepTime = document.getElementById('ticketPrepTime');
  const riderSlider = document.getElementById('riderSlider');
  const riderBadge = document.getElementById('riderBadge');
  const riderPerkText = document.getElementById('riderPerkText');
  
  // Output Displays
  const etaMinutes = document.getElementById('etaMinutes');
  const etaClock = document.getElementById('etaClock');
  const etaProgressBar = document.getElementById('etaProgressBar');

  // Breakdown Bars
  const barDistance = document.getElementById('barDistance');
  const barPrep = document.getElementById('barPrep');
  const barTraffic = document.getElementById('barTraffic');
  const barWeather = document.getElementById('barWeather');
  const barBonus = document.getElementById('barBonus');
  
  const bdDistanceVal = document.getElementById('bdDistanceVal');
  const bdPrepVal = document.getElementById('bdPrepVal');
  const bdTrafficVal = document.getElementById('bdTrafficVal');
  const bdWeatherVal = document.getElementById('bdWeatherVal');
  const bdRiderVal = document.getElementById('bdRiderVal');

  const bdDistanceImpact = document.getElementById('bdDistanceImpact');
  const bdPrepImpact = document.getElementById('bdPrepImpact');
  const bdTrafficImpact = document.getElementById('bdTrafficImpact');
  const bdWeatherImpact = document.getElementById('bdWeatherImpact');
  const bdRiderImpact = document.getElementById('bdRiderImpact');
  const bdBaseImpact = document.getElementById('bdBaseImpact');

  const trafficDesc = document.getElementById('trafficDesc');
  const weatherDesc = document.getElementById('weatherDesc');

  // Header & Modals
  const liveTime = document.getElementById('liveTime');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const dispatchBtn = document.getElementById('dispatchBtn');
  const dispatchToast = document.getElementById('dispatchToast');
  const modelDetailsBtn = document.getElementById('modelDetailsBtn');
  const modelModal = document.getElementById('modelModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  // ---------------- CLOCK & HEADER ----------------
  function updateClock() {
    const now = new Date();
    if (liveTime) {
      liveTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Sound Toggle
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      const isSoundOn = animEngine.toggleSound();
      soundIcon.textContent = isSoundOn ? '🔊' : '🔇';
      soundToggleBtn.classList.toggle('active', isSoundOn);
    });
  }

  // ---------------- EVENT LISTENERS FOR CONTROLS ----------------

  // 1. Distance Slider
  if (distanceSlider) {
    distanceSlider.addEventListener('input', (e) => {
      state.distance_km = parseFloat(e.target.value);
      distanceBadge.textContent = `${state.distance_km.toFixed(1)} km`;
      updateChips('distanceSlider', state.distance_km);
      calculateAndRender();
      animEngine.playBeep(440 + state.distance_km * 20, 0.04);
    });
  }

  // 2. Prep Time Slider (Restaurant & Kitchen Reaction)
  if (prepSlider) {
    prepSlider.addEventListener('input', (e) => {
      state.preparation_time_min = parseInt(e.target.value, 10);
      prepBadge.textContent = `${state.preparation_time_min} min`;
      if (ticketPrepTime) ticketPrepTime.textContent = `${state.preparation_time_min} min prep`;
      updateChips('prepSlider', state.preparation_time_min);
      
      // Trigger Kitchen Animation reaction
      animEngine.setPrepTime(state.preparation_time_min);
      calculateAndRender();
    });
  }

  // 3. Traffic Level Option Cards
  const trafficCards = document.querySelectorAll('.cards-traffic .option-card');
  const trafficDescriptions = {
    1: 'Clear Road • Express Speed',
    2: 'Moderate Traffic Flow',
    3: 'Heavy Congestion • Lane Weaving',
    4: 'Severe Gridlock Rush Hour 📢'
  };

  trafficCards.forEach((card) => {
    card.addEventListener('click', () => {
      trafficCards.forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      const val = parseInt(card.dataset.val, 10);
      state.traffic_level = val;
      if (trafficDesc) trafficDesc.textContent = trafficDescriptions[val];

      // Trigger Traffic Animation reaction
      animEngine.setTraffic(val);
      calculateAndRender();
      animEngine.playBeep(320 + val * 40, 0.08, 'square');
    });
  });

  // 4. Weather Severity Option Cards
  const weatherCards = document.querySelectorAll('.cards-weather .option-card');
  const weatherDescriptions = {
    0: 'Sunny & Clear Skies ☀️',
    1: 'Overcast & Cool Breeze ⛅',
    2: 'Heavy Rain & Wet Roads 🌧️',
    3: 'Severe Thunderstorm ⛈️'
  };

  weatherCards.forEach((card) => {
    card.addEventListener('click', () => {
      weatherCards.forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      const val = parseInt(card.dataset.val, 10);
      state.weather_severity = val;
      if (weatherDesc) weatherDesc.textContent = weatherDescriptions[val];

      // Trigger Weather Animation reaction
      animEngine.setWeather(val);
      calculateAndRender();
    });
  });

  // 5. Rider Experience Slider
  const riderTiers = [
    { max: 1, title: 'Rookie Courier 🔰', perk: 'New rider: Basic routing speed' },
    { max: 4, title: 'Active Rider 🛵', perk: 'Skilled: Saves ~1.2 mins via city short cuts' },
    { max: 7, title: 'Senior Pro ⚡', perk: 'Veteran: Shaves ~2.3 mins via traffic bypass' },
    { max: 10, title: 'Master Navigator 🏆', perk: 'Elite: Maximum ~3.6 mins speed optimization' }
  ];

  if (riderSlider) {
    riderSlider.addEventListener('input', (e) => {
      state.rider_experience_years = parseFloat(e.target.value);
      const tier = riderTiers.find((t) => state.rider_experience_years <= t.max) || riderTiers[riderTiers.length - 1];
      riderBadge.textContent = `${state.rider_experience_years} Yrs • ${tier.title}`;
      if (riderPerkText) riderPerkText.textContent = tier.perk;

      animEngine.setRiderBonus(state.rider_experience_years);
      calculateAndRender();
      animEngine.playBeep(520 + state.rider_experience_years * 30, 0.04);
    });
  }

  // Quick Chips Click Handling
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const targetId = chip.dataset.target;
      const val = parseFloat(chip.dataset.val);
      const targetInput = document.getElementById(targetId);
      if (targetInput) {
        targetInput.value = val;
        targetInput.dispatchEvent(new Event('input'));
      }
    });
  });

  function updateChips(sliderId, value) {
    document.querySelectorAll(`.chip[data-target="${sliderId}"]`).forEach((chip) => {
      chip.classList.toggle('active', parseFloat(chip.dataset.val) === parseFloat(value));
    });
  }

  // ---------------- PREDICTION LOGIC (Rio.pkl) ----------------

  let currentDisplayedEta = 28.4;
  let etaAnimationId = null;

  function calculateAndRender() {
    // 1. Real-time client-side calculation (Exact Rio.pkl weights)
    const distImpact = state.distance_km * MODEL_PARAMS.coefs.distance_km;
    const prepImpact = state.preparation_time_min * MODEL_PARAMS.coefs.preparation_time_min;
    const trafImpact = state.traffic_level * MODEL_PARAMS.coefs.traffic_level;
    const wthrImpact = state.weather_severity * MODEL_PARAMS.coefs.weather_severity;
    const rdrDiscount = state.rider_experience_years * MODEL_PARAMS.coefs.rider_experience_years;

    const rawTotal = MODEL_PARAMS.intercept + distImpact + prepImpact + trafImpact + wthrImpact + rdrDiscount;
    const finalPredictedTime = Math.max(1.0, rawTotal);

    // 2. Render smooth number ticker for ETA
    animateEtaDisplay(finalPredictedTime);

    // 3. Render Estimated Clock Arrival
    const arrivalDate = new Date(Date.now() + finalPredictedTime * 60 * 1000);
    if (etaClock) {
      etaClock.textContent = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // 4. Update Factor Waterfall Breakdown
    if (bdDistanceVal) bdDistanceVal.textContent = state.distance_km.toFixed(1);
    if (bdPrepVal) bdPrepVal.textContent = state.preparation_time_min;
    if (bdTrafficVal) bdTrafficVal.textContent = `Lvl ${state.traffic_level}`;
    const weatherLabels = ['Clear', 'Cloudy', 'Rain', 'Storm'];
    if (bdWeatherVal) bdWeatherVal.textContent = weatherLabels[state.weather_severity];
    if (bdRiderVal) bdRiderVal.textContent = `${state.rider_experience_years}y`;

    if (bdDistanceImpact) bdDistanceImpact.textContent = `+${distImpact.toFixed(1)}m`;
    if (bdPrepImpact) bdPrepImpact.textContent = `+${prepImpact.toFixed(1)}m`;
    if (bdTrafficImpact) bdTrafficImpact.textContent = `+${trafImpact.toFixed(1)}m`;
    if (bdWeatherImpact) bdWeatherImpact.textContent = `+${wthrImpact.toFixed(1)}m`;
    if (bdRiderImpact) bdRiderImpact.textContent = `${rdrDiscount.toFixed(1)}m`;
    if (bdBaseImpact) bdBaseImpact.textContent = `+${MODEL_PARAMS.intercept.toFixed(1)}m`;

    // Max potential time for bar percentage scale is ~90 minutes
    const maxScale = 90;
    if (barDistance) barDistance.style.width = `${Math.min(100, (distImpact / maxScale) * 100)}%`;
    if (barPrep) barPrep.style.width = `${Math.min(100, (prepImpact / maxScale) * 100)}%`;
    if (barTraffic) barTraffic.style.width = `${Math.min(100, (trafImpact / maxScale) * 100)}%`;
    if (barWeather) barWeather.style.width = `${Math.min(100, (wthrImpact / maxScale) * 100)}%`;
    if (barBonus) barBonus.style.width = `${Math.min(100, (Math.abs(rdrDiscount) / 10) * 100)}%`;
    if (etaProgressBar) etaProgressBar.style.width = `${Math.min(100, (finalPredictedTime / maxScale) * 100)}%`;

    // 5. Asynchronous server sync check if running under app.py
    fetchServerPrediction(state);
  }

  function animateEtaDisplay(targetVal) {
    if (etaAnimationId) cancelAnimationFrame(etaAnimationId);
    const startVal = currentDisplayedEta;
    const duration = 280; // ms
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      currentDisplayedEta = startVal + (targetVal - startVal) * ease;
      if (etaMinutes) {
        etaMinutes.textContent = currentDisplayedEta.toFixed(1);
      }
      if (progress < 1) {
        etaAnimationId = requestAnimationFrame(step);
      }
    }
    etaAnimationId = requestAnimationFrame(step);
  }

  // Server API query (Optional backend verification)
  async function fetchServerPrediction(inputs) {
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          // Sync with server verification
          console.debug('[Food Express] Verified with server Rio.pkl:', json.data.predicted_time_min);
        }
      }
    } catch (e) {
      // Running standalone without active backend server
    }
  }

  // ---------------- DISPATCH CTA BUTTON ----------------
  if (dispatchBtn) {
    dispatchBtn.addEventListener('click', () => {
      animEngine.triggerDispatchSprint();
      if (dispatchToast) {
        dispatchToast.classList.add('show');
        setTimeout(() => dispatchToast.classList.remove('show'), 3500);
      }
    });
  }

  // ---------------- MODEL INFO MODAL ----------------
  if (modelDetailsBtn && modelModal) {
    modelDetailsBtn.addEventListener('click', () => {
      modelModal.classList.add('open');
      animEngine.playBeep(640, 0.05);
    });
  }

  if (modalCloseBtn && modelModal) {
    modalCloseBtn.addEventListener('click', () => {
      modelModal.classList.remove('open');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modelModal) {
      modelModal.classList.remove('open');
    }
  });

  // Initial Calculation
  calculateAndRender();
  animEngine.setPrepTime(state.preparation_time_min);
  animEngine.setTraffic(state.traffic_level);
  animEngine.setWeather(state.weather_severity);
});


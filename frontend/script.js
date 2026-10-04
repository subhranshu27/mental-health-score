// Change this if your FastAPI server runs elsewhere
const API_URL = "";

// Assumed score range: 0–10, where higher means better mental health
const MAX_SCORE = 10;

const OPTIONS = {
  gender: ["Male", "Female"],
  country: ["India", "USA", "Canada", "Australia", "UK", "Germany", "Mexico", "Turkey", "France", "Other"],
  academic: ["High School", "Undergraduate", "Graduate"],
  stress: ["Low", "Medium", "High", "Very High"],
  most_used_platform: ["Facebook", "LinkedIn", "Instagram", "Snapchat", "Twitter", "YouTube",
    "TikTok", "LINE", "KakaoTalk", "VKontakte", "WhatsApp", "WeChat"],
  purpose_of_use: ["Networking", "Education", "Entertainment", "News"],
};

const form = document.getElementById("predict-form");
const btn = document.getElementById("submit-btn");
const scoreEl = document.getElementById("score");
const verdictEl = document.getElementById("verdict");
const errorEl = document.getElementById("error");
const gaugeFill = document.getElementById("gauge-fill");

// Fill dropdowns
for (const [id, values] of Object.entries(OPTIONS)) {
  const select = document.getElementById(id);
  select.innerHTML = '<option value="" disabled selected>Select…</option>' +
    values.map(v => `<option value="${v}">${v}</option>`).join("");
}

const NUMBER_FIELDS = {
  age: "int",
  avg_daily_usage_hours: "float",
  daily_unlocks: "int",
  study_hours: "float",
  physical_activity_hours: "float",
  sleep_hours_per_night: "float",
};
const SELECT_FIELDS = Object.keys(OPTIONS);

function collect() {
  const data = {};
  let valid = true;

  for (const id of [...Object.keys(NUMBER_FIELDS), ...SELECT_FIELDS]) {
    const el = document.getElementById(id);
    const ok = el.value !== "" && el.checkValidity();
    el.classList.toggle("invalid", !ok);
    if (!ok) valid = false;
    if (id in NUMBER_FIELDS) {
      data[id] = NUMBER_FIELDS[id] === "int" ? parseInt(el.value, 10) : parseFloat(el.value);
    } else {
      data[id] = el.value;
    }
  }
  return valid ? data : null;
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

function showScore(score) {
  const ratio = Math.min(Math.max(score / MAX_SCORE, 0), 1);
  const color = ratio >= 0.65 ? "var(--good)" : ratio >= 0.4 ? "var(--warn)" : "var(--bad)";
  const text = ratio >= 0.65 ? "Good mental health indicators."
    : ratio >= 0.4 ? "Moderate. Some habits may be worth adjusting."
    : "Low. Consider less screen time, more sleep and activity.";

  document.documentElement.style.setProperty("--score-color", color);
  gaugeFill.style.strokeDashoffset = 100 - ratio * 100;
  scoreEl.textContent = score.toFixed(2);
  verdictEl.textContent = text;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.hidden = true;

  const payload = collect();
  if (!payload) {
    showError("Fill in every field with a valid value.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Predicting…";

  try {
    const res = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      const detail = Array.isArray(err?.detail)
        ? err.detail.map(d => `${d.loc.slice(-1)[0]}: ${d.msg}`).join("; ")
        : "The server rejected the request.";
      throw new Error(detail);
    }

    const data = await res.json();
    showScore(data.predicted_mental_health_score);
  } catch (err) {
    showError(err instanceof TypeError
      ? `Can't reach the server at ${API_URL}. Is FastAPI running?`
      : err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Predict score";
  }
});

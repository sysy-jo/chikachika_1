(() => {
  const data = window.EXAM_DATA || { subjects: [], sources: {} };
  const subjects = Array.isArray(data.subjects) ? data.subjects : [];
  const schoolComparable = subjects.filter((s) => Number.isFinite(s.schoolMarchStandard) && Number.isFinite(s.nationalMarchStandard));
  const nationalRawComparable = subjects.filter((s) => Number.isFinite(s.nationalMarchRaw) && Number.isFinite(s.nationalJuneRaw));
  const charts = {};
  let selectedSubject = subjects[0]?.id;
  const blue = "#2563eb";
  const muted = "#cbd7e8";
  const isNum = Number.isFinite;
  const fmt = (n, digits = 1) => isNum(n) ? n.toFixed(digits) : "—";
  const signed = (n, digits = 1) => `${n > 0 ? "+" : ""}${fmt(n, digits)}`;
  const mean = (list) => list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
  const html = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };

  function showEmpty(id, empty) {
    const canvas = document.getElementById(id);
    const message = document.querySelector(`[data-empty="${id}"]`);
    if (canvas) canvas.hidden = empty;
    if (message) message.hidden = !empty;
  }
  function createChart(id, config) {
    if (!window.Chart) return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), config);
  }
  function chartDefaults() {
    Chart.defaults.font.family = "'DM Sans', 'Noto Sans KR', sans-serif";
    Chart.defaults.color = "#8290a8";
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = "#152846";
    Chart.defaults.plugins.tooltip.padding = 11;
    Chart.defaults.plugins.tooltip.cornerRadius = 9;
  }
  function renderKpis() {
    const gaps = schoolComparable.map((s) => s.schoolMarchStandard - s.nationalMarchStandard);
    const rising = nationalRawComparable.filter((s) => s.nationalJuneRaw > s.nationalMarchRaw).length;
    setText("kpi-subjects", `${schoolComparable.length} / ${subjects.length}`);
    setText("kpi-growth", signed(mean(gaps) ?? 0));
    setText("kpi-growth-caption", "3월 표준점수 · 비교 가능 과목 평균 격차");
    setText("kpi-national", `${rising} / ${nationalRawComparable.length}`);
    setText("kpi-improved", "3월만");
    const coverage = subjects.length ? Math.round((schoolComparable.length / subjects.length) * 100) : 0;
    setText("kpi-subjects-caption", `${coverage}% 과목에 학교 표준점수 평균 확인`);
    const notice = document.getElementById("data-notice");
    notice?.classList.add("notice-warning");
    setText("notice-text", "부용고 자료는 3월 학년 집계만 반영했습니다. 6월·9월 부용고 성적은 제공되지 않아, 해당 회차에는 전국 통계만 표시합니다.");
  }
  function renderNational() {
    if (!schoolComparable.length || !window.Chart) { showEmpty("nationalChart", true); return; }
    showEmpty("nationalChart", false);
    const gaps = schoolComparable.map((s) => +(s.schoolMarchStandard - s.nationalMarchStandard).toFixed(2));
    createChart("nationalChart", {
      type: "bar",
      data: { labels: schoolComparable.map((s) => s.name), datasets: [{
        label: "부용고 3월 - 전국 3월 (표준점수)", data: gaps,
        backgroundColor: gaps.map((v) => v < 0 ? "#8eace2" : blue), borderRadius: 6, maxBarThickness: 28
      }] },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { tooltip: { callbacks: { label: (ctx) => ` ${signed(ctx.raw, 2)}점` } } },
        scales: {
          x: { suggestedMin: Math.min(-12, ...gaps) - 1, suggestedMax: 3, grid: { color: (ctx) => ctx.tick.value === 0 ? "#8fa0b7" : "#edf1f7", lineWidth: (ctx) => ctx.tick.value === 0 ? 1.5 : 1 }, border: { display: false }, ticks: { callback: (v) => `${v}` } },
          y: { grid: { display: false }, border: { display: false } }
        }
      }
    });
    const sorted = schoolComparable.slice().sort((a, b) => (b.schoolMarchStandard - b.nationalMarchStandard) - (a.schoolMarchStandard - a.nationalMarchStandard));
    document.getElementById("national-summary").innerHTML = sorted.map((s, i) => {
      const gap = s.schoolMarchStandard - s.nationalMarchStandard;
      return `<div class="summary-row"><span class="summary-rank">${String(i + 1).padStart(2, "0")}</span><span class="summary-name">${html(s.name)}</span><span class="summary-value ${gap >= 0 ? "positive" : "negative"}">${signed(gap)}<small>점</small></span></div>`;
    }).join("");
    renderNationalRawSummary("national-summary");
  }
  function renderNationalRawSummary(targetId) {
    const list = document.getElementById(targetId);
    const rows = nationalRawComparable.map((s) => ({ ...s, change: s.nationalJuneRaw - s.nationalMarchRaw })).sort((a, b) => b.change - a.change);
    list.innerHTML = rows.map((s) => `<div class="summary-row"><span class="flow-dot ${s.change >= 0 ? "up" : "down"}">${s.change >= 0 ? "↑" : "↓"}</span><span class="summary-name">${html(s.name)}</span><span class="summary-value ${s.change >= 0 ? "positive" : "negative"}">${signed(s.change)}<small>점</small></span></div>`).join("");
  }
  function renderFlow() {
    if (!nationalRawComparable.length || !window.Chart) { showEmpty("flowChart", true); return; }
    showEmpty("flowChart", false);
    const asPercent = (s, value) => +(value / s.nationalRawMax * 100).toFixed(1);
    createChart("flowChart", {
      type: "line",
      data: { labels: nationalRawComparable.map((s) => s.name), datasets: [
        { label: "3월 전국 원점수 평균 (배점 대비)", data: nationalRawComparable.map((s) => asPercent(s, s.nationalMarchRaw)), borderColor: muted, backgroundColor: muted, tension: .25, pointRadius: 4, pointHoverRadius: 6 },
        { label: "6월 전국 원점수 평균 (배점 대비)", data: nationalRawComparable.map((s) => asPercent(s, s.nationalJuneRaw)), borderColor: blue, backgroundColor: blue, tension: .25, pointRadius: 4, pointHoverRadius: 6 }
      ] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: { callbacks: { label: (ctx) => {
        const s = nationalRawComparable[ctx.dataIndex];
        const raw = ctx.datasetIndex === 0 ? s.nationalMarchRaw : s.nationalJuneRaw;
        const month = ctx.datasetIndex === 0 ? "3월" : "6월";
        return ` ${month} 전국 평균 ${fmt(raw, 2)}점 · ${fmt(ctx.raw)}%`;
      } } } }, scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { min: 0, max: 100, title: { display: true, text: "평균 원점수 / 과목 배점 (%)", font: { size: 10 } }, grid: { color: "#edf1f7" }, border: { display: false }, ticks: { callback: (v) => `${v}%` } }
      } }
    });
    renderNationalRawSummary("flow-summary");
  }
  function renderSubjectFilters() {
    const box = document.getElementById("subject-filters");
    box.innerHTML = subjects.map((s) => `<button class="subject-pill ${s.id === selectedSubject ? "selected" : ""}" data-subject="${html(s.id)}" aria-pressed="${s.id === selectedSubject}">${html(s.name)}</button>`).join("");
    box.addEventListener("click", (event) => {
      const button = event.target.closest("[data-subject]");
      if (!button) return;
      selectedSubject = button.dataset.subject;
      box.querySelectorAll(".subject-pill").forEach((el) => { const active = el === button; el.classList.toggle("selected", active); el.setAttribute("aria-pressed", String(active)); });
      renderSubject();
    });
  }
  function renderSubject() {
    const s = subjects.find((subject) => subject.id === selectedSubject) || subjects[0];
    if (!s) return;
    setText("subject-current", s.name);
    const hasNational = isNum(s.nationalMarchRaw) && isNum(s.nationalJuneRaw);
    showEmpty("subjectChart", !hasNational || !window.Chart);
    if (hasNational && window.Chart) {
      createChart("subjectChart", {
        type: "bar", data: { labels: ["3월 전국", "6월 전국"], datasets: [{
          label: "원점수 평균", data: [s.nationalMarchRaw, s.nationalJuneRaw],
          backgroundColor: ["#cbd7e8", blue], borderRadius: 7, maxBarThickness: 46
        }] },
        options: { responsive: true, maintainAspectRatio: false, scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: { min: 0, max: s.nationalRawMax, title: { display: true, text: `원점수 평균 (배점 ${s.nationalRawMax}점)`, font: { size: 10 } }, grid: { color: "#edf1f7" }, border: { display: false } }
        } }
      });
    }
    const hasSchool = isNum(s.schoolMarchStandard) && isNum(s.nationalMarchStandard);
    document.getElementById("subject-detail").innerHTML = hasSchool
      ? `<div class="detail-score"><span>부용고 3월 표준점수 평균</span><strong>${fmt(s.schoolMarchStandard)}<small>점</small></strong></div><div class="detail-score"><span>전국 3월 표준점수 평균</span><strong>${fmt(s.nationalMarchStandard)}<small>점</small></strong></div><div class="detail-delta ${s.schoolMarchStandard >= s.nationalMarchStandard ? "positive" : "negative"}"><span>전국 평균과의 격차</span><strong>${signed(s.schoolMarchStandard - s.nationalMarchStandard)}<small>점</small></strong></div><p class="detail-footnote">6월 그래프는 전국 원점수 평균입니다. 학교 표준점수와 직접 비교하지 않습니다.</p>`
      : `<div class="empty-copy">부용고 ${html(s.name)}의 과목별 학교 평균은 자료에서 확인되지 않았습니다. 그래프에는 전국 원점수 평균만 표시합니다.</div>`;
  }
  function renderInsights() {
    if (!schoolComparable.length && !nationalRawComparable.length) return;
    const weakest = schoolComparable.slice().sort((a, b) => (a.schoolMarchStandard - a.nationalMarchStandard) - (b.schoolMarchStandard - b.nationalMarchStandard))[0];
    const closest = schoolComparable.slice().sort((a, b) => (b.schoolMarchStandard - b.nationalMarchStandard) - (a.schoolMarchStandard - a.nationalMarchStandard))[0];
    const rising = nationalRawComparable.filter((s) => s.nationalJuneRaw > s.nationalMarchRaw).length;
    setText("insight-headline", "3월 부용고 평균과 전국 추이로 본 학습 참고점");
    setText("insight-lead", "학교 6월·9월 성적은 없어, 학교의 회차별 향상 여부는 분석하지 않았습니다.");
    const cards = [];
    if (weakest) cards.push({ title: "우선 확인할 과목", body: `${weakest.name} 3월 학교 평균은 전국 표준점수 평균보다 ${fmt(weakest.nationalMarchStandard - weakest.schoolMarchStandard)}점 낮았습니다. 해당 과목의 취약 단원과 문항 유형을 우선 살펴보세요.` });
    if (closest) cards.push({ title: "상대적으로 격차가 작은 과목", body: `${closest.name}의 3월 학교 평균은 비교 과목 중 전국 표준점수 평균에 가장 가까웠습니다 (${signed(closest.schoolMarchStandard - closest.nationalMarchStandard)}점). 학습 전략을 다른 과목에도 적용할 수 있는지 살펴보세요.` });
    cards.push({ title: "전국 3월→6월 참고", body: `전국 원점수 평균은 ${rising}개 과목에서 상승했습니다. 이는 전국 통계의 변화이며 부용고의 6월 성적 변화를 뜻하지 않습니다.` });
    document.getElementById("insight-grid").innerHTML = cards.slice(0, 3).map((item, i) => `<article class="insight-card"><span class="insight-number">${String(i + 1).padStart(2, "0")}</span><h3>${html(item.title)}</h3><p>${html(item.body)}</p></article>`).join("");
  }
  function initTabs() {
    document.querySelector(".tabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-tab]");
      if (!button) return;
      document.querySelectorAll(".tab").forEach((tab) => { const active = tab === button; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
      document.querySelectorAll(".tab-panel").forEach((panel) => { const active = panel.dataset.panel === button.dataset.tab; panel.hidden = !active; panel.classList.toggle("active", active); });
      Object.values(charts).forEach((instance) => instance.resize());
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    if (window.Chart) chartDefaults();
    renderKpis(); initTabs(); renderSubjectFilters(); renderNational(); renderFlow(); renderSubject(); renderInsights();
  });
})();


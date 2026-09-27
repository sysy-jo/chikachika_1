(() => {
  const data = window.EXAM_DATA || { subjects: [], sources: {}, insights: [] };
  const subjects = Array.isArray(data.subjects) ? data.subjects : [];
  const valid = (value) => typeof value === "number" && Number.isFinite(value);
  const fmt = (value, digits = 1) => valid(value) ? Number(value).toFixed(digits) : "—";
  const signed = (value) => `${value > 0 ? "+" : ""}${fmt(value)}`;
  const ready = subjects.filter((s) => valid(s.march) || valid(s.june) || valid(s.nationalMarch) || valid(s.nationalJune));
  const scoreReady = subjects.filter((s) => valid(s.march) && valid(s.june));
  const nationalReady = subjects.filter((s) => valid(s.june) && valid(s.nationalJune));
  const colors = { blue: "#2563eb", cyan: "#16b8c9", violet: "#8059e8", pale: "rgba(37,99,235,.12)" };
  let selectedSubject = subjects[0]?.id;
  const charts = {};

  function setText(id, value) { const node = document.getElementById(id); if (node) node.textContent = value; }
  function showEmpty(id, show) {
    const canvas = document.getElementById(id);
    const empty = document.querySelector(`[data-empty="${id}"]`);
    if (canvas) canvas.hidden = show;
    if (empty) empty.hidden = !show;
  }
  function chart(id, config) {
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
  function kpis() {
    setText("kpi-subjects", `${ready.length} / ${subjects.length || 6}`);
    if (!scoreReady.length) {
      setText("kpi-growth", "—"); setText("kpi-growth-caption", "3월·6월 평균 자료 필요");
      setText("kpi-improved", "—");
    } else {
      const averageChange = scoreReady.reduce((sum, s) => sum + s.june - s.march, 0) / scoreReady.length;
      const improved = scoreReady.filter((s) => s.june > s.march).length;
      setText("kpi-growth", signed(averageChange)); setText("kpi-growth-caption", `${scoreReady.length}개 과목 평균 변화`);
      setText("kpi-improved", `${improved}과목`);
    }
    if (nationalReady.length) {
      const gap = nationalReady.reduce((sum, s) => sum + s.june - s.nationalJune, 0) / nationalReady.length;
      setText("kpi-national", signed(gap));
    } else setText("kpi-national", "—");
    const notice = document.getElementById("data-notice");
    const schoolSources = data.sources?.school?.length || 0;
    const nationalSources = data.sources?.national?.length || 0;
    if (!ready.length) {
      notice?.classList.add("notice-warning");
      setText("notice-text", "학교 평균 점수와 전국 통계 PDF가 아직 등록되지 않았습니다. 원본 수치가 확인된 뒤 분석 결과가 표시됩니다.");
    } else if (!schoolSources || !nationalSources) {
      notice?.classList.add("notice-warning");
      setText("notice-text", `현재 ${ready.length}개 과목 자료가 등록되어 있습니다. 출처 표기를 확인해 주세요.`);
    } else {
      notice?.classList.add("notice-ready");
      setText("notice-text", `학교 자료 ${schoolSources}건 · 전국 통계 ${nationalSources}건을 바탕으로 분석합니다.`);
    }
  }
  function renderNational() {
    if (!nationalReady.length || !window.Chart) { showEmpty("nationalChart", true); return; }
    showEmpty("nationalChart", false);
    chart("nationalChart", {
      type: "bar",
      data: { labels: nationalReady.map((s) => s.name), datasets: [
        { label: "부용고", data: nationalReady.map((s) => s.june), backgroundColor: colors.blue, borderRadius: 6, maxBarThickness: 26 },
        { label: "전국", data: nationalReady.map((s) => s.nationalJune), backgroundColor: "#dce5f2", borderRadius: 6, maxBarThickness: 26 }
      ] },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, border: { display: false } }, y: { min: 0, max: 100, ticks: { stepSize: 20 }, grid: { color: "#edf1f7" }, border: { display: false } } } }
    });
    const rows = nationalReady.map((s) => ({ name: s.name, diff: s.june - s.nationalJune })).sort((a, b) => b.diff - a.diff);
    document.getElementById("national-summary").innerHTML = rows.map((r, i) => `<div class="summary-row"><span class="summary-rank">${String(i + 1).padStart(2, "0")}</span><span class="summary-name">${r.name}</span><span class="summary-value ${r.diff >= 0 ? "positive" : "negative"}">${signed(r.diff)}<small>점</small></span></div>`).join("");
  }
  function renderSubjectFilters() {
    const box = document.getElementById("subject-filters");
    box.innerHTML = subjects.map((s) => `<button class="subject-pill ${s.id === selectedSubject ? "selected" : ""}" data-subject="${s.id}" aria-pressed="${s.id === selectedSubject}">${s.name}</button>`).join("");
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
    const available = valid(s.march) && valid(s.june);
    showEmpty("subjectChart", !available || !window.Chart);
    if (available && window.Chart) {
      chart("subjectChart", { type: "line", data: { labels: ["3월", "6월"], datasets: [{ label: s.name, data: [s.march, s.june], borderColor: colors.blue, backgroundColor: colors.pale, fill: true, tension: .35, pointBackgroundColor: "#fff", pointBorderColor: colors.blue, pointBorderWidth: 3, pointRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, border: { display: false } }, y: { min: 0, max: 100, grid: { color: "#edf1f7" }, border: { display: false } } } } });
      const delta = s.june - s.march;
      document.getElementById("subject-detail").innerHTML = `<div class="detail-score"><span>3월 평균</span><strong>${fmt(s.march)}<small>점</small></strong></div><div class="detail-score"><span>6월 평균</span><strong>${fmt(s.june)}<small>점</small></strong></div><div class="detail-delta ${delta >= 0 ? "positive" : "negative"}"><span>변화량</span><strong>${signed(delta)}<small>점</small></strong></div>`;
    } else document.getElementById("subject-detail").innerHTML = `<div class="empty-copy">${s.name}의 학교 평균 자료가 등록되면 상세 성취를 표시합니다.</div>`;
  }
  function renderFlow() {
    if (!scoreReady.length || !window.Chart) { showEmpty("flowChart", true); return; }
    showEmpty("flowChart", false);
    chart("flowChart", { type: "line", data: { labels: scoreReady.map((s) => s.name), datasets: [
      { label: "3월", data: scoreReady.map((s) => s.march), borderColor: "#b9c7da", backgroundColor: "#b9c7da", tension: .3, pointRadius: 4 },
      { label: "6월", data: scoreReady.map((s) => s.june), borderColor: colors.blue, backgroundColor: colors.blue, tension: .3, pointRadius: 4 }
    ] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, border: { display: false } }, y: { min: 0, max: 100, grid: { color: "#edf1f7" }, border: { display: false } } } } });
    const rows = scoreReady.map((s) => ({ name: s.name, diff: s.june - s.march })).sort((a, b) => b.diff - a.diff);
    document.getElementById("flow-summary").innerHTML = rows.map((r) => `<div class="summary-row"><span class="flow-dot ${r.diff >= 0 ? "up" : "down"}">${r.diff >= 0 ? "↑" : "↓"}</span><span class="summary-name">${r.name}</span><span class="summary-value ${r.diff >= 0 ? "positive" : "negative"}">${signed(r.diff)}<small>점</small></span></div>`).join("");
  }
  function renderInsights() {
    const supplied = Array.isArray(data.insights) ? data.insights.filter((item) => item.title && item.body) : [];
    if (!scoreReady.length && !nationalReady.length && !supplied.length) return;
    const best = scoreReady.slice().sort((a, b) => (b.june - b.march) - (a.june - a.march))[0];
    const gap = nationalReady.slice().sort((a, b) => (a.june - a.nationalJune) - (b.june - b.nationalJune))[0];
    setText("insight-headline", "확인된 수치로 살펴본 학습 포인트");
    setText("insight-lead", "아래 내용은 등록된 학년 집계 자료에서 계산했습니다. 개인별 결과를 뜻하지 않습니다.");
    const cards = [...supplied];
    if (best) cards.push({ title: "상승 흐름 이어가기", body: `${best.name} 평균이 ${signed(best.june - best.march)}점 변했습니다. 상승에 기여한 단원과 학습 방법을 점검해 보세요.` });
    if (gap) cards.push({ title: "보완 우선 과목", body: `${gap.name}은 6월 전국 평균보다 ${fmt(Math.abs(gap.june - gap.nationalJune))}점 ${gap.june >= gap.nationalJune ? "높습니다" : "낮습니다"}. 취약 단원을 확인하고 복습 계획을 세워 보세요.` });
    document.getElementById("insight-grid").innerHTML = cards.slice(0, 3).map((item, i) => `<article class="insight-card"><span class="insight-number">${String(i + 1).padStart(2, "0")}</span><h3>${item.title}</h3><p>${item.body}</p></article>`).join("");
  }
  function initTabs() {
    document.querySelector(".tabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-tab]"); if (!button) return;
      document.querySelectorAll(".tab").forEach((tab) => { const active = tab === button; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
      document.querySelectorAll(".tab-panel").forEach((panel) => { const active = panel.dataset.panel === button.dataset.tab; panel.hidden = !active; panel.classList.toggle("active", active); });
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    if (window.Chart) chartDefaults();
    kpis(); initTabs(); renderSubjectFilters(); renderNational(); renderSubject(); renderFlow(); renderInsights();
  });
})();


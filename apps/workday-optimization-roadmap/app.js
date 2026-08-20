const state = {
  data: null,
  query: "",
  workgroup: "",
  roadmap: "",
  dependencyOnly: false,
  selectedTaskKey: "",
  scenario: "balanced",
  decisions: JSON.parse(localStorage.getItem("wdOptimizeDecisions") || "{}"),
  priorityOverrides: JSON.parse(localStorage.getItem("wdOptimizePriorityOverrides") || "{}"),
};

const el = {
  searchInput: document.querySelector("#searchInput"),
  workgroupFilter: document.querySelector("#workgroupFilter"),
  roadmapFilter: document.querySelector("#roadmapFilter"),
  dependencyOnly: document.querySelector("#dependencyOnly"),
  dependencyFocusToggle: document.querySelector("#dependencyFocusToggle"),
  dependencyFocusPanel: document.querySelector("#dependencyFocusPanel"),
  dependencyFocusList: document.querySelector("#dependencyFocusList"),
  dependencyFocusSummary: document.querySelector("#dependencyFocusSummary"),
  resetFilters: document.querySelector("#resetFilters"),
  copyBrief: document.querySelector("#copyBrief"),
  exportBoardPacket: document.querySelector("#exportBoardPacket"),
  scenarioPlanner: document.querySelector("#scenarioPlanner"),
  totalHours: document.querySelector("#totalHours"),
  totalItems: document.querySelector("#totalItems"),
  p0Hours: document.querySelector("#p0Hours"),
  p0Items: document.querySelector("#p0Items"),
  filteredHours: document.querySelector("#filteredHours"),
  filteredItems: document.querySelector("#filteredItems"),
  scheduleWindow: document.querySelector("#scheduleWindow"),
  dependencyCount: document.querySelector("#dependencyCount"),
  workstreamList: document.querySelector("#workstreamList"),
  priorityBars: document.querySelector("#priorityBars"),
  timeline: document.querySelector("#timeline"),
  taskTable: document.querySelector("#taskTable"),
  tableTitle: document.querySelector("#tableTitle"),
  activeSummary: document.querySelector("#activeSummary"),
  whySummary: document.querySelector("#whySummary"),
  whySummaryMeta: document.querySelector("#whySummaryMeta"),
  ownerAccountability: document.querySelector("#ownerAccountability"),
  scenarioSummary: document.querySelector("#scenarioSummary"),
  toast: document.querySelector("#toast"),
};

const synonyms = new Map([
  ["financial", "finance"],
  ["reports", "report"],
  ["reporting", "report"],
  ["dashboard", "report"],
  ["dashboards", "report"],
  ["security", "security"],
  ["audit", "audit"],
  ["auditor", "audit"],
  ["auditors", "audit"],
  ["budget", "budget"],
  ["budgets", "budget"],
  ["payroll", "payroll"],
  ["benefits", "benefits"],
  ["critical", "p0"],
  ["high", "high"],
  ["medium", "medium"],
  ["low", "low"],
]);

const publishedSmartsheetLinks = Object.freeze({
  Benefits: "https://app.smartsheet.com/b/publish?EQBCT=d726f6b1323642d781e85cbecce97b94",
  Budgets: "https://app.smartsheet.com/b/publish?EQBCT=a1399a7da54e461083d06610926e5dca",
  Compensation: "https://app.smartsheet.com/b/publish?EQBCT=60ea5d1bdb4b4c0bb87ff4e2ae1ae96e",
  Finance: "https://app.smartsheet.com/b/publish?EQBCT=12f0d8db43194ad79d837c28a803d103",
  Grants: "https://app.smartsheet.com/b/publish?EQBCT=30a748c07d5c4c348ff2eb4522204173",
  HCM: "https://app.smartsheet.com/b/publish?EQBCT=0e223ee4214046f1839f0669df4c36ab",
  Integrations: "https://app.smartsheet.com/b/publish?EQBCT=fc24a2c020314a1ba876836a26d7d6e4",
  Payroll: "https://app.smartsheet.com/b/publish?EQBCT=19493032352f4a4e9e15b45f0a76c0c5",
  "Procurement-Finance": "https://app.smartsheet.com/b/publish?EQBCT=dc0149452b4646ad81128678c6bfe85b",
  Programs: "https://app.smartsheet.com/b/publish?EQBCT=031953b97f4847a3a90d60e56181a3a9",
  Projects: "https://app.smartsheet.com/b/publish?EQBCT=95435d27b9154969ac1375deb8a4f9bb",
  Reporting: "https://app.smartsheet.com/b/publish?EQBCT=a6f4a7679ae54c1f9c71bfb6e70851ec",
  Security: "https://app.smartsheet.com/b/publish?EQBCT=872fd0dc63674b5bbc7df98aa9130dfc",
  Timekeeping: "https://app.smartsheet.com/b/publish?EQBCT=494047fdc09c4df9a41894be79557092",
});

const workgroupByWbsPrefix = Object.freeze({
  1: "Benefits",
  2: "Budgets",
  3: "Compensation",
  4: "Finance",
  5: "Grants",
  6: "HCM",
  7: "Integrations",
  8: "Payroll",
  9: "Procurement-Finance",
  10: "Programs",
  11: "Projects",
  12: "Reporting",
  13: "Security",
  14: "Timekeeping",
});

function formatHours(value) {
  return `${Math.round(value).toLocaleString()} hrs`;
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${month}/${day}/${year.slice(2)}`;
}

function dateValue(value) {
  return value ? new Date(`${value}T00:00:00`).getTime() : 0;
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function queryTokens(query) {
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => synonyms.get(token) || token);
}

function haystack(task) {
  return normalize([
    task.workgroup,
    task.taskName,
    task.optimizationRequest,
    task.objective,
    task.deliverable,
    effectiveRoadmapPriority(task),
    task.businessValue,
    task.mappedPredecessorWbs,
    task.mappedDependencies,
    task.dependencyType,
    task.dependencyConfidence,
    task.dependencyRationale,
    task.notes,
    effectiveGlobalPriority(task),
    task.priorityGroup,
    task.shortReason,
    task.sourceValidation,
    task.jiraKey,
    task.jiraUrl,
    task.jiraStatus,
    task.jiraAssignee,
    task.jiraSummary,
    task.plainEnglishWorkdayProdChange,
  ].join(" "));
}

function matchesTask(task) {
  if (state.workgroup && task.workgroup !== state.workgroup) return false;
  if (state.roadmap && effectiveRoadmapPriority(task) !== state.roadmap) return false;
  if (state.dependencyOnly && !task.mappedDependencies) return false;
  const tokens = queryTokens(state.query);
  if (!tokens.length) return true;
  const text = haystack(task);
  return tokens.every((token) => text.includes(token));
}

function taskNameMatchesQuery(task) {
  const tokens = queryTokens(state.query);
  if (!tokens.length) return false;
  const taskName = normalize(task.taskName);
  return tokens.every((token) => taskName.includes(token));
}

function searchResultScore(task) {
  if (!state.query.trim()) return 0;
  const normalizedQuery = normalize(state.query);
  const taskName = normalize(task.taskName);
  if (taskName === normalizedQuery) return 4;
  if (taskName.includes(normalizedQuery)) return 3;
  if (taskNameMatchesQuery(task)) return 2;
  return 1;
}

function scenarioScore(task) {
  const text = haystack(task);
  const priorityScore = { P0: 80, P1: 55, P2: 30, P3: 10 }[effectiveGlobalPriority(task)] || 0;
  const dependencyScore = task.mappedDependencies ? (task.dependencyConfidence === "High" ? 22 : task.dependencyConfidence === "Medium" ? 14 : 7) : 0;
  const valueScore = task.businessValue === "High" ? 16 : task.businessValue === "Medium" ? 8 : 2;
  const lowEffort = Math.max(0, 32 - Number(task.estimatedHours || 0));
  const keywordScore = (words, weight) => words.reduce((sum, word) => sum + (text.includes(word) ? weight : 0), 0);

  if (state.scenario === "compliance") {
    return priorityScore + dependencyScore + valueScore + keywordScore(["security", "audit", "control", "compliance", "permission"], 18);
  }
  if (state.scenario === "finance") {
    return priorityScore + dependencyScore + valueScore + keywordScore(["finance", "close", "budget", "ledger", "report", "forecast"], 18);
  }
  if (state.scenario === "payroll") {
    return priorityScore + dependencyScore + valueScore + keywordScore(["payroll", "benefits", "worker", "hcm", "absence", "time"], 20);
  }
  if (state.scenario === "quickWins") {
    return priorityScore + valueScore + lowEffort + (effectiveRoadmapPriority(task) === "High" ? 14 : 0);
  }
  if (state.scenario === "conservative") {
    return priorityScore + dependencyScore + valueScore - Math.max(0, Number(task.estimatedHours || 0) - 24);
  }
  return priorityScore + dependencyScore + valueScore + (1000 - Number(task.globalRank || 1000)) / 100;
}

function applyScenario(tasks) {
  return [...tasks].sort((a, b) => {
    const searchDelta = searchResultScore(b) - searchResultScore(a);
    if (searchDelta) return searchDelta;
    const scoreDelta = scenarioScore(b) - scenarioScore(a);
    if (scoreDelta) return scoreDelta;
    return Number(a.globalRank || 9999) - Number(b.globalRank || 9999);
  });
}

function priorityClass(priority) {
  return `priority-${priority}`;
}

function taskKey(task) {
  return `${task.wbs || ""}-${task.globalRank || ""}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function publishedSmartsheetLinkForWorkgroup(workgroup = "") {
  return publishedSmartsheetLinks[workgroup] || "";
}

function workgroupFromWbs(wbs = "") {
  const match = String(wbs).match(/^WBS-(\d+)/);
  return match ? workgroupByWbsPrefix[match[1]] || "" : "";
}

function publishedSmartsheetLinkForWbs(wbs = "") {
  return publishedSmartsheetLinkForWorkgroup(workgroupFromWbs(wbs));
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  window.setTimeout(() => el.toast.classList.remove("show"), 1800);
}

function saveDecisions() {
  localStorage.setItem("wdOptimizeDecisions", JSON.stringify(state.decisions));
}

function savePriorityOverrides() {
  localStorage.setItem("wdOptimizePriorityOverrides", JSON.stringify(state.priorityOverrides));
}

function effectiveGlobalPriority(task) {
  return state.priorityOverrides[taskKey(task)]?.globalPriority || task.globalPriority;
}

function effectiveRoadmapPriority(task) {
  return state.priorityOverrides[taskKey(task)]?.roadmapPriority || task.roadmapPriority;
}

function updateTaskPriority(taskKeyValue, globalPriority, roadmapPriority) {
  const original = state.data.tasks.find((task) => taskKey(task) === taskKeyValue);
  if (!original) return;
  state.priorityOverrides[taskKeyValue] = {
    globalPriority,
    roadmapPriority,
    updatedAt: new Date().toISOString()
  };
  savePriorityOverrides();
  render();
  showToast("Priority updated");
}

function businessImpactLine(task) {
  const priority = effectiveGlobalPriority(task) === "P0"
    ? "This is a critical-path item tied to controls, compliance, launch stability, or executive reporting."
    : effectiveGlobalPriority(task) === "P1"
      ? "This is a high-value item that can unlock better reporting, close discipline, security, or cross-functional execution."
      : effectiveGlobalPriority(task) === "P2"
        ? "This improves operating efficiency and adoption once the critical foundation is stable."
        : "This is a targeted enhancement that can reduce friction after higher-priority work is underway.";
  return priority;
}

function decisionLine(task) {
  const priority = effectiveGlobalPriority(task);
  if (priority === "P0") return "Approve, assign ownership, and protect capacity while confirming mapped predecessor work is sequenced first.";
  if (priority === "P1") return "Approve if the owner can absorb the change; otherwise schedule immediately after P0 stabilization.";
  if (priority === "P2") return "Bundle with adjacent workstream improvements so it does not fragment delivery capacity.";
  return "Defer unless it supports an executive sponsor, a blocked team, or a near-term adoption push.";
}

function riskLine(task) {
  const riskParts = [];
  if (task.mappedDependencies) riskParts.push("mapped predecessor work may delay this item if it is not sequenced first");
  if (/security|audit|control|compliance/i.test([task.taskName, task.objective, task.shortReason].join(" "))) riskParts.push("control or audit exposure could remain unresolved");
  if (/payroll|finance|close|budget/i.test([task.workgroup, task.taskName, task.objective].join(" "))) riskParts.push("business-cycle execution could stay manual or harder to trust");
  return riskParts.length ? riskParts.join("; ") + "." : "the main risk is continued manual effort, slower adoption, and lower confidence in Workday data.";
}

function renderWhySummary(task) {
  if (!task) {
    el.whySummaryMeta.textContent = "";
    el.whySummary.innerHTML = '<p class="subtle">Select a task below to see the business impact, risk, decision path, and expected outcome in plain English.</p>';
    return;
  }

  const globalPriority = effectiveGlobalPriority(task);
  const roadmapPriority = effectiveRoadmapPriority(task);
  el.whySummaryMeta.textContent = `${globalPriority} | Rank ${task.globalRank || "-"} | ${formatHours(task.estimatedHours)}`;
  el.whySummary.innerHTML = `
    <div class="why-hero">
      <div>
        <p class="eyebrow">${escapeHtml(task.workgroup)} Workstream</p>
        <h3>${escapeHtml(task.taskName)}</h3>
        <p class="source-link">${renderSmartsheetTaskLink(task)}</p>
      </div>
      <span class="priority-chip ${globalPriority.toLowerCase()}">${escapeHtml(globalPriority)}</span>
    </div>
    <div class="priority-editor">
      <label>
        <span>Global Priority</span>
        <select id="selectedGlobalPriority">
          ${["P0", "P1", "P2", "P3", "UNRANKED"].map((priority) => `<option value="${priority}" ${globalPriority === priority ? "selected" : ""}>${priority}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Roadmap Priority</span>
        <select id="selectedRoadmapPriority">
          ${["High", "Medium", "Low"].map((priority) => `<option value="${priority}" ${roadmapPriority === priority ? "selected" : ""}>${priority}</option>`).join("")}
        </select>
      </label>
      <button id="saveSelectedPriority" class="button" type="button">Save Priority</button>
      <button id="clearSelectedPriority" class="button secondary" type="button">Clear Override</button>
    </div>
    <div class="why-grid">
      <article>
        <span>Business Problem</span>
        <p>${escapeHtml(task.optimizationRequest || task.objective || task.taskName)}</p>
      </article>
      <article>
        <span>Why It Matters</span>
        <p>${escapeHtml(businessImpactLine(task))}</p>
      </article>
      <article>
        <span>Risk If Delayed</span>
        <p>${escapeHtml(riskLine(task))}</p>
      </article>
      <article>
        <span>Executive Action</span>
        <p>${escapeHtml(decisionLine(task))}</p>
      </article>
    </div>
    <div class="why-outcome">
      <strong>Expected outcome:</strong>
      <span>${escapeHtml(task.deliverable || "Validated configuration, documentation, and knowledge transfer.")}</span>
    </div>
    ${renderPlainEnglishContext(task)}
    <div class="why-jira">
      <p class="eyebrow">Jira Connection</p>
      ${renderJiraSummary(task)}
    </div>
    <div class="why-jira">
      <p class="eyebrow">Mapped Dependencies</p>
      ${renderDependencySummary(task)}
    </div>
    <div class="why-foot">
      <span>${escapeHtml(formatDate(task.startDate))} - ${escapeHtml(formatDate(task.finishDate))}</span>
      <span>${escapeHtml(roadmapPriority)} roadmap priority</span>
      <span>${escapeHtml(task.businessValue)} business value</span>
    </div>
  `;
  bindPriorityEditor(task);
}

function getDecision(task) {
  return state.decisions[taskKey(task)] || { status: "needs-follow-up", notes: "" };
}

function bindPriorityEditor(task) {
  const save = document.querySelector("#saveSelectedPriority");
  const clear = document.querySelector("#clearSelectedPriority");
  const globalSelect = document.querySelector("#selectedGlobalPriority");
  const roadmapSelect = document.querySelector("#selectedRoadmapPriority");
  if (!save || !clear || !globalSelect || !roadmapSelect) return;
  const key = taskKey(task);
  save.addEventListener("click", () => updateTaskPriority(key, globalSelect.value, roadmapSelect.value));
  clear.addEventListener("click", () => {
    delete state.priorityOverrides[key];
    savePriorityOverrides();
    render();
    showToast("Priority override cleared");
  });
}

function jiraInfo(task = {}) {
  return {
    key: task.jiraKey || "",
    url: task.jiraUrl || "",
    status: task.jiraStatus || "",
    assignee: task.jiraAssignee || "",
    summary: task.jiraSummary || ""
  };
}

function renderJiraSummary(task) {
  const jira = jiraInfo(task);
  const urlMarkup = jira.url
    ? `<a href="${escapeHtml(jira.url)}" target="_blank" rel="noopener">Open in Jira</a>`
    : '<span class="muted-value">URL pending</span>';
  return `
    <div class="jira-grid">
      <div><span>Jira Key</span><strong>${escapeHtml(jira.key || "Not linked yet")}</strong></div>
      <div><span>Jira Status</span><strong>${escapeHtml(jira.status || "Not synced")}</strong></div>
      <div><span>Jira Assignee</span><strong>${escapeHtml(jira.assignee || "Unassigned")}</strong></div>
      <div><span>Jira URL</span>${urlMarkup}</div>
      <div class="jira-summary-cell"><span>Jira Current Summary</span><strong>${escapeHtml(jira.summary || task.taskName || "Not synced")}</strong></div>
    </div>
  `;
}

function renderPlainEnglishContext(task = {}) {
  if (!task.plainEnglishWorkdayProdChange) return "";
  return `
    <div class="plain-english-context">
      <strong>Plain-English Workday Prod context:</strong>
      <p>${escapeHtml(task.plainEnglishWorkdayProdChange)}</p>
    </div>
  `;
}

function renderSmartsheetTaskLink(task = {}) {
  const publishedLink = publishedSmartsheetLinkForWorkgroup(task.workgroup);
  if (publishedLink) {
    return `<a href="${escapeHtml(publishedLink)}" target="_blank" rel="noopener">Open published ${escapeHtml(task.workgroup)} sheet</a>`;
  }
  return task.smartsheetRowLink
    ? `<a href="${escapeHtml(task.smartsheetRowLink)}" target="_blank" rel="noopener">Open selected task row</a>`
    : '<span class="muted-value">No Smartsheet row link captured</span>';
}

function renderDependencySummary(task = {}) {
  if (!task.mappedDependencies) {
    return '<p class="subtle">No mapped predecessor dependency for this task.</p>';
  }
  const dependencyLinks = parseDependencyLinks(task.mappedDependencyLinks);
  const linksMarkup = dependencyLinks.length
    ? dependencyLinks.map((link) => `<a href="${escapeHtml(publishedSmartsheetLinkForWbs(link.wbs) || link.url)}" target="_blank" rel="noopener">${escapeHtml(link.wbs)}</a>`).join(" ")
    : renderDependencyFallbackLinks(task.mappedPredecessorWbs);
  return `
    <div class="dependency-summary">
      <div><span>Predecessor WBS</span><strong>${escapeHtml(task.mappedPredecessorWbs || "TBD")}</strong></div>
      <div><span>Depends On</span><strong>${escapeHtml(task.mappedDependencies)}</strong></div>
      <div><span>Smartsheet Sheet</span><strong>${linksMarkup}</strong></div>
      <div><span>Type</span><strong>${escapeHtml(task.dependencyType || "Mapped dependency")}</strong></div>
      <div><span>Confidence</span><strong>${escapeHtml(task.dependencyConfidence || "Unreviewed")}</strong></div>
      <div class="dependency-rationale"><span>Rationale</span><p>${escapeHtml(task.dependencyRationale || "")}</p></div>
    </div>
  `;
}

function parseDependencyLinks(value = "") {
  return String(value || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const pieces = part.split("|").map((piece) => piece.trim());
      return { wbs: pieces[0] || "Smartsheet row", url: pieces[1] || "" };
    })
    .filter((item) => item.url);
}

function renderOwnerAccountability(filtered, selectedTask = null) {
  if (!el.ownerAccountability) return;
  const byOwner = new Map();
  for (const task of filtered) {
    if (!byOwner.has(task.workgroup)) byOwner.set(task.workgroup, { tasks: [], hours: 0, p0: 0, decisions: { approved: 0, deferred: 0, followUp: 0 } });
    const row = byOwner.get(task.workgroup);
    row.tasks.push(task);
    row.hours += Number(task.estimatedHours || 0);
    if (effectiveGlobalPriority(task) === "P0") row.p0 += 1;
    const status = getDecision(task).status;
    if (status === "approved") row.decisions.approved += 1;
    else if (status === "deferred") row.decisions.deferred += 1;
    else row.decisions.followUp += 1;
  }

  if (selectedTask) {
    const ownerTasks = filtered.filter((task) => task.workgroup === selectedTask.workgroup);
    const ownerHours = ownerTasks.reduce((sum, task) => sum + Number(task.estimatedHours || 0), 0);
    const ownerP0 = ownerTasks.filter((task) => effectiveGlobalPriority(task) === "P0").length;
    const ownerDeps = ownerTasks.filter((task) => task.mappedDependencies).length;
    const selectedPosition = ownerTasks.findIndex((task) => taskKey(task) === taskKey(selectedTask)) + 1;
    const related = ownerTasks
      .filter((task) => taskKey(task) !== taskKey(selectedTask))
      .slice(0, 5);

    el.ownerAccountability.innerHTML = `
      <div class="owner-focus">
        <div class="owner-focus-head">
          <div>
            <p class="eyebrow">Focused Owner</p>
            <h3>${escapeHtml(selectedTask.workgroup)}</h3>
          </div>
          <button class="text-button" type="button" data-owner="${escapeHtml(selectedTask.workgroup)}">Filter to owner</button>
        </div>
        <div class="owner-metrics">
          <div><strong>${ownerTasks.length}</strong><span>visible tasks</span></div>
          <div><strong>${formatHours(ownerHours)}</strong><span>visible effort</span></div>
          <div><strong>${ownerP0}</strong><span>P0 items</span></div>
          <div><strong>${ownerDeps}</strong><span>mapped deps</span></div>
        </div>
        <div class="owner-selected-task">
          <span>Selected task</span>
          <strong>${escapeHtml(selectedTask.taskName)}</strong>
          <p>${escapeHtml(effectiveGlobalPriority(selectedTask))} | owner rank ${selectedPosition || "-"} of ${ownerTasks.length} | ${formatHours(selectedTask.estimatedHours)}</p>
          <p>${renderSmartsheetTaskLink(selectedTask)}</p>
        </div>
        <div class="owner-jira">
          <span>Jira ticket</span>
          ${renderJiraSummary(selectedTask)}
        </div>
        ${selectedTask.plainEnglishWorkdayProdChange ? `
          <div class="owner-jira">
            <span>Plain-English Workday Prod Context</span>
            <p class="plain-english-copy">${escapeHtml(selectedTask.plainEnglishWorkdayProdChange)}</p>
          </div>
        ` : ""}
        <div class="owner-jira">
          <span>Dependency map</span>
          ${renderDependencySummary(selectedTask)}
        </div>
        <div class="owner-related">
          <span>Related ${escapeHtml(selectedTask.workgroup)} work</span>
          ${related.length ? related.map((task) => `
            <button type="button" data-task-key="${taskKey(task)}">
              <strong>${escapeHtml(task.taskName)}</strong>
              <small>${escapeHtml(effectiveGlobalPriority(task))} | ${formatHours(task.estimatedHours)} | ${escapeHtml(task.shortReason || "")}</small>
            </button>
          `).join("") : '<p class="subtle">No related visible tasks under the current filters.</p>'}
        </div>
      </div>
    `;
    bindOwnerAccountabilityActions(filtered);
    return;
  }

  const rows = [...byOwner.entries()].sort((a, b) => b[1].hours - a[1].hours);
  el.ownerAccountability.innerHTML = rows.length ? rows.map(([owner, row]) => {
    const topRisk = row.tasks.find((task) => effectiveGlobalPriority(task) === "P0") || row.tasks[0];
    return `
      <button class="owner-row" type="button" data-owner="${escapeHtml(owner)}">
        <div>
          <strong>${escapeHtml(owner)}</strong>
          <div class="meta">${row.tasks.length} tasks | ${formatHours(row.hours)} | ${row.p0} P0</div>
          <div class="meta">Top focus: ${escapeHtml(topRisk?.taskName || "None")}</div>
        </div>
        <div class="owner-decisions">
          <span>${row.decisions.approved} approved</span>
          <span>${row.decisions.deferred} deferred</span>
          <span>${row.decisions.followUp} follow-up</span>
        </div>
      </button>
    `;
  }).join("") : '<p class="subtle">No owner impact to show.</p>';

  bindOwnerAccountabilityActions(filtered);
}

function bindOwnerAccountabilityActions(filtered) {
  el.ownerAccountability.querySelectorAll("[data-owner]").forEach((button) => {
    button.addEventListener("click", () => {
      state.workgroup = button.dataset.owner;
      el.workgroupFilter.value = state.workgroup;
      render();
    });
  });
  el.ownerAccountability.querySelectorAll("[data-task-key]").forEach((button) => {
    button.addEventListener("click", () => {
      selectTaskByKey(button.dataset.taskKey, filtered);
    });
  });
}

function renderScenarioSummary(filtered) {
  if (!el.scenarioSummary) return;
  const scenarioLabels = {
    balanced: "Balances criticality, mapped dependencies, business value, effort, and global rank.",
    compliance: "Pulls security, audit, controls, compliance, and dependency-sensitive work forward.",
    finance: "Prioritizes finance close, budget, ledger, forecast, and reporting improvements.",
    payroll: "Elevates payroll, benefits, HCM, worker, absence, and time-sensitive stability items.",
    quickWins: "Favors high-value, lower-effort items that leadership can move quickly.",
    conservative: "Protects capacity by favoring critical items with smaller delivery load."
  };
  const top = filtered.slice(0, 3);
  el.scenarioSummary.innerHTML = `
    <p>${escapeHtml(scenarioLabels[state.scenario] || scenarioLabels.balanced)}</p>
    <div class="scenario-picks">
      ${top.map((task) => `
        <button type="button" data-task-key="${taskKey(task)}">
          <strong>${escapeHtml(task.taskName)}</strong>
          <span>${escapeHtml(task.workgroup)} | ${escapeHtml(effectiveGlobalPriority(task))} | ${formatHours(task.estimatedHours)}</span>
        </button>
      `).join("")}
    </div>
  `;
  el.scenarioSummary.querySelectorAll("[data-task-key]").forEach((button) => {
    button.addEventListener("click", () => {
      selectTaskByKey(button.dataset.taskKey, filtered);
    });
  });
}

function renderFilters() {
  const options = ['<option value="">All workgroups</option>']
    .concat(state.data.workgroupSummaries.map((row) => `<option value="${row.workgroup}">${row.workgroup}</option>`));
  el.workgroupFilter.innerHTML = options.join("");
}

function renderKpis(filtered) {
  const totals = state.data.totals;
  const filteredHours = filtered.reduce((sum, task) => sum + task.estimatedHours, 0);
  const filteredDeps = filtered.filter((task) => task.mappedDependencies).length;
  el.totalHours.textContent = formatHours(totals.estimatedHours);
  el.totalItems.textContent = `${totals.taskCount} tasks across ${totals.workgroupCount} workgroups`;
  el.p0Hours.textContent = formatHours(totals.p0Hours);
  el.p0Items.textContent = `${totals.p0Count} P0 tasks`;
  el.filteredHours.textContent = formatHours(filteredHours);
  el.filteredItems.textContent = `${filtered.length} visible tasks`;
  el.scheduleWindow.textContent = `${formatDate(totals.earliestStart)} - ${formatDate(totals.latestFinish)}`;
  el.dependencyCount.textContent = `${filteredDeps} visible mapped dependencies`;
}

function renderWorkstreams(filtered) {
  const byWorkgroup = new Map();
  for (const task of filtered) {
    if (!byWorkgroup.has(task.workgroup)) {
      byWorkgroup.set(task.workgroup, { hours: 0, tasks: 0, p0: 0 });
    }
    const row = byWorkgroup.get(task.workgroup);
    row.hours += task.estimatedHours;
    row.tasks += 1;
    if (effectiveGlobalPriority(task) === "P0") row.p0 += 1;
  }
  const max = Math.max(...state.data.workgroupSummaries.map((row) => row.estimatedHours), 1);
  el.workstreamList.innerHTML = state.data.workgroupSummaries
    .map((row) => {
      const visible = byWorkgroup.get(row.workgroup) || { hours: 0, tasks: 0, p0: 0 };
      const active = state.workgroup === row.workgroup ? " active" : "";
      return `
        <button class="workstream-row${active}" type="button" data-workgroup="${row.workgroup}">
          <div>
            <strong>${row.workgroup}</strong>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.max(3, (row.estimatedHours / max) * 100)}%"></div></div>
            <div class="meta">${row.taskCount} tasks total | ${row.highRoadmapCount} high roadmap</div>
          </div>
          <div><strong>${formatHours(row.estimatedHours)}</strong><div class="meta">total</div></div>
          <div><strong>${visible.tasks}</strong><div class="meta">shown</div></div>
        </button>
      `;
    })
    .join("");

  el.workstreamList.querySelectorAll("[data-workgroup]").forEach((button) => {
    button.addEventListener("click", () => {
      state.workgroup = state.workgroup === button.dataset.workgroup ? "" : button.dataset.workgroup;
      el.workgroupFilter.value = state.workgroup;
      render();
    });
  });
}

function renderPriorityBars(filtered) {
  const filteredByPriority = new Map();
  for (const task of filtered) {
    filteredByPriority.set(effectiveGlobalPriority(task), (filteredByPriority.get(effectiveGlobalPriority(task)) || 0) + task.estimatedHours);
  }
  const max = Math.max(...state.data.prioritySummary.map((row) => row.estimatedHours), 1);
  el.priorityBars.innerHTML = state.data.prioritySummary
    .map((row) => {
      const visibleHours = filteredByPriority.get(row.priority) || 0;
      return `
        <div class="priority-row">
          <span class="priority-chip ${row.priority.toLowerCase()}">${row.priority}</span>
          <div>
            <div class="bar-track"><div class="bar-fill ${priorityClass(row.priority)}" style="width:${Math.max(3, (row.estimatedHours / max) * 100)}%"></div></div>
            <div class="meta">${row.priorityGroup}</div>
          </div>
          <div><strong>${formatHours(row.estimatedHours)}</strong><div class="meta">${formatHours(visibleHours)} shown</div></div>
        </div>
      `;
    })
    .join("");
}

function renderTimeline() {
  const dates = state.data.workgroupSummaries.flatMap((row) => [dateValue(row.startDate), dateValue(row.finishDate)]).filter(Boolean);
  const min = Math.min(...dates);
  const max = Math.max(...dates);
  const span = Math.max(max - min, 1);
  el.timeline.innerHTML = state.data.workgroupSummaries.slice(0, 8).map((row) => {
    const left = ((dateValue(row.startDate) - min) / span) * 100;
    const width = Math.max(2, ((dateValue(row.finishDate) - dateValue(row.startDate)) / span) * 100);
    return `
      <div class="timeline-row">
        <div><strong>${row.workgroup}</strong><div class="meta">${formatDate(row.startDate)} - ${formatDate(row.finishDate)}</div></div>
        <div class="timeline-track"><div class="timeline-fill" style="left:${left}%; width:${width}%"></div></div>
      </div>
    `;
  }).join("");
}

function renderTable(filtered) {
  const limited = filtered.slice(0, 200);
  const taskNameMatchCount = state.query.trim()
    ? filtered.filter(taskNameMatchesQuery).length
    : 0;
  el.tableTitle.textContent = state.query || state.workgroup || state.roadmap || state.dependencyOnly
    ? "Filtered Optimization Tasks"
    : "All Optimization Tasks";
  el.activeSummary.textContent = `${limited.length} rows | ${formatHours(filtered.reduce((sum, task) => sum + task.estimatedHours, 0))}${taskNameMatchCount ? ` | ${taskNameMatchCount} task-name matches` : ""}`;
  el.taskTable.innerHTML = limited
    .map((task) => `
      <tr class="task-row ${state.selectedTaskKey === taskKey(task) ? "selected-row" : ""}" data-task-key="${taskKey(task)}">
        <td>${task.globalRank || ""}</td>
        <td><span class="priority-chip ${effectiveGlobalPriority(task).toLowerCase()}">${effectiveGlobalPriority(task)}</span></td>
        <td>${task.workgroup}</td>
        <td>
          <div class="task-name">${escapeHtml(task.taskName)}${taskNameMatchesQuery(task) ? '<span class="match-pill">Task name match</span>' : ""}</div>
          <div class="subtle">${effectiveRoadmapPriority(task)} roadmap priority | ${task.businessValue} business value</div>
        </td>
        <td>${task.estimatedHours}</td>
        <td>${formatDate(task.startDate)} - ${formatDate(task.finishDate)}</td>
        <td>${task.mappedDependencies ? `<strong>${renderDependencyCellLinks(task)}</strong><div class="subtle">${escapeHtml(task.mappedDependencies)}</div><div class="subtle">${escapeHtml(task.dependencyConfidence || "")} confidence</div>` : '<span class="subtle">None mapped</span>'}</td>
        <td>
          <div>${task.shortReason}</div>
          <button class="text-button" type="button" data-task-key="${taskKey(task)}">Focus task</button>
        </td>
      </tr>
    `)
    .join("");
}

function renderDependencyCellLinks(task) {
  const links = parseDependencyLinks(task.mappedDependencyLinks);
  if (!links.length) return renderDependencyFallbackLinks(task.mappedPredecessorWbs);
  return links.map((link) => {
    const url = publishedSmartsheetLinkForWbs(link.wbs) || link.url;
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(link.wbs)}</a>`;
  }).join(" ");
}

function renderDependencyFallbackLinks(value = "") {
  const wbsItems = String(value || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!wbsItems.length) return '<span class="muted-value">No sheet link captured</span>';
  return wbsItems.map((wbs) => {
    const url = publishedSmartsheetLinkForWbs(wbs);
    return url
      ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(wbs)}</a>`
      : escapeHtml(wbs);
  }).join(" ");
}

function renderDependencyFocus(filtered) {
  if (!el.dependencyFocusPanel) return;
  const dependencyTasks = filtered.filter((task) => task.mappedDependencies);
  el.dependencyFocusPanel.classList.toggle("hidden", !state.dependencyOnly);
  if (el.dependencyFocusToggle) {
    el.dependencyFocusToggle.classList.toggle("active", state.dependencyOnly);
    el.dependencyFocusToggle.textContent = state.dependencyOnly ? "Dependency Focus On" : "Dependency Focus";
  }
  if (!state.dependencyOnly) return;

  const high = dependencyTasks.filter((task) => task.dependencyConfidence === "High").length;
  const medium = dependencyTasks.filter((task) => task.dependencyConfidence === "Medium").length;
  const low = dependencyTasks.filter((task) => task.dependencyConfidence === "Low").length;
  el.dependencyFocusSummary.textContent = `${dependencyTasks.length} mapped | ${high} high | ${medium} medium | ${low} low`;

  if (!dependencyTasks.length) {
    el.dependencyFocusList.innerHTML = '<p class="subtle">No mapped dependencies match the current filters.</p>';
    return;
  }

  el.dependencyFocusList.innerHTML = dependencyTasks.map((task) => `
    <article class="dependency-card ${state.selectedTaskKey === taskKey(task) ? "active" : ""}">
      <button type="button" data-task-key="${taskKey(task)}">
        <div>
          <p class="eyebrow">${escapeHtml(task.workgroup)} | ${escapeHtml(effectiveGlobalPriority(task))}</p>
          <h3>${escapeHtml(task.taskName)}</h3>
        </div>
        <span>${escapeHtml(task.dependencyConfidence || "Unreviewed")}</span>
      </button>
      <div class="dependency-card-body">
        <div><strong>Depends on</strong><p>${task.mappedDependencyLinks ? renderDependencyCellLinks(task) : escapeHtml(task.mappedDependencies)}</p></div>
        <div><strong>Type</strong><p>${escapeHtml(task.dependencyType || "Mapped dependency")}</p></div>
        <div><strong>Why</strong><p>${escapeHtml(task.dependencyRationale || "")}</p></div>
      </div>
    </article>
  `).join("");

  el.dependencyFocusList.querySelectorAll("[data-task-key]").forEach((button) => {
    button.addEventListener("click", () => selectTaskByKey(button.dataset.taskKey, filtered));
  });
}

function selectTaskByKey(key, filtered = applyScenario(state.data.tasks.filter(matchesTask))) {
  state.selectedTaskKey = key;
  const selected = filtered.find((task) => taskKey(task) === key)
    || state.data.tasks.find((task) => taskKey(task) === key);
  renderWhySummary(selected);
  renderOwnerAccountability(filtered, selected);
  renderTable(filtered);
  renderDependencyFocus(filtered);
  el.whySummary.scrollIntoView({ behavior: "smooth", block: "center" });
}

function executiveBrief(filtered) {
  const hours = filtered.reduce((sum, task) => sum + task.estimatedHours, 0);
  const top = filtered.slice(0, 5).map((task) => `${effectiveGlobalPriority(task)} #${task.globalRank}: ${task.workgroup} - ${task.taskName} (${task.estimatedHours} hrs)`);
  return [
    "WD Optimize Executive Brief",
    `Visible scope: ${filtered.length} tasks, ${Math.round(hours).toLocaleString()} estimated hours.`,
    `P0 visible: ${filtered.filter((task) => effectiveGlobalPriority(task) === "P0").length} tasks.`,
    `Mapped dependencies visible: ${filtered.filter((task) => task.mappedDependencies).length} tasks.`,
    "",
    "Top visible priorities:",
    ...top,
    "",
    "Why this matters:",
    ...filtered.slice(0, 3).map((task) => `${task.workgroup} - ${task.taskName}: ${businessImpactLine(task)} Risk if delayed: ${riskLine(task)}`),
  ].join("\n");
}

function boardPacketSections(filtered) {
  const hours = filtered.reduce((sum, task) => sum + Number(task.estimatedHours || 0), 0);
  const p0 = filtered.filter((task) => effectiveGlobalPriority(task) === "P0");
  const risks = filtered
    .filter((task) => effectiveGlobalPriority(task) === "P0" || effectiveRoadmapPriority(task) === "High" || task.mappedDependencies)
    .slice(0, 8);
  const decisionsNeeded = filtered
    .filter((task) => getDecision(task).status === "needs-follow-up")
    .slice(0, 10);
  const ownerRows = [...filtered.reduce((map, task) => {
    if (!map.has(task.workgroup)) map.set(task.workgroup, { count: 0, hours: 0, p0: 0 });
    const row = map.get(task.workgroup);
    row.count += 1;
    row.hours += Number(task.estimatedHours || 0);
    if (effectiveGlobalPriority(task) === "P0") row.p0 += 1;
    return map;
  }, new Map()).entries()].sort((a, b) => b[1].hours - a[1].hours);
  const taskWithJira = (task) => {
    const jira = jiraInfo(task);
    const jiraText = jira.key || jira.status || jira.assignee
      ? ` | Jira: ${jira.key || "unlinked"}${jira.status ? ` / ${jira.status}` : ""}${jira.assignee ? ` / ${jira.assignee}` : ""}`
      : " | Jira: not linked yet";
    const depText = task.mappedDependencies
      ? ` | Depends on: ${task.mappedPredecessorWbs || "TBD"} ${task.mappedDependencies} (${task.dependencyConfidence || "unreviewed"} confidence)`
      : "";
    return `${effectiveGlobalPriority(task)} #${task.globalRank}: ${task.workgroup} - ${task.taskName} (${task.estimatedHours} hrs)${jiraText}${depText}`;
  };

  return [
    {
      title: "Executive Summary",
      lines: [
        `Scenario: ${el.scenarioPlanner.options[el.scenarioPlanner.selectedIndex]?.text || "Balanced Executive Roadmap"}`,
        `Generated: ${new Date().toLocaleString()}`,
        `Visible roadmap scope includes ${filtered.length} tasks and ${Math.round(hours).toLocaleString()} estimated hours.`,
        `${p0.length} tasks are P0 critical items. ${filtered.filter((task) => task.mappedDependencies).length} visible tasks have mapped predecessor dependencies.`
      ]
    },
    {
      title: "Top Priorities",
      lines: filtered.slice(0, 10).map(taskWithJira)
    },
    {
      title: "Risks",
      lines: risks.map((task) => `${task.workgroup} - ${task.taskName}: ${riskLine(task)}`)
    },
    {
      title: "Decisions Needed",
      lines: decisionsNeeded.length
        ? decisionsNeeded.map((task) => `${task.workgroup} - ${task.taskName}: ${decisionLine(task)}`)
        : ["No outstanding follow-up decisions in the current filtered view."]
    },
    {
      title: "Timeline",
      lines: [
        `Overall window: ${formatDate(state.data.totals.earliestStart)} - ${formatDate(state.data.totals.latestFinish)}`,
        ...state.data.workgroupSummaries.slice(0, 10).map((row) => `${row.workgroup}: ${formatDate(row.startDate)} - ${formatDate(row.finishDate)} (${formatHours(row.estimatedHours)})`)
      ]
    },
    {
      title: "Department Impact",
      lines: ownerRows.map(([owner, row]) => `${owner}: ${row.count} tasks, ${formatHours(row.hours)}, ${row.p0} P0`)
    }
  ];
}

function boardPacketText(filtered) {
  return [
    "WD Optimize Board Packet",
    ...boardPacketSections(filtered).flatMap((section) => ["", section.title, ...section.lines.map((line) => `- ${line}`)])
  ].join("\n");
}

function addPdfSection(doc, section, cursor) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const usableWidth = pageWidth - margin * 2;
  let y = cursor;
  const ensureRoom = (height) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  ensureRoom(28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text(section.title, margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  for (const line of section.lines) {
    const wrapped = doc.splitTextToSize(`- ${line}`, usableWidth);
    ensureRoom(wrapped.length * 13 + 6);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 13 + 6;
  }

  return y + 8;
}

function exportBoardPacketPdf(filtered) {
  const jsPdf = window.jspdf?.jsPDF;
  if (!jsPdf) {
    throw new Error("PDF library did not load. Check internet access or ad blocker settings.");
  }

  const doc = new jsPdf({ unit: "pt", format: "letter" });
  const sections = boardPacketSections(filtered);
  let y = 52;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 118, 110);
  doc.text("WD Optimize Board Packet", 48, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(91, 102, 117);
  doc.text("Executive-ready roadmap summary generated from the current app filters and scenario.", 48, y);
  y += 28;

  for (const section of sections) {
    y = addPdfSection(doc, section, y);
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 130, 145);
    doc.text(`Page ${page} of ${pageCount}`, 48, doc.internal.pageSize.getHeight() - 24);
  }

  doc.save("wd-optimize-board-packet.pdf");
}

function render() {
  const filtered = applyScenario(state.data.tasks.filter(matchesTask));
  renderKpis(filtered);
  renderWorkstreams(filtered);
  renderPriorityBars(filtered);
  renderTimeline();
  let selected = filtered.find((task) => taskKey(task) === state.selectedTaskKey);
  if (!selected) {
    selected = filtered[0];
    state.selectedTaskKey = selected ? taskKey(selected) : "";
  }
  renderTable(filtered);
  renderWhySummary(selected);
  renderScenarioSummary(filtered);
  renderOwnerAccountability(filtered, selected);
  renderDependencyFocus(filtered);
}

function bindEvents() {
  el.searchInput.addEventListener("input", () => {
    state.query = el.searchInput.value;
    render();
  });
  el.workgroupFilter.addEventListener("change", () => {
    state.workgroup = el.workgroupFilter.value;
    render();
  });
  el.roadmapFilter.addEventListener("change", () => {
    state.roadmap = el.roadmapFilter.value;
    render();
  });
  el.dependencyOnly.addEventListener("change", () => {
    state.dependencyOnly = el.dependencyOnly.checked;
    render();
    if (state.dependencyOnly) el.dependencyFocusPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  el.dependencyFocusToggle.addEventListener("click", () => {
    state.query = "";
    state.workgroup = "";
    state.roadmap = "";
    state.dependencyOnly = true;
    el.searchInput.value = "";
    el.workgroupFilter.value = "";
    el.roadmapFilter.value = "";
    el.dependencyOnly.checked = true;
    render();
    el.dependencyFocusPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  el.resetFilters.addEventListener("click", () => {
    state.query = "";
    state.workgroup = "";
    state.roadmap = "";
    state.dependencyOnly = false;
    el.searchInput.value = "";
    el.workgroupFilter.value = "";
    el.roadmapFilter.value = "";
    el.dependencyOnly.checked = false;
    render();
  });
  el.copyBrief.addEventListener("click", async () => {
    const filtered = applyScenario(state.data.tasks.filter(matchesTask));
    await navigator.clipboard.writeText(executiveBrief(filtered));
    showToast("Executive brief copied");
  });
  el.exportBoardPacket.addEventListener("click", async () => {
    const filtered = applyScenario(state.data.tasks.filter(matchesTask));
    const originalText = el.exportBoardPacket.textContent;
    el.exportBoardPacket.textContent = "Generating PDF...";
    el.exportBoardPacket.disabled = true;
    try {
      exportBoardPacketPdf(filtered);
      await navigator.clipboard.writeText(boardPacketText(filtered)).catch(() => {});
      showToast("Board packet PDF downloaded");
    } catch (error) {
      console.error("Board packet PDF error:", error);
      showToast(error.message || "PDF export failed");
    } finally {
      el.exportBoardPacket.textContent = originalText;
      el.exportBoardPacket.disabled = false;
    }
  });
  el.scenarioPlanner.addEventListener("change", () => {
    state.scenario = el.scenarioPlanner.value;
    state.selectedTaskKey = "";
    render();
  });
  el.taskTable.addEventListener("click", (event) => {
    const target = event.target.closest("[data-task-key]");
    if (!target) return;
    state.selectedTaskKey = target.dataset.taskKey;
    const filtered = applyScenario(state.data.tasks.filter(matchesTask));
    selectTaskByKey(target.dataset.taskKey, filtered);
  });
}

async function init() {
  const response = await fetch("./data.json");
  state.data = await response.json();
  renderFilters();
  bindEvents();
  render();
}

init();


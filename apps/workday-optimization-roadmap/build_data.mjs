import fs from "node:fs/promises";
import path from "node:path";

const root = "C:/Users/franc/OneDrive/Documents/Portfolio";
const imsPath = path.join(root, "outputs/wd_optimize_smartsheet/csv/Integrated_Master_Schedule.csv");
const priorityPath = path.join(root, "outputs/wd_optimize_smartsheet/global_priority_paste_concise.csv");
const jiraMatchPath = path.join(root, "outputs/wd_optimize_smartsheet/jira_match.csv");
const outPath = path.join(root, "outputs/wd_optimize_exec_app/data.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (quoted) {
      if (c === '"' && n === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") {
      cell += c;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function records(rows) {
  const headers = rows[0];
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] ?? "";
    });
    return item;
  });
}

function key(area, item) {
  return `${(area || "").trim().toLowerCase()}|${(item || "").trim().toLowerCase()}`;
}

function itemKey(item) {
  return String(item || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\brfta'?s\b/g, "")
    .replace(/\bwd\b/g, "workday")
    .replace(/\bkt\b/g, "")
    .replace(/\bas needed\b/g, "")
    .replace(/\bisue\b/g, "issue")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function areaItemKey(area, item) {
  return `${String(area || "").trim().toLowerCase()}|${itemKey(item)}`;
}

function number(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstValue(row, names) {
  return names.map((name) => row?.[name]).find((value) => value) || "";
}

function normalizePriority(value) {
  const priority = String(value || "").trim().toUpperCase();
  return priority || "UNRANKED";
}

const imsRows = records(parseCsv(await fs.readFile(imsPath, "utf8")));
const priorityRowsRaw = parseCsv(await fs.readFile(priorityPath, "utf8"));
const jiraMatchRows = records(parseCsv(await fs.readFile(jiraMatchPath, "utf8")));
const priorityHeaderIndex = priorityRowsRaw.findIndex((row) => row[0] === "Global Priority" && row[2] === "Global Rank");
const priorityRows = records(priorityRowsRaw.slice(priorityHeaderIndex));
const priorityByKey = new Map(priorityRows.map((row) => [areaItemKey(row.Area, row["Optimization Item"]), row]));
const priorityByItem = new Map(priorityRows.map((row) => [itemKey(row["Optimization Item"]), row]));
const priorityByJiraKey = new Map(priorityRows
  .map((row) => [firstValue(row, ["JIRA Key", "Jira Key"]), row])
  .filter(([jiraKey]) => jiraKey));
const jiraByItem = new Map(jiraMatchRows.map((row) => [itemKey(row.Summary), row]));
const jiraByKey = new Map(jiraMatchRows
  .map((row) => [firstValue(row, ["Key", "JIRA Key", "Jira Key"]), row])
  .filter(([jiraKey]) => jiraKey));

const detailTasks = imsRows.filter((row) => row.Level === "2").map((row) => {
  const rowJiraKey = firstValue(row, ["JIRA Key", "Jira Key"]);
  const match = priorityByKey.get(areaItemKey(row.Workgroup, row["Task Name"]))
    ?? priorityByItem.get(itemKey(row["Task Name"]))
    ?? priorityByJiraKey.get(rowJiraKey)
    ?? {};
  const jiraMatch = jiraByKey.get(rowJiraKey)
    ?? jiraByItem.get(itemKey(row["Task Name"]))
    ?? {};
  const globalPriority = normalizePriority(match["Global Priority"]);
  const jiraKey = firstValue(match, ["JIRA Key", "Jira Key"])
    || rowJiraKey
    || jiraMatch.Key
    || "";
  const plainEnglishWorkdayProdChange = firstValue(match, ["Plain English Workday Prod Change"])
    || firstValue(jiraMatch, ["Plain English Workday Prod Change"])
    || "";
  const jiraSummary = firstValue(match, ["Jira Current Summary", "JIRA Current Summary"])
    || firstValue(jiraMatch, ["Jira Current Summary", "JIRA Current Summary"])
    || jiraMatch.Summary
    || "";
  return {
    wbs: row.WBS,
    parentWbs: row["Parent WBS"],
    workgroup: row.Workgroup,
    taskName: row["Task Name"],
    optimizationRequest: row["Optimization Request"],
    objective: row.Objective,
    deliverable: row.Deliverable,
    roadmapPriority: row.Priority,
    businessValue: row["Business Value"],
    estimatedHours: number(row["Estimated Hours"]),
    durationDays: number(row["Duration (days)"]),
    startDate: row["Start Date"],
    finishDate: row["Finish Date"],
    status: row.Status,
    percentComplete: number(row["% Complete"]),
    dependencies: row.Dependencies,
    mappedPredecessorWbs: row["Mapped Predecessor WBS"] || "",
    mappedDependencies: row["Mapped Dependencies"] || "",
    dependencyType: row["Dependency Type"] || "",
    dependencyConfidence: row["Dependency Confidence"] || "",
    dependencyRationale: row["Dependency Rationale"] || "",
    smartsheetSheetId: row["Smartsheet Sheet ID"] || "",
    smartsheetRowId: row["Smartsheet Row ID"] || "",
    smartsheetRowLink: row["Smartsheet Row Link"] || "",
    mappedDependencyLinks: row["Mapped Dependency Links"] || "",
    notes: row.Notes,
    sourceValidation: row["Source Validation"],
    jiraKey,
    jiraUrl: firstValue(match, ["JIRA URL", "Jira URL"])
      || firstValue(row, ["JIRA URL", "Jira URL"])
      || (jiraKey ? `https://guidehouse-workday.atlassian.net/browse/${jiraKey}` : ""),
    jiraStatus: firstValue(match, ["JIRA Status", "Jira Status"])
      || firstValue(row, ["JIRA Status", "Jira Status"])
      || firstValue(jiraMatch, ["JIRA Status", "Jira Status", "Status"]),
    jiraAssignee: firstValue(match, ["JIRA Assignee", "Jira Assignee"])
      || firstValue(row, ["JIRA Assignee", "Jira Assignee"])
      || firstValue(jiraMatch, ["JIRA Assignee", "Jira Assignee", "Assignee"]),
    jiraSummary,
    plainEnglishWorkdayProdChange,
    globalPriority,
    priorityGroup: match["Priority Group"] || "",
    globalRank: number(match["Global Rank"]),
    shortReason: match["Short Reason"] || "",
  };
});

const parentRows = imsRows.filter((row) => row.Level === "1").map((row) => ({
  wbs: row.WBS,
  workgroup: row.Workgroup,
  taskName: row["Task Name"],
  estimatedHours: number(row["Estimated Hours"]),
  startDate: row["Start Date"],
  finishDate: row["Finish Date"],
  durationDays: number(row["Duration (days)"]),
}));

const workgroups = [...new Set(detailTasks.map((task) => task.workgroup))].sort();
const workgroupSummaries = workgroups.map((workgroup) => {
  const tasks = detailTasks.filter((task) => task.workgroup === workgroup);
  const p0 = tasks.filter((task) => task.globalPriority === "P0");
  const p1 = tasks.filter((task) => task.globalPriority === "P1");
  const dates = tasks.flatMap((task) => [task.startDate, task.finishDate]).filter(Boolean).sort();
  return {
    workgroup,
    taskCount: tasks.length,
    estimatedHours: tasks.reduce((sum, task) => sum + task.estimatedHours, 0),
    p0Count: p0.length,
    p1Count: p1.length,
    highRoadmapCount: tasks.filter((task) => task.roadmapPriority === "High").length,
    mappedDependencyCount: tasks.filter((task) => task.mappedDependencies).length,
    startDate: dates[0] || "",
    finishDate: dates.at(-1) || "",
  };
}).sort((a, b) => b.estimatedHours - a.estimatedHours);

const priorities = ["P0", "P1", "P2", "P3"].concat(detailTasks.some((task) => task.globalPriority === "UNRANKED") ? ["UNRANKED"] : []);
const prioritySummary = priorities.map((priority) => {
  const tasks = detailTasks.filter((task) => task.globalPriority === priority);
  return {
    priority,
    priorityGroup: tasks[0]?.priorityGroup || "",
    taskCount: tasks.length,
    estimatedHours: tasks.reduce((sum, task) => sum + task.estimatedHours, 0),
  };
});

const source = {
  generatedAt: new Date().toISOString(),
  totals: {
    taskCount: detailTasks.length,
    estimatedHours: detailTasks.reduce((sum, task) => sum + task.estimatedHours, 0),
    p0Count: detailTasks.filter((task) => task.globalPriority === "P0").length,
    p0Hours: detailTasks.filter((task) => task.globalPriority === "P0").reduce((sum, task) => sum + task.estimatedHours, 0),
    mappedDependencyCount: detailTasks.filter((task) => task.mappedDependencies).length,
    workgroupCount: workgroups.length,
    earliestStart: detailTasks.map((task) => task.startDate).filter(Boolean).sort()[0],
    latestFinish: detailTasks.map((task) => task.finishDate).filter(Boolean).sort().at(-1),
  },
  prioritySummary,
  workgroupSummaries,
  parentRows,
  tasks: detailTasks.sort((a, b) => (a.globalRank || 9999) - (b.globalRank || 9999)),
};

await fs.writeFile(outPath, `${JSON.stringify(source, null, 2)}\n`);
console.log(JSON.stringify({ outPath, tasks: source.tasks.length, workgroups: source.workgroupSummaries.length }, null, 2));

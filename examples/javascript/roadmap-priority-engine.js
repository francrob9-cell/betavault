const WEIGHTS = {
  businessImpact: 3.2,
  risk: 2.4,
  dependencyCount: 1.3,
  executiveUrgency: 2.8,
  effort: -1.1,
};

function normalize(value, max = 10) {
  const number = Number(value || 0);
  return Math.max(0, Math.min(max, number)) / max;
}

function scoreRoadmapItem(item) {
  const dependencyCount = Array.isArray(item.dependencies) ? item.dependencies.length : 0;
  const raw =
    normalize(item.businessImpact) * WEIGHTS.businessImpact +
    normalize(item.risk) * WEIGHTS.risk +
    normalize(dependencyCount, 8) * WEIGHTS.dependencyCount +
    normalize(item.executiveUrgency) * WEIGHTS.executiveUrgency +
    normalize(item.effort) * WEIGHTS.effort;

  return Math.round(raw * 100) / 100;
}

function classifyPriority(score) {
  if (score >= 6.2) return "Critical";
  if (score >= 4.6) return "High";
  if (score >= 3.1) return "Medium";
  return "Low";
}

function explainPriority(item) {
  const reasons = [];
  if (item.businessImpact >= 8) reasons.push("high business impact");
  if (item.risk >= 7) reasons.push("meaningful delivery or compliance risk");
  if ((item.dependencies || []).length >= 3) reasons.push("multiple upstream dependencies");
  if (item.executiveUrgency >= 8) reasons.push("executive visibility");
  if (item.effort <= 3 && item.businessImpact >= 6) reasons.push("quick-win potential");
  return reasons.length ? reasons.join(", ") : "routine prioritization signals";
}

function rankRoadmap(items) {
  return [...items]
    .map((item) => {
      const score = scoreRoadmapItem(item);
      return {
        ...item,
        priorityScore: score,
        priority: classifyPriority(score),
        rationale: explainPriority(item),
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

function summarizeRoadmap(items) {
  const ranked = rankRoadmap(items);
  const counts = ranked.reduce((acc, item) => {
    acc[item.priority] = (acc[item.priority] || 0) + 1;
    return acc;
  }, {});

  return {
    totalItems: ranked.length,
    counts,
    topFive: ranked.slice(0, 5),
    decisionsNeeded: ranked.filter((item) => item.priority === "Critical" || item.executiveUrgency >= 8),
  };
}

module.exports = {
  rankRoadmap,
  scoreRoadmapItem,
  summarizeRoadmap,
};

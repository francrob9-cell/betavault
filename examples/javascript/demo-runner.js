const { summarizeRoadmap } = require("./roadmap-priority-engine");
const { detectTrainingPatterns } = require("./training-session-insights");
const { routeBatch } = require("./notification-router");
const { buildClientDelivery } = require("./asset-library-filter");

const roadmapItems = [
  { name: "Payroll parallel testing", businessImpact: 9, risk: 8, effort: 7, executiveUrgency: 9, dependencies: ["security", "integrations"] },
  { name: "Benefits open enrollment cleanup", businessImpact: 7, risk: 6, effort: 4, executiveUrgency: 6, dependencies: ["hcm"] },
  { name: "Reporting catalog governance", businessImpact: 6, risk: 3, effort: 3, executiveUrgency: 5, dependencies: [] },
];

const sessions = [
  { date: "2026-08-03", durationMinutes: 95, rpe: 8, sleepHours: 6.1, pain: 2, notes: "Limit boulder, hard moves." },
  { date: "2026-08-05", durationMinutes: 75, rpe: 9, sleepHours: 5.8, pain: 5, notes: "Finger felt sore after board climbing." },
  { date: "2026-08-07", durationMinutes: 120, rpe: 8, sleepHours: 6.2, pain: 4, notes: "Project attempts, elbow tweak." },
];

const events = [
  { type: "video_uploaded", athleteName: "Sam", athleteId: "ath-100", entityId: "vid-22" },
  { type: "session_flagged", athleteName: "Sam", athleteId: "ath-100", entityId: "sess-41" },
  { type: "coach_note_added", athleteName: "Sam", athleteId: "ath-100", entityId: "note-9" },
];

const assets = [
  { title: "All Things Pretty hero", type: "photo", client: "Unfound Door", campaign: "All Things Pretty", status: "approved", tags: ["portrait", "social"] },
  { title: "Behind the scenes cut", type: "video", client: "Unfound Door", campaign: "All Things Pretty", status: "approved", tags: ["shortform"] },
  { title: "Internal color proof", type: "photo", client: "Unfound Door", campaign: "All Things Pretty", status: "draft", tags: ["internal"] },
];

console.log("Roadmap summary");
console.log(JSON.stringify(summarizeRoadmap(roadmapItems), null, 2));

console.log("\nTraining insights");
console.log(JSON.stringify(detectTrainingPatterns(sessions), null, 2));

console.log("\nNotifications");
console.log(JSON.stringify(routeBatch(events), null, 2));

console.log("\nClient delivery");
console.log(JSON.stringify(buildClientDelivery(assets, "Unfound Door"), null, 2));

const EVENT_RULES = {
  video_uploaded: {
    audience: ["coach"],
    title: "New video needs review",
    severity: "review",
  },
  goal_created: {
    audience: ["coach"],
    title: "New active goal submitted",
    severity: "review",
  },
  goal_reply_added: {
    audience: ["coach", "athlete"],
    title: "New goal reply",
    severity: "info",
  },
  session_flagged: {
    audience: ["coach"],
    title: "Flagged session saved",
    severity: "attention",
  },
  coach_note_added: {
    audience: ["athlete"],
    title: "Coach added feedback",
    severity: "info",
  },
  assignment_created: {
    audience: ["athlete"],
    title: "New training assignment",
    severity: "action",
  },
};

function routeNotification(event) {
  const rule = EVENT_RULES[event.type];
  if (!rule) {
    return [];
  }

  return rule.audience.map((recipientType) => ({
    recipientType,
    type: event.type,
    title: rule.title,
    severity: rule.severity,
    athleteId: event.athleteId || null,
    actorId: event.actorId || null,
    entityId: event.entityId || null,
    message: buildMessage(rule, event),
    createdAt: event.createdAt || new Date().toISOString(),
    read: false,
  }));
}

function buildMessage(rule, event) {
  const name = event.athleteName || "An athlete";
  if (event.type === "video_uploaded") return `${name} uploaded a video for review.`;
  if (event.type === "session_flagged") return `${name} saved a session with fatigue, pain, or recovery flags.`;
  if (event.type === "coach_note_added") return "Your coach added feedback to your training history.";
  if (event.type === "assignment_created") return "A coach added a new assignment to your plan.";
  return `${rule.title}: ${name}`;
}

function routeBatch(events) {
  return events.flatMap(routeNotification);
}

module.exports = {
  routeBatch,
  routeNotification,
};

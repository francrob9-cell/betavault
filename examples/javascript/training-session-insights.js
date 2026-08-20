function average(values) {
  const numbers = values.map(Number).filter((value) => Number.isFinite(value));
  if (!numbers.length) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function groupByWeek(sessions) {
  return sessions.reduce((weeks, session) => {
    const date = new Date(session.date);
    const weekKey = Number.isNaN(date.getTime())
      ? "unknown"
      : `${date.getUTCFullYear()}-W${Math.ceil((date.getUTCDate() + 6) / 7)}`;
    weeks[weekKey] = weeks[weekKey] || [];
    weeks[weekKey].push(session);
    return weeks;
  }, {});
}

function summarizeTrainingLoad(sessions) {
  const totalMinutes = sessions.reduce((sum, session) => sum + Number(session.durationMinutes || 0), 0);
  const highIntensity = sessions.filter((session) => Number(session.rpe || 0) >= 8).length;
  const averageRpe = average(sessions.map((session) => session.rpe));
  const averageSleep = average(sessions.map((session) => session.sleepHours));
  const painMentions = sessions.filter((session) => Number(session.pain || 0) >= 4 || /pain|tweak|sore|injury/i.test(session.notes || "")).length;

  return {
    sessions: sessions.length,
    totalMinutes,
    highIntensity,
    averageRpe: Math.round(averageRpe * 10) / 10,
    averageSleep: Math.round(averageSleep * 10) / 10,
    painMentions,
  };
}

function detectTrainingPatterns(sessions) {
  const summary = summarizeTrainingLoad(sessions);
  const flags = [];

  if (summary.highIntensity >= 3) flags.push("High-intensity density is elevated.");
  if (summary.averageRpe >= 7.5) flags.push("Average RPE suggests fatigue may be rising.");
  if (summary.averageSleep > 0 && summary.averageSleep < 6.5) flags.push("Sleep is below recovery target.");
  if (summary.painMentions >= 2) flags.push("Pain is recurring and should be reviewed.");
  if (summary.totalMinutes > 520) flags.push("Weekly volume may be high for current recovery context.");

  return {
    summary,
    flags,
    recommendation: recommendNextEmphasis(summary, flags),
  };
}

function recommendNextEmphasis(summary, flags) {
  if (flags.some((flag) => /pain|sleep|fatigue/i.test(flag))) return "lower volume or rest";
  if (summary.highIntensity >= 3) return "technique or aerobic capacity";
  if (summary.sessions <= 2) return "structured strength or endurance";
  return "balanced progression";
}

module.exports = {
  detectTrainingPatterns,
  groupByWeek,
  summarizeTrainingLoad,
};

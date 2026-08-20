const header = document.querySelector("[data-elevate]");
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll("[data-category]");
const briefProject = document.querySelector("#briefProject");
const briefExampleButtons = document.querySelectorAll("[data-brief-example]");
const briefSummary = document.querySelector("#briefSummary");
const briefSuggestions = document.querySelector("#briefSuggestions");
const copyBrief = document.querySelector("#copyBrief");
const contactEmail = "francrob9@gmail.com";
const aiUseCase = document.querySelector("#aiUseCase");
const aiCulture = document.querySelector("#aiCulture");
const aiRisk = document.querySelector("#aiRisk");
const aiDecision = document.querySelector("#aiDecision");
const aiWorkflow = document.querySelector("#aiWorkflow");
const aiGate = document.querySelector("#aiGate");
const aiBoundary = document.querySelector("#aiBoundary");
const aiSignals = document.querySelector("#aiSignals");
const aiTimeline = document.querySelector("#aiTimeline");
const aiRunCheck = document.querySelector("#aiRunCheck");
const personalCarousel = document.querySelector(".personal-carousel");

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 24);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    projectCards.forEach((card) => {
      const shouldShow = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("hidden", !shouldShow);
    });
  });
});

[aiUseCase, aiCulture, aiRisk].forEach((field) => field?.addEventListener("change", updateAiDeployment));

aiRunCheck?.addEventListener("click", () => {
  updateAiDeployment();
  addAiTimeline("Deployment fit check complete", "Use case, culture, risk tolerance, data boundary, and human review controls were mapped before build-out.");
});

document.querySelectorAll("[data-ai-action]").forEach((button) => {
  button.addEventListener("click", () => handleAiAction(button.dataset.aiAction));
});

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const aiDeploymentPlans = {
  grant: {
    workflow: "Use AI to pre-read evidence, compare it to grant milestones, and route only exceptions to the program owner.",
    boundary: "Limit AI access to approved grant folders, budget extracts, milestone tables, and redacted supporting evidence.",
    signals: "Track missing evidence, reviewer overrides, milestone variance, documentation latency, and audit readiness.",
  },
  vendor: {
    workflow: "Use AI to summarize supplier packets, flag contract gaps, and prepare risk notes before procurement review.",
    boundary: "Limit AI access to vendor documents, contract metadata, insurance records, payment timing, and approved scorecards.",
    signals: "Track supplier response time, blocked uploads, signature delays, dispute rate, and risk-score movement.",
  },
  healthcare: {
    workflow: "Use AI to classify intake, identify missing information, and route PHI-sensitive items to trained staff.",
    boundary: "Keep PHI inside approved systems, redact unnecessary identifiers, and restrict model access by role.",
    signals: "Track PHI escalations, review turnaround, corrected classifications, access exceptions, and patient-impact risk.",
  },
  hr: {
    workflow: "Use AI to organize applicant materials and draft reviewer summaries without making hiring decisions.",
    boundary: "Exclude protected-class inference, retain source documents, and keep final evaluation with accountable reviewers.",
    signals: "Track reviewer edits, adverse-impact checks, cycle time, candidate-stage consistency, and escalation volume.",
  },
};

const aiCulturePlans = {
  frontline: "Pilot inside the existing daily work queue with plain-language outputs and one-click escalation.",
  committee: "Route recommendations through the current committee packet, with rationale and dissent captured.",
  regulated: "Require evidence snapshots, reviewer attestation, access logs, and exception records before scale.",
  executive: "Add an executive view showing adoption, risk, budget impact, and unresolved decisions.",
};

const aiRiskPlans = {
  moderate: {
    decision: "Pilot with controls",
    gate: "AI can recommend; staff approve before a record changes.",
  },
  high: {
    decision: "Human approval required",
    gate: "AI output is draft-only until a named owner approves, signs, and logs the decision.",
  },
  low: {
    decision: "Summarize and route",
    gate: "AI can summarize and classify, but exceptions still route to staff for confirmation.",
  },
};

function addAiTimeline(title, body) {
  if (!aiTimeline) return;
  const item = document.createElement("li");
  item.innerHTML = `<strong>${title}</strong><span>${body}</span>`;
  aiTimeline.prepend(item);
  while (aiTimeline.children.length > 5) aiTimeline.lastElementChild?.remove();
}

function updateAiDeployment() {
  if (!aiUseCase || !aiCulture || !aiRisk) return;

  const useCase = aiDeploymentPlans[aiUseCase.value];
  const culture = aiCulturePlans[aiCulture.value];
  const risk = aiRiskPlans[aiRisk.value];

  aiDecision.textContent = risk.decision;
  aiWorkflow.textContent = `${useCase.workflow} ${culture}`;
  aiGate.textContent = risk.gate;
  aiBoundary.textContent = useCase.boundary;
  aiSignals.textContent = useCase.signals;
}

function initPersonalCarousel() {
  if (!personalCarousel) return;

  const slides = [...personalCarousel.querySelectorAll(".personal-carousel-image")];
  const dotsContainer = personalCarousel.querySelector(".carousel-dots");
  const previous = personalCarousel.querySelector("[data-carousel-prev]");
  const next = personalCarousel.querySelector("[data-carousel-next]");
  let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Show photo ${index + 1}`);
    dot.addEventListener("click", () => showSlide(index));
    dotsContainer?.append(dot);
    return dot;
  });

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === activeIndex));
    dots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === activeIndex));
  }

  previous?.addEventListener("click", () => showSlide(activeIndex - 1));
  next?.addEventListener("click", () => showSlide(activeIndex + 1));
  showSlide(activeIndex);
  window.setInterval(() => showSlide(activeIndex + 1), 3000);
}

function handleAiAction(action) {
  if (action === "review") {
    addAiTimeline("Human review triggered", "The workflow pauses AI-assisted routing until the accountable owner reviews rationale, source evidence, and risk notes.");
  }

  if (action === "pilot") {
    addAiTimeline("Controlled pilot approved", "Pilot is limited to one workflow, named reviewers, approved data sources, and weekly adoption/risk monitoring.");
  }

  if (action === "evidence") {
    addAiTimeline("Audit evidence generated", "Use-case decision, data boundary, reviewer gate, prompt controls, and monitoring signals are captured for leadership review.");
  }
}

function getAiRecommendation(projectText) {
  const haystack = projectText.toLowerCase();
  const recommendations = [];

  if (haystack.includes("intake") || haystack.includes("email") || haystack.includes("form")) {
    recommendations.push("Start with intake, status, owner, and approval rules.");
  }

  if (haystack.includes("approval") || haystack.includes("queue") || haystack.includes("handoff")) {
    recommendations.push("Add an approval queue with history and notifications.");
  }

  if (haystack.includes("compliance") || haystack.includes("audit") || haystack.includes("evidence") || haystack.includes("grant")) {
    recommendations.push("Include evidence, due dates, and an exportable audit trail.");
  }

  if (haystack.includes("dashboard") || haystack.includes("report") || haystack.includes("leadership") || haystack.includes("board")) {
    recommendations.push("Show status, risk, owners, blockers, and decisions needed.");
  }

  if (haystack.includes("vendor") || haystack.includes("customer") || haystack.includes("applicant") || haystack.includes("external")) {
    recommendations.push("Separate external submission from internal review.");
  }

  if (haystack.includes("spreadsheet") || haystack.includes("excel") || haystack.includes("sheet")) {
    recommendations.push("Turn spreadsheet columns into workflow states and reports.");
  }

  if (haystack.includes("erp") || haystack.includes("ats") || haystack.includes("crm")) {
    recommendations.push("Prototype the high-friction workflow before a platform change.");
  }

  if (haystack.includes("frontline") || haystack.includes("staff") || haystack.includes("field")) {
    recommendations.push("Keep the first screen fast for daily users.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Start with a workflow map and one small working version.");
    recommendations.push("Define users, statuses, owners, permissions, and reports.");
  }

  return recommendations.slice(0, 3);
}

function buildBrief() {
  const projectText = briefProject?.value.trim() || "[Describe the workflow, problem, or project idea here]";
  const recommendations = getAiRecommendation(projectText);

  return `Hi Robert,

I'd like to talk through this project idea:
${projectText}

Suggested first step:
${recommendations.map((item) => `- ${item}`).join("\n")}

Additional context:
`;
}

function updateBrief() {
  const projectText = briefProject?.value.trim() || "";
  const recommendations = getAiRecommendation(projectText);

  if (briefSuggestions) {
    briefSuggestions.innerHTML = recommendations.map((item) => `<li>${item}</li>`).join("");
  }

  if (briefSummary) briefSummary.value = buildBrief();
}

briefProject?.addEventListener("input", updateBrief);

briefExampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!briefProject) return;
    briefProject.value = button.dataset.briefExample || "";
    briefProject.focus();
    updateBrief();
  });
});

copyBrief?.addEventListener("click", async () => {
  const text = briefSummary?.value.trim() || buildBrief();
  const subject = "Custom business application project brief";
  const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

  try {
    await navigator.clipboard.writeText(text);
    copyBrief.textContent = "Opening email";
  } catch {
    copyBrief.textContent = "Opening email";
  }

  window.location.href = mailto;

  window.setTimeout(() => {
    copyBrief.textContent = "Email project brief";
  }, 2200);
});

updateBrief();
updateAiDeployment();
initPersonalCarousel();

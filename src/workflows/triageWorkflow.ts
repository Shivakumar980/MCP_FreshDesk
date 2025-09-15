import { WorkflowDefinition, WorkflowStep } from "../domain/types.js";

export function createTriageWorkflow(): WorkflowDefinition {
  const steps: WorkflowStep[] = [gatherContextStep, recommendationStep];

  return {
    name: "ticket_triage",
    description:
      "Analyze an incoming support ticket, retrieve relevant institutional knowledge, and propose a resolution plan.",
    steps,
  };
}

const gatherContextStep: WorkflowStep = async (context) => {
  const knowledgeResult = await context.tools.invoke("knowledge_base_search", {
    ticket: context.ticket,
    query: `${context.ticket.subject}\n${context.ticket.description}`,
    projectConfig: context.config,
  });

  context.artifacts.set("knowledgeResult", knowledgeResult);
};

const recommendationStep: WorkflowStep = async (context) => {
  const knowledgeResult = context.artifacts.get("knowledgeResult");

  context.artifacts.set(
    "triageRecommendation",
    {
      suggestedStatus: "pending",
      justification:
        "Review recommended knowledge base articles and tailor a user response. Escalate if no match is adequate.",
      knowledgeResult,
    },
  );
};

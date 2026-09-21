/** Map real preparation stages, without treating percentages as overall progress. */
export function updateStep(phase: string, stage?: string): number {
  if (phase === "installing") return 3;
  if (phase === "ready") return 2;
  if (phase !== "preparing") return -1;
  if (stage === "download" || stage === "retry" || stage === "fetch") return 0;
  if (stage === "verify") return 1;
  if (stage === "extract" || stage === "preflight" || stage === "ready") return 2;
  return -1;
}

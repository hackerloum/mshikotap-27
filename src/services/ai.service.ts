/**
 * AI-ready abstraction. Implementations can swap to Vercel AI Gateway later
 * without changing feature call sites.
 */
export interface FraudSignal {
  score: number;
  reasons: string[];
}

export interface RecommendationItem {
  taskId: string;
  reason: string;
  confidence: number;
}

export const aiService = {
  async scoreSubmissionFraud(input: {
    userId: string;
    taskId: string;
    proofUrl?: string;
    deviceId?: string;
    ipAddress?: string;
  }): Promise<FraudSignal> {
    // Placeholder heuristic until model wiring lands.
    const reasons = ["baseline_demo_score"];
    if (input.proofUrl) reasons.push("proof_present");
    if (input.deviceId) reasons.push("device_tracked");
    return {
      score: 0.12,
      reasons,
    };
  },

  async recommendTasks(userId: string): Promise<RecommendationItem[]> {
    return [
      {
        taskId: "task-3",
        reason: `High completion fit for ${userId.slice(0, 6)} profile`,
        confidence: 0.78,
      },
      {
        taskId: "task-1",
        reason: "Matches social engagement streak",
        confidence: 0.71,
      },
    ];
  },

  async verifyScreenshot(proofUrl: string): Promise<{ valid: boolean; notes: string }> {
    return {
      valid: Boolean(proofUrl),
      notes: "AI screenshot verification not yet enabled — pass-through.",
    };
  },
};

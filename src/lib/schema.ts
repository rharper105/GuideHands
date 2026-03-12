export interface Action {
  type: 'click' | 'type' | 'scroll' | 'select' | 'wait';
  target: string;
  text?: string;
  direction?: 'up' | 'down';
  reason: string;
}

export interface AnalysisResponse {
  screen_summary: string;
  user_goal: string;
  recommended_next_step: string;
  confidence: number;
  warnings: string[];
  actions: Action[];
}

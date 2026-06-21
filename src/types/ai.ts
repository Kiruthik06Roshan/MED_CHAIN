export interface SafetyInsight {
  id: string;
  type: 'safety' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
  sourceModel: string;
  timestamp: string;
  isDismissed: boolean;
}

export interface FraudAlert {
  id: string;
  score: number;
  indicator: string;
  explanation: string;
  affectedData: string[];
  timestamp: string;
  isTriaged: boolean;
}

export interface AIInsightsData {
  safety: SafetyInsight[];
  fraud: FraudAlert[];
  lastUpdated: string;
}

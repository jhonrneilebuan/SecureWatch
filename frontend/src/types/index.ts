export type Role = 'Admin' | 'Analyst';

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface DashboardSummary {
  totalLogs: number;
  threatsDetected: number;
  highRiskAlerts: number;
  criticalAlerts: number;
  activeIncidents: number;
  resolvedIncidents: number;
  maliciousIps: number;
  failedLoginAttempts: number;
  threatSeverity: { severity: string; count: number }[];
  attackTimeline: { date: string; threats: number }[];
  topAttackingIps: { ipAddress: string; count: number }[];
  incidentStatus: { status: string; count: number }[];
}

export interface Threat {
  id: string;
  securityLogId?: string;
  threatType: string;
  severity: string;
  sourceIP: string;
  failedAttempts: number;
  riskScore: number;
  description: string;
  recommendation: string;
  aiExplanation?: string;
  aiImpact?: string;
  aiPreventionSteps?: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  threatId: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface IpReputation {
  id: string;
  ipAddress: string;
  abuseConfidenceScore: number;
  countryCode: string;
  isp: string;
  totalReports: number;
  isMalicious: boolean;
  checkedAt: string;
}

export interface CveRecord {
  id: string;
  query: string;
  cveId: string;
  severity: string;
  cvssScore?: number;
  description: string;
  publishedDate?: string;
  referenceUrl: string;
}

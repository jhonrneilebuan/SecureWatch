export type Role = 'Admin' | 'Analyst';

export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  fullName: string;
  role: Role;
  expiresAt: string;
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
  failedLoginTimeline: { date: string; failedAttempts: number }[];
  topAttackingIps: { ipAddress: string; count: number }[];
  topCountries: { name: string; count: number; latitude?: number | null; longitude?: number | null }[];
  topIsps: { name: string; count: number }[];
  incidentStatus: { status: string; count: number }[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
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
  mitreTechniqueId?: string;
  mitreTechniqueName?: string;
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
  resolutionNotes: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface EmailAlert {
  id: string;
  threatId?: string;
  recipients: string;
  subject: string;
  status: string;
  errorMessage: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  severity: string;
  entityType: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SystemStatus {
  smtpConfigured: boolean;
  openAiConfigured: boolean;
  abuseIpDbConfigured: boolean;
  virusTotalConfigured: boolean;
  shodanConfigured: boolean;
  otxConfigured: boolean;
  nvdConfigured: boolean;
  failedLoginLockoutThreshold: number;
  recentEmailAlerts: number;
  failedEmailAlerts: number;
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
  latitude?: number | null;
  longitude?: number | null;
}

export interface LiveAttackFeedItem {
  timestamp: string;
  attackType: string;
  severity: string;
  sourceIp: string;
  sourceCountry: string;
  targetCountry: string;
  latitude?: number | null;
  longitude?: number | null;
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

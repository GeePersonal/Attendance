// Overall analytics
export interface TopSession {
  sessionId: string;
  sessionName: string;
  attendeesCount: number;
  status: string;
  className?: string;
  createdAt: string;
}

export interface DailyActivity {
  date: string;
  sessionsCreated: number;
  attendeesRecorded: number;
}

export interface OverallAnalytics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  totalClasses: number;
  totalAttendees: number;
  averageAttendeesPerSession: number;
  sessionsLast7Days: number;
  sessionsLast30Days: number;
  attendeesLast7Days: number;
  attendeesLast30Days: number;
  topSessionsByAttendees: TopSession[];
  dailySessionActivity: DailyActivity[];
}

// Session analytics
export interface ScanLocationBreakdown {
  location: string;
  count: number;
  percentage: number;
}

export interface AttendanceOverTime {
  time: string;
  cumulativeCount: number;
}

export interface SessionAttendeeDetail {
  firstName: string;
  lastName: string;
  email: string;
  matNumber: string;
  joinedAt: string;
  scanLocationName?: string;
  joinOrder: number;
}

export interface SessionAnalytics {
  sessionId: string;
  sessionName: string;
  status: string;
  createdAt: string;
  sessionExpiresAt: string;
  classId?: string;
  className?: string;
  totalAttendees: number;
  averageJoinIntervalMinutes: number;
  attendeesByScanLocation: ScanLocationBreakdown[];
  attendeesOverTime: AttendanceOverTime[];
  attendees: SessionAttendeeDetail[];
}

// Class analytics
export interface ClassAttendeeAnalytics {
  firstName: string;
  lastName: string;
  email: string;
  matNumber: string;
  sessionsAttended: number;
  totalSessions: number;
  attendancePercentage: number;
  attendedSessionIds: string[];
}

export interface SessionAttendanceSummary {
  sessionId: string;
  sessionName: string;
  attendeesCount: number;
  status: string;
  createdAt: string;
}

export interface ClassAnalytics {
  classId: string;
  className: string;
  description?: string;
  totalSessions: number;
  totalUniqueAttendees: number;
  averageAttendeesPerSession: number;
  maxAttendeesInSession: number;
  minAttendeesInSession: number;
  overallAttendanceRate: number;
  attendeeBreakdown: ClassAttendeeAnalytics[];
  sessionBreakdown: SessionAttendanceSummary[];
}

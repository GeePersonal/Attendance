

export interface Attendee {
    id: number
    firstName: string
    lastName: string
    email: string
    matNumber: string
    sessionId: string
    session: any
    createdAt: string
    scanLocationName: string | null
  }

export interface AttendanceLinkToken {
    unique_name: string
    nameid: string
    given_name: string
    nbf: number
    exp: number
    iat: number
  }

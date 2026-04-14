export interface ClassFormValues {
    name: string
    description?: string
}

export interface Class {
    classId: string
    name: string
    description?: string
    hostName: string
    sessionsCount: number
    createdAt: string
}

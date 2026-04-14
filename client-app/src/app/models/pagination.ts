export interface MetaData {
    totalCount: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

export interface Pagination<T> {
    items: T[];
    metaData: MetaData;
}

export interface PaginationParams {
    searchTerm?: string;
    orderBy?: string;
    pageNumber?: number;
    pageSize?: number;
    classId?: string;
} // for session params and attendee params
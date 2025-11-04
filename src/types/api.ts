// Generic paginated response interface
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;           // Current page
    limit: number;          // Items per page
    total: number;          // Total items
    totalPages: number;     // Total pages
    hasNext: boolean;       // Has next page
    hasPrevious: boolean;   // Has previous page
  };
}

// Query parameters for paginated endpoints
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends PaginationParams {
  search?: string;
}

export interface FilterParams extends SearchParams {
  status?: number | null;
}

// List state interface for components
export interface ListState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    search: string;
    status?: number | null; // Optional status filter for list views
  };
}

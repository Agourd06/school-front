import React from 'react';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import FilterDropdown from './FilterDropdown';

type ListState<T> = {
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
  filters: Record<string, unknown> & { search?: string; status?: number | null | undefined };
};

interface StatusOption {
  value: number;
  label: string;
}

interface DataTableGenericProps<T> {
  title: string;
  state: ListState<T>;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: number) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (query: string) => void;
  onFilterChange?: (status: number | null) => void;
  addButtonText: string;
  searchPlaceholder: string;
  filterOptions?: StatusOption[];
  renderRow: (item: T, onEdit: (item: T) => void, onDelete: (id: number) => void, index: number) => React.ReactNode;
}

function DataTableGeneric<T extends { id: number }>({
  title,
  state,
  onAdd,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onFilterChange,
  addButtonText,
  searchPlaceholder,
  filterOptions,
  renderRow,
}: DataTableGenericProps<T>) {
  const { data, loading, error, pagination, filters } = state as ListState<T>;

  const statusFilterOptions = filterOptions ?? [
    { value: 0, label: 'Disabled ' },
    { value: 1, label: 'Active ' },
    { value: 2, label: 'Pending ' },
    { value: -1, label: 'Archived ' },
    { value: -2, label: 'Deleted ' },
  ];

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
        <button
          onClick={onAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {addButtonText}
        </button>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar onSearch={onSearch} placeholder={searchPlaceholder} isLoading={loading} />
          </div>
          {onFilterChange && (
            <div className="w-full sm:w-48">
              <FilterDropdown
                options={statusFilterOptions}
                value={(filters as { status?: number | null }).status ?? null}
                onChange={(val) => onFilterChange?.(val === null ? null : Number(val))}
                placeholder="Filter by status"
                isLoading={loading}
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-200">
          <div className="text-sm text-red-600">Error: {error}</div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-200">
            {Array.isArray(data) && data.length > 0 ? (
              (data as T[]).map((item, index) => renderRow(item, onEdit, onDelete, index))
            ) : (
              <li className="px-4 py-8 sm:px-6">
                <div className="text-center text-gray-500">
                  {(filters as { search?: string }).search ? (
                    <>No {title.toLowerCase()} found matching "{(filters as { search?: string }).search}"</>
                  ) : (
                    `No ${title.toLowerCase()} found`
                  )}
                </div>
              </li>
            )}
          </ul>

          {pagination.total > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              hasNext={pagination.hasNext}
              hasPrevious={pagination.hasPrevious}
              isLoading={loading}
            />
          )}
        </>
      )}
    </div>
  );
}

export default DataTableGeneric;


import React from 'react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
  isLoading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  hasNext,
  hasPrevious,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const pageSizeOptions = [10, 25, 50, 100];
  
  // Calculate the range of items being displayed
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        // Show first 4 pages + ellipsis + last page
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show first page + ellipsis + last 4 pages
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-card border-t border-tertiary/20">
      {/* Items info */}
      <div className="text-sm text-body">
        {t('sections.showing')} <span className="font-medium">{startItem}</span> {t('sections.to')}{' '}
        <span className="font-medium">{endItem}</span> {t('sections.of')}{' '}
        <span className="font-medium">{totalItems}</span> {t('sections.results')}
      </div>

      <div className="flex items-center gap-4">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-body">
            {t('sections.show')}
          </label>
          <select
            id="pageSize"
            value={itemsPerPage}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={isLoading}
            className="custom-select px-2 py-1 text-sm border border-border rounded-md bg-card text-body focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1">
          {/* Previous button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrevious || isLoading}
            className="px-3 py-1 text-sm font-medium text-muted bg-card border border-tertiary rounded-l-md hover:bg-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('sections.previous')}
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-1 text-sm text-muted">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  disabled={isLoading}
                  className={`px-3 py-1 text-sm font-medium border border-tertiary focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    page === currentPage
                      ? 'text-secondary-foreground bg-secondary border-secondary'
                      : 'text-body bg-card hover:bg-surface'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          {/* Next button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNext || isLoading}
            className="px-3 py-1 text-sm font-medium text-muted bg-card border border-tertiary rounded-r-md hover:bg-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('sections.next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

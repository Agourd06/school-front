import React, { useState, useEffect, useMemo } from 'react';
import { pagesApi } from '../../api/pages';
import type { Page } from '../../api/pages';
import type { Profile } from '../../types/profile';
import { PROFILE_OPTIONS } from '../../types/profile';
import Button from '../ui/Button';
import CreatePagesSection from './CreatePagesSection';

const EMPTY_META = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

const PageAccessSettings: React.FC = () => {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState<Page[]>([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [selectedProfile, setSelectedProfile] = useState<Profile | ''>('');
  const [assignedPageIds, setAssignedPageIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      search: search.trim() || undefined,
    }),
    [pagination, search]
  );

  useEffect(() => {
    loadPages();
  }, [params]);

  useEffect(() => {
    if (selectedProfile) {
      loadProfilePages(selectedProfile);
    } else {
      setAssignedPageIds(new Set());
    }
  }, [selectedProfile]);

  const loadPages = async () => {
    try {
      setLoading(true);
      const response = await pagesApi.getAll(params);
      setPages(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load pages';
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const loadProfilePages = async (profile: Profile) => {
    try {
      setLoading(true);
      const data = await pagesApi.getPagesForProfile(profile);
      setAssignedPageIds(new Set(data.map(p => p.id)));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load profile pages';
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePage = (pageId: number) => {
    const newAssignedIds = new Set(assignedPageIds);
    if (newAssignedIds.has(pageId)) {
      newAssignedIds.delete(pageId);
    } else {
      newAssignedIds.add(pageId);
    }
    setAssignedPageIds(newAssignedIds);
  };

  const handleSave = async () => {
    if (!selectedProfile) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // Get current assignments (all pages assigned to profile)
      const currentPages = await pagesApi.getPagesForProfile(selectedProfile);
      const currentIds = new Set(currentPages.map(p => p.id));

      // Find pages to add (in assignedPageIds but not in currentIds)
      const toAdd: number[] = [];
      assignedPageIds.forEach((pageId) => {
        if (!currentIds.has(pageId)) {
          toAdd.push(pageId);
        }
      });

      // Find pages to remove (in currentIds but not in assignedPageIds)
      const toRemove: number[] = [];
      currentIds.forEach((pageId) => {
        if (!assignedPageIds.has(pageId)) {
          toRemove.push(pageId);
        }
      });

      // Add new assignments
      for (const pageId of toAdd) {
        await pagesApi.assignPageToProfile({
          profile: selectedProfile,
          page_id: pageId,
        });
      }

      // Remove old assignments
      for (const pageId of toRemove) {
        await pagesApi.removePageFromProfile(selectedProfile, pageId);
      }

      // Reload assigned pages to reflect changes
      await loadProfilePages(selectedProfile);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update access';
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading && pages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading pages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Page Access Management</h3>
        <p className="text-sm text-gray-600">
          Assign pages to profiles to control which users can access which routes.
        </p>
      </div>

      {/* Create Pages Section */}
      <CreatePagesSection onPagesCreated={loadPages} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          Access updated successfully!
        </div>
      )}

      <div>
        <label htmlFor="profile-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Profile
        </label>
        <select
          id="profile-select"
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value as Profile)}
          className="w-full sm:w-auto rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none bg-white"
        >
          <option value="">-- Select Profile --</option>
          {PROFILE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {selectedProfile && (
        <div className="space-y-4">
          {/* Search Input */}
          <div>
            <label htmlFor="page-search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Pages
            </label>
            <input
              id="page-search"
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by title or route..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none bg-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Check the pages you want to assign to <strong>{PROFILE_OPTIONS.find(p => p.value === selectedProfile)?.label}</strong> profile:
            </p>
            <span className="text-sm font-medium text-gray-700">
              Showing {pages.length} of {meta.total} pages
              {assignedPageIds.size > 0 && ` • ${assignedPageIds.size} selected`}
            </span>
          </div>

          {loading && pages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Loading pages...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                {search ? 'No pages found matching your search' : 'No pages available'}
              </p>
            </div>
          ) : (
            <>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {pages.map((page) => (
                  <label
                    key={page.id}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={assignedPageIds.has(page.id)}
                      onChange={() => handleTogglePage(page.id)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{page.title}</div>
                      <div className="text-sm text-gray-500 font-mono">{page.route}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Pagination Controls */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600">
                    Page {meta.page} of {meta.totalPages} • {meta.total} total pages
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      disabled={!meta.hasPrevious || loading}
                      variant="secondary"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      disabled={!meta.hasNext || loading}
                      variant="secondary"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !selectedProfile}
              className="px-6"
            >
              {saving ? 'Saving...' : 'Save Access Changes'}
            </Button>
          </div>
        </div>
      )}

      {!selectedProfile && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Please select a profile to manage page access</p>
        </div>
      )}
    </div>
  );
};

export default PageAccessSettings;


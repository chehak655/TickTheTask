import React from 'react';
import { Search, X, ArrowDownUp, Filter, RotateCcw } from 'lucide-react';

export default function TaskFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
  onResetFilters,
  counts = {},
}) {
  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    sortBy !== 'created_at' ||
    sortOrder !== 'desc';

  return (
    <section aria-label="Task Filters and Search" className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-4 shadow-xs mb-6 space-y-4">
      {/* Top row: Search input & Status Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <label htmlFor="task-search-input" className="sr-only">
            Search tasks
          </label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            id="task-search-input"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks by title..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus:border-primary-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search text"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div
          role="tablist"
          aria-label="Filter tasks by status"
          className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 self-start md:self-auto"
        >
          {[
            { id: 'all', label: 'All', count: counts.total },
            { id: 'pending', label: 'Pending', count: counts.pending },
            { id: 'completed', label: 'Completed', count: counts.completed },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={statusFilter === tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    statusFilter === tab.id
                      ? 'bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row: Priority & Sort controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/40 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <label htmlFor="priority-filter-select" className="text-slate-600 dark:text-slate-400 font-medium">
              Priority:
            </label>
            <select
              id="priority-filter-select"
              value={priorityFilter}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="sort-by-select" className="text-slate-600 dark:text-slate-400 font-medium">
              Sort by:
            </label>
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 font-medium"
            >
              <option value="created_at">Date Created</option>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <button
            type="button"
            onClick={onSortOrderToggle}
            aria-label={`Toggle sort order. Current order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
          </button>
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset filters
          </button>
        )}
      </div>
    </section>
  );
}

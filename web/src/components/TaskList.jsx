import React from 'react';
import TaskCard from './TaskCard';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export default function TaskList({
  tasks = [],
  isLoading = false,
  onToggleStatus,
  onEdit,
  onDelete,
  onCreateNew,
  searchQuery = '',
}) {
  if (isLoading) {
    return <LoadingSpinner text="Fetching tasks..." />;
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        title={searchQuery ? 'No matching tasks' : 'No tasks here yet'}
        description={
          searchQuery
            ? `No tasks matched your search for "${searchQuery}". Try searching for something else.`
            : 'Get organized and boost your productivity. Create your first task to get started.'
        }
        actionLabel="Create Task"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3.5">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggleStatus={onToggleStatus}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

import { useDroppable } from '@dnd-kit/core'

export default function KanbanColumn({ id, title, tasks, children }) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`theme-card bg-opacity-40 flex flex-col rounded-2xl p-4 min-h-[600px] border transition-colors shadow-sm ${
        isOver ? 'bg-[var(--theme-accent)] bg-opacity-10 border-[var(--theme-accent)] ring-2 ring-[var(--theme-accent)] shadow-lg' : ''
      }`}
      style={{ boxShadow: 'var(--column-shadow)' }}
    >
      <h2 className="font-bold theme-text mb-4 flex items-center justify-between px-1">
        {title}
        <span className="btn-secondary px-2.5 py-0.5 rounded-full text-xs font-bold">{tasks.length}</span>
      </h2>
      <div className={`flex flex-col gap-3 flex-1 ${tasks.length === 0 ? 'border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg justify-center items-center opacity-60' : ''}`}>
        {tasks.length === 0 ? (
          <span className="text-sm font-medium theme-text-muted">Drop tasks here</span>
        ) : children}
      </div>
    </div>
  )
}

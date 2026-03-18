import { useDroppable } from '@dnd-kit/core'

export default function KanbanColumn({ id, title, tasks, children }) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef}
      className={`theme-card bg-opacity-40 flex flex-col rounded-2xl p-4 min-h-[600px] border transition-colors ${
        isOver ? 'bg-[var(--theme-accent)] bg-opacity-5 border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]' : ''
      }`}
    >
      <h2 className="font-bold theme-text mb-4 flex items-center justify-between px-1">
        {title}
        <span className="btn-secondary px-2.5 py-0.5 rounded-full text-xs font-semibold">{tasks.length}</span>
      </h2>
      <div className="flex flex-col gap-3 flex-1">
        {children}
      </div>
    </div>
  )
}

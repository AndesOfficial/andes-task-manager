import { useDraggable } from '@dnd-kit/core'
import { differenceInDays, isPast, parseISO, formatDistanceToNow } from 'date-fns'
import { FaCheck, FaPlay, FaRegClock } from 'react-icons/fa'

export default function KanbanCard({ task, handleStatusChange }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  })

  // Border logic
  const borderColors = {
    high: 'border-l-red-500',
    medium: 'border-l-orange-500',
    low: 'border-l-blue-400 dark:border-l-slate-400 sticky:border-l-emerald-500',
  }
  const badgeColors = {
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'btn-secondary',
  }

  // Time awareness
  let dueInfo = null
  let dueColor = 'theme-text-muted'
  if (task.dueDate && task.status !== 'completed') {
    const dueD = parseISO(task.dueDate)
    const days = differenceInDays(dueD, new Date())
    const past = isPast(dueD)
    
    if (days < 0 || past) {
      dueInfo = 'Overdue'
      dueColor = 'text-red-600 font-bold'
    } else if (days === 0) {
      dueInfo = 'Due today'
      dueColor = 'text-orange-600 font-bold'
    } else if (days <= 2) {
      dueInfo = `Due in ${days} days`
      dueColor = 'text-orange-600 font-bold'
    } else {
      dueInfo = `Due in ${days} days`
    }
  }

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={dragStyle}
      className={`relative theme-card rounded-xl shadow-sm border border-l-4 ${borderColors[task.priority] || 'border-l-blue-400'} p-4 flex flex-col gap-2 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg cursor-grab active:cursor-grabbing group ${isDragging ? 'opacity-70 ring-2 ring-blue-400 shadow-xl scale-105' : ''}`}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className={`font-bold text-sm leading-snug ${task.status === 'completed' ? 'theme-text-muted line-through opacity-70' : 'theme-text'}`}>
          {task.title}
        </h3>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full flex-shrink-0 ml-2 ${badgeColors[task.priority] || badgeColors.low}`}>
          {task.priority || 'low'}
        </span>
      </div>
      
      {task.description && (
        <p className="theme-text-muted text-xs line-clamp-2 opacity-90">{task.description}</p>
      )}

      {/* Removed border-t separator, relying on margin/gap for whitespace */}
      <div className="flex flex-col gap-2 mt-3 block">
        <div className="flex justify-between items-end">
           <div className="flex flex-col gap-1.5 mt-2">
             {dueInfo && (
                <div className={`flex items-center gap-1.5 text-[10px] ${dueColor}`}>
                  <FaRegClock />
                  <span>{dueInfo}</span>
                </div>
             )}
             <div className="text-[10px] theme-text-muted opacity-60 flex items-center gap-1.5 font-medium">
               <span title={task.createdAt?.toDate ? task.createdAt.toDate().toString() : ''}>
                 {task.createdAt?.toDate ? formatDistanceToNow(task.createdAt.toDate(), { addSuffix: true }) : 'just now'}
               </span>
             </div>
           </div>

           {/* Hover Actions */}
           <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 p-1 rounded-lg -mr-2 absolute bottom-2.5 right-3 z-10">
             {task.status !== 'completed' && (
                <button
                  onPointerDown={(e) => { e.stopPropagation(); handleStatusChange(task, 'completed'); }}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 transition-colors bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600"
                  title="Mark as Done"
                >
                  <FaCheck size={12} />
                </button>
             )}
             {task.status === 'pending' && (
                <button
                  onPointerDown={(e) => { e.stopPropagation(); handleStatusChange(task, 'in_progress'); }}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 transition-colors bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600"
                  title="Start Progress"
                >
                  <FaPlay size={10} />
                </button>
             )}
           </div>
        </div>
      </div>
    </div>
  )
}

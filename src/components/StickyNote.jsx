import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { useRef, useMemo } from 'react'
import { db } from '../firebase'
import { doc, deleteDoc } from 'firebase/firestore'
import { differenceInDays, isPast, parseISO, formatDistanceToNow } from 'date-fns'

function StickyNote({ task, members, onRightClick, heatmapMode, stackCount, isFocused, setFocusedTask, handleMarkDone }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  // Random rotation between -2 and 2 degrees
  const rotation = useMemo(() => Math.random() * 4 - 2, [])

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (window.confirm('Delete this task?')) {
      await deleteDoc(doc(db, 'andes_tm_tasks', task.id))
    }
  }

  const isCompleted = task.status === 'completed'

  // Calculate pseudo-random color based on ID string
  const colorIndex = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < task.id.length; i++) {
        hash = task.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 5;
  }, [task.id]);

  // Time awareness
  let dueInfo = null
  let dueColor = 'btn-secondary'
  if (task.dueDate && !isCompleted) {
    const dueD = parseISO(task.dueDate)
    const days = differenceInDays(dueD, new Date())
    const past = isPast(dueD)
    
    if (days < 0 || past) {
      dueInfo = `Overdue by ${Math.abs(days)} days`
      dueColor = 'badge-high'
    } else if (days <= 2) {
      dueInfo = `Due in ${days === 0 ? 'today' : days + ' days'}`
      dueColor = 'badge-medium'
    } else {
      dueInfo = `Due in ${days} days`
      dueColor = 'badge-low'
    }
  }

  // Heatmap styles
  const heatmapGlow = heatmapMode && !isCompleted ? {
    boxShadow: task.priority === 'high' ? '0 0 25px 8px rgba(239, 68, 68, 0.4)' :
               task.priority === 'medium' ? '0 0 20px 5px rgba(249, 115, 22, 0.3)' :
               '0 0 15px 3px rgba(34, 197, 94, 0.2)'
  } : {}

  // Drag styles
  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 1.05 : 1}) rotate(${rotation}deg)`,
    zIndex: isDragging ? 50 : 10,
    boxShadow: isDragging ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : undefined
  } : {
    transform: `scale(${isFocused ? 1.15 : 1}) rotate(${isFocused ? 0 : rotation}deg)`,
    zIndex: isFocused ? 70 : 10,
  }

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onContextMenu={onRightClick}
      onDoubleClick={(e) => {
        e.stopPropagation()
        setFocusedTask && setFocusedTask(isFocused ? null : task.id)
      }}
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        position: 'absolute',
        top: task.position?.y || 0,
        left: task.position?.x || 0,
        backgroundColor: isCompleted ? 'var(--theme-success)' : undefined,
        color: isCompleted ? '#ffffff' : 'var(--theme-text)',
        ...dragStyle,
        ...heatmapGlow
      }}
      className={`w-64 min-h-40 p-5 flex flex-col justify-between rounded-xl border cursor-grab active:cursor-grabbing ${isCompleted ? 'opacity-90 border-transparent' : `note-color-${colorIndex}`}`}
    >
      {/* Smart stack badge */}
      {stackCount > 0 && !isDragging && !isFocused && (
        <div className="absolute -bottom-3 -right-3 bg-[var(--theme-accent)] text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-md">
          +{stackCount}
        </div>
      )}

      {/* Focus badge */}
      {isFocused && (
         <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 btn-secondary px-2 py-0.5 rounded-full shadow-sm text-[10px] font-bold">
           Focus Mode Active
         </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className={`font-bold text-sm leading-tight mt-0.5 ${isCompleted ? 'opacity-80 line-through' : ''} flex-1`}>
            {task.title}
          </h3>
          <button 
            onClick={handleDelete}
            onPointerDown={(e) => e.stopPropagation()}
            className={`${isCompleted ? 'text-white/50 hover:text-white' : 'theme-text-muted hover:text-red-500 hover:bg-red-50'} p-1 rounded transition-colors -mt-1 -mr-1 z-10 flex-shrink-0`}
            title="Delete task"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
            task.priority === 'high' ? 'badge-high' : 
            task.priority === 'medium' ? 'badge-medium' : 
            'badge-low'
          }`}>
            {task.priority}
          </span>
          {dueInfo && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${dueColor}`}>
              {dueInfo}
            </span>
          )}
        </div>
        <p className={`text-xs mt-1 ${isCompleted ? 'text-white/80' : 'theme-text-muted'}`}>{task.description}</p>
      </div>

      <div className={`flex flex-col gap-2 mt-4 pt-3 border-t ${isCompleted ? 'border-white/20' : 'theme-border border-opacity-50'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
              {(members[task.assignedTo] || task.assignedTo || '?').charAt(0).toUpperCase()}
            </div>
            <span className={`text-[11px] font-medium ${isCompleted ? 'text-white/80' : 'theme-text-muted'}`}>
              {members[task.assignedTo] || task.assignedTo}
            </span>
          </div>
          {isCompleted ? (
            <span className="text-xs font-bold text-white bg-black/10 px-2 py-0.5 rounded-full">✓ Done</span>
          ) : task.status === 'in_progress' ? (
             <div className="flex items-center gap-1.5">
               <span className="text-[10px] font-bold text-white bg-[var(--theme-accent)] shadow-sm px-2 py-1 rounded-full">🔥 In Progress</span>
               <button
                 onPointerDown={e => e.stopPropagation()}
                 onClick={() => handleMarkDone && handleMarkDone(task)}
                 className="text-[10px] font-bold btn-secondary px-2 py-1 rounded"
               >
                 Mark Done
               </button>
             </div>
          ) : (
             <button
               onPointerDown={e => e.stopPropagation()}
               onClick={() => handleMarkDone && handleMarkDone(task)}
               className="text-[10px] font-bold btn-secondary px-2 py-1 rounded"
             >
               Mark Done
             </button>
          )}
        </div>
        
        <div className={`flex justify-between items-center text-[9px] opacity-80 mt-1 ${isCompleted ? 'text-white' : 'theme-text-muted'}`}>
          <span>Added {task.createdAt?.toDate ? formatDistanceToNow(task.createdAt.toDate(), { addSuffix: true }) : 'just now'}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default StickyNote
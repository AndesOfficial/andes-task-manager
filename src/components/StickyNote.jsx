// UI: Drag & Drop removed, rendered elegantly mimicking a real board 
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { db } from '../firebase'
import { doc, deleteDoc } from 'firebase/firestore'
import { differenceInDays, isPast, parseISO, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

function StickyNote({ task, members, onRightClick, heatmapMode, handleMarkDone, onEdit }) {
  // UI: Deterministic slight rotations for natural resting positions
  const rotation = useMemo(() => {
    let hash = 0
    for (let i = 0; i < task.id.length; i++) {
      hash = task.id.charCodeAt(i) + ((hash << 5) - hash)
    }
    return (Math.abs(hash) % 40 - 20) / 10
  }, [task.id])

  const colorIndex = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < task.id.length; i++) {
        hash = task.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 5;
  }, [task.id]);

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (window.confirm('Delete this task?')) {
      try {
        await deleteDoc(doc(db, 'andes_tm_tasks', task.id))
        toast.success("Task deleted")
      } catch (err) {
        toast.error("Failed to delete task")
      }
    }
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    if (onEdit) onEdit(task)
  }

  const isCompleted = task.status === 'completed'
  
  let dueInfo = null
  let dueColor = 'btn-secondary'
  let isOverdue = false
  if (task.dueDate && !isCompleted) {
    const dueD = parseISO(task.dueDate)
    const days = differenceInDays(dueD, new Date())
    const past = isPast(dueD)
    
    if (days < 0 || past) {
      dueInfo = `Overdue by ${Math.abs(days)} days`
      dueColor = 'badge-high'
      isOverdue = true 
    } else if (days <= 2) {
      dueInfo = `Due in ${days === 0 ? 'today' : days + ' days'}`
      dueColor = 'badge-medium'
    } else {
      dueInfo = `Due in ${days} days`
      dueColor = 'badge-low'
    }
  }

  // UI: Disable heatmapglow overrides for a second to show accurate colors except if forced
  const heatmapGlow = heatmapMode && !isCompleted ? {
    boxShadow: task.priority === 'high' ? '0 0 25px 8px rgba(239, 68, 68, 0.4)' :
               task.priority === 'medium' ? '0 0 20px 5px rgba(249, 115, 22, 0.3)' :
               '0 0 15px 3px rgba(34, 197, 94, 0.2)'
  } : {
    boxShadow: 'none'
  }

  // UI: Applied specific styling updates (borderRadius 2px, hatches for done notes, overduePulse)
  const noteStyle = {
    borderRadius: '2px',
    backgroundColor: isCompleted ? 'var(--theme-success)' : `var(--note-bg-${colorIndex})`,
    borderColor: isCompleted ? 'transparent' : `var(--note-border-${colorIndex})`,
    color: isCompleted ? '#ffffff' : 'var(--theme-text)',
    backgroundImage: isCompleted ? 'repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(0,0,0,0.04) 8px, rgba(0,0,0,0.04) 9px)' : 'none',
    animation: isOverdue && !heatmapMode ? 'overduePulse 2s ease-in-out infinite' : undefined,
    transform: `rotate(${rotation}deg)`,
    ...heatmapGlow
  }

  return (
    // UI: Outer wrapper carrying positional data so drop-shadow composites flawlessly naturally in a flex grid
    <div className="sticky-note-wrap group focus:outline-none focus:ring-4 rounded-sm" tabIndex={0}>
      <motion.div
        onContextMenu={onRightClick}
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={noteStyle}
        className={`relative w-64 min-h-60 p-5 pt-8 flex flex-col justify-between border hover:scale-[1.02] transition-transform ${isCompleted ? 'opacity-90' : ''}`}
      >
        {/* UI: Add a glassmorphic SVG tape OR pin at the top of each note alternating by colorIndex as FIRST child */}
        {colorIndex % 2 === 0 ? (
          <svg className="absolute -top-[14px] left-1/2 -translate-x-1/2 -rotate-[3deg] w-[54px] h-[20px] pointer-events-none z-10 shadow-sm" style={{ backdropFilter: 'blur(1px)' }} viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="60" height="20" rx="1.5" fill="rgba(255, 255, 255, 0.45)" />
            <rect width="60" height="20" rx="1.5" fill="url(#tape-grad)" />
            <path d="M1 0V20M59 0V20" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeDasharray="1 3"/>
            <defs>
              <linearGradient id="tape-grad" x1="0" y1="0" x2="60" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
              </linearGradient>
            </defs>
          </svg>
        ) : (
          <div className="note-pin" />
        )}

        {/* UI: Make the delete (x) button always visible as a small circle */}
        <button 
          onClick={handleDelete}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ width: '20px', height: '20px', background: 'rgba(0,0,0,0.12)', color: 'inherit' }}
          className="absolute top-2 right-2 rounded-full flex items-center justify-center hover:bg-black/25 transition-colors z-20"
          title="Delete task"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col gap-2 z-10 w-full pr-4">
          <div className="flex justify-between items-start gap-2">
            {/* UI: Typography improvements inside the note */}
            <h3 style={{ fontWeight: 800, letterSpacing: '-0.3px', fontSize: '14px' }} className={`leading-tight mt-0.5 flex-1 ${isCompleted ? 'opacity-80 line-through' : ''}`}>
              {task.title}
            </h3>
            
            {!isCompleted && (
              <button 
                onClick={handleEdit}
                onPointerDown={(e) => e.stopPropagation()}
                className="hover:scale-110 p-1 rounded transition-transform -mt-1 flex-shrink-0 opacity-60 hover:opacity-100"
                title="Edit task"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 z-10 my-1">
            {/* UI: Typography update for priority badge */}
            <span 
              style={{ fontSize: '9px', letterSpacing: '0.8px', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '20px' }}
              className={`rounded-full ${
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
          
          {/* UI: Typography update for Description */}
          <p style={{ fontSize: '12px', lineHeight: 1.55, opacity: 0.82 }} className={`mt-1 z-10`}>
            {task.description}
          </p>
        </div>

        <div className={`flex flex-col gap-2 mt-4 pt-3 border-t z-10 ${isCompleted ? 'border-white/20' : 'border-black/10'}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shadow-sm">
                {(members[task.assignedTo]?.name || (typeof members[task.assignedTo] === 'string' ? members[task.assignedTo] : task.assignedTo) || '?').charAt(0).toUpperCase()}
              </div>
              {/* UI: Typography update for Assignee */}
            <div className="flex flex-col">
              <span style={{ fontSize: '11px', fontWeight: 600, opacity: isCompleted ? 0.9 : 0.7 }}>
                {members[task.assignedTo]?.name || members[task.assignedTo] || task.assignedTo}
              </span>
              {members[task.assignedTo]?.designation && (
                <span style={{ fontSize: '9px', opacity: 0.5, fontWeight: 500 }}>
                  {members[task.assignedTo].designation}
                </span>
              )}
            </div>
            </div>
            
            {isCompleted ? (
              <span className="text-xs font-bold text-white bg-black/10 px-2 py-0.5 rounded-full">✓ Done</span>
            ) : task.status === 'in_progress' ? (
               <div className="flex items-center gap-1.5 pl-1.5">
                 <span className="text-[10px] font-bold text-white bg-[var(--theme-accent)] shadow-sm px-2 py-1 rounded-full">🔥 Focus</span>
                 <button
                   onPointerDown={(e) => e.stopPropagation()}
                   onClick={(e) => { e.stopPropagation(); handleMarkDone && handleMarkDone(task); }}
                   className="flex items-center justify-center flex-shrink-0 w-[26px] h-[26px] rounded-full bg-black/5 hover:bg-black/10 transition-colors shadow-sm border border-black/5"
                   title="Mark as Done"
                 >
                   <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} className="text-emerald-700 dark:text-emerald-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                   </svg>
                 </button>
               </div>
            ) : (
               <button
                 onPointerDown={(e) => e.stopPropagation()}
                 onClick={(e) => { e.stopPropagation(); handleMarkDone && handleMarkDone(task); }}
                 className="flex items-center justify-center flex-shrink-0 w-[26px] h-[26px] rounded-full bg-black/5 hover:bg-black/10 transition-colors shadow-sm border border-black/5 mr-1"
                 title="Mark as Done"
               >
                 <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} className="text-emerald-700 dark:text-emerald-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                 </svg>
               </button>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-0.5">
            {/* UI: Typography update for Timestamp */}
            <span style={{ fontSize: '10px', opacity: 0.55 }}>
              {task.createdAt?.toDate ? formatDistanceToNow(task.createdAt.toDate(), { addSuffix: true }) : 'just now'}
            </span>
          </div>
        </div>

        {/* UI: Folded corner as the LAST child inside the note body */}
        <div className="note-fold" />
      </motion.div>
    </div>
  )
}

export default StickyNote
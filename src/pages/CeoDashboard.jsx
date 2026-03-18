import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { useState, useEffect } from 'react'
import TaskForm from '../components/TaskForm'
import { db } from '../firebase'
import { collection, onSnapshot, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import StickyNote from '../components/StickyNote'
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

function CeoDashboard({ theme, setTheme }) {
  const handleLogout = async () => {
    await signOut(auth)
  }

  const [showForm, setShowForm] = useState(false)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState({})
  const [showCompleted, setShowCompleted] = useState(true)
  const [heatmapMode, setHeatmapMode] = useState(false)
  const [focusedTask, setFocusedTask] = useState(null)
  
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, task: null })

  const themes = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'sticky', label: 'Sticky Mode' }
  ]

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  useEffect(() => {
    const fetchMembers = async () => {
      const snapshot = await getDocs(collection(db, 'andes_tm_users'))
      const memberMap = {}
      snapshot.docs.forEach((doc) => {
        memberMap[doc.id] = doc.data().name
      })
      setMembers(memberMap)
    }
    fetchMembers()
  }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'andes_tm_tasks'), (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      setTasks(taskList)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0, task: null })
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const handleDragEnd = async (event) => {
    const { active, delta } = event
    if (active && delta) {
      const task = tasks.find(t => t.id === active.id)
      if (task) {
        const newX = (task.position?.x || 0) + delta.x
        const newY = (task.position?.y || 0) + delta.y
        const snappedX = Math.round(newX / 20) * 20
        const snappedY = Math.round(newY / 20) * 20
        await updateDoc(doc(db, 'andes_tm_tasks', task.id), {
          position: { x: snappedX, y: snappedY }
        })
      }
    }
  }

  const handleContextMenu = (e, task) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, task })
  }

  const handleMarkDone = async (task) => {
    if (task.status !== 'completed') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#34d399', '#10b981', '#ffffff']
      })
    }
    await updateDoc(doc(db, 'andes_tm_tasks', task.id), { status: 'completed' })
  }

  const handleContextDelete = async (task) => {
    if (window.confirm('Delete this task?')) {
      await deleteDoc(doc(db, 'andes_tm_tasks', task.id))
    }
  }

  const memberTasks = tasks.reduce((acc, task) => {
    if (task.status !== 'completed' || showCompleted) {
      acc[task.assignedTo] = (acc[task.assignedTo] || 0) + 1
    }
    return acc
  }, {})

  // Smart Stacking Logic
  const displayTasks = tasks.filter(t => showCompleted || t.status !== 'completed')
  const stacks = []
  const processed = new Set()
  
  displayTasks.forEach(t1 => {
    if (processed.has(t1.id)) return
    const group = { top: t1, others: [] }
    displayTasks.forEach(t2 => {
      if (t1.id !== t2.id && !processed.has(t2.id)) {
         const dx = (t1.position?.x || 0) - (t2.position?.x || 0);
         const dy = (t1.position?.y || 0) - (t2.position?.y || 0);
         if (Math.hypot(dx, dy) < 40) {
           group.others.push(t2)
           processed.add(t2.id)
         }
      }
    })
    processed.add(t1.id)
    stacks.push(group)
  })

  return (
    <div className="bg-notepad min-h-screen p-8 relative">
      <AnimatePresence>
        {focusedTask && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             onClick={() => setFocusedTask(null)}
             className="fixed inset-0 z-[60] backdrop-blur-md bg-slate-900/30"
           />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 z-10 relative">
        <div>
          <h1 className="text-3xl font-bold theme-text tracking-tight">Andes Task Manager</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">CEO Workspace</span>
            <span className="theme-text-muted text-sm">•</span>
            <span className="theme-text-muted text-sm font-medium">{tasks.length} tasks · {tasks.filter(t => t.status === 'completed').length} completed</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          
          <button 
            onClick={() => setHeatmapMode(!heatmapMode)}
            style={heatmapMode ? { backgroundColor: 'var(--badge-med-bg)', color: 'var(--badge-med-text)', borderColor: 'var(--badge-med-text)' } : {}}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm border ${heatmapMode ? '' : 'theme-card'}`}
          >
            🔥 Heatmap {heatmapMode ? 'On' : 'Off'}
          </button>

          <select 
            value={theme} 
            onChange={e => setTheme(e.target.value)}
            className="theme-card rounded-lg px-2 py-1.5 text-sm outline-none shadow-sm cursor-pointer border"
          >
            {themes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>

          <div className="flex items-center gap-2 mx-1 border-r theme-border border-opacity-30 pr-5">
            <span className="text-sm theme-text-muted font-medium">Completed</span>
            <button 
              onClick={() => setShowCompleted(!showCompleted)}
              style={{ backgroundColor: showCompleted ? 'var(--theme-accent)' : 'var(--theme-border)' }}
              className="w-10 h-5 rounded-full relative transition-colors focus:outline-none"
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200 shadow-sm ${showCompleted ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            + New Task
          </button>
          <button
            onClick={handleLogout}
            className="theme-card hover:opacity-80 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm border"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Member Task Overview */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 z-10 relative">
        {Object.entries(members).map(([uid, name]) => (
          <div key={uid} className="theme-card px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm whitespace-nowrap border">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium theme-text">{name}</span>
            <span className="btn-secondary text-[10px] font-bold px-1.5 py-0.5 rounded-full">{memberTasks[uid] || 0}</span>
          </div>
        ))}
      </div>

      {/* Task Form */}
      {showForm && <TaskForm onClose={() => setShowForm(false)} />}

      {/* Canvas */}
      <div className="relative w-full z-20" style={{ height: 'calc(100vh - 160px)' }}>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {stacks.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center theme-text-muted pointer-events-none">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xl font-semibold">Your canvas is empty</p>
              <p className="text-sm mt-2 opacity-80">Create a new task to start organizing your work visually.</p>
            </div>
          ) : (
            stacks.map((stack) => {
              // Stack Rendering Strategy:
              // For dnd-kit, the top element is draggable. Handled purely inside StickyNote.
              // We pass the "stackCount" so it knows it's a stack.
              return (
                <StickyNote 
                  key={stack.top.id} 
                  task={stack.top} 
                  members={members} 
                  onRightClick={(e) => handleContextMenu(e, stack.top)} 
                  heatmapMode={heatmapMode}
                  stackCount={stack.others.length}
                  isFocused={focusedTask === stack.top.id}
                  setFocusedTask={setFocusedTask}
                  handleMarkDone={handleMarkDone}
                />
              )
            })
          )}
        </DndContext>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.task && (
        <div 
          className="fixed theme-card shadow-2xl rounded-lg w-40 py-1 z-[100] overflow-hidden border"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.task.status === 'pending' && (
            <button 
              onClick={() => handleMarkDone(contextMenu.task)}
              className="w-full text-left px-4 py-2 text-sm theme-text hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
            >
              Mark as Done
            </button>
          )}
          <button 
            onClick={() => handleContextDelete(contextMenu.task)}
            className="w-full text-left px-4 py-2 text-sm theme-text hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            Delete Task
          </button>
        </div>
      )}

    </div>
  )
}

export default CeoDashboard
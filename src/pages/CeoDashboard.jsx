// UI: CeoDashboard applied premium Header overhauls + FreeFlow Drag Disabled
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { useState, useEffect } from 'react'
import TaskForm from '../components/TaskForm'
import { db } from '../firebase'
import { collection, onSnapshot, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore'
import StickyNote from '../components/StickyNote'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import toast, { Toaster } from 'react-hot-toast'

function CeoDashboard({ theme, setTheme, setIsCommandOpen }) {
  const handleLogout = async () => {
    await signOut(auth)
  }

  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState(null)
  
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState({})
  const [showCompleted, setShowCompleted] = useState(true)
  const [heatmapMode, setHeatmapMode] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, task: null })

  const themes = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'sticky', label: 'Corkboard' }
  ]

  useEffect(() => {
    const fetchMembers = async () => {
      const snapshot = await getDocs(collection(db, 'andes_tm_users'))
      const memberMap = {}
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        memberMap[doc.id] = { name: data.name, designation: data.designation || data.role }
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

  const handleContextMenu = (e, task) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, task })
  }

  const handleMarkDone = async (task) => {
    try {
      if (task.status !== 'completed') {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#34d399', '#10b981', '#ffffff']
        })
      }
      await updateDoc(doc(db, 'andes_tm_tasks', task.id), { status: 'completed' })
      toast.success("Task marked as done! 🎉")
    } catch (err) {
      toast.error('Failed to update task status.')
      console.error(err)
    }
  }

  const handleContextDelete = async (task) => {
    if (window.confirm('Delete this task?')) {
      try {
        await deleteDoc(doc(db, 'andes_tm_tasks', task.id))
        toast.success("Task deleted successfully")
      } catch (err) {
        toast.error('Failed to delete task.')
        console.error(err)
      }
    }
  }

  const syncTeamMembers = async () => {
    const team = [
      { name: 'Pranay', designation: 'Finance', email: 'pranay@andes.co.in' },
      { name: 'Jeet', designation: 'Operation Efficiency', email: 'jeet@andes.co.in' },
      { name: 'Prabjot', designation: 'Operation Efficiency', email: 'prabjot@andes.co.in' },
      { name: 'Swanandi', designation: 'Marketing', email: 'swanandi@andes.co.in' },
      { name: 'Nitya', designation: 'Marketing', email: 'nitya@andes.co.in' },
      { name: 'Sneha', designation: 'Marketing', email: 'sneha@andes.co.in' },
      { name: 'Neeyati', designation: 'Marketing', email: 'neeyati@andes.co.in' },
      { name: 'Prathmesh', designation: 'Operation Manager', email: 'prathmesh@andes.co.in' },
      { name: 'Gaurav', designation: 'CTO', email: 'gaurav@andes.co.in' },
      { name: 'Tamana', designation: 'Marketing', email: 'tamana@andes.co.in' },
      { name: 'Ishan', designation: 'Technology Manager Intern', email: 'ishan@andes.co.in' }
    ]

    const confirm = window.confirm("This will overwrite existing local member metadata for these names. Proceed?")
    if (!confirm) return

    toast.loading("Syncing team...", { id: 'sync' })
    try {
      const snapshot = await getDocs(collection(db, 'andes_tm_users'))
      const existingUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

      for (const member of team) {
        const existing = existingUsers.find(u => 
          (u.email && u.email.toLowerCase() === member.email.toLowerCase()) || 
          (u.name && u.name.toLowerCase() === member.name.toLowerCase())
        )
        if (existing) {
          await updateDoc(doc(db, 'andes_tm_users', existing.id), {
            designation: member.designation,
            email: member.email,
            name: member.name // Correct capitalization
          })
        } else {
          // If no Auth UID is found, we skip adding to Firestore right now 
          // because you are creating them properly in Authentication first!
        }
      }
      toast.success("Team roles synced successfully!", { id: 'sync' })
    } catch (err) {
      toast.error("Failed to sync team.", { id: 'sync' })
      console.error(err)
    }
  }

  const memberTasks = tasks.reduce((acc, task) => {
    if (task.status !== 'completed' || showCompleted) {
      acc[task.assignedTo] = (acc[task.assignedTo] || 0) + 1
    }
    return acc
  }, {})

  const displayTasks = tasks.filter(t => showCompleted || t.status !== 'completed')

  // UI: Determine pill ring color based on task assignments
  const getRingColor = (count) => {
    if (count === 0) return 'rgba(156, 163, 175, 0.4)' // ring-gray
    if (count <= 2) return 'rgba(59, 130, 246, 0.6)'    // ring-blue
    return 'rgba(249, 115, 22, 0.8)'                    // ring-orange
  }

  return (
    <div className="bg-notepad min-h-screen p-8 relative overflow-hidden flex flex-col items-center">
      <Toaster position="bottom-right" />

      {/* Header */}
      <div className="w-full max-w-7xl flex justify-between items-center mb-6 z-50 relative">
        <div>
          <h1 className="text-3xl font-bold theme-text tracking-tight">Andes Task Manager</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">CEO Workspace</span>
            <span className="theme-text-muted text-sm">•</span>
            <span className="theme-text-muted text-sm font-medium">{tasks.length} tasks · {tasks.filter(t => t.status === 'completed').length} completed</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          
          {/* UI: Premium search button with KBD component */}
          <button 
            onClick={() => setIsCommandOpen && setIsCommandOpen(true)}
            className="flex items-center gap-2 theme-card border rounded-full px-4 py-1.5 text-sm theme-text-muted hover:opacity-80 transition-opacity shadow-sm"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Search
            <kbd style={{
              fontSize:'10px', padding:'1px 5px', borderRadius:'4px',
              background:'var(--btn-secondary-bg)', 
              color:'var(--btn-secondary-text)',
              border:'1px solid var(--theme-border)'
            }}>⌘K</kbd>
          </button>

          {/* New Task Action */}
          <button
            onClick={() => {
              setEditTask(null)
              setShowForm(true)
            }}
            style={{ padding: '8px 20px', fontWeight: 600, borderRadius: '8px' }}
            className="btn-primary text-sm transition-colors shadow-sm flex flex-row items-center gap-1.5"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>

          {/* Grouped Actions Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
              className="p-2 theme-card border rounded-full shadow-sm hover:opacity-80 transition-opacity"
              title="More Options"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute top-12 right-0 theme-card shadow-2xl rounded-xl w-48 py-2 z-50 border">
                <button 
                  onClick={() => { setHeatmapMode(!heatmapMode); setIsDropdownOpen(false); }} 
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-sm font-medium transition-colors"
                >
                  Heatmap Mode
                  {heatmapMode && <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>}
                </button>
                <div className="px-4 py-2 border-t border-b theme-border border-opacity-40 my-1">
                  <select 
                    value={theme} 
                    onChange={e => { setTheme(e.target.value); setIsDropdownOpen(false); }} 
                    className="w-full bg-transparent outline-none text-sm cursor-pointer font-medium theme-text-muted"
                  >
                    {themes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <button 
                  onClick={() => { syncTeamMembers(); setIsDropdownOpen(false); }} 
                  className="w-full text-left px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-500 text-sm font-medium transition-colors"
                >
                  🔄 Sync Roles
                </button>
                <div className="border-t theme-border border-opacity-40 my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 text-sm font-medium transition-colors rounded-b-xl"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Member Task Overview */}
      <div className="w-full max-w-7xl flex gap-3 mb-6 overflow-x-auto pb-2 z-10 relative scrollbar-hide">
        {Object.entries(members).map(([uid, member]) => {
          const tCount = memberTasks[uid] || 0
          return (
            <div key={uid} className="theme-card px-3 py-2 rounded-xl flex items-center gap-2.5 shadow-sm whitespace-nowrap border min-w-max">
              {/* UI: Resized Member Pillars + Ring Dynamic Color Indicator */}
              <div 
                style={{ width: '32px', height: '32px', boxShadow: `0 0 0 2px ${getRingColor(tCount)}` }}
                className="rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0"
              >
                {(member.name || '').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col line-clamp-1 pr-1">
                <span className="text-xs font-bold theme-text leading-tight">{member.name}</span>
                {member.designation && (
                  <span className="text-[10px] theme-text-muted mt-0.5 tracking-tight">{member.designation}</span>
                )}
              </div>
              <span className="btn-secondary text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto">{tCount}</span>
            </div>
          )
        })}
      </div>

      {showForm && (
        <TaskForm 
          onClose={() => setShowForm(false)} 
          editTask={editTask}
        />
      )}

      {/* Canvas */}
      <div className="w-full max-w-7xl z-20 pb-32">
        {displayTasks.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center pt-32 theme-text-muted pointer-events-none">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xl font-semibold">Your canvas is empty</p>
            <p className="text-sm mt-2 opacity-80">Create a new task to start organizing your work visually.</p>
          </div>
        ) : (
          <motion.div 
             layout 
             className="flex flex-wrap justify-center sm:justify-start gap-8 mt-10 origin-top"
          >
            <AnimatePresence>
              {displayTasks.map((task) => (
                <StickyNote 
                  key={task.id} 
                  task={task} 
                  members={members} 
                  onRightClick={(e) => handleContextMenu(e, task)} 
                  heatmapMode={heatmapMode}
                  handleMarkDone={handleMarkDone}
                  onEdit={(t) => {
                    setEditTask(t)
                    setShowForm(true)
                  }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.task && (
        <div 
          className="fixed theme-card shadow-2xl rounded-lg w-40 py-1 z-[100] overflow-hidden border"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.task.status === 'pending' && (
            <button 
              onClick={() => {
                handleMarkDone(contextMenu.task)
                setContextMenu({ visible: false, x: 0, y: 0, task: null })
              }}
              className="w-full text-left px-4 py-2 text-sm theme-text hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
            >
              Mark as Done
            </button>
          )}
          <button 
            onClick={() => {
              handleContextDelete(contextMenu.task)
              setContextMenu({ visible: false, x: 0, y: 0, task: null })
            }}
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
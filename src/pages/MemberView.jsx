import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import confetti from 'canvas-confetti'
import toast, { Toaster } from 'react-hot-toast'
import { DndContext, useSensor, useSensors, PointerSensor, closestCorners } from '@dnd-kit/core'
import KanbanColumn from '../components/KanbanColumn'
import KanbanCard from '../components/KanbanCard'
import { FaCheckCircle, FaInbox, FaSpinner } from 'react-icons/fa'

function MemberView({ user, theme, setTheme }) {
  const handleLogout = async () => {
    await signOut(auth)
  }
  const [tasks, setTasks] = useState([])
  const [userName, setUserName] = useState('')
  const [filter, setFilter] = useState('all')

  const themes = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'sticky', label: 'Sticky Mode' }
  ]

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    const fetchUser = async () => {
      const docSnap = await getDoc(doc(db, 'andes_tm_users', user.uid))
      if (docSnap.exists()) {
        setUserName(docSnap.data().name)
      }
    }
    fetchUser()
  }, [user.uid])

  useEffect(() => {
    const q = query(collection(db, 'andes_tm_tasks'), where('assignedTo', '==', user.uid))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      setTasks(taskList)
    })
    return () => unsubscribe()
  }, [user.uid])

  const handleStatusChange = async (task, newStatus) => {
    if (task.status === newStatus) return;
    
    await updateDoc(doc(db, 'andes_tm_tasks', task.id), { status: newStatus })
    
    if (newStatus === 'completed') {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#ffffff'] })
      toast.success('Task marked as Done! 🎉', { style: { borderRadius: '10px', background: '#ecfdf5', color: '#065f46' } })
    } else if (newStatus === 'in_progress') {
      toast('Task moved to In Progress 🚀', { icon: '🚀', style: { borderRadius: '10px' } })
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id && over.id) {
       const task = tasks.find(t => t.id === active.id)
       if (task && task.status !== over.id) {
           handleStatusChange(task, over.id)
       }
    }
  }

  // Filtering
  const todayStr = new Date().toISOString().split('T')[0]
  const filteredTasks = tasks.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)).filter(t => {
      if (filter === 'high') return t.priority === 'high'
      if (filter === 'today') return t.dueDate === todayStr
      return true
  })

  // 'in_progress' state didn't exist before, so pendings go to 'pending' unless moved.
  const columnPending = filteredTasks.filter(t => t.status === 'pending')
  const columnProgress = filteredTasks.filter(t => t.status === 'in_progress')
  const columnDone = filteredTasks.filter(t => t.status === 'completed')

  return (
    <div className="bg-notepad min-h-screen p-8 pb-20">
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8 max-w-7xl mx-auto z-10 relative">
        <div>
          <h1 className="text-3xl font-bold theme-text tracking-tight flex items-center gap-2">
            Welcome, {userName || 'Member'} 👋
          </h1>
          <p className="theme-text-muted font-medium mt-2">
            You have {columnPending.length + columnProgress.length} tasks today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={theme} 
            onChange={e => setTheme(e.target.value)}
            className="theme-card rounded-lg px-3 py-2 text-sm outline-none shadow-sm cursor-pointer border"
          >
            {themes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <button
            onClick={handleLogout}
            className="theme-card hover:opacity-80 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm border"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 max-w-7xl mx-auto mb-8 z-10 relative">
        <button onClick={() => setFilter('all')} className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors shadow-sm border ${filter === 'all' ? 'btn-primary border-transparent' : 'theme-card'}`}>All Tasks</button>
        <button onClick={() => setFilter('high')} className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors shadow-sm border ${filter === 'high' ? 'bg-red-500 text-white border-transparent' : 'theme-card'}`}>🔥 High Priority</button>
        <button onClick={() => setFilter('today')} className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors shadow-sm border ${filter === 'today' ? 'bg-orange-500 text-white border-transparent' : 'theme-card'}`}>📅 Due Today</button>
      </div>

      {/* Kanban Board */}
      <div className="relative z-20">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto items-start">
            <KanbanColumn id="pending" title="To Do" tasks={columnPending}>
              {columnPending.length === 0 && <div className="text-center py-10 opacity-60 theme-text-muted"><FaInbox className="mx-auto text-3xl mb-3"/> <p className="text-sm font-medium">All clear here!</p></div>}
              {columnPending.map(task => <KanbanCard key={task.id} task={task} handleStatusChange={handleStatusChange} />)}
            </KanbanColumn>

            <KanbanColumn id="in_progress" title="In Progress" tasks={columnProgress}>
              {columnProgress.length === 0 && <div className="text-center py-10 opacity-60 theme-text-muted"><FaSpinner className="mx-auto text-3xl mb-3"/> <p className="text-sm font-medium">Ready to start?</p></div>}
              {columnProgress.map(task => <KanbanCard key={task.id} task={task} handleStatusChange={handleStatusChange} />)}
            </KanbanColumn>

            <KanbanColumn id="completed" title="Done" tasks={columnDone}>
              {columnDone.length === 0 && <div className="text-center py-10 opacity-60 theme-text-muted"><FaCheckCircle className="mx-auto text-3xl mb-3"/> <p className="text-sm font-medium">Get things done!</p></div>}
              {columnDone.length > 0 && columnDone.length === filteredTasks.length && (
                  <div className="theme-card bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 p-5 rounded-xl text-center mb-2 border shadow-sm">
                     <p className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">🎉 You’re all caught up!</p>
                  </div>
              )}
              {columnDone.map(task => <KanbanCard key={task.id} task={task} handleStatusChange={handleStatusChange} />)}
            </KanbanColumn>
          </div>
        </DndContext>
      </div>
    </div>
  )
}

export default MemberView
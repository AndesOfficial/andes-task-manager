import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { useState , useEffect} from 'react'
import TaskForm from '../components/TaskForm'
import { db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import StickyNote from '../components/StickyNote'

function CeoDashboard() {
  const handleLogout = async () => {
    await signOut(auth)
  }

  const [showForm, setShowForm] = useState(false)
  const [tasks, setTasks] = useState([])

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


  return (
    <div className="bg-notepad min-h-screen p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Andes Task Manager</h1>
          <p className="text-slate-500 text-sm mt-1">CEO Workspace</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + New Task
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Task Form */}
      {showForm && <TaskForm onClose={() => setShowForm(false)} />}
        {/* Canvas */}
{/* Canvas */}
<div className="relative w-full" style={{ height: 'calc(100vh - 120px)' }}>
  {tasks.map((task) => (
    <StickyNote key={task.id} task={task} />
  ))}
</div>

    </div>
  )
}

export default CeoDashboard
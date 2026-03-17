import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

function MemberView({ user }) {
  const handleLogout = async () => {
    await signOut(auth)
  }
  const [tasks, setTasks] = useState([])

useEffect(() => {
  const q = query(
    collection(db, 'andes_tm_tasks'),
    where('assignedTo', '==', user.uid)
  )

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const taskList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
    setTasks(taskList)
  })

  return () => unsubscribe()
}, [user.uid])

const handleDone = async (taskId) => {
  await updateDoc(doc(db, 'andes_tm_tasks', taskId), {
    status: 'completed'
  })
}

  return (
    <div className="bg-notepad min-h-screen p-8">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">{user.email}</p>
        </div>
        {/* Tasks */}
<div className="grid grid-cols-1 gap-4 max-w-2xl">
  {tasks.length === 0 ? (
    <p className="text-slate-400 text-sm">No tasks assigned to you yet.</p>
  ) : (
    tasks.map((task) => (
      <div
        key={task.id}
        style={{ backgroundColor: task.priority === 'high' ? '#fecaca' : task.priority === 'medium' ? '#fed7aa' : '#fef08a' }}
        className="p-4 rounded-lg shadow-md flex flex-col gap-2"
      >
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-800">{task.title}</h3>
          <span className="text-xs font-bold uppercase text-gray-500">{task.priority}</span>
        </div>
        <p className="text-gray-700 text-sm">{task.description}</p>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/10">
          <span className="text-xs text-gray-500">Status: {task.status}</span>
          {task.status === 'pending' && (
            <button
  onClick={() => handleDone(task.id)}
  className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded shadow-sm transition-colors"
>
  Done
</button>
          )}
        </div>
      </div>
    ))
  )}
</div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Logout
        </button>
      </div>

    </div>
  )
}

export default MemberView
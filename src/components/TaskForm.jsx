import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore'

function TaskForm({ onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('low')
  const [assignedTo, setAssignedTo] = useState('')
  const [members, setMembers] = useState([])

  useEffect(() => {
    const fetchMembers = async () => {
      const q = query(
        collection(db, 'andes_tm_users'),
        where('role', '==', 'member')
      )
      const snapshot = await getDocs(q)
      const memberList = snapshot.docs.map((doc) => ({
        uid: doc.id,
        name: doc.data().name
      }))
      setMembers(memberList)
    }
    fetchMembers()
  }, [])

  const handleSubmit = async () => {
    if (!title || !assignedTo) {
      alert('Please fill in title and assigned to fields')
      return
    }
    try {
      await addDoc(collection(db, 'andes_tm_tasks'), {
        title,
        description,
        priority,
        assignedTo,
        status: 'pending',
        position: { x: 100, y: 100 },
        createdAt: serverTimestamp()
      })
      onClose()
    } catch (error) {
      console.log(error.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">

        <h2 className="text-xl font-bold text-slate-800 mb-4">Create New Task</h2>

        <div className="flex flex-col gap-4">

          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-24"
          />

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select team member</option>
            {members.map((member) => (
              <option key={member.uid} value={member.uid}>
                {member.name}
              </option>
            ))}
          </select>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create Task
          </button>
        </div>

      </div>
    </div>
  )
}

export default TaskForm
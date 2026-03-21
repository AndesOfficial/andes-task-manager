// FIX: Toast updates in form and position randomizer removed
import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs, query, where, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'

function TaskForm({ onClose, editTask }) {
  const [title, setTitle] = useState(editTask?.title || '')
  const [description, setDescription] = useState(editTask?.description || '')
  const [priority, setPriority] = useState(editTask?.priority || 'low')
  const [assignedTo, setAssignedTo] = useState(editTask?.assignedTo || '')
  const [dueDate, setDueDate] = useState(editTask?.dueDate || '')
  const [members, setMembers] = useState([])

  useEffect(() => {
    const fetchMembers = async () => {
      const q = query(
        collection(db, 'andes_tm_users'),
        where('role', '==', 'member')
      )
      const snapshot = await getDocs(q)
      const memberList = snapshot.docs.map((d) => ({
        uid: d.id,
        name: d.data().name,
        designation: d.data().designation || d.data().role
      }))
      setMembers(memberList)
    }
    fetchMembers()
  }, [])

  const handleSubmit = async () => {
    if (!title || !assignedTo) {
      toast.error('Please fill in title and assigned to fields')
      return
    }
    try {
      if (editTask) {
        await updateDoc(doc(db, 'andes_tm_tasks', editTask.id), {
          title,
          description,
          priority,
          assignedTo,
          dueDate
        })
        toast.success("Task updated successfully")
      } else {
        await addDoc(collection(db, 'andes_tm_tasks'), {
          title,
          description,
          priority,
          assignedTo,
          dueDate,
          status: 'pending',
          createdAt: serverTimestamp()
        })
        toast.success("Task created successfully")
      }
      onClose()
    } catch (error) {
      toast.error("An error occurred. Please try again.")
      console.log(error.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="theme-card rounded-xl p-6 w-full max-w-md shadow-2xl border transition-all transform scale-100" style={{ borderColor: 'var(--theme-border)' }}>
        <h2 className="text-xl font-bold theme-text mb-4">
          {editTask ? 'Edit Task' : 'Create New Task'}
        </h2>

        <div className="flex flex-col gap-4">

          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card)' }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 theme-text transition-colors"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card)' }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-24 theme-text transition-colors"
          />

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card)' }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 theme-text transition-colors"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card)' }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 theme-text transition-colors"
          />

          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card)' }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 theme-text transition-colors"
          >
            <option value="">Select team member</option>
            {members.map((member) => (
              <option key={member.uid} value={member.uid}>
                {member.name} {member.designation ? `(${member.designation})` : ''}
              </option>
            ))}
          </select>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm theme-text-muted hover:opacity-80 transition-opacity font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-transform transform active:scale-95 shadow-md hover:shadow-lg"
          >
            {editTask ? 'Save Changes' : 'Create Task'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default TaskForm
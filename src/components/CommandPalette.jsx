import { Command } from 'cmdk'
import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'

export default function CommandPalette({ isOpen, setIsOpen }) {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (!isOpen) return
    const unsubTasks = onSnapshot(collection(db, 'andes_tm_tasks'), (snapshot) => {
      setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
    const unsubUsers = onSnapshot(collection(db, 'andes_tm_users'), (snapshot) => {
      setUsers(snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() })))
    })
    return () => {
      unsubTasks()
      unsubUsers()
    }
  }, [isOpen])

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
      if (e.key === '/') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setIsOpen((open) => !open)
        }
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setIsOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-start justify-center pt-[15vh] z-[100] p-4 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div className="theme-card rounded-2xl shadow-2xl overflow-hidden w-full max-w-xl border theme-border" onClick={e => e.stopPropagation()}>
        <Command>
          <Command.Input 
            autoFocus 
            placeholder="Search tasks, users, statuses..." 
            className="w-full px-5 py-4 border-b theme-border theme-text bg-transparent focus:outline-none text-lg"
          />

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm theme-text-muted">No results found.</Command.Empty>

            <Command.Group heading="Tasks" className="px-3 py-2 text-xs font-semibold theme-text-muted uppercase tracking-wider">
              {tasks.map(task => (
                <Command.Item key={task.id} onSelect={() => setIsOpen(false)} className="px-4 py-2 my-1 rounded-xl theme-hover cursor-pointer flex justify-between items-center text-sm theme-text">
                  <span className="font-medium">{task.title}</span>
                  <div className="flex gap-2">
                    <span className="text-[10px] btn-secondary px-2.5 py-1 rounded-full">{task.priority}</span>
                    <span className="text-[10px] badge-low px-2.5 py-1 rounded-full">{task.status}</span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
            
            <Command.Group heading="Users" className="px-3 py-2 text-xs font-semibold theme-text-muted uppercase tracking-wider mt-2">
               {users.map(user => (
                <Command.Item key={user.uid} onSelect={() => setIsOpen(false)} className="px-4 py-2 my-1 rounded-xl theme-hover cursor-pointer flex items-center gap-3 text-sm theme-text">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-slate-400 ml-auto capitalize">{user.role}</span>
                </Command.Item>
              ))}
            </Command.Group>

          </Command.List>
        </Command>
      </div>
    </div>
  )
}

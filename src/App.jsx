import { useState, useEffect } from 'react'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Login from './pages/Login'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import CeoDashboard from './pages/CeoDashboard'
import MemberView from './pages/MemberView'
import CommandPalette from './components/CommandPalette'
import TaskForm from './components/TaskForm'

function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    const unsubscribe = onSnapshot(doc(db, 'andes_tm_users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.role) setRole(data.role)
        if (data.theme) setTheme(data.theme)
      }
    })
    return () => unsubscribe()
  }, [user])

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme) // Optimistic update
    if (user) {
      try {
        await setDoc(doc(db, 'andes_tm_users', user.uid), { theme: newTheme }, { merge: true })
      } catch (error) {
        console.error("Failed to update user theme", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-notepad">
        <p className="text-slate-400 text-sm animate-pulse">Loading workspace...</p>
      </div>
    )
  }

  if (user && role === 'ceo') {
    return (
      <>
        <CeoDashboard theme={theme} setTheme={handleThemeChange} />
        <CommandPalette isOpen={isCommandOpen} setIsOpen={setIsCommandOpen} />
      </>
    )
  }

  if (user && role === 'member') {
    return (
      <>
        <MemberView user={user} theme={theme} setTheme={handleThemeChange} />
        <CommandPalette isOpen={isCommandOpen} setIsOpen={setIsCommandOpen} />
      </>
    )
  }

  return <Login />
}

export default App
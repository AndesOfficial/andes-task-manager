import { useState, useEffect } from 'react'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Login from './pages/Login'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import CeoDashboard from './pages/CeoDashboard'
import MemberView from './pages/MemberView'
import CommandPalette from './components/CommandPalette'

function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  
  // FIX: Separate auth loading and role loading states to prevent Login page flash
  const [authLoading, setAuthLoading] = useState(true)
  const [roleLoading, setRoleLoading] = useState(true)
  
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
      // If there is no user, we don't need to load a role
      if (!currentUser) setRoleLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    const userRef = doc(db, 'andes_tm_users', user.uid)
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.role) setRole(data.role)
        if (data.theme) setTheme(data.theme)
      } else {
        // Auto-provision if missing
        const newProfile = {
          name: user.displayName || user.email?.split('@')[0] || 'New Member',
          role: 'member',
          theme: 'light',
          email: user.email,
          createdAt: new Date()
        }
        await setDoc(userRef, newProfile)
      }
      setRoleLoading(false)
    })
    return () => unsubscribe()
  }, [user])

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme) 
    if (user) {
      try {
        await setDoc(doc(db, 'andes_tm_users', user.uid), { theme: newTheme }, { merge: true })
      } catch (error) {
        console.error("Failed to update user theme", error)
      }
    }
  }

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-notepad">
        <p className="text-slate-400 text-sm animate-pulse">Loading workspace...</p>
      </div>
    )
  }

  if (user && role === 'ceo') {
    return (
      <>
        <CeoDashboard theme={theme} setTheme={handleThemeChange} setIsCommandOpen={setIsCommandOpen} />
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
import { useState, useEffect } from 'react'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Login from './pages/Login'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import CeoDashboard from './pages/CeoDashboard'
import MemberView from './pages/MemberView'

function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
  if (!user) return

 const fetchRole = async () => {
  const docRef = doc(db, 'andes_tm_users', user.uid)
  const docSnap = await getDoc(docRef)
 
  if (docSnap.exists()) {
    setRole(docSnap.data().role)
  }
}

  fetchRole()
}, [user])

if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-notepad">
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  )
}

 if (user && role === 'ceo') {
    return <CeoDashboard />
  }

  if (user && role === 'member') {
     return <MemberView user={user} />
  }

  return <Login />
}

export default App
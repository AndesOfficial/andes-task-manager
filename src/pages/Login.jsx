import { useState } from "react"
import { auth } from '../firebase'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setError('Invalid email or password')
    }
  }

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setResetMessage('Please enter your email')
      return
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail)
      setResetMessage('Reset link sent! Check your email.')
    } catch (error) {
      setResetMessage('Email not found')
    }
  }

  return (
    <div className="bg-notepad min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Andes Task Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your workspace</p>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            onClick={handleLogin}
            className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-sm font-medium transition-colors mt-2"
          >
            Sign In
          </button>

          {!showReset ? (
            <p
              onClick={() => setShowReset(true)}
              className="text-center text-xs text-blue-500 cursor-pointer hover:underline"
            >
              Forgot password?
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleResetPassword}
                className="bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Send Reset Link
              </button>
              {resetMessage && (
                <p className="text-xs text-center text-green-600">{resetMessage}</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Login
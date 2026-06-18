import { useEffect, useState } from 'react'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ShieldCheck } from 'lucide-react'
import { BrandLogos } from '../components/BrandLogos'
import { loginRequest } from '../lib/authConfig'

export function LoginPage() {
  const { instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) navigate('/')
    const handler = () => {
      if (isAuthenticated) navigate('/')
    }
    window.addEventListener('msal:accountChanged', handler)
    return () => window.removeEventListener('msal:accountChanged', handler)
  }, [isAuthenticated, navigate])

  const handleMicrosoftLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await instance.loginRedirect(loginRequest)
    } catch {
      setError('Microsoft login failed. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandLogos className="mb-5" size={56} />
          <h1 className="font-title text-2xl font-bold text-slate-800">Community Cafe Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Staff and board administration</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-hubble-50 text-hubble-600">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h2 className="text-lg font-semibold text-slate-800">Staff login</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in with your organization Microsoft account.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={isLoading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-800 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none" aria-hidden="true">
                  <path d="M10 0H0V10H10V0Z" fill="#F25022" />
                  <path d="M21 0H11V10H21V0Z" fill="#7FBA00" />
                  <path d="M10 11H0V21H10V11Z" fill="#00A4EF" />
                  <path d="M21 11H11V21H21V11Z" fill="#FFB900" />
                </svg>
                Sign in with Microsoft
              </>
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          Authorized staff only. All actions are logged.
        </p>
      </div>
    </div>
  )
}

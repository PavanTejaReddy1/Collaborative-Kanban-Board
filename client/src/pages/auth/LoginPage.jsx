import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useForm } from '../../hooks/useForm.js'
import { Input }  from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Alert }  from '../../components/ui/Alert.jsx'

// ── Client-side validation ────────────────────────────────────────────────
function validateLogin(values) {
  const errors = {}

  if (!values.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!values.password) {
    errors.password = 'Password is required'
  }

  return errors
}

export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()

  // Redirect back to the page the user was trying to reach
  const from = location.state?.from?.pathname || '/dashboard'

  const { values, errors, touched, isSubmitting, submitError, handleChange, handleBlur, handleSubmit } =
    useForm(
      { email: '', password: '' },
      validateLogin,
      async (vals) => {
        await login(vals)
        navigate(from, { replace: true })
      },
    )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to Kanban</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back — let&apos;s pick up where you left off</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            <Alert message={submitError} type="error" />

            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email ? errors.email : ''}
            />

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500" aria-hidden>*</span>
                </label>
                {/* Forgot password — placeholder for a future phase */}
                <span className="text-xs text-gray-400">Forgot password? (coming soon)</span>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                autoComplete="current-password"
                required
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password ? errors.password : ''}
              />
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full mt-1"
              size="lg"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700 underline-offset-2 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

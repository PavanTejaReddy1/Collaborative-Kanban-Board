import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useForm } from '../../hooks/useForm.js'
import { Input }  from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Alert }  from '../../components/ui/Alert.jsx'

// Demo credentials — populated by the seed script on the server
const DEMO_EMAIL    = 'demo@kanban.app'
const DEMO_PASSWORD = 'Demo@1234'

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
  const from       = location.state?.from?.pathname || '/dashboard'

  const form = useForm(
    { email: '', password: '' },
    validateLogin,
    async (vals) => {
      await login(vals)
      navigate(from, { replace: true })
    },
  )

  // Fill the demo credentials and immediately submit
  const handleDemoLogin = async () => {
    // Set values synchronously, then trigger login directly
    try {
      await login({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
      navigate(from, { replace: true })
    } catch (err) {
      form.setSubmitError(
        err.response?.data?.message ||
        'Demo account not available. Run the seed script on the server first.',
      )
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to Kanban</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back — pick up where you left off</p>
        </div>

        {/* Demo login banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <span className="text-amber-500 text-lg flex-shrink-0">✦</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Try the demo</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Instantly explore a pre-loaded workspace with boards, tasks and members.
            </p>
            <p className="text-xs text-amber-500 mt-1 font-mono">
              {DEMO_EMAIL} / {DEMO_PASSWORD}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDemoLogin}
            className="flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            Demo login
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or sign in with your account</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-5">

            <Alert message={form.submitError} type="error" />

            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={form.values.email}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.touched.email ? form.errors.email : ''}
            />

            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-1">
                Password <span className="text-red-500" aria-hidden>*</span>
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                autoComplete="current-password"
                required
                value={form.values.password}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                error={form.touched.password ? form.errors.password : ''}
              />
            </div>

            <Button
              type="submit"
              isLoading={form.isSubmitting}
              className="w-full mt-1"
              size="lg"
            >
              {form.isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        {/* Footer */}
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

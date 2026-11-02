import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useForm } from '../../hooks/useForm.js'
import { Input }  from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Alert }  from '../../components/ui/Alert.jsx'

// ── Client-side validation ────────────────────────────────────────────────
function validateRegister(values) {
  const errors = {}

  if (!values.name.trim()) {
    errors.name = 'Name is required'
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!values.password) {
    errors.password = 'Password is required'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  } else if (!/[A-Z]/.test(values.password)) {
    errors.password = 'Password must contain at least one uppercase letter'
  } else if (!/[a-z]/.test(values.password)) {
    errors.password = 'Password must contain at least one lowercase letter'
  } else if (!/[0-9]/.test(values.password)) {
    errors.password = 'Password must contain at least one number'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const { values, errors, touched, isSubmitting, submitError, handleChange, handleBlur, handleSubmit } =
    useForm(
      { name: '', email: '', password: '', confirmPassword: '' },
      validateRegister,
      async (vals) => {
        // confirmPassword is only for client-side — don't send it to the server
        await register({ name: vals.name, email: vals.email, password: vals.password })
        navigate('/dashboard', { replace: true })
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
          <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="text-sm text-gray-500 mt-1">Start collaborating with your team</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            <Alert message={submitError} type="error" />

            <Input
              id="name"
              name="name"
              label="Full name"
              placeholder="Jane Smith"
              autoComplete="name"
              required
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.name ? errors.name : ''}
            />

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

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="Min 8 chars, one uppercase, one number"
              autoComplete="new-password"
              required
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password ? errors.password : ''}
              helper="At least 8 characters with one uppercase letter and one number"
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.confirmPassword ? errors.confirmPassword : ''}
            />

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full mt-1"
              size="lg"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

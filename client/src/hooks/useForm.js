import { useState, useCallback } from 'react'

/**
 * useForm
 *
 * Lightweight form state manager.
 * Handles values, touched state, client-side validation and submission.
 *
 * @param {object} initialValues   – initial field values
 * @param {function} validate      – (values) => { fieldName: errorString, ... }
 * @param {function} onSubmit      – async (values) => void
 */
export function useForm(initialValues, validate, onSubmit) {
  const [values,     setValues]     = useState(initialValues)
  const [errors,     setErrors]     = useState({})
  const [touched,    setTouched]    = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError,  setSubmitError]  = useState('')

  // ── handleChange ──────────────────────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))

    // Clear the field's error as soon as the user starts typing again
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }, [errors])

  // ── handleBlur ────────────────────────────────────────────────────────────
  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))

    // Validate just this field on blur
    if (validate) {
      const fieldErrors = validate(values)
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] || '' }))
    }
  }, [validate, values])

  // ── handleSubmit ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setSubmitError('')

    // Mark all fields as touched so errors are shown
    const allTouched = Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {})
    setTouched(allTouched)

    // Run validation
    if (validate) {
      const fieldErrors = validate(values)
      const hasErrors = Object.values(fieldErrors).some(Boolean)
      setErrors(fieldErrors)
      if (hasErrors) return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      // Extract the server error message
      const message =
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit])

  // ── reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setSubmitError('')
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    setSubmitError,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  }
}

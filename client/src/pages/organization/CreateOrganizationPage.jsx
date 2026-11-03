import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrganization } from '../../contexts/OrganizationContext.jsx'
import { useForm }  from '../../hooks/useForm.js'
import { Input }   from '../../components/ui/Input.jsx'
import { Button }  from '../../components/ui/Button.jsx'
import { Alert }   from '../../components/ui/Alert.jsx'

// ── Auto-generate slug from name ──────────────────────────────────────────
function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

function validateOrg(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Organization name is required'
  else if (values.name.trim().length < 2) errors.name = 'Name must be at least 2 characters'

  if (!values.slug.trim()) errors.slug = 'Slug is required'
  else if (!/^[a-z0-9-]+$/.test(values.slug)) errors.slug = 'Only lowercase letters, numbers and hyphens'
  else if (values.slug.length < 2) errors.slug = 'Slug must be at least 2 characters'

  return errors
}

export default function CreateOrganizationPage() {
  const { createOrg }   = useOrganization()
  const navigate         = useNavigate()
  const [slugEdited, setSlugEdited] = useState(false)

  const form = useForm(
    { name: '', slug: '', description: '' },
    validateOrg,
    async (vals) => {
      await createOrg(vals)
      navigate('/dashboard', { replace: true })
    },
  )

  // Auto-fill slug from name unless user has manually edited it
  const handleNameChange = (e) => {
    form.handleChange(e)
    if (!slugEdited) {
      const synthetic = { target: { name: 'slug', value: toSlug(e.target.value) } }
      form.handleChange(synthetic)
    }
  }

  const handleSlugChange = (e) => {
    setSlugEdited(true)
    form.handleChange(e)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your organization</h1>
          <p className="text-sm text-gray-500 mt-1">Your organization is the top-level workspace for all your teams and boards.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-5">
            <Alert message={form.submitError} type="error" />

            <Input
              id="name"
              name="name"
              label="Organization name"
              placeholder="Acme Corporation"
              required
              value={form.values.name}
              onChange={handleNameChange}
              onBlur={form.handleBlur}
              error={form.touched.name ? form.errors.name : ''}
            />

            <Input
              id="slug"
              name="slug"
              label="URL slug"
              placeholder="acme-corporation"
              required
              value={form.values.slug}
              onChange={handleSlugChange}
              onBlur={form.handleBlur}
              error={form.touched.slug ? form.errors.slug : ''}
              helper="Lowercase letters, numbers and hyphens only. Cannot be changed later."
            />

            <Input
              id="description"
              name="description"
              label="Description"
              placeholder="What does your organization do?"
              value={form.values.description}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
            />

            <Button type="submit" isLoading={form.isSubmitting} className="w-full mt-1" size="lg">
              {form.isSubmitting ? 'Creating…' : 'Create organization'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

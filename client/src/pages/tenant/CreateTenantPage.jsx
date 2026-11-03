import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenant }       from '../../contexts/TenantContext.jsx'
import { useOrganization } from '../../contexts/OrganizationContext.jsx'
import { useForm }  from '../../hooks/useForm.js'
import { Input }   from '../../components/ui/Input.jsx'
import { Button }  from '../../components/ui/Button.jsx'
import { Alert }   from '../../components/ui/Alert.jsx'

function toSlug(name) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60)
}

function validateTenant(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Tenant name is required'
  else if (values.name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
  if (!values.slug.trim()) errors.slug = 'Slug is required'
  else if (!/^[a-z0-9-]+$/.test(values.slug)) errors.slug = 'Only lowercase letters, numbers and hyphens'
  return errors
}

export default function CreateTenantPage() {
  const { createTenant }  = useTenant()
  const { activeOrg }     = useOrganization()
  const navigate           = useNavigate()
  const [slugEdited, setSlugEdited] = useState(false)

  const form = useForm(
    { name: '', slug: '', description: '' },
    validateTenant,
    async (vals) => {
      await createTenant(vals)
      navigate('/dashboard', { replace: true })
    },
  )

  const handleNameChange = (e) => {
    form.handleChange(e)
    if (!slugEdited) {
      form.handleChange({ target: { name: 'slug', value: toSlug(e.target.value) } })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create a branch</h1>
          <p className="text-sm text-gray-500 mt-1">
            in <span className="font-medium text-gray-700">{activeOrg?.name}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-5">
            <Alert message={form.submitError} type="error" />

            <Input id="name" name="name" label="Branch name" placeholder="Engineering Team" required
              value={form.values.name} onChange={handleNameChange} onBlur={form.handleBlur}
              error={form.touched.name ? form.errors.name : ''} />

            <Input id="slug" name="slug" label="URL slug" placeholder="engineering-team" required
              value={form.values.slug}
              onChange={(e) => { setSlugEdited(true); form.handleChange(e) }}
              onBlur={form.handleBlur}
              error={form.touched.slug ? form.errors.slug : ''}
              helper="Unique within your organization." />

            <Input id="description" name="description" label="Description" placeholder="What this branch is for"
              value={form.values.description} onChange={form.handleChange} onBlur={form.handleBlur} />

            <Button type="submit" isLoading={form.isSubmitting} className="w-full mt-1" size="lg">
              {form.isSubmitting ? 'Creating…' : 'Create branch'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <button onClick={() => navigate(-1)} className="text-primary-600 hover:underline">← Go back</button>
        </p>
      </div>
    </div>
  )
}

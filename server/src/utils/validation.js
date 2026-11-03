import Joi from 'joi'

/**
 * Central validation schemas.
 * All schemas are defined here so they can be reused across controllers
 * and are easy to audit in one place.
 */

// ── Password rule (reused across schemas) ─────────────────────────────────
const passwordRule = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[A-Z]/, 'uppercase letter')
  .pattern(/[a-z]/, 'lowercase letter')
  .pattern(/[0-9]/, 'number')
  .messages({
    'string.min':     'Password must be at least 8 characters',
    'string.max':     'Password must not exceed 128 characters',
    'string.pattern.name': 'Password must contain at least one {#name}',
    'any.required':   'Password is required',
  })

// ── Auth schemas ──────────────────────────────────────────────────────────
export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required().messages({
    'string.min':   'Name must be at least 2 characters',
    'string.max':   'Name must be at most 80 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().trim().email({ tlds: { allow: false } }).lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: passwordRule.required(),
})

export const loginSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
})

// ── Slug helper ───────────────────────────────────────────────────────────
const slugRule = Joi.string()
  .lowercase()
  .trim()
  .min(2)
  .max(60)
  .pattern(/^[a-z0-9-]+$/)
  .messages({
    'string.pattern.base': 'Slug can only contain lowercase letters, numbers and hyphens',
    'string.min':   'Slug must be at least 2 characters',
    'string.max':   'Slug must be at most 60 characters',
    'any.required': 'Slug is required',
  })

// ── Organization schemas ──────────────────────────────────────────────────
export const createOrganizationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Organization name is required',
  }),
  slug: slugRule.required(),
  description: Joi.string().trim().max(500).allow('').default(''),
})

export const updateOrganizationSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500).allow(''),
}).min(1).messages({ 'object.min': 'Provide at least one field to update' })

// ── Tenant schemas ────────────────────────────────────────────────────────
export const createTenantSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Tenant name is required',
  }),
  slug: slugRule.required(),
  description: Joi.string().trim().max(500).allow('').default(''),
})

export const updateTenantSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500).allow(''),
}).min(1)

// ── Membership schemas ────────────────────────────────────────────────────
export const inviteMemberSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).lowercase().required().messages({
    'any.required': 'Email is required',
  }),
  role: Joi.string().valid('TENANT_ADMIN', 'MEMBER').required().messages({
    'any.only':     'Role must be TENANT_ADMIN or MEMBER',
    'any.required': 'Role is required',
  }),
})

// ── Generic validate helper ───────────────────────────────────────────────
/**
 * validate(schema, data)
 * Returns { value, error } where error is a human-readable string or null.
 */
export function validate(schema, data) {
  const { error, value } = schema.validate(data, {
    abortEarly:      false, // collect all errors, not just the first
    stripUnknown:    true,  // remove extra fields the client might send
    convert:         true,
  })

  if (error) {
    const message = error.details.map((d) => d.message).join('; ')
    return { value: null, error: message }
  }

  return { value, error: null }
}

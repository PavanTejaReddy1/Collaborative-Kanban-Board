import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * User schema.
 *
 * Design decisions:
 * - `password` is excluded from all queries by default via `select: false`.
 *   Any route that needs to verify a password must explicitly include it:
 *   User.findOne({ email }).select('+password')
 * - Passwords are hashed in a pre-save hook so they are NEVER stored in plain
 *   text — even if a developer accidentally calls user.save() after setting
 *   user.password = plainText.
 * - `role` at this level is a system-wide role. Organisation / tenant roles
 *   live in the Membership model (Phase 3).
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type:     String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:   false, // never returned in query results by default
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  },
)

// ── Indexes ────────────────────────────────────────────────────────────────
// email already gets an index from `unique: true` but we declare it
// explicitly for clarity and to allow collation in the future.
userSchema.index({ email: 1 })

// ── Pre-save hook: hash password ──────────────────────────────────────────
userSchema.pre('save', async function hashPassword(next) {
  // Only hash when the password field has been modified
  if (!this.isModified('password')) return next()

  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS)
    next()
  } catch (err) {
    next(err)
  }
})

// ── Instance method: compare passwords ───────────────────────────────────
/**
 * comparePassword(candidate)
 * Returns true if the candidate matches the stored hash.
 * Called during login — the controller must have fetched the user
 * with .select('+password') first.
 */
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

// ── Instance method: safe public profile ─────────────────────────────────
/**
 * toPublicJSON()
 * Returns only the fields that are safe to send to the client.
 * Call this instead of res.json(user) to guarantee the password hash
 * is never accidentally included.
 */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id:          this._id,
    name:        this.name,
    email:       this.email,
    isActive:    this.isActive,
    lastLoginAt: this.lastLoginAt,
    createdAt:   this.createdAt,
    updatedAt:   this.updatedAt,
  }
}

const User = mongoose.models['User'] || mongoose.model('User', userSchema)
export default User

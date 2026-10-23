const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Array of interest strings — used in Aggregation Scenario 1
    interests: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// INDEXES (using schema.index as required)
// 1. Unique index on email — supports login lookup and uniqueness enforcement
UserSchema.index({ email: 1 }, { unique: true });

// 2. Index on interests array — supports Aggregation Scenario 1 ($match + $unwind + $group)
UserSchema.index({ interests: 1 });

// 3. Index on createdAt — supports Admin getAllUsers sorted by createdAt: -1 (paginated)
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare plain password with stored hash
UserSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Remove password from any JSON response
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);

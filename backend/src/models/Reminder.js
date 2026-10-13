const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    reminderTime: {
      type: String,
      default: '20:00',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid 24-hour time format (HH:mm)']
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.userId = ret.userId ? ret.userId.toString() : ret.userId;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.userId = ret.userId ? ret.userId.toString() : ret.userId;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Virtual for id getter
reminderSchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : undefined;
});

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;

const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    mood: {
      type: Number,
      required: [true, 'Mood score is required'],
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer mood score'
      }
    },
    feelings: {
      type: [String],
      default: []
    },
    reflection: {
      type: String,
      default: null,
      maxlength: 2000
    },
    sleepHours: {
      type: Number,
      required: [true, 'Sleep hours is required'],
      min: 0,
      max: 24
    },
    entryDate: {
      type: Date,
      required: [true, 'Entry date is required'],
      index: true
    },
    // Optional weather metrics
    temperature: {
      type: Number,
      default: null
    },
    weatherCondition: {
      type: String,
      default: null
    },
    precipitation: {
      type: Number,
      default: null
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
moodEntrySchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : undefined;
});

// Composite unique index: One mood entry per user per entryDate
moodEntrySchema.index({ userId: 1, entryDate: 1 }, { unique: true });

const MoodEntry = mongoose.model('MoodEntry', moodEntrySchema);

module.exports = MoodEntry;

const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// INDEXES (using schema.index as required)
// 1. Compound index on owner + createdAt — supports:
//    - User listing their own notes (filter by owner, sorted by date, paginated)
NoteSchema.index({ owner: 1, createdAt: -1 });

// 2. Index on createdAt — supports Admin getAllNotes where Note.find({}).sort({ createdAt: -1 })
//    cannot use the { owner: 1, createdAt: -1 } prefix, so needs its own index
NoteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Note', NoteSchema);

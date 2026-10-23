const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// INDEXES (using schema.index as required)
// 1. Compound index on author + createdAt — supports:
//    - Aggregation Scenario 2: $lookup join (foreignField: "author") + sort by createdAt
//    - Fetching a specific user's posts sorted by date
PostSchema.index({ author: 1, createdAt: -1 });

// 2. Index on createdAt — supports public getAllPosts: Post.find({}).sort({ createdAt: -1 })
//    (full-collection scan without this index; compound prefix 'author' cannot be skipped)
PostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);

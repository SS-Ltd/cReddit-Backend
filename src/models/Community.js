const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CommunitySchema = new Schema({
  owner: {
    type: String,
    required: true,
    ref: 'User',
    refPath: 'username'
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  banner: {
    type: String
  },
  icon: {
    type: String
  },
  topic: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  isNSFW: {
    type: Boolean,
    default: false
  },
  members: {
    type: Number,
    default: 1
  },
  moderators: [
    {
      type: String,
      ref: 'User',
      refPath: 'username'
    }
  ],
  bannedUsers: [
    {
      type: String,
      ref: 'User',
      refPath: 'username'
    }
  ],
  mutedUsers: [
    {
      type: String,
      ref: 'User',
      refPath: 'username'
    }
  ],
  isDeleted: {
    type: Boolean,
    default: false
  },
  suggestedSort: {
    type: String,
    enum: ['Best', 'Old', 'Top', 'New'],
    default: 'Old'
  },
  rules: [
    {
      text: {
        type: String,
        required: true
      },
      appliesTo: {
        type: String,
        enum: ['Posts & comments', 'Posts only', 'Comments only'],
        default: 'Posts & comments'
      }
    }
  ]
}, {
  timestamps: true
})

module.exports = mongoose.model('Community', CommunitySchema)

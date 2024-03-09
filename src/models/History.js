const mongoose = require('mongoose')
const Schema = mongoose.Schema

const historySchema = new Schema({
  owner: {
    type: String,
    required: true,
    ref: 'User',
    refPath: 'username'
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('History', historySchema)

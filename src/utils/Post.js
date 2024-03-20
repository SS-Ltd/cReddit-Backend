const URL = require('url').URL

function isValidUrl (string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

const validatePost = (post) => {
  if (!post.type || !post.communityName || !post.title) {
    throw new Error('Post type, community name, and title are required')
  }

  if (!['Post', 'Images & Video', 'Link', 'Poll'].includes(post.type)) {
    throw new Error('Invalid type')
  }

  if (post.type === 'Images & Video') {
    if (!post.files || post.files.length === 0) {
      throw new Error('Images or video are required')
    }
    if (post.files.length > 10) {
      throw new Error('Maximum of 10 images or videos')
    }
    if (post.content) {
      post.unusedData = true
    }
  }

  if (post.type === 'Link' && !isValidUrl(post.content)) {
    throw new Error('Invalid URL')
  }

  if (post.type === 'Poll') {
    if (!Array.isArray(post.pollOptions)) {
      throw new Error('Poll options must be an array')
    }
    if (post.pollOptions.length < 2) {
      throw new Error('Poll options must have at least 2 options')
    }
    if (!post.expirationDate || new Date(post.expirationDate) < new Date()) {
      throw new Error('Invalid expiration date')
    }
  } else if (post.pollOptions || post.expirationDate) {
    post.pollOptions = []
    post.expirationDate = null
    post.unusedData = true
  }
}

module.exports = {
  validatePost
}

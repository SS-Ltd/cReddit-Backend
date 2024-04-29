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
  if (!post.type || !post.title) {
    throw new Error('Post type and title are required')
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

const validatePostAccordingToCommunitySettings = (post, community) => {
  if (!community.settings.allowSpoiler && post.isSpoiler) {
    post.isSpoiler = false
  }

  if (!community.settings.allowCrossPosting && post.child) {
    throw new Error('Crossposting is not allowed in this community')
  }

  if (community.moderators.includes(post.username)) {
    return
  }

  if (post.type !== 'Link' && community.settings.allowedPostTypes === 'Links') {
    throw new Error('Community only allows links')
  }

  if (post.type !== 'Post' && community.settings.allowedPostTypes === 'Posts') {
    throw new Error('Community only allows text posts')
  }

  if (post.type === 'Images & Video' && community.settings.allowImages === false) {
    throw new Error('Community does not allow images or videos')
  }

  if (post.type === 'Poll' && community.settings.allowPolls === false) {
    throw new Error('Community does not allow polls')
  }
}

const upvotePost = (post, user) => {
  const postId = post._id
  if (user.upvotedPosts.find(upvotedPost => upvotedPost.postId.equals(postId))) {
    post.upvote -= 1
    post.netVote -= 1
    user.upvotedPosts = user.upvotedPosts.filter(upvotedPost => !upvotedPost.postId.equals(postId))
  } else if (user.downvotedPosts.find(downvotedPost => downvotedPost.postId.equals(postId))) {
    post.upvote += 1
    post.downvote -= 1
    post.netVote += 2
    user.upvotedPosts.push({ postId, SavedAt: new Date() })
    user.downvotedPosts = user.downvotedPosts.filter(downvotedPost => !downvotedPost.postId.equals(postId))
  } else {
    post.upvote += 1
    post.netVote += 1
    user.upvotedPosts.push({ postId, SavedAt: new Date() })
  }
}

const downvotePost = (post, user) => {
  const postId = post._id
  if (user.downvotedPosts.find(downvotedPost => downvotedPost.postId.equals(postId))) {
    post.downvote -= 1
    post.netVote += 1
    user.downvotedPosts = user.downvotedPosts.filter(downvotedPost => !downvotedPost.postId.equals(postId))
  } else if (user.upvotedPosts.find(upvotedPost => upvotedPost.postId.equals(postId))) {
    post.upvote -= 1
    post.downvote += 1
    post.netVote -= 2
    user.downvotedPosts.push({ postId: postId, SavedAt: new Date() })
    user.upvotedPosts = user.upvotedPosts.filter(upvotedPost => !upvotedPost.postId.equals(postId))
  } else {
    post.downvote += 1
    post.netVote -= 1
    user.downvotedPosts.push({ postId, SavedAt: new Date() })
  }
}

const votePoll = (post, user, pollOption) => {
  if (post.type !== 'Poll') {
    throw new Error('Post is not a poll')
  }

  if (post.expirationDate < new Date()) {
    throw new Error('Poll has expired')
  }

  if (!post.pollOptions.find(option => option.text === pollOption)) {
    throw new Error('Invalid poll option')
  }

  if (post.pollOptions.find(option => option.voters.includes(user.username))) {
    throw new Error('User has already voted')
  }

  post.pollOptions = post.pollOptions.map(option => {
    if (option.text === pollOption) {
      option.voters.push(user.username)
    }
    return option
  })
}

module.exports = {
  validatePost,
  upvotePost,
  downvotePost,
  votePoll,
  validatePostAccordingToCommunitySettings
}

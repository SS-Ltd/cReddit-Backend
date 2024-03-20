const Post = require('../models/Post')
const cloudinary = require('../utils/Cloudinary')
const PostUtils = require('../utils/Post')

const createPost = async (req, res) => {
  const post = req.body
  post.files = req.files
  post.username = req.decoded.username

  try {
    PostUtils.validatePost(post)

    if (post.type === 'Images & Video') {
      const urls = []

      for (const file of req.files) {
        const b64 = Buffer.from(file.buffer).toString('base64')
        const dataURI = 'data:' + file.mimetype + ';base64,' + b64
        const { secure_url } = await cloudinary.uploader.upload(dataURI, {
          folder: 'cReddit',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'svg']
        })
        urls.push(secure_url)
      }
      post.content = urls.join(' ')
    }

    const createdPost = new Post({
      type: post.type,
      username: req.decoded.username,
      communityName: post.communityName,
      title: post.title,
      content: post.content || '',
      pollOptions: post.pollOptions?.map(option => ({ text: option, votes: 0 })) || [],
      expirationDate: post.expirationDate || null,
      isSpoiler: post.isSpoiler || false,
      isNSFW: post.isNSFW || false
    })

    await createdPost.save()
    res.status(201).json({ message: 'Post created successfully' + (post.unusedData ? ' while ignoring additional fields' : '') })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

module.exports = {
  createPost
}

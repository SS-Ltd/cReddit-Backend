const cloudinary = require('cloudinary').v2
require('dotenv').config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadImages = async (files) => {
  const urls = []

  for (const file of files) {
    const b64 = Buffer.from(file.buffer).toString('base64')
    const dataURI = 'data:' + file.mimetype + ';base64,' + b64
    const { secure_url } = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'auto',
      folder: 'cReddit',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'svg']
    })
    urls.push(secure_url)
  }

  return urls
}

const deleteImages = async (urls) => {
  const urlsToDelete = urls.filter(url => url.includes('res.cloudinary.com'))
  const publicIDs = urlsToDelete.map(url => {
    const matches = url.match(/(cReddit\/.+)\.(.+)/)
    if (!matches) {
      return null
    } else {
      return matches
    }
  })
  if (publicIDs.includes(null)) {
    throw new Error('Invalid image or video URLs found in post')
  }
  for (const publicID of publicIDs) {
    if (publicID[2] === 'mp4') {
      await cloudinary.uploader.destroy(publicID[1], { resource_type: 'video' })
    } else {
      await cloudinary.uploader.destroy(publicID[1])
    }
  }
}

module.exports = {
  cloudinary,
  uploadImages,
  deleteImages
}

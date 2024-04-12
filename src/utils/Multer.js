const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage })

const uploadMultipleImages = (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Error uploading file' })
    } else if (err) {
      return res.status(500).json({ message: 'Internal server error' })
    }
    next()
  })
}

const uploadAvatarBanner = (req, res, next) => {
  upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Error uploading file' })
    } else if (err) {
      return res.status(500).json({ message: 'Internal server error' })
    }
    next()
  })
}

module.exports = {
  uploadMultipleImages,
  uploadAvatarBanner
}

const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage })

const uploadMultipleImages = upload.array('images', 10)
const uploadAvatarBanner = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }])

module.exports = {
  uploadMultipleImages,
  uploadAvatarBanner
}

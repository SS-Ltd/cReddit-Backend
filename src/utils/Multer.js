const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage })

const uploadMultipleImages = upload.array('images', 10)

module.exports = {
  uploadMultipleImages
}

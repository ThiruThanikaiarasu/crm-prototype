const multer = require('multer')

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true)
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed!'), false)
    }
}

const upload = multer({
    storage,
    fileFilter
})

module.exports = upload
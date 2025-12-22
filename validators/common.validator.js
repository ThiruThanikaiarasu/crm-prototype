const { param } = require('express-validator')
const mongoose = require('mongoose')

const validateObjectIdParam = [
    param('id')
        .notEmpty()
        .withMessage('Lead id is required')
        .bail()
        .custom(value => mongoose.Types.ObjectId.isValid(value))
        .withMessage('Invalid lead id'),
]

module.exports = {
    validateObjectIdParam,
}

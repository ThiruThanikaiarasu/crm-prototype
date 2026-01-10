const { param } = require('express-validator')
const mongoose = require('mongoose')

const validateObjectIdParam = (urlParam) => {
    return [
        param(urlParam)
            .notEmpty()
            .withMessage(`${urlParam} is required`)
            .bail()
            .custom(value => mongoose.Types.ObjectId.isValid(value))
            .withMessage('Invalid lead id'),
    ]
}

module.exports = {
    validateObjectIdParam,
}

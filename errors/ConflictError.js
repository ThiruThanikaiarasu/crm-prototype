class ConflictError extends Error {
    constructor(statusCode, message, errorCode, errorType) {
        super(
            message,
            statusCode,
            errorCode,
            errorType
        )

        this.statusCode = statusCode,
        this.message = message,
        this.errorCode = errorCode,
        this.errorType = errorType

    }
}

module.exports = ConflictError

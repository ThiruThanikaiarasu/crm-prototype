class UploadError extends Error {
    constructor(message = "Failed to upload image. Please try again later.", statusCode = 503) {
        super(
            message,
            statusCode,
            errorType,
            errorCode,

        )
        this.name = "Upload Error",
        this.statusCode = statusCode
    }
}

module.exports = UploadError
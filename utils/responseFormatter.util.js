const setResponseBody = (message,errorCode = "0000", error, data) => {
    return {
        message,
        errorCode,
        error,
        data,
    }
}

module.exports = {
    setResponseBody,
}

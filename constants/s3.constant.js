const S3_BASE_URL = `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/`

module.exports = {
    S3_BASE_URL
}
const { default: mongoose } = require('mongoose')

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       required:
 *         - tenantId
 *         - domain
 *       properties:
 *         title:
 *           type: string
 *           description: The organization's title
 *         tenantId:
 *           type: string
 *           description: The unique tenant identifier
 *         domain:
 *           type: string
 *           description: The organization's domain
 *       example:
 *         title: Acme Corp
 *         tenantId: acme
 *         domain: acme.com
 */
const organizationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
        },
        tenantId: {
            type: String,
            required: [true, 'Tenant Id is a mandatory field'],
        },
        domain: {
            type: String,
            required: [true, 'Domain is a mandatory field'],
        },
    },
    {
        timestamps: true,
        collection: 'organizations',
    },
)

module.exports = mongoose.model('organizations', organizationSchema)

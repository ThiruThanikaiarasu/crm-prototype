// Routes


// Models

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
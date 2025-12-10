// Routes

/**
 * @swagger
 * /organizations/verify:
 *   post:
 *     summary: Verify if an organization exists based on email domain
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email used to extract domain for verification
 *                 example: "john.doe@acme.com"
 *
 *     responses:
 *       200:
 *         description: Organization verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               oneOf:
 *                 - properties:
 *                     message:
 *                       type: string
 *                       example: "Organization already exists"
 *                     errorCode:
 *                       type: string
 *                       example: "4102"
 *                     error:
 *                       type: string
 *                       example: "organization_exists"
 *                     data:
 *                       nullable: true
 *                       example: null
 *
 *                 - properties:
 *                     message:
 *                       type: string
 *                       example: "Organization verification result"
 *                     errorCode:
 *                       nullable: true
 *                       example: null
 *                     error:
 *                       type: string
 *                       example: "0000"
 *                     data:
 *                       type: object
 *                       properties:
 *                         organizationExists:
 *                           type: boolean
 *                           example: false
 *
 *       400:
 *         description: Validation error — missing or invalid input
 *         content:
 *           application/json:
 *             examples:
 *               MissingEmail:
 *                 summary: Email missing
 *                 value:
 *                   message: "Please fill mandatory field"
 *                   errorCode: "1001"
 *                   error: "validation_error"
 *                   data: null
 *               InvalidEmail:
 *                 summary: Email is not valid
 *                 value:
 *                   message: "Please provide a valid email address"
 *                   errorCode: "1001"
 *                   error: "validation_error"
 *                   data: null
 *       422:
 *         description: Unable to verify email — DNS or domain issues
 *         content:
 *           application/json:
 *             example:
 *               message: "Unable to verify this email address. Please provide a valid one."
 *               errorCode: "1101"
 *               error: "validation_error"
 *               data: null
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Corresponding error message"
 *               errorCode: "5001"
 *               error: "server_error"
 *               data: null
 */

/**
 * @swagger
 * /organizations:
 *   post:
 *     summary: Create a new organization and its admin user
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Organization title
 *                 example: "Acme Corporation"
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 25
 *                 description: Admin's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 25
 *                 description: Admin's last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email
 *                 example: "john.doe@acme.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 25
 *                 description: Admin password
 *                 example: "StrongPass123"
  *               invitedUser:
 *                 type: array
 *                 description: Array of email addresses to invite to the organization
 *                 items:
 *                   type: string
 *                   format: email
 *                   example: "employee1@acme.com"
 *                 example:
 *                   - "employee1@acme.com"
 *                   - "employee2@acme.com"
 *
 *     responses:
 *       201:
 *         description: Organization created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Organization created successfully"
 *               errorCode: "0101"
 *               error: null
 *               data:
 *                 title: "Acme Corporation"
 *                 tenantId: "acme_corp"
 *                 domain: "acme.com"
 *                 admin: "65b3c44de4f72b2bdb4e91b3"
 *                 createdAt: "2025-01-15T12:45:32.123Z"
 *       400:
 *         description: Validation error — one or more fields are invalid
 *         content:
 *           application/json:
 *             examples:
 *               MissingTitle:
 *                 summary: Missing organization title
 *                 value:
 *                   message: "Title is a mandatory field"
 *                   errorCode: "1001"
 *                   error: "validation_error"
 *                   data: null
 *
 *               InvalidEmail:
 *                 summary: Invalid email address
 *                 value:
 *                   message: "Please provide a valid email address"
 *                   errorCode: "1001"
 *                   error: "validation_error"
 *                   data: null
 *
 *               ShortPassword:
 *                 summary: Password too short
 *                 value:
 *                   message: "Password must be between 8 and 25 characters"
 *                   errorCode: "1001"
 *                   error: "validation_error"
 *                   data: null
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Corresponding error message"
 *               errorCode: "5001"
 *               error: "server_error"
 *               data: null
 */

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
 *         - admin
 *       properties:
 *         title:
 *           type: string
 *           description: The name/title of the organization
 *           example: "Acme Corporation"
 *
 *         tenantId:
 *           type: string
 *           description: Unique tenant identifier for the organization
 *           example: "acme_corp"
 *
 *         domain:
 *           type: string
 *           description: Domain associated with the organization
 *           example: "acme.com"
 */

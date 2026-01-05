// // Routes

/**
 * @swagger
 * /organization/invite/status:
 *   get:
 *     summary: Check invite eligibility for a user
 *     description: |
 *       Checks whether a user with the given email can be invited to the organization.
 *       Returns the invite status along with additional user details if the user already exists.
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *           example: "thiru9@gmail.com"
 *         description: Email address to check invite status
 *
 *     responses:
 *       200:
 *         description: Invite status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invite status retrieved successfully"
 *                 errorCode:
 *                   nullable: true
 *                   example: null
 *                 error:
 *                   type: string
 *                   example: "0000"
 *                 data:
 *                   oneOf:
 *                     - type: object
 *                       title: User already exists
 *                       properties:
 *                         canInvite:
 *                           type: boolean
 *                           example: false
 *                         reason:
 *                           type: string
 *                           example: "User already exists in organization"
 *                         status:
 *                           type: string
 *                           example: "exists"
 *                         user:
 *                           type: object
 *                           properties:
 *                             email:
 *                               type: string
 *                               example: "thiru9@gmail.com"
 *                             firstName:
 *                               type: string
 *                               example: "Thiru"
 *                             lastName:
 *                               type: string
 *                               example: "T"
 *                             role:
 *                               type: string
 *                               example: "super_admin"
 *
 *                     - type: object
 *                       title: User can be invited
 *                       properties:
 *                         canInvite:
 *                           type: boolean
 *                           example: true
 *                         reason:
 *                           type: string
 *                           example: "User can be invited"
 *                         status:
 *                           type: string
 *                           example: "not_invited"
 *
 *             examples:
 *               UserExists:
 *                 summary: User already exists in organization
 *                 value:
 *                   message: "Invite status retrieved successfully"
 *                   errorCode: null
 *                   error: "0000"
 *                   data:
 *                     canInvite: false
 *                     reason: "User already exists in organization"
 *                     status: "exists"
 *                     user:
 *                       email: "thiru9@gmail.com"
 *                       firstName: "Thiru"
 *                       lastName: "T"
 *                       role: "super_admin"
 *
 *               CanInvite:
 *                 summary: User can be invited
 *                 value:
 *                   message: "Invite status retrieved successfully"
 *                   errorCode: null
 *                   error: "0000"
 *                   data:
 *                     canInvite: true
 *                     reason: "User can be invited"
 *                     status: "not_invited"
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               message: "Please provide a valid email address"
 *               errorCode: "1001"
 *               error: "validation_error"
 *               data: null
 *
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             examples:
 *               TokenExpired:
 *                 value:
 *                   message: "Session Expired"
 *                   errorCode: "2003"
 *                   error: "token_expired"
 *                   data: null
 *               AuthenticationError:
 *                 value:
 *                   message: "Session Expired"
 *                   errorCode: "2010"
 *                   error: "authentication_error"
 *                   data: null
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal Server Error"
 *               errorCode: "5001"
 *               error: "server_error"
 *               data: null
 */

/**
 * @swagger
 * /organization/members:
 *   get:
 *     summary: Get all organization members
 *     description: Retrieve the list of all members belonging to the organization.
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Members retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Members retrieved successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 members:
 *                   - _id: "69217605dbb69021bc8d12d5"
 *                     firstName: "Thiru"
 *                     lastName: "T"
 *                     email: "thiru@gmail.com"
 *                     role: "super_admin"
 *                     createdAt: "2025-11-22T08:36:21.974Z"
 *                     updatedAt: "2025-11-22T08:36:21.974Z"
 *                     __v: 0
 *                   - _id: "69217deafadabbc00724bebd"
 *                     firstName: "Thiru"
 *                     lastName: "T"
 *                     email: "thiru4@gmail.com"
 *                     role: "admin"
 *                     createdAt: "2025-11-22T09:10:02.764Z"
 *                     updatedAt: "2025-11-22T09:10:02.764Z"
 *                     __v: 0
 *                   - _id: "69217ce444bd86cfef120bd6"
 *                     firstName: "Thiru"
 *                     lastName: "T"
 *                     email: "thiru3@gmail.com"
 *                     role: "employee"
 *                     createdAt: "2025-11-22T09:05:40.642Z"
 *                     updatedAt: "2025-11-22T09:05:40.642Z"
 *                     __v: 0
 *                 count: 32
 *
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             examples:
 *               TokenExpired:
 *                 value:
 *                   message: "Session Expired"
 *                   errorCode: "2003"
 *                   error: "token_expired"
 *                   data: null
 *               AuthenticationError:
 *                 value:
 *                   message: "Session Expired"
 *                   errorCode: "2010"
 *                   error: "authentication_error"
 *                   data: null
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal Server Error"
 *               errorCode: "5001"
 *               error: "server_error"
 *               data: null
 */


/**
 * @swagger
 * /organization/invite/validate:
 *   get:
 *     summary: Validate organization invite token
 *     description: Validate whether an invite token is present, valid, and not expired.
 *     tags: [Organization]
 *
 *     parameters:
 *       - in: query
 *         name: token
 *         required: false
 *         description: Invite token sent to the user's email
 *         schema:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     responses:
 *       200:
 *         description: Invite token is valid
 *         content:
 *           application/json:
 *             example:
 *               message: "Invite token is valid"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 email: "thiruarasurani@gmail.com"
 *                 tenantId: "abcd"
 *                 role: "admin"
 *
 *       400:
 *         description: Invite token missing
 *         content:
 *           application/json:
 *             example:
 *               message: "Invite token is required"
 *               errorCode: "1001"
 *               error: "validation_error"
 *               data: null
 *
 *       401:
 *         description: Invalid or expired invite token
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid or expired invite token"
 *               errorCode: "INVALID_TOKEN"
 *               error: "invalid_token"
 *               data:
 *                 error: "invalid token"
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal Server Error"
 *               errorCode: "5001"
 *               error: "server_error"
 *               data: null
 */

/**
 * @swagger
 * /organization/invite:
 *   post:
 *     summary: Invite members to the organization
 *     description: |
 *       Send invitation emails to users to join the organization.
 *       This action can be performed **only by a Super Admin**.
 *     tags: [Organization]
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
 *               - members
 *             properties:
 *               members:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - email
 *                     - role
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "thiruarasurani@gmail.com"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *
 *     responses:
 *       200:
 *         description: Invitations processed successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Invitations sent successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 success:
 *                   - email: "thiruarasurani@gmail.com"
 *                     role: "admin"
 *                     inviteId: "695be02798f15c52f3dcada9"
 *                 failed: []
 *                 alreadyInvited:
 *                   - email: "bala@gmail.com"
 *                     role: "admin"
 *                     reason: "Invite already sent and pending"
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               message: "Members array is required"
 *               errorCode: "1001"
 *               error: "validation_error"
 *               data: null
 *
 *       403:
 *         description: Forbidden — only Super Admin can invite users
 *         content:
 *           application/json:
 *             example:
 *               message: "You don’t have access to this resource"
 *               errorCode: "3001"
 *               error: "authorization_error"
 *               data: null
 *
 *       401:
 *         description: Unauthorized — token missing, expired, or invalid
 *         content:
 *           application/json:
 *             examples:
 *               TokenExpired:
 *                 value:
 *                   message: "Session Expired"
 *                   errorCode: "2003"
 *                   error: "token_expired"
 *                   data: null
 *               AuthenticationError:
 *                 value:
 *                   message: "Session Expired"
 *                   errorCode: "2010"
 *                   error: "authentication_error"
 *                   data: null
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal Server Error"
 *               errorCode: "5001"
 *               error: "server_error"
 *               data: null
 */



// /**
//  * @swagger
//  * /organizations/verify:
//  *   post:
//  *     summary: Verify if an organization exists based on email domain
//  *     tags: [Organizations]
//  *     security:
//  *       - bearerAuth: []
//  *
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 format: email
//  *                 description: Email used to extract domain for verification
//  *                 example: "john.doe@acme.com"
//  *
//  *     responses:
//  *       200:
//  *         description: Organization verification result
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               oneOf:
//  *                 - properties:
//  *                     message:
//  *                       type: string
//  *                       example: "Organization already exists"
//  *                     errorCode:
//  *                       type: string
//  *                       example: "4102"
//  *                     error:
//  *                       type: string
//  *                       example: "organization_exists"
//  *                     data:
//  *                       nullable: true
//  *                       example: null
//  *
//  *                 - properties:
//  *                     message:
//  *                       type: string
//  *                       example: "Organization verification result"
//  *                     errorCode:
//  *                       nullable: true
//  *                       example: null
//  *                     error:
//  *                       type: string
//  *                       example: "0000"
//  *                     data:
//  *                       type: object
//  *                       properties:
//  *                         organizationExists:
//  *                           type: boolean
//  *                           example: false
//  *
//  *       400:
//  *         description: Validation error — missing or invalid input
//  *         content:
//  *           application/json:
//  *             examples:
//  *               MissingEmail:
//  *                 summary: Email missing
//  *                 value:
//  *                   message: "Please fill mandatory field"
//  *                   errorCode: "1001"
//  *                   error: "validation_error"
//  *                   data: null
//  *               InvalidEmail:
//  *                 summary: Email is not valid
//  *                 value:
//  *                   message: "Please provide a valid email address"
//  *                   errorCode: "1001"
//  *                   error: "validation_error"
//  *                   data: null
//  *       422:
//  *         description: Unable to verify email — DNS or domain issues
//  *         content:
//  *           application/json:
//  *             example:
//  *               message: "Unable to verify this email address. Please provide a valid one."
//  *               errorCode: "1101"
//  *               error: "validation_error"
//  *               data: null
//  *
//  *       500:
//  *         description: Internal server error
//  *         content:
//  *           application/json:
//  *             example:
//  *               message: "Corresponding error message"
//  *               errorCode: "5001"
//  *               error: "server_error"
//  *               data: null
//  */

// /**
//  * @swagger
//  * /organizations:
//  *   post:
//  *     summary: Create a new organization and its admin user
//  *     tags: [Organizations]
//  *     security:
//  *       - bearerAuth: []
//  *
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - title
//  *               - firstName
//  *               - lastName
//  *               - email
//  *               - password
//  *             properties:
//  *               title:
//  *                 type: string
//  *                 minLength: 2
//  *                 maxLength: 50
//  *                 description: Organization title
//  *                 example: "Acme Corporation"
//  *               firstName:
//  *                 type: string
//  *                 minLength: 2
//  *                 maxLength: 25
//  *                 description: Admin's first name
//  *                 example: "John"
//  *               lastName:
//  *                 type: string
//  *                 minLength: 1
//  *                 maxLength: 25
//  *                 description: Admin's last name
//  *                 example: "Doe"
//  *               email:
//  *                 type: string
//  *                 format: email
//  *                 description: Admin email
//  *                 example: "john.doe@acme.com"
//  *               password:
//  *                 type: string
//  *                 minLength: 8
//  *                 maxLength: 25
//  *                 description: Admin password
//  *                 example: "StrongPass123"
//   *               invitedUser:
//  *                 type: array
//  *                 description: Array of email addresses to invite to the organization
//  *                 items:
//  *                   type: string
//  *                   format: email
//  *                   example: "employee1@acme.com"
//  *                 example:
//  *                   - "employee1@acme.com"
//  *                   - "employee2@acme.com"
//  *
//  *     responses:
//  *       201:
//  *         description: Organization created successfully
//  *         content:
//  *           application/json:
//  *             example:
//  *               message: "Organization created successfully"
//  *               errorCode: "0101"
//  *               error: null
//  *               data:
//  *                 title: "Acme Corporation"
//  *                 tenantId: "acme_corp"
//  *                 domain: "acme.com"
//  *                 admin: "65b3c44de4f72b2bdb4e91b3"
//  *                 createdAt: "2025-01-15T12:45:32.123Z"
//  *       400:
//  *         description: Validation error — one or more fields are invalid
//  *         content:
//  *           application/json:
//  *             examples:
//  *               MissingTitle:
//  *                 summary: Missing organization title
//  *                 value:
//  *                   message: "Title is a mandatory field"
//  *                   errorCode: "1001"
//  *                   error: "validation_error"
//  *                   data: null
//  *
//  *               InvalidEmail:
//  *                 summary: Invalid email address
//  *                 value:
//  *                   message: "Please provide a valid email address"
//  *                   errorCode: "1001"
//  *                   error: "validation_error"
//  *                   data: null
//  *
//  *               ShortPassword:
//  *                 summary: Password too short
//  *                 value:
//  *                   message: "Password must be between 8 and 25 characters"
//  *                   errorCode: "1001"
//  *                   error: "validation_error"
//  *                   data: null
//  *       500:
//  *         description: Internal server error
//  *         content:
//  *           application/json:
//  *             example:
//  *               message: "Corresponding error message"
//  *               errorCode: "5001"
//  *               error: "server_error"
//  *               data: null
//  */

// // Models

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     Organization:
//  *       type: object
//  *       required:
//  *         - tenantId
//  *         - domain
//  *         - admin
//  *       properties:
//  *         title:
//  *           type: string
//  *           description: The name/title of the organization
//  *           example: "Acme Corporation"
//  *
//  *         tenantId:
//  *           type: string
//  *           description: Unique tenant identifier for the organization
//  *           example: "acme_corp"
//  *
//  *         domain:
//  *           type: string
//  *           description: Domain associated with the organization
//  *           example: "acme.com"
//  */

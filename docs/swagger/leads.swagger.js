// Routes

/**
 * @swagger
 * /leads:
 *   post:
 *     summary: Create a new lead
 *     tags: [Leads]
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
 *               - company
 *               - contact
 *               - email
 *             properties:
 *               company:
 *                 type: string
 *                 description: Company name
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Acme Industries"
 *               contact:
 *                 type: string
 *                 description: Contact person's name
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *                 example: "johndoe@acme.com"
 *               phone:
 *                 type: object
 *                 description: Phone details
 *                 properties:
 *                   extension:
 *                     type: string
 *                     description: Country/area extension
 *                     maxLength: 5
 *                     example: "+91"
 *                   number:
 *                     type: string
 *                     minLength: 8
 *                     maxLength: 15
 *                     description: Phone number
 *                     example: "9876543210"
 *               status:
 *                 type: string
 *                 enum: [new, qualified, contacted, done]
 *                 description: Lead status
 *                 default: new
 *                 example: "new"
 *               source:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Source of lead
 *                 example: "LinkedIn"
 *               followUp:
 *                 type: string
 *                 format: date-time
 *                 description: Follow-up date
 *                 example: "2025-12-06T16:29:34.099Z"
 *               owner:
 *                 type: string
 *                 description: Lead owner id
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *
 *     responses:
 *       201:
 *         description: Lead created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lead created successfully"
 *                 errorCode:
 *                   type: string
 *                   example: "2010"
 *                 error:
 *                   type: string
 *                   example: null
 *                 data:
 *                   type: object
 *                   example:
 *                     company: "Acme Industries"
 *                     contact: "John Doe"
 *                     email: "johndoe@acme.com"
 *                     phone:
 *                       extension: "+91"
 *                       number: "9876543210"
 *                     status: "new"
 *                     source: "LinkedIn"
 *                     followUp: "2025-12-06T16:29:34.099Z"
 *                     owner: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *
 *
 *       400:
 *         description: Validation error — one or more fields are invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Appropriate message will be returned
 *                 errorCode:
 *                   type: string
 *                   example: "1001"
 *                 error:
 *                   type: string
 *                   example: "validation_error"
 *                 data:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *
 *             examples:
 *               MissingMandatoryField:
 *                 summary: Missing required input
 *                 value:
 *                   message: Appropriate message will be returned
 *                   errorCode: "1001"
 *                   error: "validation_error"
 *                   data: null
 *
 *               InvalidEmail:
 *                 summary: Invalid email format
 *                 value:
 *                   message: "Please provide a valid email address"
 *                   errorCode: "1001"
 *                   error: "validation_error"
 *                   data: null
 *
 *
 *       401:
 *         description: Unauthorized — token missing, expired, or invalid
 *         content:
 *           application/json:
 *             examples:
 *               TokenExpired:
 *                 summary: Token expired
 *                 value:
 *                   message: "Session Expired"
 *                   errorCode: "2003"
 *                   error: "token_expired"
 *                   data: null
 *
 *               AuthenticationError:
 *                 summary: Invalid or missing token
 *                 value:
 *                   message: "Session Expired"
 *                   errorCode: "2010"
 *                   error: "authentication_error"
 *                   data: null
 *
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Appropriate error message will be returned"
 *               errorCode: "5001"
 *               error: "server_error"
 *               data: null
 */


/**
 * @swagger
 * /leads:
 *   get:
 *     summary: Get all leads with pagination, filtering, and sorting
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Filter by company name (partial match)
 *       - in: query
 *         name: contact
 *         schema:
 *           type: string
 *         description: Filter by contact name (partial match)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, qualified, contacted, done]
 *         description: Filter by status
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter by source (partial match)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: followUp
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by follow-up date (YYYY-MM-DD or ISO date-time)
 *
 *     responses:
 *       200:
 *         description: Leads fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Leads fetched successfully"
 *                 errorCode:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 error:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 data:
 *                   type: object
 *                   properties:
 *                     leads:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           company:
 *                             type: string
 *                             example: "Acme Industries"
 *                           contact:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "johndoe@acme.com"
 *                           phone:
 *                             type: object
 *                             properties:
 *                               extension:
 *                                 type: string
 *                                 example: "+91"
 *                               number:
 *                                 type: string
 *                                 example: "9876543210"
 *                           status:
 *                             type: string
 *                             example: "new"
 *                           source:
 *                             type: string
 *                             example: "LinkedIn"
 *                           followUp:
 *                             type: string
 *                             example: "2025-12-06T16:29:34.099Z"
 *                           owner:
 *                             type: string
 *                             example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                     info:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 50
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         hasMoreRecords:
 *                           type: boolean
 *                           example: true
 *
 *
 *       401:
 *         description: Unauthorized — token missing, expired, or invalid
 *         content:
 *           application/json:
 *             examples:
 *               TokenExpired:
 *                 summary: Token expired
 *                 value:
 *                   message: "Session Expired"
 *                   errorCode: "2003"
 *                   error: "token_expired"
 *                   data: null
 *               AuthenticationError:
 *                 summary: Invalid or missing token
 *                 value:
 *                   message: "Session Expired"
 *                   errorCode: "2010"
 *                   error: "authentication_error"
 *                   data: null
 *
 *
 *       500:
 *         description: Server error
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
 * /leads/{id}:
 *   get:
 *     summary: Get a lead by ID
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Lead ID
 *         schema:
 *           type: string
 *           example: "65c1f3a2e9a34c0012ab1234"
 *
 *     responses:
 *       200:
 *         description: Lead fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Lead fetched successfully"
 *               errorCode: null
 *               error: null
 *               data:
 *                 company: "Acme Industries"
 *                 contact: "John Doe"
 *                 email: "john.doe@acme.com"
 *                 status: "new"
 *                 source: "LinkedIn"
 *                 owner: "65b3c44de4f72b2bdb4e91b3"
 *
 *       400:
 *         description: Invalid request parameter
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid lead id"
 *               errorCode: "1001"
 *               error: "validation_error"
 *               data: null
 *
 *
 *       404:
 *         description: Lead not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Lead not found"
 *               errorCode: "4201"
 *               error: "not_found"
 *               data: null
 *
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
 * /leads/{id}:
 *   patch:
 *     summary: Update a lead by ID
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Lead ID
 *         schema:
 *           type: string
 *           example: "65c1f3a2e9a34c0012ab1234"
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 type: string
 *                 example: "Updated Company Name"
 *               contact:
 *                 type: string
 *                 example: "Updated Contact"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "updated.email@acme.com"
 *               status:
 *                 type: string
 *                 enum: [new, qualified, contacted, done]
 *                 example: "qualified"
 *               source:
 *                 type: string
 *                 example: "Website"
 *
 *
 *     responses:
 *       200:
 *         description: Lead updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Lead updated successfully"
 *               errorCode: null
 *               error: null
 *               data:
 *                 company: "Updated Company Name"
 *                 contact: "Updated Contact"
 *                 email: "updated.email@acme.com"
 *                 status: "qualified"
 *
 *       400:
 *         description: Invalid request parameter
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid lead id"
 *               errorCode: "1001"
 *               error: "validation_error"
 *               data: null
 *
 *       404:
 *         description: Lead not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Lead not found"
 *               errorCode: "LEAD_NOT_FOUND"
 *               error: "not_found"
 *               data: null
 *
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
 * /leads/{id}:
 *   delete:
 *     summary: Delete a lead by ID
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Lead ID
 *         schema:
 *           type: string
 *           example: "65c1f3a2e9a34c0012ab1234"
 *
 *     responses:
 *       200:
 *         description: Lead deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Lead deleted successfully"
 *               errorCode: null
 *               error: null
 *               data: null
 *
 *       400:
 *         description: Invalid request parameter
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid lead id"
 *               errorCode: "1001"
 *               error: "validation_error"
 *               data: null
 *
 *       403:
 *         description: Forbidden — insufficient permissions
 *         content:
 *           application/json:
 *             example:
 *               message: "You don’t have access to this resource"
 *               errorCode: "3001"
 *               error: "authorization_error"
 *               data: null
 *
 *       404:
 *         description: Lead not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Lead not found"
 *               errorCode: "LEAD_NOT_FOUND"
 *               error: "not_found"
 *               data: null
 *
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

// Models

/**
 * @swagger
 * components:
 *   schemas:
 *     Lead:
 *       type: object
 *       required:
 *         - company
 *         - contact
 *         - email
 *       properties:
 *         company:
 *           type: string
 *           description: The company name
 *           minLength: 2
 *           maxLength: 100
 *         contact:
 *           type: string
 *           description: The contact person's name
 *           minLength: 2
 *           maxLength: 50
 *         email:
 *           type: string
 *           description: Contact email address
 *           format: email
 *         phone:
 *           type: object
 *           properties:
 *             extension:
 *               type: string
 *               description: Phone extension (e.g. +1)
 *               maxLength: 5
 *             number:
 *               type: string
 *               description: Phone number
 *               minLength: 8
 *               maxLength: 15
 *         status:
 *           type: string
 *           enum: [new, qualified, contacted, done]
 *           description: Lead status
 *           default: new
 *         source:
 *           type: string
 *           description: Source of the lead
 *           minLength: 2
 *           maxLength: 50
 *         followUp:
 *           type: string
 *           format: date-time
 *           description: Follow-up date
 *         owner:
 *           type: string
 *           format: uuid
 *           description: ID of the user who owns this lead
 */

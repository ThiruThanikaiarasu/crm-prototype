// Routes

/**
 * @swagger
 * /leads:
 *   post:
 *     summary: Create a new lead with company and contacts
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
 *               - leads
 *             properties:
 *               company:
 *                 type: object
 *                 required:
 *                   - name
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Tech Solutions Inc"
 *                   phone:
 *                     type: object
 *                     properties:
 *                       extension:
 *                         type: string
 *                         example: "+1"
 *                       number:
 *                         type: string
 *                         example: "5551234567"
 *                   website:
 *                     type: string
 *                     example: "https://techsolutions.com"
 *                   socialProfile:
 *                     type: string
 *                     example: "https://linkedin.com/company/techsolutions"
 *
 *               leads:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - email
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "John Smith"
 *                     phone:
 *                       type: object
 *                       properties:
 *                         extension:
 *                           type: string
 *                           example: "+1"
 *                         number:
 *                           type: string
 *                           example: "5559876543"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john.smith@gmail.com"
 *                     status:
 *                       type: string
 *                       enum: [new, qualified, contacted, done]
 *                       example: "qualified"
 *                     source:
 *                       type: string
 *                       example: "referral"
 *                     followUp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-28T14:30:00.000Z"
 *                     priority:
 *                       type: integer
 *                       example: 0
 *
 *     responses:
 *       201:
 *         description: Lead created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Lead created successfully"
 *               errorCode: "0201"
 *               error: null
 *               data:
 *                 company:
 *                   _id: "695b1208d65f7e7ded4eb800"
 *                   name: "Tech Solutions Inc"
 *                   phone:
 *                     extension: "+1"
 *                     number: "5551234567"
 *                   website: "https://techsolutions.com"
 *                   socialProfile: "https://linkedin.com/company/techsolutions"
 *                   createdAt: "2025-12-19T08:55:36.946Z"
 *                   updatedAt: "2025-12-19T08:55:36.946Z"
 *                 leads:
 *                   - _id: "695b1308d65f7e7ded4eb900"
 *                     company: "695b1208d65f7e7ded4eb800"
 *                     name: "John Smith"
 *                     email: "john.smith@gmail.com"
 *                     phone:
 *                       extension: "+1"
 *                       number: "5559876543"
 *                     status: "qualified"
 *                     source: "referral"
 *                     followUp: "2025-12-28T14:30:00.000Z"
 *                     priority: 0
 *                     createdAt: "2025-12-19T08:55:36.946Z"
 *                     updatedAt: "2025-12-19T08:55:36.946Z"
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               message: "Company name is required"
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
 *       409:
 *         description: Conflict — company or contact already exists
 *         content:
 *           application/json:
 *             examples:
 *               CompanyAlreadyExists:
 *                 value:
 *                   message: "Company already exists"
 *                   errorCode: "4402"
 *                   error: "conflict"
 *                   data: null
 *               ContactAlreadyExists:
 *                 value:
 *                   message: "Contact already exists"
 *                   errorCode: "4502"
 *                   error: "conflict"
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
 * /leads:
 *   get:
 *     summary: Get all leads grouped by company
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, qualified, contacted, done]
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: followUp
 *         schema:
 *           type: string
 *           format: date
 *
 *     responses:
 *       200:
 *         description: Leads fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Leads fetched successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 leads:
 *                   - company:
 *                       _id: "694fec0c231a3da53bdd1997"
 *                       name: "Tech Solutions Inc"
 *                       website: "https://techsolutions.com"
 *                       phone:
 *                         extension: "+1"
 *                         number: "5551234567"
 *                       email: "support@techsolutions.com"
 *                       socialProfile: "https://linkedin.com/company/techsolutions"
 *                       createdAt: "2025-12-27T14:24:12.499Z"
 *                       updatedAt: "2025-12-28T20:05:26.952Z"
 *
 *                     leads:
 *                       - _id: "694fec0d231a3da53bdd19a1"
 *                         company: "694fec0c231a3da53bdd1997"
 *                         name: "John Smith"
 *                         email: "john.smith@gmail.com"
 *                         phone:
 *                           extension: "+1"
 *                           number: "5559876543"
 *                         status: "qualified"
 *                         source: "referral"
 *                         followUp: "2025-12-28T14:30:00.000Z"
 *                         priority: 1
 *                         createdAt: "2025-12-27T14:24:13.610Z"
 *                         updatedAt: "2025-12-27T14:24:13.610Z"
 *
 *                       - _id: "694fec0d231a3da53bdd19a2"
 *                         company: "694fec0c231a3da53bdd1997"
 *                         name: "Sarah Johnson"
 *                         email: "sarah.johnson@gmail.com"
 *                         phone:
 *                           extension: "+1"
 *                           number: "5558887777"
 *                         status: "new"
 *                         source: "website"
 *                         followUp: "2025-12-30T20:00:00.000Z"
 *                         priority: 2
 *                         createdAt: "2025-12-27T14:24:13.611Z"
 *                         updatedAt: "2025-12-28T20:05:27.230Z"
 *
 *                 info:
 *                   total: 8
 *                   page: 1
 *                   limit: 10
 *                   totalPages: 1
 *                   hasMoreRecords: false
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
 *     summary: Get a lead by ID with company context
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
 *           example: "694fe95c0d56b0e31babcf66"
 *
 *     responses:
 *       200:
 *         description: Lead fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Lead fetched successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 _id: "694fe95c0d56b0e31babcf66"
 *                 name: "John Michael Smith"
 *                 email: "jm.smith@gmail.com"
 *                 phone:
 *                   extension: "+1"
 *                   number: "5556666666"
 *                 status: "contacted"
 *                 source: "cold_call"
 *                 followUp: "2025-12-29T16:30:00.000Z"
 *                 priority: 1
 *                 createdAt: "2025-12-27T14:12:44.093Z"
 *                 updatedAt: "2025-12-27T17:40:39.471Z"
 *
 *                 company:
 *                   _id: "694fe95a0d56b0e31babcf5f"
 *                   name: "Tech Solutions Corp"
 *                   website: "https://techsolutionscorp.com"
 *                   email: "support@cybermindworks.com"
 *                   phone:
 *                     extension: "+1"
 *                     number: "5557777777"
 *                   socialProfile: "https://linkedin.com/company/techsolutionscorp"
 *                   createdAt: "2025-12-27T14:12:42.946Z"
 *                   updatedAt: "2025-12-27T17:40:38.925Z"
 *
 *                   leads:
 *
 *                     - _id: "694fe95c0d56b0e31babcf67"
 *                       name: "Brien Austin"
 *                       email: "brienaustin@cybermindworks.com"
 *                       phone:
 *                         extension: "+91"
 *                         number: "9875886325"
 *                       status: "contacted"
 *                       source: "linkedIn"
 *                       followUp: "2026-01-16T00:00:00.000Z"
 *                       createdAt: "2025-12-27T14:12:44.093Z"
 *                       updatedAt: "2025-12-27T14:12:44.093Z"
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
 *               errorCode: "4201"
 *               error: "not_found"
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
 *               name:
 *                 type: string
 *                 example: "Updated Name"
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
 *                 _id: "694fe95c0d56b0e31babcf66"
 *                 name: "Updated Name"
 *                 email: "updated.email@acme.com"
 *                 phone:
 *                   extension: "+1"
 *                   number: "5556666666"
 *                 status: "qualified"
 *                 source: "Website"
 *                 followUp: "2025-12-29T16:30:00.000Z"
 *                 priority: 1
 *                 createdAt: "2025-12-27T14:12:44.093Z"
 *                 updatedAt: "2025-12-27T17:40:39.471Z"
 *
 *                 company:
 *                   _id: "694fe95a0d56b0e31babcf5f"
 *                   name: "Updated Company Name"
 *                   website: "https://techsolutionscorp.com"
 *                   email: "support@cybermindworks.com"
 *                   phone:
 *                     extension: "+1"
 *                     number: "5557777777"
 *                   socialProfile: "https://linkedin.com/company/techsolutionscorp"
 *                   createdAt: "2025-12-27T14:12:42.946Z"
 *                   updatedAt: "2025-12-27T17:40:38.925Z"
 *
 *                   leads:
 *                     - _id: "694fe95c0d56b0e31babcf67"
 *                       name: "Brien Austin"
 *                       email: "brienaustin@cybermindworks.com"
 *                       phone:
 *                         extension: "+91"
 *                         number: "9875886325"
 *                       status: "contacted"
 *                       source: "linkedIn"
 *                       followUp: "2026-01-16T00:00:00.000Z"
 *                       priority: 1
 *                       createdAt: "2025-12-27T14:12:44.093Z"
 *                       updatedAt: "2025-12-27T14:12:44.093Z"
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

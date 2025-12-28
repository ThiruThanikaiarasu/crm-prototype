/**
 * @swagger
 * components:
 *   schemas:
 *     CallLog:
 *       type: object
 *       required:
 *         - lead
 *         - outcome
 *         - followUp
 *         - remarks
 *       properties:
 *         _id:
 *           type: string
 *           example: "65c1f3a2e9a34c0012ab1234"
 *         lead:
 *           type: string
 *           description: Lead ID
 *           example: "65c1f3a2e9a34c0012ab9999"
 *         outcome:
 *           type: string
 *           enum: [intrested, not_intrested, contacted, done]
 *           example: "contacted"
 *         followUp:
 *           type: string
 *           format: date-time
 *           example: "2025-02-10T10:30:00.000Z"
 *         remarks:
 *           type: string
 *           example: "Client asked for a follow-up call"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-02-01T08:12:30.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-02-01T08:12:30.000Z"
 */

/**
 * @swagger
 * /call-logs:
 *   post:
 *     summary: Create a call log
 *     tags: [Call Logs]
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lead, outcome, followUp, remarks]
 *             properties:
 *               lead:
 *                 type: string
 *                 example: "65c1f3a2e9a34c0012ab9999"
 *               outcome:
 *                 type: string
 *                 enum: [intrested, not_intrested, contacted, done]
 *                 example: "contacted"
 *               followUp:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-02-10T10:30:00.000Z"
 *               remarks:
 *                 type: string
 *                 example: "Customer requested follow-up"
 *
 *     responses:
 *       201:
 *         description: Call log created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Call log created successfully"
 *               errorCode: "0301"
 *               error: null
 *               data:
 *                 lead: "65c1f3a2e9a34c0012ab9999"
 *                 outcome: "contacted"
 *                 followUp: "2025-02-10T10:30:00.000Z"
 *                 remarks: "Customer requested follow-up"
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               message: "Lead is required"
 *               errorCode: "1001"
 *               error: "validation_error"
 *               data: null
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
 *       404:
 *         description: Lead not found
 *         content:
 *           application/json:
 *             examples:
 *               LeadNotFound:
 *                 value:
 *                   message: "Lead not found"
 *                   errorCode: "4201"
 *                   error: "not_found"
 *                   data: null
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal Server Error"
 *               errorCode: "5001"
 *               error: "internal_server_error"
 *               data: null
 */

/**
 * @swagger
 * /call-logs:
 *   get:
 *     summary: Fetch all call logs
 *     tags: [Call Logs]
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
 *         name: lead
 *         schema:
 *           type: string
 *           description: Filter by lead ID
 *       - in: query
 *         name: outcome
 *         schema:
 *           type: string
 *           description: Filter by call outcome
 *       - in: query
 *         name: followUp
 *         schema:
 *           type: string
 *           format: date
 *           description: Filter by follow-up date
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *
 *     responses:
 *       200:
 *         description: Call logs fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Call logs fetched successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 callLogs:
 *                   - _id: "695021a8533f976683911867"
 *                     lead:
 *                       _id: "694fec0d231a3da53bdd19a1"
 *                       company:
 *                         _id: "694fec0c231a3da53bdd1997"
 *                         name: "Tech Solutions Inc"
 *                         website: "https://techsolutions.com"
 *                         phone:
 *                           extension: "+1"
 *                           number: "5551234567"
 *                         socialProfile: "https://linkedin.com/company/techsolutions"
 *                         createdAt: "2025-12-27T14:24:12.499Z"
 *                         updatedAt: "2025-12-27T14:24:12.499Z"
 *                       contact:
 *                         _id: "694fec0d231a3da53bdd199e"
 *                         name: "John Smith"
 *                         phone:
 *                           extension: "+1"
 *                           number: "5559876543"
 *                         email: "john.smith@gmail.com"
 *                         createdAt: "2025-12-27T14:24:13.332Z"
 *                         updatedAt: "2025-12-27T14:24:13.332Z"
 *                       status: "qualified"
 *                       source: "referral"
 *                       followUp: "2025-12-28T14:30:00.000Z"
 *                       createdAt: "2025-12-27T14:24:13.610Z"
 *                       updatedAt: "2025-12-27T14:24:13.610Z"
 *                     outcome: "interested"
 *                     followUp: "2025-12-31T00:00:00.000Z"
 *                     remarks: "positive.. next meeting scheduled"
 *                     createdAt: "2025-12-27T18:12:56.628Z"
 *                     updatedAt: "2025-12-27T18:12:56.628Z"
 *
 *                 info:
 *                   total: 1
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
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Corresponding error message"
 *               errorCode: "5001"
 *               error: "internal_server_error"
 *               data: null
 */

/**
 * @swagger
 * /call-logs/{id}:
 *   get:
 *     summary: Fetch a call log by ID
 *     tags: [Call Logs]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Call log ID
 *         schema:
 *           type: string
 *           example: "695021a8533f976683911867"
 *
 *     responses:
 *       200:
 *         description: Call log fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Call log fetched successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 _id: "695021a8533f976683911867"
 *                 lead:
 *                   _id: "694fec0d231a3da53bdd19a1"
 *                   company:
 *                     _id: "694fec0c231a3da53bdd1997"
 *                     name: "Tech Solutions Inc"
 *                     website: "https://techsolutions.com"
 *                     phone:
 *                       extension: "+1"
 *                       number: "5551234567"
 *                     socialProfile: "https://linkedin.com/company/techsolutions"
 *                     createdAt: "2025-12-27T14:24:12.499Z"
 *                     updatedAt: "2025-12-27T14:24:12.499Z"
 *                   contact:
 *                     _id: "694fec0d231a3da53bdd199e"
 *                     name: "John Smith"
 *                     phone:
 *                       extension: "+1"
 *                       number: "5559876543"
 *                     email: "john.smith@gmail.com"
 *                     createdAt: "2025-12-27T14:24:13.332Z"
 *                     updatedAt: "2025-12-27T14:24:13.332Z"
 *                   status: "qualified"
 *                   source: "referral"
 *                   followUp: "2025-12-28T14:30:00.000Z"
 *                   createdAt: "2025-12-27T14:24:13.610Z"
 *                   updatedAt: "2025-12-27T14:24:13.610Z"
 *                 outcome: "interested"
 *                 followUp: "2025-12-31T00:00:00.000Z"
 *                 remarks: "positive.. next meeting scheduled"
 *                 createdAt: "2025-12-27T18:12:56.628Z"
 *                 updatedAt: "2025-12-27T18:12:56.628Z"
 *
 *       400:
 *         description: Invalid request parameter
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid call log id"
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
 *       404:
 *         description: Call log not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Call log not found"
 *               errorCode: "4301"
 *               error: "not_found"
 *               data: null
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal Server Error"
 *               errorCode: "5001"
 *               error: "internal_server_error"
 *               data: null
 */

/**
 * @swagger
 * /call-logs/{id}:
 *   patch:
 *     summary: Update a call log
 *     tags: [Call Logs]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Call log ID
 *         schema:
 *           type: string
 *           example: "695021a8533f976683911867"
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               outcome:
 *                 type: string
 *                 example: "done"
 *               followUp:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-31T00:00:00.000Z"
 *               remarks:
 *                 type: string
 *                 example: "Completed successfully"
 *
 *     responses:
 *       200:
 *         description: Call log updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Call log updated successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 _id: "695021a8533f976683911867"
 *                 lead:
 *                   _id: "694fec0d231a3da53bdd19a1"
 *                   company:
 *                     _id: "694fec0c231a3da53bdd1997"
 *                     name: "Tech Solutions Inc"
 *                     website: "https://techsolutions.com"
 *                     phone:
 *                       extension: "+1"
 *                       number: "5551234567"
 *                     socialProfile: "https://linkedin.com/company/techsolutions"
 *                     createdAt: "2025-12-27T14:24:12.499Z"
 *                     updatedAt: "2025-12-27T14:24:12.499Z"
 *                   contact:
 *                     _id: "694fec0d231a3da53bdd199e"
 *                     name: "John Smith"
 *                     phone:
 *                       extension: "+1"
 *                       number: "5559876543"
 *                     email: "john.smith@gmail.com"
 *                     createdAt: "2025-12-27T14:24:13.332Z"
 *                     updatedAt: "2025-12-27T14:24:13.332Z"
 *                   status: "qualified"
 *                   source: "referral"
 *                   followUp: "2025-12-28T14:30:00.000Z"
 *                   createdAt: "2025-12-27T14:24:13.610Z"
 *                   updatedAt: "2025-12-27T14:24:13.610Z"
 *                 outcome: "done"
 *                 followUp: "2025-12-31T00:00:00.000Z"
 *                 remarks: "Completed successfully"
 *                 createdAt: "2025-12-27T18:12:56.628Z"
 *                 updatedAt: "2025-12-28T09:15:41.221Z"
 *
 *       400:
 *         description: Invalid request parameter
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid call log id"
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
 *       404:
 *         description: Call log not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Call log not found"
 *               errorCode: "4301"
 *               error: "not_found"
 *               data: null
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal Server Error"
 *               errorCode: "5001"
 *               error: "internal_server_error"
 *               data: null
 */

/**
 * @swagger
 * /call-logs/{id}:
 *   delete:
 *     summary: Delete a call log
 *     tags: [Call Logs]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *
 *     responses:
 *       200:
 *         description: Call log deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Call log deleted successfully"
 *               errorCode: "0000"
 *               error: null
 *               data:
 *                 id: "65c1f3a2e9a34c0012ab1234"
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
 *         description: Call log not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Call log not found"
 *               errorCode: "4301"
 *               error: "not_found"
 *               data: null
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal Server Error"
 *               errorCode: "5001"
 *               error: "internal_server_error"
 *               data: null
 */

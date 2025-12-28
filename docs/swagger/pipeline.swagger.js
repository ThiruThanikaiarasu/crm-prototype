/**
 * @swagger
 * /pipeline:
 *   post:
 *     summary: Create a pipeline for a lead
 *     tags: [Pipelines]
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
 *               - lead
 *               - opportunityStage
 *             properties:
 *               lead:
 *                 type: string
 *                 description: Lead ID for which pipeline is created
 *                 example: "694fec0d231a3da53bdd19a2"
 *               opportunityStage:
 *                 type: string
 *                 description: Current stage of the opportunity
 *                 example: "lead"
 *               estimatedValue:
 *                 type: number
 *                 description: Estimated deal value
 *                 example: 12000
 *               probability:
 *                 type: number
 *                 description: Probability of conversion (percentage)
 *                 example: 12
 *               expectedRevnue:
 *                 type: number
 *                 description: Expected revenue value
 *                 example: 10000
 *               nextStep:
 *                 type: string
 *                 description: Next action to be taken
 *                 example: "next"
 *               followUp:
 *                 type: string
 *                 format: date-time
 *                 description: Follow-up date
 *                 example: "2025-12-10T10:00:00.000Z"
 *               remarks:
 *                 type: string
 *                 description: Remarks or notes
 *                 example: "contacted"
 *
 *     responses:
 *       201:
 *         description: Pipeline created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Pipeline created successfully"
 *               errorCode: null
 *               error: "0601"
 *               data:
 *                 _id: "695042d54d1d9b15f79d4c50"
 *                 lead:
 *                   - _id: "694fec0d231a3da53bdd19a2"
 *                     company:
 *                       _id: "694fec0c231a3da53bdd1997"
 *                       name: "Tech Solutions Inc"
 *                       website: "https://techsolutions.com"
 *                       phone:
 *                         extension: "+1"
 *                         number: "5551234567"
 *                       socialProfile: "https://linkedin.com/company/techsolutions"
 *                       createdAt: "2025-12-27T14:24:12.499Z"
 *                       updatedAt: "2025-12-27T14:24:12.499Z"
 *                     contact:
 *                       _id: "694fec0d231a3da53bdd199f"
 *                       name: "Sarah Johnson"
 *                       phone:
 *                         extension: "+1"
 *                         number: "5558887777"
 *                       email: "sarah.johnson@gmail.com"
 *                       createdAt: "2025-12-27T14:24:13.332Z"
 *                       updatedAt: "2025-12-27T14:24:13.332Z"
 *                     status: "new"
 *                     source: "website"
 *                     followUp: "2025-12-30T09:00:00.000Z"
 *                     createdAt: "2025-12-27T14:24:13.611Z"
 *                     updatedAt: "2025-12-27T14:24:13.611Z"
 *                 opportunityStage: "lead"
 *                 estimatedValue: 12000
 *                 probability: 12
 *                 expectedRevnue: 10000
 *                 nextStep: "next"
 *                 followUp: "2025-12-10T10:00:00.000Z"
 *                 remarks: "contacted"
 *                 owner: "69217ce444bd86cfef120bd6"
 *                 deleted:
 *                   isDeleted: false
 *
 *       400:
 *         description: Validation error
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
 *
 *       409:
 *         description: Conflict — pipeline already exists for this lead
 *         content:
 *           application/json:
 *             example:
 *               message: "Pipeline already exists"
 *               errorCode: "0602"
 *               error: "conflict"
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
 * /pipeline:
 *   get:
 *     summary: Get all pipelines
 *     tags: [Pipelines]
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Pipelines fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Pipelines fetched successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 - _id: "695042d54d1d9b15f79d4c50"
 *                   lead:
 *                     _id: "694fec0d231a3da53bdd19a2"
 *                     company:
 *                       _id: "694fec0c231a3da53bdd1997"
 *                       name: "Tech Solutions Inc"
 *                       website: "https://techsolutions.com"
 *                       phone:
 *                         extension: "+1"
 *                         number: "5551234567"
 *                       socialProfile: "https://linkedin.com/company/techsolutions"
 *                       createdAt: "2025-12-27T14:24:12.499Z"
 *                       updatedAt: "2025-12-27T14:24:12.499Z"
 *                     contact:
 *                       _id: "694fec0d231a3da53bdd199f"
 *                       name: "Sarah Johnson"
 *                       phone:
 *                         extension: "+1"
 *                         number: "5558887777"
 *                       email: "sarah.johnson@gmail.com"
 *                       createdAt: "2025-12-27T14:24:13.332Z"
 *                       updatedAt: "2025-12-27T14:24:13.332Z"
 *                     status: "new"
 *                     source: "website"
 *                     followUp: "2025-12-30T09:00:00.000Z"
 *                     createdAt: "2025-12-27T14:24:13.611Z"
 *                     updatedAt: "2025-12-27T14:24:13.611Z"
 *                   opportunityStage: "lead"
 *                   estimatedValue: 12000
 *                   probability: 12
 *                   expectedRevnue: 10000
 *                   nextStep: "next"
 *                   followUp: "2025-12-10T10:00:00.000Z"
 *                   remarks: "contacted"
 *                   owner: "69217ce444bd86cfef120bd6"
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
 *               error: "internal_server_error"
 *               data: null
 */

/**
 * @swagger
 * /pipeline/{id}:
 *   get:
 *     summary: Get a pipeline by ID
 *     tags: [Pipelines]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Pipeline ID
 *         schema:
 *           type: string
 *           example: "695042d54d1d9b15f79d4c50"
 *
 *     responses:
 *       200:
 *         description: Pipeline fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Pipeline fetched successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 _id: "695042d54d1d9b15f79d4c50"
 *                 lead:
 *                   _id: "694fec0d231a3da53bdd19a2"
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
 *                     _id: "694fec0d231a3da53bdd199f"
 *                     name: "Sarah Johnson"
 *                     phone:
 *                       extension: "+1"
 *                       number: "5558887777"
 *                     email: "sarah.johnson@gmail.com"
 *                     createdAt: "2025-12-27T14:24:13.332Z"
 *                     updatedAt: "2025-12-27T14:24:13.332Z"
 *                   status: "new"
 *                   source: "website"
 *                   followUp: "2025-12-30T09:00:00.000Z"
 *                   createdAt: "2025-12-27T14:24:13.611Z"
 *                   updatedAt: "2025-12-27T14:24:13.611Z"
 *                 opportunityStage: "lead"
 *                 estimatedValue: 12000
 *                 probability: 12
 *                 expectedRevnue: 10000
 *                 nextStep: "next"
 *                 followUp: "2025-12-10T10:00:00.000Z"
 *                 remarks: "contacted"
 *                 owner: "69217ce444bd86cfef120bd6"
 *
 *       400:
 *         description: Invalid request parameter
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid pipeline id"
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
 *         description: Pipeline not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Pipeline not found"
 *               errorCode: "0603"
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
 * /pipeline/{id}:
 *   patch:
 *     summary: Update a pipeline by ID
 *     tags: [Pipelines]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Pipeline ID
 *         schema:
 *           type: string
 *           example: "695042d54d1d9b15f79d4c50"
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               opportunityStage:
 *                 type: string
 *                 example: "lead"
 *               estimatedValue:
 *                 type: number
 *                 example: 12000
 *               probability:
 *                 type: number
 *                 example: 12
 *               expectedRevnue:
 *                 type: number
 *                 example: 10000
 *               nextStep:
 *                 type: string
 *                 example: "next"
 *               followUp:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-10T10:00:00.000Z"
 *               remarks:
 *                 type: string
 *                 example: "Asked to follow up later"
 *
 *     responses:
 *       200:
 *         description: Pipeline updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Pipeline updated successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 _id: "695042d54d1d9b15f79d4c50"
 *                 lead:
 *                   _id: "694fec0d231a3da53bdd19a2"
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
 *                     _id: "694fec0d231a3da53bdd199f"
 *                     name: "Sarah Johnson"
 *                     phone:
 *                       extension: "+1"
 *                       number: "5558887777"
 *                     email: "sarah.johnson@gmail.com"
 *                     createdAt: "2025-12-27T14:24:13.332Z"
 *                     updatedAt: "2025-12-27T14:24:13.332Z"
 *                   status: "new"
 *                   source: "website"
 *                   followUp: "2025-12-30T09:00:00.000Z"
 *                   createdAt: "2025-12-27T14:24:13.611Z"
 *                   updatedAt: "2025-12-27T14:24:13.611Z"
 *                 opportunityStage: "lead"
 *                 estimatedValue: 12000
 *                 probability: 12
 *                 expectedRevnue: 10000
 *                 nextStep: "next"
 *                 followUp: "2025-12-10T10:00:00.000Z"
 *                 remarks: "Asked to follow up later"
 *                 owner: "69217ce444bd86cfef120bd6"
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid pipeline id"
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
 *         description: Pipeline not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Pipeline not found"
 *               errorCode: "0603"
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
 * /pipeline/{id}:
 *   delete:
 *     summary: Delete a pipeline by ID
 *     tags: [Pipelines]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Pipeline ID
 *         schema:
 *           type: string
 *           example: "695042d54d1d9b15f79d4c50"
 *
 *     responses:
 *       200:
 *         description: Pipeline deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Pipeline deleted successfully"
 *               errorCode: null
 *               error: null
 *               data: null
 *
 *       400:
 *         description: Invalid request parameter
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid pipeline id"
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
 *         description: Pipeline not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Pipeline not found"
 *               errorCode: "0603"
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

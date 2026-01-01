/**
 * @swagger
 * /pipeline:
 *   post:
 *     summary: Create a pipeline for a company
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
 *               - company
 *               - opportunityStage
 *             properties:
 *               company:
 *                 type: string
 *                 description: Company ID for which the pipeline is created
 *                 example: "695012cce2389e938f922e9c"
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
 *                 _id: "69565ee981355feed0cee28b"
 *                 company:
 *                   _id: "695012cce2389e938f922e9c"
 *                   name: "GK Tech"
 *                   website: "gktech.com"
 *                   phone:
 *                     extension: "+91"
 *                     number: "5551234599"
 *                   socialProfile: "https://linkedin.com/company/gktech"
 *                   createdAt: "2025-12-27T17:09:32.390Z"
 *                   updatedAt: "2025-12-27T17:09:32.390Z"
 *                 opportunityStage: "lead"
 *                 estimatedValue: 12000
 *                 probability: 12
 *                 expectedRevnue: 10000
 *                 nextStep: "next"
 *                 followUp: "2025-12-10T10:00:00.000Z"
 *                 remarks: "contacted"
 *                 owner: "69217ce444bd86cfef120bd6"
 *                 createdAt: "2026-01-01T11:47:53.630Z"
 *                 updatedAt: "2026-01-01T11:47:53.630Z"
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               message: "Company is a mandatory field"
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
 *         description: Company not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Company not found"
 *               errorCode: "4401"
 *               error: "not_found"
 *               data: null
 *
 *       409:
 *         description: Conflict — pipeline already exists for this company
 *         content:
 *           application/json:
 *             example:
 *               message: "Pipeline already exists for this company"
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
 *                 pipelines:
 *                   - _id: "69565ee981355feed0cee28b"
 *                     company:
 *                       _id: "695012cce2389e938f922e9c"
 *                       name: "GK Tech"
 *                       website: "gktech.com"
 *                       phone:
 *                         extension: "+91"
 *                         number: "5551234599"
 *                       socialProfile: "https://linkedin.com/company/gktech"
 *                       createdAt: "2025-12-27T17:09:32.390Z"
 *                       updatedAt: "2025-12-27T17:09:32.390Z"
 *                     opportunityStage: "lead"
 *                     estimatedValue: 12000
 *                     probability: 12
 *                     expectedRevnue: 10000
 *                     nextStep: "next"
 *                     followUp: "2025-12-10T10:00:00.000Z"
 *                     remarks: "contacted"
 *                     owner: "69217ce444bd86cfef120bd6"
 *                     createdAt: "2026-01-01T11:47:53.630Z"
 *                     updatedAt: "2026-01-01T11:47:53.630Z"
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
 *           example: "69565ee981355feed0cee28b"
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
 *                 _id: "69565ee981355feed0cee28b"
 *                 company:
 *                   _id: "695012cce2389e938f922e9c"
 *                   name: "GK Tech"
 *                   website: "gktech.com"
 *                   phone:
 *                     extension: "+91"
 *                     number: "5551234599"
 *                   socialProfile: "https://linkedin.com/company/gktech"
 *                   createdAt: "2025-12-27T17:09:32.390Z"
 *                   updatedAt: "2025-12-27T17:09:32.390Z"
 *                 opportunityStage: "lead"
 *                 estimatedValue: 12000
 *                 probability: 12
 *                 expectedRevnue: 10000
 *                 nextStep: "next"
 *                 followUp: "2025-12-10T10:00:00.000Z"
 *                 remarks: "contacted"
 *                 owner: "69217ce444bd86cfef120bd6"
 *                 createdAt: "2026-01-01T11:47:53.630Z"
 *                 updatedAt: "2026-01-01T11:47:53.630Z"
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
 *           example: "69565ee981355feed0cee28b"
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
 *                 example: 13000
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
 *                 example: "contacted"
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
 *                 _id: "69565ee981355feed0cee28b"
 *                 company:
 *                   _id: "695012cce2389e938f922e9c"
 *                   name: "GK Tech"
 *                   website: "gktech.com"
 *                   phone:
 *                     extension: "+91"
 *                     number: "5551234599"
 *                   socialProfile: "https://linkedin.com/company/gktech"
 *                   createdAt: "2025-12-27T17:09:32.390Z"
 *                   updatedAt: "2025-12-27T17:09:32.390Z"
 *                 opportunityStage: "lead"
 *                 estimatedValue: 13000
 *                 probability: 12
 *                 expectedRevnue: 10000
 *                 nextStep: "next"
 *                 followUp: "2025-12-10T10:00:00.000Z"
 *                 remarks: "contacted"
 *                 owner: "69217ce444bd86cfef120bd6"
 *                 createdAt: "2026-01-01T11:47:53.630Z"
 *                 updatedAt: "2026-01-01T12:06:57.438Z"
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

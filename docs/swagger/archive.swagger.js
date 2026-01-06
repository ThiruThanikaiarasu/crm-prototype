/**
 * @swagger
 * /archive/leads:
 *   get:
 *     summary: Get all archived leads
 *     description: |
 *       Fetch all archived (soft-deleted) leads grouped by company.
 *       This endpoint is accessible **only to Super Admin users**.
 *     tags: [Archive]
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
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of companies per page
 *
 *     responses:
 *       200:
 *         description: Archived leads retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Archived leads retrieved successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 leads:
 *                   - company:
 *                       _id: "695012cce2389e938f922e9c"
 *                       name: "GK Tech"
 *                       website: "gktech.com"
 *                       phone:
 *                         extension: "+91"
 *                         number: "5551234599"
 *                       socialProfile: "https://linkedin.com/company/gktech"
 *                       deleted:
 *                         isDeleted: false
 *                       createdAt: "2025-12-27T17:09:32.390Z"
 *                       updatedAt: "2025-12-27T17:09:32.390Z"
 *                     leads:
 *                       - _id: "695012cde2389e938f922ea0"
 *                         company: "695012cce2389e938f922e9c"
 *                         status: "new"
 *                         source: null
 *                         followUp: null
 *                         deleted:
 *                           isDeleted: true
 *                           at: "2025-12-27T17:21:08.245Z"
 *                           by:
 *                             _id: "69217fc1d26c2d434bee1ae4"
 *                             firstName: "Thiru"
 *                             lastName: "T"
 *                             email: "thiru9@gmail.com"
 *                             role: "super_admin"
 *                         createdAt: "2025-12-27T17:09:33.244Z"
 *                         updatedAt: "2025-12-27T17:21:08.245Z"
 *
 *                 info:
 *                   total: 25
 *                   page: 1
 *                   limit: 10
 *                   totalPages: 3
 *                   hasMoreRecords: true
 *
 *       403:
 *         description: Forbidden — only Super Admin can access archived leads
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

/**
 * @swagger
 * /archive/call-logs:
 *   get:
 *     summary: Get all archived call logs
 *     description: |
 *       Fetch all archived (soft-deleted) call logs with populated lead,
 *       company, and deletion metadata.
 *       Accessible **only to Super Admin users**.
 *     tags: [Archive]
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
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of call logs per page
 *
 *     responses:
 *       200:
 *         description: Archived call logs retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Archived call logs retrieved successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 callLogs:
 *                   - _id: "6956cf22e0161b73d5ccd850"
 *                     lead:
 *                       _id: "6956ced4e0161b73d5ccd81a"
 *                       status: "qualified"
 *                       source: "Referral"
 *                       followUp: "2026-01-27T00:00:00.000Z"
 *                       priority: 1
 *                       name: "arun"
 *                       email: "arun@gmail.com"
 *                       phone:
 *                         extension: "+91"
 *                         number: "8754896321"
 *                       createdAt: "2026-01-01T19:45:24.306Z"
 *                       updatedAt: "2026-01-01T19:45:24.306Z"
 *                       company:
 *                         _id: "6956ced2e0161b73d5ccd811"
 *                         name: "denver"
 *                         website: "denver.com"
 *                         phone:
 *                           extension: "+91"
 *                           number: "998756987"
 *                         email: "denver@gmail.com"
 *                         socialProfile: "denver.com"
 *                         createdAt: "2026-01-01T19:45:22.780Z"
 *                         updatedAt: "2026-01-01T19:45:22.780Z"
 *                     outcome: "contacted"
 *                     followUp: "2026-01-09T00:00:00.000Z"
 *                     remarks: "test"
 *                     callStartTime: "2026-01-01T19:46:00.000Z"
 *                     callDuration: 660
 *                     deleted:
 *                       isDeleted: true
 *                       at: "2026-01-06T07:29:57.051Z"
 *                       by:
 *                         _id: "69217fc1d26c2d434bee1ae4"
 *                         firstName: "Thiru"
 *                         lastName: "T"
 *                         email: "thiru9@gmail.com"
 *                         role: "super_admin"
 *                         tenantId: "abcd"
 *                     createdAt: "2026-01-01T19:46:42.641Z"
 *                     updatedAt: "2026-01-06T07:29:57.052Z"
 *
 *                 info:
 *                   total: 1
 *                   page: 1
 *                   limit: 10
 *                   totalPages: 1
 *                   hasMoreRecords: false
 *
 *       403:
 *         description: Forbidden — only Super Admin can access archived call logs
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

/**
 * @swagger
 * /archive/pipelines:
 *   get:
 *     summary: Get all archived pipelines
 *     description: |
 *       Fetch all archived (soft-deleted) pipelines with populated
 *       company, owner, and deletion audit details.
 *       Accessible **only to Super Admin users**.
 *     tags: [Archive]
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
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of pipelines per page
 *
 *     responses:
 *       200:
 *         description: Archived pipelines retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Archived pipelines retrieved successfully"
 *               errorCode: null
 *               error: "0000"
 *               data:
 *                 pipelines:
 *                   - _id: "6956e6e6e0161b73d5ccdbc1"
 *                     company:
 *                       _id: "69501c1a05588b442f8fbb0c"
 *                       name: "amazon"
 *                       website: "https://amazon.com"
 *                       phone:
 *                         extension: "+91"
 *                         number: "9856878547"
 *                       email: "support@amazon.com"
 *                       socialProfile: "https://amazon.com"
 *                       createdAt: "2025-12-27T17:49:14.113Z"
 *                       updatedAt: "2025-12-29T14:23:20.678Z"
 *                     opportunityStage: "closed_lost"
 *                     estimatedValue: 5000000
 *                     probability: 10
 *                     expectedRevnue: 500000
 *                     nextStep: "need to follow up later, facing some hardships in recent days -- shouldn't bug the client"
 *                     followUp: "2026-01-14T00:00:00.000Z"
 *                     remarks: "need to follow up later, facing some hardships in recent days -- shouldn't bug the client"
 *                     owner:
 *                       _id: "69217fc1d26c2d434bee1ae4"
 *                       firstName: "Thiru"
 *                       lastName: "T"
 *                       email: "thiru9@gmail.com"
 *                       role: "super_admin"
 *                       tenantId: "abcd"
 *                     deleted:
 *                       isDeleted: true
 *                       at: "2026-01-01T21:28:14.455Z"
 *                       by:
 *                         _id: "69217fc1d26c2d434bee1ae4"
 *                         firstName: "Thiru"
 *                         lastName: "T"
 *                         email: "thiru9@gmail.com"
 *                         role: "super_admin"
 *                         tenantId: "abcd"
 *                     createdAt: "2026-01-01T21:28:06.779Z"
 *                     updatedAt: "2026-01-01T21:28:14.456Z"
 *
 *                 info:
 *                   total: 1
 *                   page: 1
 *                   limit: 10
 *                   totalPages: 1
 *                   hasMoreRecords: false
 *
 *       403:
 *         description: Forbidden — only Super Admin can access archived pipelines
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

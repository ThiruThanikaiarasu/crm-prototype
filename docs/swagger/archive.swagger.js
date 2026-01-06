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

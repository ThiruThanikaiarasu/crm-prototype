// Routes


// Models

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           description: The user's first name
 *           minLength: 2
 *           maxLength: 25
 *         lastName:
 *           type: string
 *           description: The user's last name
 *           minLength: 1
 *           maxLength: 25
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *         password:
 *           type: string
 *           format: password
 *           description: The user's password (min 8 chars)
 *         profileImage:
 *           type: string
 *           description: URL of the user's profile image
 *         role:
 *           type: string
 *           enum: [super_admin, admin, employee]
 *           default: employee
 *           description: User role
 *         tenantId:
 *           type: string
 *           description: The tenant ID this user belongs to
 *       example:
 *         firstName: John
 *         lastName: Doe
 *         email: john.doe@example.com
 *         password: password123
 *         role: employee
 */
const { body } = require('express-validator')

const validateCreatePipelinePayload = [

    body('company')
        .notEmpty().withMessage('Company is required')
        .isMongoId().withMessage('Company must be a valid id'),

    body('opportunityStage')
        .optional({ nullable: true })
        .isIn([
            'lead',
            'meeting',
            'proposal',
            'negotiation',
            'closed_won',
            'closed_lost'
        ])
        .withMessage('Invalid opportunity stage'),

    body('estimatedValue')
        .optional({ nullable: true })
        .isNumeric().withMessage('Estimated value must be a number')
        .custom(value => value >= 0)
        .withMessage('Estimated value cannot be negative'),

    body('probability')
        .optional({ nullable: true })
        .isNumeric().withMessage('Probability must be a number')
        .custom(value => value >= 0 && value <= 100)
        .withMessage('Probability must be between 0 and 100'),

    body('expectedRevnue')
        .optional({ nullable: true })
        .isNumeric().withMessage('Expected revenue must be a number')
        .custom(value => value >= 0)
        .withMessage('Expected revenue cannot be negative'),

    body('nextStep')
        .optional({ nullable: true })
        .isString().withMessage('Next step must be a string')
        .isLength({ max: 255 })
        .withMessage('Next step must not exceed 255 characters'),

    body('followUp')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Follow up must be a valid date'),

    body('remarks')
        .optional({ nullable: true })
        .isString().withMessage('Remarks must be a string')
        .isLength({ max: 1000 })
        .withMessage('Remarks must not exceed 1000 characters'),
    body('proposalNumber')
        .optional({ nullable: true })
        .matches(/^[a-zA-Z0-9]+$/).withMessage('Only alphanumeric characters are allowed (A–Z, a–z, 0–9)')
        .isLength({ max: 50 }).withMessage('Proposal number must not exceed 50 characters'),

]

module.exports = {
    validateCreatePipelinePayload,
}

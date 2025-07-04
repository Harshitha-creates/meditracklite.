const { body, validationResult } = require('express-validator');

const validateRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .custom(value => {
            if (!value.endsWith('@meditrack.local')) {
                throw new Error('Email must be from @meditrack.local domain');
            }
            return true;
        }),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('role')
        .isIn(['Patient', 'Doctor'])
        .withMessage('Role must be either Patient or Doctor')
];

const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const validateAppointment = [
    body('doctorId')
        .notEmpty()
        .withMessage('Please select a doctor'),
    
    body('appointmentDate')
        .isISO8601()
        .withMessage('Please enter a valid date')
        .custom(value => {
            const date = new Date(value);
            const now = new Date();
            if (date < now) {
                throw new Error('Appointment date cannot be in the past');
            }
            return true;
        }),
    
    body('appointmentTime')
        .matches(/^(0[9]|1[0-6]):[0-5][0-9]$/)
        .withMessage('Appointment time must be between 09:00 and 16:59'),
    
    body('healthConcern')
        .trim()
        .isLength({ min: 10, max: 200 })
        .withMessage('Health concern must be between 10 and 200 characters')
];

const validatePrescription = [
    body('medicineName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Medicine name must be between 2 and 100 characters'),
    
    body('dosage')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Dosage instructions must be between 2 and 100 characters'),
    
    body('frequency')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Frequency must be between 2 and 100 characters')
];

const validateFeedback = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('Comment must not exceed 150 characters')
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.validationErrors = errors.array();
        return next();
    }
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateAppointment,
    validatePrescription,
    validateFeedback,
    handleValidationErrors
};

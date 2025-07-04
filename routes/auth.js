const express = require('express');
const bcrypt = require('bcrypt');
const { createUser, findUserByEmail } = require('../server/storage');
const { validateRegistration, validateLogin, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Login page
router.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login - MediTrack Lite',
        error: null,
        success: null
    });
});

// Register page
router.get('/register', (req, res) => {
    res.render('register', {
        title: 'Register - MediTrack Lite',
        error: null,
        success: null
    });
});

// Handle registration
router.post('/register', validateRegistration, handleValidationErrors, async (req, res) => {
    const { name, email, password, role } = req.body;
    
    // Check for validation errors
    if (req.validationErrors) {
        return res.render('register', {
            title: 'Register - MediTrack Lite',
            error: req.validationErrors[0].msg,
            success: null
        });
    }
    
    try {
        // Check if email already exists
        const existingUser = await findUserByEmail(email.toLowerCase());
        
        if (existingUser) {
            return res.render('register', {
                title: 'Register - MediTrack Lite',
                error: 'An account with this email already exists.',
                success: null
            });
        }
        
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create user
        const userData = {
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role
        };
        
        await createUser(userData);
        
        res.render('login', {
            title: 'Login - MediTrack Lite',
            error: null,
            success: 'Registration successful! Please log in.'
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', {
            title: 'Register - MediTrack Lite',
            error: 'Registration failed. Please try again.',
            success: null
        });
    }
});

// Handle login
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
    const { email, password } = req.body;
    
    // Check for validation errors
    if (req.validationErrors) {
        return res.render('login', {
            title: 'Login - MediTrack Lite',
            error: req.validationErrors[0].msg,
            success: null
        });
    }
    
    try {
        // Find user by email
        const userData = await findUserByEmail(email.toLowerCase());
        
        if (!userData) {
            return res.render('login', {
                title: 'Login - MediTrack Lite',
                error: 'Invalid email or password.',
                success: null
            });
        }
        
        // Verify password
        const passwordMatch = await bcrypt.compare(password, userData.password);
        
        if (!passwordMatch) {
            return res.render('login', {
                title: 'Login - MediTrack Lite',
                error: 'Invalid email or password.',
                success: null
            });
        }
        
        // Create session
        req.session.user = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role
        };
        
        // Redirect based on role
        if (userData.role === 'Patient') {
            res.redirect('/dashboard/patient');
        } else {
            res.redirect('/dashboard/doctor');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', {
            title: 'Login - MediTrack Lite',
            error: 'Login failed. Please try again.',
            success: null
        });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;

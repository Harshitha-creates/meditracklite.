const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const expressLayouts = require('express-ejs-layouts');

// Initialize Firebase configuration
require('./config/firebase');

const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const dashboardRoutes = require('./routes/dashboard');
const prescriptionRoutes = require('./routes/prescriptions');
const feedbackRoutes = require('./routes/feedback');

const app = express();
const PORT = process.env.PORT || 5000;

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'meditrack-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Global middleware to pass user info to templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/prescriptions', prescriptionRoutes);
app.use('/feedback', feedbackRoutes);

// Home route
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'MediTrack Lite - Clinic Management System',
        error: null,
        success: null
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('index', {
        title: 'Error',
        error: 'Something went wrong! Please try again.',
        success: null
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('index', {
        title: 'Page Not Found',
        error: 'The page you are looking for does not exist.',
        success: null
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediTrack Lite server running on port ${PORT}`);
});

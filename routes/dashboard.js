const express = require('express');
const { getAppointmentsByPatient, getAppointmentsByDoctor, getAllAppointments, getFeedbackByDoctor } = require('../server/storage');
const { requireAuth, requirePatient, requireDoctor } = require('../middleware/auth');

const router = express.Router();

// Patient dashboard
router.get('/patient', requirePatient, async (req, res) => {
    try {
        // Get patient's appointments
        const appointments = await getAppointmentsByPatient(req.session.user.id);
        
        // Add feedback placeholders (we'll implement feedback later)
        appointments.forEach(appointment => {
            appointment.feedback = null;
        });
        
        res.render('patient-dashboard', {
            title: 'Patient Dashboard - MediTrack Lite',
            appointments: appointments,
            error: req.query.error || null,
            success: req.query.success || null
        });
        
    } catch (error) {
        console.error('Error loading patient dashboard:', error);
        res.render('patient-dashboard', {
            title: 'Patient Dashboard - MediTrack Lite',
            appointments: [],
            error: 'Failed to load dashboard data. Please try again.',
            success: null
        });
    }
});

// Doctor dashboard
router.get('/doctor', requireDoctor, async (req, res) => {
    try {
        // Get doctor's appointments
        const appointments = await getAppointmentsByDoctor(req.session.user.id);
        
        // Separate appointments by status
        const completedAppointments = appointments.filter(apt => apt.status === 'Completed');
        const activeAppointments = appointments.filter(apt => apt.status === 'Confirmed' || apt.status === 'In Progress');
        
        // Get all appointments for pending count
        const allAppointments = await getAllAppointments();
        const pendingCount = allAppointments.filter(apt => apt.status === 'Pending').length;
        
        // Placeholder for feedback data
        const feedbacks = [];
        const averageRating = null;
        
        res.render('doctor-dashboard', {
            title: 'Doctor Dashboard - MediTrack Lite',
            completedAppointments: completedAppointments,
            activeAppointments: activeAppointments,
            feedbacks: feedbacks,
            averageRating: averageRating,
            pendingCount: pendingCount,
            error: req.query.error || null,
            success: req.query.success || null
        });
        
    } catch (error) {
        console.error('Error loading doctor dashboard:', error);
        res.render('doctor-dashboard', {
            title: 'Doctor Dashboard - MediTrack Lite',
            completedAppointments: [],
            activeAppointments: [],
            feedbacks: [],
            averageRating: null,
            pendingCount: 0,
            error: 'Failed to load dashboard data. Please try again.',
            success: null
        });
    }
});

module.exports = router;

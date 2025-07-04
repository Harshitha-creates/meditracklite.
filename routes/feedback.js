const express = require('express');
const { db, collections } = require('../config/firebase');
const { requirePatient } = require('../middleware/auth');
const { validateFeedback, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Show feedback form (Patient only)
router.get('/create/:appointmentId', requirePatient, async (req, res) => {
    const appointmentId = req.params.appointmentId;
    
    try {
        const appointmentDoc = await db.collection(collections.appointments).doc(appointmentId).get();
        
        if (!appointmentDoc.exists) {
            return res.redirect('/dashboard/patient?error=Appointment not found.');
        }
        
        const appointmentData = appointmentDoc.data();
        
        // Check if patient is assigned to this appointment
        if (appointmentData.patientId !== req.session.user.id) {
            return res.redirect('/dashboard/patient?error=You are not authorized to provide feedback for this appointment.');
        }
        
        // Check if appointment is completed
        if (appointmentData.status !== 'Completed') {
            return res.redirect('/dashboard/patient?error=Feedback can only be provided for completed appointments.');
        }
        
        // Check if feedback already exists
        const existingFeedback = await db.collection(collections.feedback)
            .where('appointmentId', '==', appointmentId)
            .get();
        
        if (!existingFeedback.empty) {
            return res.redirect('/dashboard/patient?error=Feedback already submitted for this appointment.');
        }
        
        res.render('feedback-form', {
            title: 'Provide Feedback - MediTrack Lite',
            appointment: {
                id: appointmentDoc.id,
                ...appointmentData,
                appointmentDate: appointmentData.appointmentDate.toDate()
            },
            error: null,
            success: null
        });
        
    } catch (error) {
        console.error('Error loading feedback form:', error);
        res.redirect('/dashboard/patient?error=Failed to load feedback form.');
    }
});

// Handle feedback submission
router.post('/create/:appointmentId', requirePatient, validateFeedback, handleValidationErrors, async (req, res) => {
    const appointmentId = req.params.appointmentId;
    const { rating, comment } = req.body;
    
    // Check for validation errors
    if (req.validationErrors) {
        try {
            const appointmentDoc = await db.collection(collections.appointments).doc(appointmentId).get();
            const appointmentData = appointmentDoc.data();
            
            return res.render('feedback-form', {
                title: 'Provide Feedback - MediTrack Lite',
                appointment: {
                    id: appointmentDoc.id,
                    ...appointmentData,
                    appointmentDate: appointmentData.appointmentDate.toDate()
                },
                error: req.validationErrors[0].msg,
                success: null
            });
        } catch (error) {
            console.error('Error loading appointment:', error);
        }
        return;
    }
    
    try {
        // Verify appointment and authorization again
        const appointmentDoc = await db.collection(collections.appointments).doc(appointmentId).get();
        
        if (!appointmentDoc.exists) {
            return res.redirect('/dashboard/patient?error=Appointment not found.');
        }
        
        const appointmentData = appointmentDoc.data();
        
        if (appointmentData.patientId !== req.session.user.id) {
            return res.redirect('/dashboard/patient?error=You are not authorized to provide feedback for this appointment.');
        }
        
        if (appointmentData.status !== 'Completed') {
            return res.redirect('/dashboard/patient?error=Feedback can only be provided for completed appointments.');
        }
        
        // Check if feedback already exists
        const existingFeedback = await db.collection(collections.feedback)
            .where('appointmentId', '==', appointmentId)
            .get();
        
        if (!existingFeedback.empty) {
            return res.redirect('/dashboard/patient?error=Feedback already submitted for this appointment.');
        }
        
        // Create feedback document
        const feedbackDoc = {
            appointmentId: appointmentId,
            patientId: req.session.user.id,
            patientName: req.session.user.name,
            doctorId: appointmentData.doctorId,
            doctorName: appointmentData.doctorName,
            rating: parseInt(rating),
            comment: comment ? comment.trim() : '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await db.collection(collections.feedback).add(feedbackDoc);
        
        res.redirect('/dashboard/patient?success=Feedback submitted successfully!');
        
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.redirect('/dashboard/patient?error=Failed to submit feedback. Please try again.');
    }
});

module.exports = router;

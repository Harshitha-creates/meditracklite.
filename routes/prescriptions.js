const express = require('express');
const { db, collections } = require('../config/firebase');
const { requireDoctor } = require('../middleware/auth');
const { validatePrescription, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Show prescription form (Doctor only)
router.get('/create/:appointmentId', requireDoctor, async (req, res) => {
    const appointmentId = req.params.appointmentId;
    
    try {
        const appointmentDoc = await db.collection(collections.appointments).doc(appointmentId).get();
        
        if (!appointmentDoc.exists) {
            return res.redirect('/appointments/my-appointments?error=Appointment not found.');
        }
        
        const appointmentData = appointmentDoc.data();
        
        // Check if doctor is assigned to this appointment
        if (appointmentData.doctorId !== req.session.user.id) {
            return res.redirect('/appointments/my-appointments?error=You are not authorized to create prescription for this appointment.');
        }
        
        // Check if appointment is completed
        if (appointmentData.status !== 'Completed') {
            return res.redirect('/appointments/my-appointments?error=Prescription can only be created for completed appointments.');
        }
        
        // Check if prescription already exists
        const existingPrescription = await db.collection(collections.prescriptions)
            .where('appointmentId', '==', appointmentId)
            .get();
        
        if (!existingPrescription.empty) {
            return res.redirect('/appointments/my-appointments?error=Prescription already exists for this appointment.');
        }
        
        res.render('prescription-form', {
            title: 'Create Prescription - MediTrack Lite',
            appointment: {
                id: appointmentDoc.id,
                ...appointmentData,
                appointmentDate: appointmentData.appointmentDate.toDate()
            },
            error: null,
            success: null
        });
        
    } catch (error) {
        console.error('Error loading prescription form:', error);
        res.redirect('/appointments/my-appointments?error=Failed to load prescription form.');
    }
});

// Handle prescription creation
router.post('/create/:appointmentId', requireDoctor, validatePrescription, handleValidationErrors, async (req, res) => {
    const appointmentId = req.params.appointmentId;
    const { medicineName, dosage, frequency } = req.body;
    
    // Check for validation errors
    if (req.validationErrors) {
        try {
            const appointmentDoc = await db.collection(collections.appointments).doc(appointmentId).get();
            const appointmentData = appointmentDoc.data();
            
            return res.render('prescription-form', {
                title: 'Create Prescription - MediTrack Lite',
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
            return res.redirect('/appointments/my-appointments?error=Appointment not found.');
        }
        
        const appointmentData = appointmentDoc.data();
        
        if (appointmentData.doctorId !== req.session.user.id) {
            return res.redirect('/appointments/my-appointments?error=You are not authorized to create prescription for this appointment.');
        }
        
        if (appointmentData.status !== 'Completed') {
            return res.redirect('/appointments/my-appointments?error=Prescription can only be created for completed appointments.');
        }
        
        // Check if prescription already exists
        const existingPrescription = await db.collection(collections.prescriptions)
            .where('appointmentId', '==', appointmentId)
            .get();
        
        if (!existingPrescription.empty) {
            return res.redirect('/appointments/my-appointments?error=Prescription already exists for this appointment.');
        }
        
        // Create prescription document
        const prescriptionDoc = {
            appointmentId: appointmentId,
            patientId: appointmentData.patientId,
            patientName: appointmentData.patientName,
            doctorId: req.session.user.id,
            doctorName: req.session.user.name,
            medicineName: medicineName.trim(),
            dosage: dosage.trim(),
            frequency: frequency.trim(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await db.collection(collections.prescriptions).add(prescriptionDoc);
        
        res.redirect('/appointments/my-appointments?success=Prescription created successfully!');
        
    } catch (error) {
        console.error('Error creating prescription:', error);
        res.redirect('/appointments/my-appointments?error=Failed to create prescription. Please try again.');
    }
});

// View prescription details
router.get('/view/:appointmentId', async (req, res) => {
    const appointmentId = req.params.appointmentId;
    
    try {
        const appointmentDoc = await db.collection(collections.appointments).doc(appointmentId).get();
        
        if (!appointmentDoc.exists) {
            return res.redirect('/dashboard?error=Appointment not found.');
        }
        
        const appointmentData = appointmentDoc.data();
        
        // Check if user is authorized to view this prescription
        const isAuthorized = (
            req.session.user.role === 'Patient' && appointmentData.patientId === req.session.user.id
        ) || (
            req.session.user.role === 'Doctor' && appointmentData.doctorId === req.session.user.id
        );
        
        if (!isAuthorized) {
            return res.redirect('/dashboard?error=You are not authorized to view this prescription.');
        }
        
        // Get prescription
        const prescriptionSnapshot = await db.collection(collections.prescriptions)
            .where('appointmentId', '==', appointmentId)
            .get();
        
        if (prescriptionSnapshot.empty) {
            return res.redirect('/dashboard?error=Prescription not found.');
        }
        
        const prescriptionData = prescriptionSnapshot.docs[0].data();
        
        res.render('prescription-details', {
            title: 'Prescription Details - MediTrack Lite',
            appointment: {
                id: appointmentDoc.id,
                ...appointmentData,
                appointmentDate: appointmentData.appointmentDate.toDate()
            },
            prescription: prescriptionData,
            userRole: req.session.user.role,
            error: null,
            success: null
        });
        
    } catch (error) {
        console.error('Error loading prescription details:', error);
        res.redirect('/dashboard?error=Failed to load prescription details.');
    }
});

module.exports = router;

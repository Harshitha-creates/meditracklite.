const express = require('express');
const { getAllDoctors, createAppointment, getAppointmentsByPatient, getAppointmentsByDoctor, getAllAppointments, updateAppointmentStatus } = require('../server/storage');
const { requireAuth, requirePatient, requireDoctor } = require('../middleware/auth');
const { validateAppointment, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Book appointment page (Patient only)
router.get('/book', requirePatient, async (req, res) => {
    try {
        // Get all doctors
        const doctors = await getAllDoctors();
        
        res.render('book-appointment', {
            title: 'Book Appointment - MediTrack Lite',
            doctors: doctors,
            error: null,
            success: null
        });
        
    } catch (error) {
        console.error('Error loading doctors:', error);
        res.render('book-appointment', {
            title: 'Book Appointment - MediTrack Lite',
            doctors: [],
            error: 'Failed to load doctors. Please try again.',
            success: null
        });
    }
});

// Handle appointment booking
router.post('/book', requirePatient, validateAppointment, handleValidationErrors, async (req, res) => {
    const { doctorId, appointmentDate, appointmentTime, healthConcern } = req.body;
    
    // Check for validation errors
    if (req.validationErrors) {
        try {
            const doctorsSnapshot = await db.collection(collections.users)
                .where('role', '==', 'Doctor')
                .get();
            
            const doctors = [];
            doctorsSnapshot.forEach(doc => {
                doctors.push({
                    id: doc.id,
                    name: doc.data().name
                });
            });
            
            return res.render('book-appointment', {
                title: 'Book Appointment - MediTrack Lite',
                doctors: doctors,
                error: req.validationErrors[0].msg,
                success: null
            });
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
        return;
    }
    
    try {
        // Check if patient has more than 2 appointments on the same day
        const startOfDay = new Date(appointmentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(appointmentDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existingAppointments = await db.collection(collections.appointments)
            .where('patientId', '==', req.session.user.id)
            .where('appointmentDate', '>=', startOfDay)
            .where('appointmentDate', '<=', endOfDay)
            .get();
        
        if (existingAppointments.size >= 2) {
            const doctorsSnapshot = await db.collection(collections.users)
                .where('role', '==', 'Doctor')
                .get();
            
            const doctors = [];
            doctorsSnapshot.forEach(doc => {
                doctors.push({
                    id: doc.id,
                    name: doc.data().name
                });
            });
            
            return res.render('book-appointment', {
                title: 'Book Appointment - MediTrack Lite',
                doctors: doctors,
                error: 'You cannot book more than 2 appointments on the same day.',
                success: null
            });
        }
        
        // Get doctor information
        const doctorDoc = await db.collection(collections.users).doc(doctorId).get();
        if (!doctorDoc.exists) {
            throw new Error('Doctor not found');
        }
        
        // Create appointment datetime
        const [hours, minutes] = appointmentTime.split(':');
        const appointmentDateTime = new Date(appointmentDate);
        appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Create appointment document
        const appointmentDoc = {
            patientId: req.session.user.id,
            patientName: req.session.user.name,
            doctorId: doctorId,
            doctorName: doctorDoc.data().name,
            appointmentDate: appointmentDateTime,
            healthConcern: healthConcern.trim(),
            status: 'Pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await db.collection(collections.appointments).add(appointmentDoc);
        
        res.redirect('/dashboard/patient?success=Appointment booked successfully!');
        
    } catch (error) {
        console.error('Error booking appointment:', error);
        
        try {
            const doctorsSnapshot = await db.collection(collections.users)
                .where('role', '==', 'Doctor')
                .get();
            
            const doctors = [];
            doctorsSnapshot.forEach(doc => {
                doctors.push({
                    id: doc.id,
                    name: doc.data().name
                });
            });
            
            res.render('book-appointment', {
                title: 'Book Appointment - MediTrack Lite',
                doctors: doctors,
                error: 'Failed to book appointment. Please try again.',
                success: null
            });
        } catch (loadError) {
            console.error('Error loading doctors:', loadError);
            res.render('book-appointment', {
                title: 'Book Appointment - MediTrack Lite',
                doctors: [],
                error: 'Failed to book appointment. Please try again.',
                success: null
            });
        }
    }
});

// View all appointments (shared page)
router.get('/', requireAuth, async (req, res) => {
    try {
        const appointmentsSnapshot = await db.collection(collections.appointments)
            .orderBy('createdAt', 'desc')
            .get();
        
        const appointments = [];
        appointmentsSnapshot.forEach(doc => {
            const data = doc.data();
            appointments.push({
                id: doc.id,
                ...data,
                appointmentDate: data.appointmentDate.toDate()
            });
        });
        
        res.render('appointments', {
            title: 'All Appointments - MediTrack Lite',
            appointments: appointments,
            userRole: req.session.user.role,
            error: null,
            success: null
        });
        
    } catch (error) {
        console.error('Error loading appointments:', error);
        res.render('appointments', {
            title: 'All Appointments - MediTrack Lite',
            appointments: [],
            userRole: req.session.user.role,
            error: 'Failed to load appointments. Please try again.',
            success: null
        });
    }
});

// Doctor's appointments page
router.get('/my-appointments', requireDoctor, async (req, res) => {
    try {
        const appointmentsSnapshot = await db.collection(collections.appointments)
            .where('doctorId', '==', req.session.user.id)
            .orderBy('appointmentDate', 'desc')
            .get();
        
        const appointments = [];
        appointmentsSnapshot.forEach(doc => {
            const data = doc.data();
            appointments.push({
                id: doc.id,
                ...data,
                appointmentDate: data.appointmentDate.toDate()
            });
        });
        
        res.render('my-appointments', {
            title: 'My Appointments - MediTrack Lite',
            appointments: appointments,
            error: null,
            success: null
        });
        
    } catch (error) {
        console.error('Error loading doctor appointments:', error);
        res.render('my-appointments', {
            title: 'My Appointments - MediTrack Lite',
            appointments: [],
            error: 'Failed to load appointments. Please try again.',
            success: null
        });
    }
});

// Accept appointment (Doctor only)
router.post('/accept/:id', requireDoctor, async (req, res) => {
    const appointmentId = req.params.id;
    
    try {
        // Use a transaction to prevent race conditions
        await db.runTransaction(async (transaction) => {
            const appointmentRef = db.collection(collections.appointments).doc(appointmentId);
            const appointmentDoc = await transaction.get(appointmentRef);
            
            if (!appointmentDoc.exists) {
                throw new Error('Appointment not found');
            }
            
            const appointmentData = appointmentDoc.data();
            
            if (appointmentData.status !== 'Pending') {
                throw new Error('Appointment is no longer available');
            }
            
            // Update appointment status and assign doctor
            transaction.update(appointmentRef, {
                status: 'Confirmed',
                doctorId: req.session.user.id,
                doctorName: req.session.user.name,
                updatedAt: new Date()
            });
        });
        
        res.redirect('/appointments?success=Appointment accepted successfully!');
        
    } catch (error) {
        console.error('Error accepting appointment:', error);
        res.redirect('/appointments?error=Failed to accept appointment. It may have already been accepted by another doctor.');
    }
});

// Update appointment status (Doctor only)
router.post('/update-status/:id', requireDoctor, async (req, res) => {
    const appointmentId = req.params.id;
    const { status } = req.body;
    
    // Validate status transition
    const validTransitions = {
        'Confirmed': ['In Progress'],
        'In Progress': ['Completed']
    };
    
    try {
        const appointmentRef = db.collection(collections.appointments).doc(appointmentId);
        const appointmentDoc = await appointmentRef.get();
        
        if (!appointmentDoc.exists) {
            return res.redirect('/appointments/my-appointments?error=Appointment not found.');
        }
        
        const appointmentData = appointmentDoc.data();
        
        // Check if doctor is assigned to this appointment
        if (appointmentData.doctorId !== req.session.user.id) {
            return res.redirect('/appointments/my-appointments?error=You are not authorized to update this appointment.');
        }
        
        // Check if status transition is valid
        if (!validTransitions[appointmentData.status] || !validTransitions[appointmentData.status].includes(status)) {
            return res.redirect('/appointments/my-appointments?error=Invalid status transition.');
        }
        
        await appointmentRef.update({
            status: status,
            updatedAt: new Date()
        });
        
        res.redirect('/appointments/my-appointments?success=Appointment status updated successfully!');
        
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.redirect('/appointments/my-appointments?error=Failed to update appointment status.');
    }
});

// View appointment details
router.get('/details/:id', requireAuth, async (req, res) => {
    const appointmentId = req.params.id;
    
    try {
        const appointmentDoc = await db.collection(collections.appointments).doc(appointmentId).get();
        
        if (!appointmentDoc.exists) {
            return res.redirect('/dashboard?error=Appointment not found.');
        }
        
        const appointmentData = appointmentDoc.data();
        
        // Check if user is authorized to view this appointment
        const isAuthorized = (
            req.session.user.role === 'Patient' && appointmentData.patientId === req.session.user.id
        ) || (
            req.session.user.role === 'Doctor' && appointmentData.doctorId === req.session.user.id
        );
        
        if (!isAuthorized) {
            return res.redirect('/dashboard?error=You are not authorized to view this appointment.');
        }
        
        // Get prescription if appointment is completed
        let prescription = null;
        if (appointmentData.status === 'Completed') {
            const prescriptionSnapshot = await db.collection(collections.prescriptions)
                .where('appointmentId', '==', appointmentId)
                .get();
            
            if (!prescriptionSnapshot.empty) {
                prescription = prescriptionSnapshot.docs[0].data();
            }
        }
        
        // Get feedback if appointment is completed
        let feedback = null;
        if (appointmentData.status === 'Completed') {
            const feedbackSnapshot = await db.collection(collections.feedback)
                .where('appointmentId', '==', appointmentId)
                .get();
            
            if (!feedbackSnapshot.empty) {
                feedback = feedbackSnapshot.docs[0].data();
            }
        }
        
        res.render('appointment-details', {
            title: 'Appointment Details - MediTrack Lite',
            appointment: {
                id: appointmentDoc.id,
                ...appointmentData,
                appointmentDate: appointmentData.appointmentDate.toDate()
            },
            prescription: prescription,
            feedback: feedback,
            userRole: req.session.user.role,
            error: null,
            success: null
        });
        
    } catch (error) {
        console.error('Error loading appointment details:', error);
        res.redirect('/dashboard?error=Failed to load appointment details.');
    }
});

module.exports = router;

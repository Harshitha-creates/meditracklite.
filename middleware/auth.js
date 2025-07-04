const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }
        
        if (req.session.user.role !== role) {
            return res.status(403).render('index', {
                title: 'Access Denied',
                error: 'You do not have permission to access this page.',
                success: null
            });
        }
        
        next();
    };
};

const requirePatient = requireRole('Patient');
const requireDoctor = requireRole('Doctor');

module.exports = {
    requireAuth,
    requireRole,
    requirePatient,
    requireDoctor
};

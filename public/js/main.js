// MediTrack Lite - Main JavaScript File

// Document Ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    initializeTooltips();
    initializeAlerts();
    initializeFormValidation();
    initializeDateTimeValidation();
    initializeCharacterCounters();
    initializeConfirmations();
    initializeRealTimeUpdates();
    initializeAccessibility();
}

// Initialize Bootstrap Tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Auto-dismiss alerts
function initializeAlerts() {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        if (!alert.querySelector('.btn-close')) {
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => {
                    alert.remove();
                }, 300);
            }, 5000);
        }
    });
}

// Form Validation Enhancement
function initializeFormValidation() {
    const forms = document.querySelectorAll('form[data-validate="true"], form.needs-validation');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                
                // Focus on first invalid field
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            
            form.classList.add('was-validated');
        });
        
        // Real-time validation feedback
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('is-invalid')) {
                    validateField(this);
                }
            });
        });
    });
}

// Field Validation
function validateField(field) {
    const isValid = field.checkValidity();
    
    field.classList.remove('is-valid', 'is-invalid');
    field.classList.add(isValid ? 'is-valid' : 'is-invalid');
    
    // Custom validation messages
    const feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback && !isValid) {
        feedback.textContent = getValidationMessage(field);
    }
}

// Custom Validation Messages
function getValidationMessage(field) {
    if (field.validity.valueMissing) {
        return `${getFieldLabel(field)} is required.`;
    }
    if (field.validity.typeMismatch) {
        return `Please enter a valid ${field.type}.`;
    }
    if (field.validity.tooShort) {
        return `${getFieldLabel(field)} must be at least ${field.minLength} characters.`;
    }
    if (field.validity.tooLong) {
        return `${getFieldLabel(field)} must not exceed ${field.maxLength} characters.`;
    }
    if (field.validity.patternMismatch) {
        return getPatternMessage(field);
    }
    return field.validationMessage;
}

// Get Field Label
function getFieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.replace('*', '').trim() : 'This field';
}

// Pattern-specific Messages
function getPatternMessage(field) {
    if (field.name === 'email') {
        return 'Please enter a valid @meditrack.local email address.';
    }
    if (field.name === 'password') {
        return 'Password must contain uppercase, lowercase, and number.';
    }
    return 'Please enter a valid value.';
}

// Date and Time Validation
function initializeDateTimeValidation() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const timeInputs = document.querySelectorAll('input[type="time"]');
    
    dateInputs.forEach(input => {
        input.addEventListener('change', function() {
            validateAppointmentDate(this);
        });
    });
    
    timeInputs.forEach(input => {
        input.addEventListener('change', function() {
            validateAppointmentTime(this);
        });
    });
}

// Validate Appointment Date
function validateAppointmentDate(dateInput) {
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showFieldError(dateInput, 'Appointment date cannot be in the past.');
        return false;
    }
    
    // Check if it's a weekend (optional business rule)
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        showFieldWarning(dateInput, 'Note: Weekends may have limited availability.');
    }
    
    clearFieldError(dateInput);
    return true;
}

// Validate Appointment Time
function validateAppointmentTime(timeInput) {
    const timeValue = timeInput.value;
    const [hours, minutes] = timeValue.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    
    // Business hours: 9:00 AM (540) to 5:00 PM (1020)
    const startTime = 9 * 60; // 9:00 AM
    const endTime = 17 * 60; // 5:00 PM
    
    if (timeInMinutes < startTime || timeInMinutes >= endTime) {
        showFieldError(timeInput, 'Appointment time must be between 9:00 AM and 5:00 PM.');
        return false;
    }
    
    clearFieldError(timeInput);
    return true;
}

// Show Field Error
function showFieldError(field, message) {
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    
    let feedback = field.parentNode.querySelector('.invalid-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        field.parentNode.appendChild(feedback);
    }
    feedback.textContent = message;
}

// Show Field Warning
function showFieldWarning(field, message) {
    let warning = field.parentNode.querySelector('.warning-feedback');
    if (!warning) {
        warning = document.createElement('div');
        warning.className = 'warning-feedback text-warning small mt-1';
        field.parentNode.appendChild(warning);
    }
    warning.textContent = message;
    
    setTimeout(() => {
        if (warning.parentNode) {
            warning.remove();
        }
    }, 5000);
}

// Clear Field Error
function clearFieldError(field) {
    field.classList.remove('is-invalid');
    const feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.textContent = '';
    }
}

// Character Counters
function initializeCharacterCounters() {
    const textAreas = document.querySelectorAll('textarea[maxlength]');
    
    textAreas.forEach(textarea => {
        const maxLength = textarea.getAttribute('maxlength');
        const counter = document.createElement('div');
        counter.className = 'character-counter text-muted small mt-1';
        counter.innerHTML = `<span class="current">0</span>/${maxLength} characters`;
        
        textarea.parentNode.appendChild(counter);
        
        textarea.addEventListener('input', function() {
            updateCharacterCounter(this, counter);
        });
        
        // Initialize counter
        updateCharacterCounter(textarea, counter);
    });
}

// Update Character Counter
function updateCharacterCounter(textarea, counter) {
    const current = textarea.value.length;
    const max = textarea.getAttribute('maxlength');
    const currentSpan = counter.querySelector('.current');
    
    currentSpan.textContent = current;
    
    // Color coding
    const percentage = (current / max) * 100;
    if (percentage >= 90) {
        counter.className = 'character-counter text-danger small mt-1';
    } else if (percentage >= 75) {
        counter.className = 'character-counter text-warning small mt-1';
    } else {
        counter.className = 'character-counter text-muted small mt-1';
    }
}

// Confirmation Dialogs
function initializeConfirmations() {
    const confirmButtons = document.querySelectorAll('[data-confirm]');
    
    confirmButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            const message = this.getAttribute('data-confirm');
            if (!confirm(message)) {
                event.preventDefault();
                return false;
            }
        });
    });
    
    // Form confirmations
    const confirmForms = document.querySelectorAll('form[data-confirm]');
    confirmForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            const message = this.getAttribute('data-confirm');
            if (!confirm(message)) {
                event.preventDefault();
                return false;
            }
        });
    });
}

// Real-time Updates (WebSocket or Polling)
function initializeRealTimeUpdates() {
    // Check if we're on a page that needs real-time updates
    const updateElements = document.querySelectorAll('[data-realtime="true"]');
    
    if (updateElements.length > 0) {
        // Poll for updates every 30 seconds
        setInterval(checkForUpdates, 30000);
    }
}

// Check for Updates
function checkForUpdates() {
    const currentPage = window.location.pathname;
    
    // Only update specific pages
    if (currentPage.includes('/appointments') || currentPage.includes('/dashboard')) {
        fetch(currentPage + '?partial=true', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.hasUpdates) {
                showUpdateNotification();
            }
        })
        .catch(error => {
            console.warn('Update check failed:', error);
        });
    }
}

// Show Update Notification
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'alert alert-info alert-dismissible fade show position-fixed';
    notification.style.cssText = 'top: 80px; right: 20px; z-index: 1050; min-width: 300px;';
    notification.innerHTML = `
        <i class="fas fa-sync-alt me-2"></i>
        Updates available. <a href="#" onclick="window.location.reload()" class="alert-link">Refresh page</a>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        notification.remove();
    }, 10000);
}

// Accessibility Enhancements
function initializeAccessibility() {
    // Add ARIA labels to elements that need them
    enhanceARIALabels();
    
    // Keyboard navigation
    initializeKeyboardNavigation();
    
    // Focus management
    initializeFocusManagement();
}

// Enhance ARIA Labels
function enhanceARIALabels() {
    // Status badges
    const statusBadges = document.querySelectorAll('.badge');
    statusBadges.forEach(badge => {
        if (!badge.getAttribute('aria-label')) {
            const status = badge.textContent.trim();
            badge.setAttribute('aria-label', `Status: ${status}`);
        }
    });
    
    // Star ratings
    const starRatings = document.querySelectorAll('.star-rating input');
    starRatings.forEach(input => {
        const value = input.value;
        input.setAttribute('aria-label', `Rate ${value} out of 5 stars`);
    });
}

// Keyboard Navigation
function initializeKeyboardNavigation() {
    // Table row navigation
    const tableRows = document.querySelectorAll('table tbody tr');
    tableRows.forEach((row, index) => {
        row.setAttribute('tabindex', '0');
        row.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                const link = this.querySelector('a');
                if (link) {
                    link.click();
                }
            } else if (event.key === 'ArrowDown') {
                const nextRow = tableRows[index + 1];
                if (nextRow) nextRow.focus();
            } else if (event.key === 'ArrowUp') {
                const prevRow = tableRows[index - 1];
                if (prevRow) prevRow.focus();
            }
        });
    });
}

// Focus Management
function initializeFocusManagement() {
    // Return focus to trigger element after modal close
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        let triggerElement = null;
        
        modal.addEventListener('show.bs.modal', function(event) {
            triggerElement = event.relatedTarget;
        });
        
        modal.addEventListener('hidden.bs.modal', function() {
            if (triggerElement) {
                triggerElement.focus();
            }
        });
    });
}

// Utility Functions

// Show Loading State
function showLoading(element, text = 'Loading...') {
    const spinner = document.createElement('span');
    spinner.className = 'loading me-2';
    
    element.disabled = true;
    element.classList.add('loading-state');
    
    const originalContent = element.innerHTML;
    element.innerHTML = '';
    element.appendChild(spinner);
    element.appendChild(document.createTextNode(text));
    
    return {
        hide: () => {
            element.disabled = false;
            element.classList.remove('loading-state');
            element.innerHTML = originalContent;
        }
    };
}

// Format Date for Display
function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
}

// Format Time for Display
function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show Toast Notification
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed`;
    toast.style.cssText = 'top: 100px; right: 20px; z-index: 1050;';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, { delay: duration });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Export functions for global use
window.MediTrack = {
    showLoading,
    formatDate,
    formatTime,
    showToast,
    debounce
};

// Error Handling
window.addEventListener('error', function(event) {
    console.error('JavaScript Error:', event.error);
    showToast('An error occurred. Please refresh the page.', 'danger');
});

// Unhandled Promise Rejection
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    showToast('A network error occurred. Please try again.', 'warning');
});

// Online/Offline Status
window.addEventListener('online', function() {
    showToast('Connection restored', 'success');
});

window.addEventListener('offline', function() {
    showToast('Connection lost. Some features may not work.', 'warning');
});

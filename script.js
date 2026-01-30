// Navigation functionality
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.skill-category, .portfolio-item, .service-card, .review-card, .about-text, .contact-item');
    animateElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // Animate skill bars when they come into view
    const skillBars = document.querySelectorAll('.skill-progress');
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const width = progressBar.style.width;
                progressBar.style.width = '0';
                setTimeout(() => {
                    progressBar.style.width = width;
                }, 100);
                skillObserver.unobserve(progressBar);
            }
        });
    }, { threshold: 0.5 });

    skillBars.forEach(bar => {
        skillObserver.observe(bar);
    });
});

// Contact form handling with Supabase
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        subject: document.getElementById('subject').value.trim(),
        message: document.getElementById('message').value.trim(),
        created_at: new Date().toISOString()
    };

    // Validate form data
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        showFormMessage('Please fill in all fields.', 'error');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showFormMessage('Please enter a valid email address.', 'error');
        return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    submitButton.style.opacity = '0.7';

    try {
        // Check if Supabase is configured
        const supabase = window.supabaseClient;
        if (!supabase || typeof supabase.from !== 'function') {
            throw new Error('Supabase is not configured. Please check your connection.');
        }

        // Insert data into Supabase
        const { data, error } = await supabase
            .from('contact_messages')
            .insert([formData])
            .select();

        if (error) {
            throw error;
        }

        // Success
        showFormMessage('Message sent successfully! I\'ll get back to you soon.', 'success');
        contactForm.reset();
        
        submitButton.textContent = 'Message Sent!';
        submitButton.style.backgroundColor = '#10b981';
        submitButton.style.opacity = '1';

        // Reset button after 3 seconds
        setTimeout(() => {
            submitButton.textContent = originalText;
            submitButton.style.backgroundColor = '';
            submitButton.disabled = false;
        }, 3000);

    } catch (error) {
        console.error('Error submitting form:', error);
        
        // Show error message
        showFormMessage(
            error.message || 'Failed to send message. Please try again or contact me directly at engrqasimkhan001@gmail.com',
            'error'
        );
        
        submitButton.textContent = originalText;
        submitButton.style.backgroundColor = '';
        submitButton.style.opacity = '1';
        submitButton.disabled = false;
    }
});

// Function to show form messages
function showFormMessage(message, type) {
    // Remove existing message if any
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `form-message form-message-${type}`;
    messageEl.textContent = message;
    
    // Insert before submit button
    const submitButton = contactForm.querySelector('button[type="submit"]');
    contactForm.insertBefore(messageEl, submitButton);

    // Auto remove after 5 seconds
    setTimeout(() => {
        messageEl.remove();
    }, 5000);
}

// Job Application Form Handler
const jobApplicationForm = document.getElementById('jobApplicationForm');
let resumeFile = null;

// Setup resume file upload
if (jobApplicationForm) {
    const resumeFileInput = document.getElementById('applicantResumeFile');
    const resumeUploadBtn = resumeFileInput?.closest('.file-upload-wrapper')?.querySelector('.file-upload-btn');
    
    if (resumeFileInput) {
        resumeFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                alert('Please select a PDF, DOC, or DOCX file.');
                resumeFileInput.value = '';
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Resume file size must be less than 5MB');
                resumeFileInput.value = '';
                return;
            }
            
            resumeFile = file;
            document.getElementById('resumeFileName').textContent = file.name;
        });
    }
    
    if (resumeUploadBtn) {
        resumeUploadBtn.style.cursor = 'pointer';
        resumeUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resumeFileInput?.click();
        });
    }
    
    jobApplicationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        let resumeUrl = document.getElementById('applicantResume').value.trim() || null;
        
        // Upload resume file if selected
        if (resumeFile) {
            const progressDiv = document.getElementById('resumeUploadProgress');
            const progressFill = document.getElementById('resumeProgressFill');
            const progressText = document.getElementById('resumeProgressText');
            
            progressDiv.style.display = 'block';
            
            try {
                const supabase = window.supabaseClient;
                if (!supabase || typeof supabase.storage === 'undefined') {
                    throw new Error('Supabase storage not configured');
                }
                
                const fileExt = resumeFile.name.split('.').pop();
                const fileName = `resumes/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                
                // Update progress
                if (progressFill) progressFill.style.width = '20%';
                progressText.textContent = 'Uploading resume...';
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(fileName, resumeFile, {
                        cacheControl: '3600',
                        upsert: false
                    });
                
                if (uploadError) throw uploadError;
                
                // Update progress
                if (progressFill) progressFill.style.width = '80%';
                progressText.textContent = 'Processing...';
                
                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('images')
                    .getPublicUrl(fileName);
                
                resumeUrl = urlData.publicUrl;
                
                // Complete progress
                if (progressFill) progressFill.style.width = '100%';
                progressText.textContent = 'Upload complete!';
                
                setTimeout(() => {
                    progressDiv.style.display = 'none';
                    if (progressFill) progressFill.style.width = '0%';
                }, 1000);
            } catch (error) {
                console.error('Error uploading resume:', error);
                alert('Error uploading resume: ' + error.message);
                const progressDiv = document.getElementById('resumeUploadProgress');
                if (progressDiv) progressDiv.style.display = 'none';
                return;
            }
        }
        
        const formData = {
            full_name: document.getElementById('applicantName').value.trim(),
            email: document.getElementById('applicantEmail').value.trim(),
            phone: document.getElementById('applicantPhone').value.trim() || null,
            position: document.getElementById('applicantPosition').value.trim(),
            experience_years: document.getElementById('applicantExperience').value ? parseInt(document.getElementById('applicantExperience').value) : null,
            resume_url: resumeUrl,
            cover_letter: document.getElementById('applicantCoverLetter').value.trim() || null,
            portfolio_url: document.getElementById('applicantPortfolio').value.trim() || null,
            linkedin_url: document.getElementById('applicantLinkedIn').value.trim() || null,
            github_url: document.getElementById('applicantGithub').value.trim() || null,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        // Validate required fields
        if (!formData.full_name || !formData.email || !formData.position) {
            showApplicationMessage('Please fill in all required fields (Name, Email, Position).', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showApplicationMessage('Please enter a valid email address.', 'error');
            return;
        }

        const submitButton = jobApplicationForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        submitButton.style.opacity = '0.7';

        try {
            const supabase = window.supabaseClient;
            if (!supabase || typeof supabase.from !== 'function') {
                throw new Error('Supabase is not configured. Please check your connection.');
            }

            const { data, error } = await supabase
                .from('job_applications')
                .insert([formData])
                .select();

            if (error) {
                throw error;
            }

            showApplicationMessage('Application submitted successfully! We\'ll review it and get back to you soon.', 'success');
            jobApplicationForm.reset();
            resumeFile = null;
            document.getElementById('resumeFileName').textContent = 'No file chosen';
            
            submitButton.textContent = 'Application Sent!';
            submitButton.style.backgroundColor = '#10b981';
            submitButton.style.opacity = '1';

            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.style.backgroundColor = '';
                submitButton.disabled = false;
            }, 3000);

        } catch (error) {
            console.error('Error submitting application:', error);
            showApplicationMessage(
                error.message || 'Failed to submit application. Please try again or contact us directly.',
                'error'
            );
            
            submitButton.textContent = originalText;
            submitButton.style.backgroundColor = '';
            submitButton.style.opacity = '1';
            submitButton.disabled = false;
        }
    });
}

function showApplicationMessage(message, type) {
    const messageEl = document.getElementById('applicationMessage');
    if (!messageEl) return;
    
    messageEl.className = `form-message form-message-${type}`;
    messageEl.textContent = message;
    messageEl.style.display = 'block';

    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// Active navigation link highlighting
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section[id]');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Prevent scroll when mobile menu is open (optional)
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    if (navMenu.classList.contains('active')) {
        window.scrollTo(0, lastScrollTop);
    } else {
        lastScrollTop = window.scrollY;
    }
}, { passive: false });

// Add loading animation for images (if you add real images later)
const portfolioImages = document.querySelectorAll('.portfolio-image');
portfolioImages.forEach(img => {
    img.addEventListener('load', () => {
        img.style.opacity = '1';
    });
});

// Performance optimization: Debounce scroll events
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

// Apply debounce to scroll events
const debouncedScroll = debounce(() => {
    // Scroll-based animations can go here
}, 10);

window.addEventListener('scroll', debouncedScroll);

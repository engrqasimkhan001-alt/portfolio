import { getSupabase } from '../config/supabase.js';
import { insertContactMessage, insertJobApplication, uploadResumeToStorage } from '../services/contactService.js';
import { isValidEmail } from '../utils/helpers.js';

function showFormMessage(contactForm, message, type) {
    document.querySelector('.form-message')?.remove();
    const messageEl = document.createElement('div');
    messageEl.className = `form-message form-message-${type}`;
    messageEl.textContent = message;
    const submitButton = contactForm.querySelector('button[type="submit"]');
    contactForm.insertBefore(messageEl, submitButton);
    setTimeout(() => messageEl.remove(), 5000);
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

export function initForms() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                subject: document.getElementById('subject').value.trim(),
                message: document.getElementById('message').value.trim(),
                created_at: new Date().toISOString(),
            };

            if (!formData.name || !formData.email || !formData.subject || !formData.message) {
                showFormMessage(contactForm, 'Please fill in all fields.', 'error');
                return;
            }
            if (!isValidEmail(formData.email)) {
                showFormMessage(contactForm, 'Please enter a valid email address.', 'error');
                return;
            }

            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            submitButton.style.opacity = '0.7';

            try {
                const supabase = getSupabase();
                if (!supabase || typeof supabase.from !== 'function') {
                    throw new Error('Supabase is not configured. Please check your connection.');
                }
                const { error } = await insertContactMessage(formData);
                if (error) throw error;

                showFormMessage(contactForm, "Message sent successfully! I'll get back to you soon.", 'success');
                contactForm.reset();
                submitButton.textContent = 'Message Sent!';
                submitButton.style.backgroundColor = '#10b981';
                submitButton.style.opacity = '1';
                setTimeout(() => {
                    submitButton.textContent = originalText;
                    submitButton.style.backgroundColor = '';
                    submitButton.disabled = false;
                }, 3000);
            } catch (error) {
                console.error('Error submitting form:', error);
                showFormMessage(
                    contactForm,
                    error.message ||
                        'Failed to send message. Please try again or contact me directly at engrqasimkhan001@gmail.com',
                    'error'
                );
                submitButton.textContent = originalText;
                submitButton.style.backgroundColor = '';
                submitButton.style.opacity = '1';
                submitButton.disabled = false;
            }
        });
    }

    const jobApplicationForm = document.getElementById('jobApplicationForm');
    let resumeFile = null;

    if (jobApplicationForm) {
        const resumeFileInput = document.getElementById('applicantResumeFile');
        const resumeUploadBtn = resumeFileInput?.closest('.file-upload-wrapper')?.querySelector('.file-upload-btn');

        resumeFileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];
            if (!allowedTypes.includes(file.type)) {
                alert('Please select a PDF, DOC, or DOCX file.');
                resumeFileInput.value = '';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Resume file size must be less than 5MB');
                resumeFileInput.value = '';
                return;
            }
            resumeFile = file;
            document.getElementById('resumeFileName').textContent = file.name;
        });

        resumeUploadBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resumeFileInput?.click();
        });
        if (resumeUploadBtn) resumeUploadBtn.style.cursor = 'pointer';

        jobApplicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            let resumeUrl = document.getElementById('applicantResume').value.trim() || null;

            if (resumeFile) {
                const progressDiv = document.getElementById('resumeUploadProgress');
                const progressFill = document.getElementById('resumeProgressFill');
                const progressText = document.getElementById('resumeProgressText');
                progressDiv.style.display = 'block';
                try {
                    const supabase = getSupabase();
                    if (!supabase || typeof supabase.storage === 'undefined') {
                        throw new Error('Supabase storage not configured');
                    }
                    if (progressFill) progressFill.style.width = '20%';
                    progressText.textContent = 'Uploading resume...';
                    resumeUrl = await uploadResumeToStorage(resumeFile);
                    if (progressFill) progressFill.style.width = '100%';
                    progressText.textContent = 'Upload complete!';
                    setTimeout(() => {
                        progressDiv.style.display = 'none';
                        if (progressFill) progressFill.style.width = '0%';
                    }, 1000);
                } catch (error) {
                    console.error('Error uploading resume:', error);
                    alert('Error uploading resume: ' + error.message);
                    progressDiv.style.display = 'none';
                    return;
                }
            }

            const formData = {
                full_name: document.getElementById('applicantName').value.trim(),
                email: document.getElementById('applicantEmail').value.trim(),
                phone: document.getElementById('applicantPhone').value.trim() || null,
                position: document.getElementById('applicantPosition').value.trim(),
                experience_years: document.getElementById('applicantExperience').value
                    ? parseInt(document.getElementById('applicantExperience').value, 10)
                    : null,
                resume_url: resumeUrl,
                cover_letter: document.getElementById('applicantCoverLetter').value.trim() || null,
                portfolio_url: document.getElementById('applicantPortfolio').value.trim() || null,
                linkedin_url: document.getElementById('applicantLinkedIn').value.trim() || null,
                github_url: document.getElementById('applicantGithub').value.trim() || null,
                status: 'pending',
                created_at: new Date().toISOString(),
            };

            if (!formData.full_name || !formData.email || !formData.position) {
                showApplicationMessage('Please fill in all required fields (Name, Email, Position).', 'error');
                return;
            }
            if (!isValidEmail(formData.email)) {
                showApplicationMessage('Please enter a valid email address.', 'error');
                return;
            }

            const submitButton = jobApplicationForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            submitButton.style.opacity = '0.7';

            try {
                const supabase = getSupabase();
                if (!supabase || typeof supabase.from !== 'function') {
                    throw new Error('Supabase is not configured. Please check your connection.');
                }
                const { error } = await insertJobApplication(formData);
                if (error) throw error;

                showApplicationMessage(
                    "Application submitted successfully! We'll review it and get back to you soon.",
                    'success'
                );
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
}

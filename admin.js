// Admin Panel JavaScript
const ADMIN_PASSWORD = 'Qasim@123'; // Admin panel password

let currentEditingId = null;
let projectImageFile = null;
let teamImageFile = null;
let cropper = null;
let currentCropType = null; // 'project' or 'team'
let projectImageUrls = []; // Ordered list of image URLs for current project

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    setupFileUploadListeners();
});

// Setup file upload listeners
function setupFileUploadListeners() {
    // Use event delegation for file upload buttons
    document.querySelectorAll('.file-upload-btn').forEach(btn => {
        // Remove existing listeners by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.style.cursor = 'pointer';
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const wrapper = this.closest('.file-upload-wrapper');
            const fileInput = wrapper ? wrapper.querySelector('.file-input') : null;
            if (fileInput) {
                fileInput.click();
            }
        });
    });
    
    // Setup file input change handlers
    const projectFileInput = document.getElementById('projectImageFile');
    if (projectFileInput) {
        projectFileInput.onchange = (e) => handleFileSelect(e, 'project');
    }
    
    const teamFileInput = document.getElementById('teamImageFile');
    if (teamFileInput) {
        teamFileInput.onchange = (e) => handleFileSelect(e, 'team');
    }
}

// Handle file selection
function handleFileSelect(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
    }
    
    // Store the file temporarily
    currentCropType = type;
    
    // Show crop modal
    openCropModal(file);
}

// Remove project image
function removeProjectImage() {
    projectImageFile = null;
    document.getElementById('projectImageFile').value = '';
    document.getElementById('projectFileName').textContent = 'No file chosen';
    document.getElementById('projectImagePreview').style.display = 'none';
    document.getElementById('projectPreviewImg').src = '';
}

// Remove team image
function removeTeamImage() {
    teamImageFile = null;
    document.getElementById('teamImageFile').value = '';
    document.getElementById('teamFileName').textContent = 'No file chosen';
    document.getElementById('teamImagePreview').style.display = 'none';
    document.getElementById('teamPreviewImg').src = '';
}

// Open crop modal
function openCropModal(file) {
    const modal = document.getElementById('cropModal');
    const cropImage = document.getElementById('cropImage');
    
    // Read file and show in crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
        cropImage.src = e.target.result;
        modal.classList.add('active');
        
        // Initialize cropper
        if (cropper) {
            cropper.destroy();
        }
        
        cropper = new Cropper(cropImage, {
            aspectRatio: 1, // Square crop for profile images
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
    };
    reader.readAsDataURL(file);
}

// Close crop modal
function closeCropModal() {
    const modal = document.getElementById('cropModal');
    modal.classList.remove('active');
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    currentCropType = null;
}

// Apply crop
function applyCrop() {
    if (!cropper || !currentCropType) return;
    
    // Get cropped canvas
    const canvas = cropper.getCroppedCanvas({
        width: 800,
        height: 800,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
        if (!blob) {
            alert('Error creating cropped image');
            return;
        }
        
        // Create a File object from the blob
        const fileName = `cropped-${Date.now()}.jpg`;
        const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });
        
        // Store the cropped file
        if (currentCropType === 'project') {
            projectImageFile = croppedFile;
            document.getElementById('projectFileName').textContent = fileName;
        } else {
            teamImageFile = croppedFile;
            document.getElementById('teamFileName').textContent = fileName;
        }
        
        // Show preview
        const previewUrl = URL.createObjectURL(blob);
        if (currentCropType === 'project') {
            document.getElementById('projectPreviewImg').src = previewUrl;
            document.getElementById('projectImagePreview').style.display = 'block';
        } else {
            document.getElementById('teamPreviewImg').src = previewUrl;
            document.getElementById('teamImagePreview').style.display = 'block';
        }
        
        // Close crop modal
        closeCropModal();
    }, 'image/jpeg', 0.9);
}

// Upload image to Supabase Storage with progress
async function uploadImage(file, bucket, folder, progressCallback) {
    if (!file || !window.supabaseClient) return null;
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Show progress indicator
        if (progressCallback) {
            progressCallback(10); // Start at 10%
        }
        
        const { data, error } = await window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (progressCallback) {
            progressCallback(80); // Upload complete, getting URL
        }
        
        if (error) {
            console.error('Upload error:', error);
            throw error;
        }
        
        // Get public URL
        const { data: urlData } = window.supabaseClient.storage
            .from(bucket)
            .getPublicUrl(fileName);
        
        if (progressCallback) {
            progressCallback(100); // Complete
        }
        
        return urlData.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        if (progressCallback) {
            progressCallback(0); // Reset on error
        }
        alert('Error uploading image: ' + error.message);
        return null;
    }
}

// Make functions globally available
window.removeProjectImage = removeProjectImage;
window.removeTeamImage = removeTeamImage;

// Check if user is authenticated
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (isAuthenticated) {
        showDashboard();
        loadData();
    } else {
        showLogin();
    }
}

// Show login screen
function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

// Show dashboard
function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });
    
    // Project buttons
    document.getElementById('addProjectBtn').addEventListener('click', () => openProjectModal());
    document.getElementById('closeProjectModal').addEventListener('click', closeProjectModal);
    document.getElementById('cancelProjectBtn').addEventListener('click', closeProjectModal);
    document.getElementById('projectForm').addEventListener('submit', handleProjectSubmit);
    
    // Team buttons
    document.getElementById('addTeamBtn').addEventListener('click', () => openTeamModal());
    document.getElementById('closeTeamModal').addEventListener('click', closeTeamModal);
    document.getElementById('cancelTeamBtn').addEventListener('click', closeTeamModal);
    document.getElementById('teamForm').addEventListener('submit', handleTeamSubmit);
    
    // Message modal
    document.getElementById('closeMessageModal').addEventListener('click', closeMessageModal);
    
    // Crop modal
    document.getElementById('closeCropModal').addEventListener('click', closeCropModal);
    document.getElementById('cancelCropBtn').addEventListener('click', closeCropModal);
    document.getElementById('applyCropBtn').addEventListener('click', applyCrop);
    
    // Close modals on outside click
    document.getElementById('projectModal').addEventListener('click', (e) => {
        if (e.target.id === 'projectModal') closeProjectModal();
    });
    document.getElementById('teamModal').addEventListener('click', (e) => {
        if (e.target.id === 'teamModal') closeTeamModal();
    });
    document.getElementById('messageModal').addEventListener('click', (e) => {
        if (e.target.id === 'messageModal') closeMessageModal();
    });
    document.getElementById('cropModal').addEventListener('click', (e) => {
        if (e.target.id === 'cropModal') closeCropModal();
    });
    
    // Application modal
    document.getElementById('closeApplicationModal').addEventListener('click', closeApplicationModal);
    document.getElementById('updateApplicationStatusBtn').addEventListener('click', updateApplicationStatus);
    document.getElementById('applicationModal').addEventListener('click', (e) => {
        if (e.target.id === 'applicationModal') closeApplicationModal();
    });
    
    // Application filters
    const statusFilter = document.getElementById('applicationStatusFilter');
    const positionFilter = document.getElementById('applicationPositionFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', loadApplications);
    }
    if (positionFilter) {
        positionFilter.addEventListener('change', loadApplications);
    }
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminAuthenticated', 'true');
        showDashboard();
        loadData();
        errorDiv.style.display = 'none';
    } else {
        errorDiv.textContent = 'Incorrect password. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Handle logout
function handleLogout() {
    sessionStorage.removeItem('adminAuthenticated');
    showLogin();
    document.getElementById('loginForm').reset();
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Load data for the active tab
    if (tabName === 'projects') {
        loadProjects();
    } else if (tabName === 'team') {
        loadTeam();
    } else if (tabName === 'applications') {
        loadApplications();
    } else if (tabName === 'messages') {
        loadMessages();
    }
}

// Load all data
function loadData() {
    loadProjects();
    loadTeam();
    loadApplications();
    loadMessages();
}

// ========== PROJECTS ==========
async function loadProjects() {
    const tbody = document.getElementById('projectsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Loading projects...</td></tr>';
    
    try {
        if (!window.supabaseClient) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading">Supabase not configured</td></tr>';
            return;
        }
        
        const { data, error } = await window.supabaseClient
            .from('portfolio_projects')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading">No projects yet. Click "Add Project" to get started.</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(project => `
            <tr>
                <td><strong>${project.title}</strong></td>
                <td>${project.platform}</td>
                <td>${project.technologies}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-edit" onclick="editProject(${project.id})">Edit</button>
                        <button class="btn-small btn-delete" onclick="deleteProject(${project.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading projects:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="loading">Error loading projects</td></tr>';
    }
}

function openProjectModal(projectId = null) {
    currentEditingId = projectId;
    projectImageUrls = [];
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const title = document.getElementById('projectModalTitle');
    
    if (projectId) {
        title.textContent = 'Edit Project';
        loadProjectData(projectId);
    } else {
        title.textContent = 'Add Project';
        form.reset();
        document.getElementById('projectId').value = '';
        renderProjectImagesList();
    }
    
    modal.classList.add('active');
    
    setTimeout(() => {
        setupFileUploadListeners();
    }, 100);
}

function renderProjectImagesList() {
    const listEl = document.getElementById('projectImagesList');
    if (!listEl) return;
    const emptyText = listEl.getAttribute('data-empty-text') || 'No images yet.';
    
    if (!projectImageUrls.length) {
        listEl.innerHTML = `<div class="project-images-empty">${emptyText}</div>`;
        listEl.classList.remove('has-items');
        return;
    }
    
    listEl.classList.add('has-items');
    listEl.innerHTML = projectImageUrls.map((url, index) => `
        <div class="project-image-item" draggable="true" data-index="${index}">
            <span class="project-image-drag" title="Drag to reorder">⋮⋮</span>
            <img src="${url}" alt="Project image ${index + 1}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22>?</text></svg>'">
            <button type="button" class="project-image-remove" onclick="removeProjectImageByIndex(${index})" title="Remove">✕</button>
        </div>
    `).join('');
    
    setupProjectImagesDragDrop();
}

function setupProjectImagesDragDrop() {
    const listEl = document.getElementById('projectImagesList');
    if (!listEl) return;
    
    const items = listEl.querySelectorAll('.project-image-item');
    let draggedIndex = null;
    
    items.forEach((item, index) => {
        item.setAttribute('data-index', index);
        item.addEventListener('dragstart', (e) => {
            draggedIndex = index;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            listEl.querySelectorAll('.project-image-item').forEach(i => i.classList.remove('drag-over'));
            draggedIndex = null;
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (index !== draggedIndex) item.classList.add('drag-over');
        });
        item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            if (draggedIndex === null || draggedIndex === index) return;
            const urls = [...projectImageUrls];
            const [removed] = urls.splice(draggedIndex, 1);
            urls.splice(index, 0, removed);
            projectImageUrls = urls;
            renderProjectImagesList();
        });
    });
}

function removeProjectImageByIndex(index) {
    projectImageUrls.splice(index, 1);
    renderProjectImagesList();
}

window.removeProjectImageByIndex = removeProjectImageByIndex;

function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('active');
    document.getElementById('projectForm').reset();
    currentEditingId = null;
}

async function loadProjectData(id) {
    try {
        const { data, error } = await window.supabaseClient
            .from('portfolio_projects')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('projectId').value = data.id;
        document.getElementById('projectTitle').value = data.title;
        document.getElementById('projectDescription').value = data.description;
        document.getElementById('projectPlatform').value = data.platform;
        document.getElementById('projectTechnologies').value = data.technologies;
        document.getElementById('projectImageUrl').value = '';
        document.getElementById('projectLink').value = data.project_link || '';
        
        // Support both image_urls (array) and legacy image_url
        if (data.image_urls && Array.isArray(data.image_urls) && data.image_urls.length > 0) {
            projectImageUrls = [...data.image_urls];
        } else if (data.image_url) {
            projectImageUrls = [data.image_url];
        } else {
            projectImageUrls = [];
        }
        renderProjectImagesList();
    } catch (error) {
        console.error('Error loading project:', error);
        alert('Error loading project data');
    }
}

async function handleProjectSubmit(e) {
    e.preventDefault();
    
    const projectId = document.getElementById('projectId').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    try {
        if (!window.supabaseClient) {
            throw new Error('Supabase not configured');
        }
        
        // Add pasted URL to list if provided
        const pastedUrl = document.getElementById('projectImageUrl').value.trim();
        if (pastedUrl) projectImageUrls.push(pastedUrl);
        
        // Handle image upload if file selected
        if (projectImageFile) {
            const progressDiv = document.getElementById('projectUploadProgress');
            const progressBar = document.getElementById('projectProgressBar');
            const progressText = document.getElementById('projectProgressText');
            progressDiv.style.display = 'block';
            
            submitBtn.textContent = 'Uploading image...';
            const progressFill = document.getElementById('projectProgressFill');
            const uploadedUrl = await uploadImage(projectImageFile, 'images', 'projects', (progress) => {
                if (progressFill) progressFill.style.width = progress + '%';
                if (progress < 50) progressText.textContent = 'Uploading... ' + progress + '%';
                else if (progress < 100) progressText.textContent = 'Processing... ' + progress + '%';
                else progressText.textContent = 'Complete!';
            });
            
            setTimeout(() => {
                progressDiv.style.display = 'none';
                const fill = document.getElementById('projectProgressFill');
                if (fill) fill.style.width = '0%';
            }, 1000);
            
            if (uploadedUrl) projectImageUrls.push(uploadedUrl);
        }
        
        const formData = {
            title: document.getElementById('projectTitle').value.trim(),
            description: document.getElementById('projectDescription').value.trim(),
            platform: document.getElementById('projectPlatform').value,
            technologies: document.getElementById('projectTechnologies').value.trim(),
            image_url: projectImageUrls[0] || null,
            image_urls: projectImageUrls,
            project_link: document.getElementById('projectLink').value.trim() || null,
        };
        
        submitBtn.textContent = 'Saving...';
        
        let result;
        if (projectId) {
            // Update
            result = await window.supabaseClient
                .from('portfolio_projects')
                .update(formData)
                .eq('id', projectId);
        } else {
            // Insert
            result = await window.supabaseClient
                .from('portfolio_projects')
                .insert([formData]);
        }
        
        if (result.error) throw result.error;
        
        // Reset file input
        projectImageFile = null;
        removeProjectImage();
        
        closeProjectModal();
        loadProjects();
        alert(projectId ? 'Project updated successfully!' : 'Project added successfully!');
    } catch (error) {
        console.error('Error saving project:', error);
        alert('Error saving project: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
        if (!window.supabaseClient) {
            throw new Error('Supabase not configured');
        }
        
        const { error } = await window.supabaseClient
            .from('portfolio_projects')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        loadProjects();
        alert('Project deleted successfully!');
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project: ' + error.message);
    }
}

// Make deleteProject available globally immediately
window.deleteProject = deleteProject;

function editProject(id) {
    openProjectModal(id);
}

// ========== TEAM ==========
async function loadTeam() {
    const tbody = document.getElementById('teamTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Loading team members...</td></tr>';
    
    try {
        if (!window.supabaseClient) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading">Supabase not configured</td></tr>';
            return;
        }
        
        const { data, error } = await window.supabaseClient
            .from('team_members')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading">No team members yet. Click "Add Team Member" to get started.</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(member => `
            <tr>
                <td><strong>${member.name}</strong></td>
                <td>${member.role}</td>
                <td>${member.email || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-edit" onclick="editTeamMember(${member.id})">Edit</button>
                        <button class="btn-small btn-delete" onclick="deleteTeamMember(${member.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading team:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="loading">Error loading team members</td></tr>';
    }
}

function openTeamModal(memberId = null) {
    currentEditingId = memberId;
    const modal = document.getElementById('teamModal');
    const form = document.getElementById('teamForm');
    const title = document.getElementById('teamModalTitle');
    
    if (memberId) {
        title.textContent = 'Edit Team Member';
        loadTeamData(memberId);
    } else {
        title.textContent = 'Add Team Member';
        form.reset();
        document.getElementById('teamId').value = '';
    }
    
    modal.classList.add('active');
    
    // Re-setup file upload listeners when modal opens (in case they weren't initialized)
    setTimeout(() => {
        setupFileUploadListeners();
    }, 100);
}

function closeTeamModal() {
    document.getElementById('teamModal').classList.remove('active');
    document.getElementById('teamForm').reset();
    currentEditingId = null;
}

async function loadTeamData(id) {
    try {
        const { data, error } = await window.supabaseClient
            .from('team_members')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('teamId').value = data.id;
        document.getElementById('teamName').value = data.name;
        document.getElementById('teamRole').value = data.role;
        document.getElementById('teamBio').value = data.bio;
        document.getElementById('teamEmail').value = data.email || '';
        document.getElementById('teamImageUrl').value = data.image_url || '';
        document.getElementById('teamLinkedIn').value = data.linkedin_url || '';
        document.getElementById('teamGithub').value = data.github_url || '';
    } catch (error) {
        console.error('Error loading team member:', error);
        alert('Error loading team member data');
    }
}

async function handleTeamSubmit(e) {
    e.preventDefault();
    
    const memberId = document.getElementById('teamId').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    try {
        if (!window.supabaseClient) {
            throw new Error('Supabase not configured');
        }
        
        // Handle image upload if file selected
        let imageUrl = document.getElementById('teamImageUrl').value.trim() || null;
        
        if (teamImageFile) {
            // Show progress indicator
            const progressDiv = document.getElementById('teamUploadProgress');
            const progressBar = document.getElementById('teamProgressBar');
            const progressText = document.getElementById('teamProgressText');
            progressDiv.style.display = 'block';
            
            submitBtn.textContent = 'Uploading photo...';
            const progressFill = document.getElementById('teamProgressFill');
            const uploadedUrl = await uploadImage(teamImageFile, 'images', 'team', (progress) => {
                if (progressFill) {
                    progressFill.style.width = progress + '%';
                }
                if (progress < 50) {
                    progressText.textContent = 'Uploading... ' + progress + '%';
                } else if (progress < 100) {
                    progressText.textContent = 'Processing... ' + progress + '%';
                } else {
                    progressText.textContent = 'Complete!';
                }
            });
            
            // Hide progress after a short delay
            setTimeout(() => {
                progressDiv.style.display = 'none';
                const fill = document.getElementById('teamProgressFill');
                if (fill) fill.style.width = '0%';
            }, 1000);
            
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            }
        }
        
        const formData = {
            name: document.getElementById('teamName').value.trim(),
            role: document.getElementById('teamRole').value.trim(),
            bio: document.getElementById('teamBio').value.trim(),
            email: document.getElementById('teamEmail').value.trim() || null,
            image_url: imageUrl,
            linkedin_url: document.getElementById('teamLinkedIn').value.trim() || null,
            github_url: document.getElementById('teamGithub').value.trim() || null,
            active: true,
        };
        
        submitBtn.textContent = 'Saving...';
        
        let result;
        if (memberId) {
            // Update
            result = await window.supabaseClient
                .from('team_members')
                .update(formData)
                .eq('id', memberId);
        } else {
            // Insert
            result = await window.supabaseClient
                .from('team_members')
                .insert([formData]);
        }
        
        if (result.error) throw result.error;
        
        // Reset file input
        teamImageFile = null;
        removeTeamImage();
        
        closeTeamModal();
        loadTeam();
        alert(memberId ? 'Team member updated successfully!' : 'Team member added successfully!');
    } catch (error) {
        console.error('Error saving team member:', error);
        alert('Error saving team member: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function deleteTeamMember(id) {
    if (!confirm('Are you sure you want to delete this team member? This action cannot be undone.')) return;
    
    try {
        if (!window.supabaseClient) {
            throw new Error('Supabase not configured');
        }
        
        const { error } = await window.supabaseClient
            .from('team_members')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        loadTeam();
        alert('Team member deleted successfully!');
    } catch (error) {
        console.error('Error deleting team member:', error);
        alert('Error deleting team member: ' + error.message);
    }
}

// Make deleteTeamMember available globally immediately
window.deleteTeamMember = deleteTeamMember;

function editTeamMember(id) {
    openTeamModal(id);
}

// ========== APPLICATIONS ==========
let currentApplicationId = null;

async function loadApplications() {
    const tbody = document.getElementById('applicationsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading applications...</td></tr>';
    
    try {
        if (!window.supabaseClient) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Supabase not configured</td></tr>';
            return;
        }
        
        const statusFilter = document.getElementById('applicationStatusFilter')?.value || '';
        const positionFilter = document.getElementById('applicationPositionFilter')?.value || '';
        
        let query = window.supabaseClient
            .from('job_applications')
            .select('*');
        
        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }
        if (positionFilter) {
            query = query.eq('position', positionFilter);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">No applications yet.</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(app => {
            const statusClass = {
                'pending': 'status-pending',
                'reviewed': 'status-reviewed',
                'shortlisted': 'status-shortlisted',
                'rejected': 'status-rejected',
                'hired': 'status-hired'
            }[app.status] || '';
            
            return `
                <tr>
                    <td><strong>${app.full_name}</strong></td>
                    <td>${app.email}</td>
                    <td>${app.position}</td>
                    <td>${app.experience_years ? app.experience_years + ' years' : '-'}</td>
                    <td><span class="status-badge ${statusClass}">${app.status}</span></td>
                    <td>${new Date(app.created_at).toLocaleDateString()}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-small btn-view" onclick="viewApplication(${app.id})">View</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading applications:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Error loading applications</td></tr>';
    }
}

async function viewApplication(id) {
    try {
        currentApplicationId = id;
        const { data, error } = await window.supabaseClient
            .from('job_applications')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const content = document.getElementById('applicationContent');
        content.innerHTML = `
            <div class="application-detail">
                <label>Full Name:</label>
                <p>${data.full_name}</p>
            </div>
            <div class="application-detail">
                <label>Email:</label>
                <p><a href="mailto:${data.email}">${data.email}</a></p>
            </div>
            <div class="application-detail">
                <label>Phone:</label>
                <p>${data.phone || '-'}</p>
            </div>
            <div class="application-detail">
                <label>Position:</label>
                <p><strong>${data.position}</strong></p>
            </div>
            <div class="application-detail">
                <label>Experience:</label>
                <p>${data.experience_years ? data.experience_years + ' years' : 'Not specified'}</p>
            </div>
            ${data.resume_url ? `
            <div class="application-detail">
                <label>Resume:</label>
                <p><a href="${data.resume_url}" target="_blank" rel="noopener">View Resume →</a></p>
            </div>
            ` : ''}
            ${data.cover_letter ? `
            <div class="application-detail">
                <label>Cover Letter:</label>
                <div class="application-text">${data.cover_letter}</div>
            </div>
            ` : ''}
            ${data.portfolio_url ? `
            <div class="application-detail">
                <label>Portfolio:</label>
                <p><a href="${data.portfolio_url}" target="_blank" rel="noopener">${data.portfolio_url}</a></p>
            </div>
            ` : ''}
            ${data.linkedin_url ? `
            <div class="application-detail">
                <label>LinkedIn:</label>
                <p><a href="${data.linkedin_url}" target="_blank" rel="noopener">${data.linkedin_url}</a></p>
            </div>
            ` : ''}
            ${data.github_url ? `
            <div class="application-detail">
                <label>GitHub:</label>
                <p><a href="${data.github_url}" target="_blank" rel="noopener">${data.github_url}</a></p>
            </div>
            ` : ''}
            <div class="application-detail">
                <label>Applied On:</label>
                <p>${new Date(data.created_at).toLocaleString()}</p>
            </div>
            ${data.notes ? `
            <div class="application-detail">
                <label>Admin Notes:</label>
                <div class="application-text">${data.notes}</div>
            </div>
            ` : ''}
        `;
        
        document.getElementById('applicationStatusSelect').value = data.status;
        document.getElementById('applicationModal').classList.add('active');
    } catch (error) {
        console.error('Error loading application:', error);
        alert('Error loading application');
    }
}

async function updateApplicationStatus() {
    if (!currentApplicationId) return;
    
    const newStatus = document.getElementById('applicationStatusSelect').value;
    const submitBtn = document.getElementById('updateApplicationStatusBtn');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
    try {
        const { error } = await window.supabaseClient
            .from('job_applications')
            .update({ status: newStatus })
            .eq('id', currentApplicationId);
        
        if (error) throw error;
        
        alert('Application status updated successfully!');
        closeApplicationModal();
        loadApplications();
    } catch (error) {
        console.error('Error updating application status:', error);
        alert('Error updating status: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function closeApplicationModal() {
    document.getElementById('applicationModal').classList.remove('active');
    currentApplicationId = null;
}

window.viewApplication = viewApplication;

// ========== MESSAGES ==========
async function loadMessages() {
    const tbody = document.getElementById('messagesTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading messages...</td></tr>';
    
    try {
        if (!window.supabaseClient) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Supabase not configured</td></tr>';
            return;
        }
        
        const { data, error } = await window.supabaseClient
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">No messages yet.</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(msg => `
            <tr style="${msg.read ? '' : 'background-color: #fef3c7;'}">
                <td><strong>${msg.name}</strong></td>
                <td>${msg.email}</td>
                <td>${msg.subject}</td>
                <td>${new Date(msg.created_at).toLocaleDateString()}</td>
                <td>${msg.read ? '✓' : '✗'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-view" onclick="viewMessage(${msg.id})">View</button>
                        ${!msg.read ? `<button class="btn-small btn-edit" onclick="markAsRead(${msg.id})">Mark Read</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading messages:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Error loading messages</td></tr>';
    }
}

async function viewMessage(id) {
    try {
        const { data, error } = await window.supabaseClient
            .from('contact_messages')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const content = document.getElementById('messageContent');
        content.innerHTML = `
            <div class="message-detail">
                <label>From:</label>
                <p>${data.name} (${data.email})</p>
            </div>
            <div class="message-detail">
                <label>Subject:</label>
                <p>${data.subject}</p>
            </div>
            <div class="message-detail">
                <label>Date:</label>
                <p>${new Date(data.created_at).toLocaleString()}</p>
            </div>
            <div class="message-detail">
                <label>Message:</label>
                <div class="message-text">${data.message}</div>
            </div>
        `;
        
        document.getElementById('messageModal').classList.add('active');
        
        // Mark as read
        if (!data.read) {
            await markAsRead(id);
        }
    } catch (error) {
        console.error('Error loading message:', error);
        alert('Error loading message');
    }
}

async function markAsRead(id) {
    try {
        const { error } = await window.supabaseClient
            .from('contact_messages')
            .update({ read: true })
            .eq('id', id);
        
        if (error) throw error;
        
        loadMessages();
    } catch (error) {
        console.error('Error marking message as read:', error);
        alert('Error updating message');
    }
}

function closeMessageModal() {
    document.getElementById('messageModal').classList.remove('active');
}

// Make functions globally available for onclick handlers
window.editProject = editProject;
window.deleteProject = deleteProject;
window.editTeamMember = editTeamMember;
window.deleteTeamMember = deleteTeamMember;
window.viewMessage = viewMessage;
window.markAsRead = markAsRead;
window.removeProjectImage = removeProjectImage;
window.removeTeamImage = removeTeamImage;

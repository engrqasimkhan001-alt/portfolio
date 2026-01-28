// Admin Panel JavaScript
const ADMIN_PASSWORD = 'wOs2024Admin!'; // Change this to your secure password

let currentEditingId = null;
let projectImageFile = null;
let teamImageFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    setupFileUploadListeners();
});

// Setup file upload listeners
function setupFileUploadListeners() {
    // Project image file input
    const projectFileInput = document.getElementById('projectImageFile');
    if (projectFileInput) {
        projectFileInput.addEventListener('change', (e) => {
            handleFileSelect(e, 'project');
        });
    }
    
    // Team image file input
    const teamFileInput = document.getElementById('teamImageFile');
    if (teamFileInput) {
        teamFileInput.addEventListener('change', (e) => {
            handleFileSelect(e, 'team');
        });
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
    
    // Store the file
    if (type === 'project') {
        projectImageFile = file;
        document.getElementById('projectFileName').textContent = file.name;
    } else {
        teamImageFile = file;
        document.getElementById('teamFileName').textContent = file.name;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        if (type === 'project') {
            document.getElementById('projectPreviewImg').src = e.target.result;
            document.getElementById('projectImagePreview').style.display = 'block';
        } else {
            document.getElementById('teamPreviewImg').src = e.target.result;
            document.getElementById('teamImagePreview').style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
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

// Upload image to Supabase Storage
async function uploadImage(file, bucket, folder) {
    if (!file || !window.supabaseClient) return null;
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('Upload error:', error);
            throw error;
        }
        
        // Get public URL
        const { data: urlData } = window.supabaseClient.storage
            .from(bucket)
            .getPublicUrl(fileName);
        
        return urlData.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
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
    } else if (tabName === 'messages') {
        loadMessages();
    }
}

// Load all data
function loadData() {
    loadProjects();
    loadTeam();
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
    }
    
    modal.classList.add('active');
}

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
        document.getElementById('projectImageUrl').value = data.image_url || '';
        document.getElementById('projectLink').value = data.project_link || '';
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
        
        // Handle image upload if file selected
        let imageUrl = document.getElementById('projectImageUrl').value.trim() || null;
        
        if (projectImageFile) {
            submitBtn.textContent = 'Uploading image...';
            const uploadedUrl = await uploadImage(projectImageFile, 'images', 'projects');
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            }
        }
        
        const formData = {
            title: document.getElementById('projectTitle').value.trim(),
            description: document.getElementById('projectDescription').value.trim(),
            platform: document.getElementById('projectPlatform').value,
            technologies: document.getElementById('projectTechnologies').value.trim(),
            image_url: imageUrl,
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
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
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
            submitBtn.textContent = 'Uploading photo...';
            const uploadedUrl = await uploadImage(teamImageFile, 'images', 'team');
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
    if (!confirm('Are you sure you want to delete this team member?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('team_members')
            .update({ active: false })
            .eq('id', id);
        
        if (error) throw error;
        
        loadTeam();
        alert('Team member deleted successfully!');
    } catch (error) {
        console.error('Error deleting team member:', error);
        alert('Error deleting team member: ' + error.message);
    }
}

function editTeamMember(id) {
    openTeamModal(id);
}

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

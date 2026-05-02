// Admin Panel JavaScript (loaded as ES module via admin.js)
import { validateAdminPassword } from './services/authService.js';
import { PORTFOLIO_SITE_PROJECTS } from './data/portfolioSiteProjects.js';

let currentEditingId = null;
let teamImageFile = null;
let blogCoverFile = null;
let blogCoverBlobUrl = null;
let blogSlugManuallyEdited = false;
let blogPublishedAtExisting = null;
let blogExistingCoverUrl = null;
let cropper = null;
let cropPreviewRaf = null;
let cropZoomSliderLast = 100;
let cropZoomSliderDragging = false;
let cropToolbarBound = false;

function scheduleCropPreviewThumb() {
    if (cropPreviewRaf) cancelAnimationFrame(cropPreviewRaf);
    cropPreviewRaf = requestAnimationFrame(() => {
        cropPreviewRaf = null;
        if (!cropper) return;
        const thumb = document.getElementById('cropPreviewThumb');
        if (!thumb) return;
        try {
            const c = cropper.getCroppedCanvas({
                maxWidth: 220,
                maxHeight: 220,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });
            if (!c || !c.width) return;
            thumb.style.backgroundImage = `url(${c.toDataURL('image/jpeg', 0.88)})`;
        } catch {
            /* ignore */
        }
    });
}

function syncCropZoomSliderFromCropper() {
    if (!cropper || cropZoomSliderDragging) return;
    const img = cropper.getImageData();
    const canvas = cropper.getCanvasData();
    if (!img.width || !canvas.width) return;
    const ratio = canvas.width / img.width;
    const pct = Math.round(Math.min(300, Math.max(100, ratio * 100)));
    const range = document.getElementById('cropZoomRange');
    if (range) {
        range.value = String(pct);
        cropZoomSliderLast = pct;
    }
}

function setActiveCropRatioButton(mode) {
    document.querySelectorAll('.crop-ratio-btn').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.aspect === mode);
    });
}

function setupCropToolbarListeners() {
    if (cropToolbarBound) return;
    cropToolbarBound = true;

    const range = document.getElementById('cropZoomRange');
    if (range) {
        range.addEventListener('pointerdown', () => {
            cropZoomSliderDragging = true;
        });
        range.addEventListener('pointerup', () => {
            cropZoomSliderDragging = false;
            cropZoomSliderLast = range.valueAsNumber;
        });
        range.addEventListener('input', () => {
            if (!cropper) return;
            const v = range.valueAsNumber;
            const delta = (v - cropZoomSliderLast) * 0.004;
            cropper.zoom(delta);
            cropZoomSliderLast = v;
        });
    }

    document.getElementById('cropZoomIn')?.addEventListener('click', () => {
        if (cropper) cropper.zoom(0.12);
    });
    document.getElementById('cropZoomOut')?.addEventListener('click', () => {
        if (cropper) cropper.zoom(-0.12);
    });
    document.getElementById('cropRotateLeft')?.addEventListener('click', () => {
        if (cropper) cropper.rotate(-90);
    });
    document.getElementById('cropRotateRight')?.addEventListener('click', () => {
        if (cropper) cropper.rotate(90);
    });
    document.getElementById('cropResetBtn')?.addEventListener('click', () => {
        if (!cropper) return;
        cropper.reset();
        cropper.setAspectRatio(NaN);
        setActiveCropRatioButton('free');
        const r = document.getElementById('cropZoomRange');
        if (r) {
            r.value = '100';
            cropZoomSliderLast = 100;
        }
        scheduleCropPreviewThumb();
    });

    document.querySelector('.crop-ratio-btns')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.crop-ratio-btn');
        if (!btn || !cropper) return;
        const key = btn.dataset.aspect || 'free';
        setActiveCropRatioButton(key);
        let ar = NaN;
        if (key === '1') ar = 1;
        else if (key === '1.7778') ar = 16 / 9;
        else if (key === '1.3333') ar = 4 / 3;
        cropper.setAspectRatio(ar);
        scheduleCropPreviewThumb();
    });
}
let currentCropType = null; // 'project' or 'team'

/** @type {{ previewUrl: string, remoteUrl: string | null, uploadFile: File | null, originalFile: File | null, fileName: string }[]} */
let projectImageItems = [];
let pendingProjectCropFiles = [];
let pendingProjectCropIndex = 0;
let pendingReeditIndex = null;
let cropSessionOriginalFile = null;
let cropModalLoadId = 0;

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

    const blogCoverInput = document.getElementById('blogCoverImageFile');
    if (blogCoverInput) {
        blogCoverInput.onchange = (e) => handleFileSelect(e, 'blog');
    }
}

const MAX_PROJECT_IMAGE_BYTES = 5 * 1024 * 1024;

function resetProjectFilePicker() {
    const input = document.getElementById('projectImageFile');
    if (input) input.value = '';
    const fn = document.getElementById('projectFileName');
    if (fn) fn.textContent = 'No file chosen';
}

function updateProjectFileInputLabel() {
    const fn = document.getElementById('projectFileName');
    if (!fn) return;
    if (pendingProjectCropFiles.length && pendingProjectCropIndex < pendingProjectCropFiles.length) {
        fn.textContent = `Cropping ${pendingProjectCropIndex + 1} of ${pendingProjectCropFiles.length}…`;
        return;
    }
    const n = projectImageItems.length;
    fn.textContent = n ? `${n} image(s) in gallery` : 'No file chosen';
}

function escapeAttr(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function revokeProjectItemBlob(item) {
    if (item?.previewUrl?.startsWith('blob:')) {
        try {
            URL.revokeObjectURL(item.previewUrl);
        } catch {
            /* ignore */
        }
    }
}

function revokeAllProjectImageBlobs() {
    projectImageItems.forEach(revokeProjectItemBlob);
}

function normalizeImageUrlsFromProjectRow(data) {
    let raw = data?.image_urls;
    if (typeof raw === 'string') {
        try {
            raw = JSON.parse(raw);
        } catch {
            raw = [];
        }
    }
    let list = [];
    if (Array.isArray(raw) && raw.length) {
        list = raw.map(String).filter(Boolean);
    } else if (data?.image_url) {
        list = [String(data.image_url)];
    }
    return dedupeUrlsPreserveOrder(list);
}

/** Same URL twice (e.g. legacy `image_url` duplicated in `image_urls`) — keep first occurrence only. */
function dedupeUrlsPreserveOrder(urls) {
    const seen = new Set();
    const out = [];
    for (const u of urls) {
        const s = typeof u === 'string' ? u.trim() : String(u ?? '').trim();
        if (!s || seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }
    return out;
}

// Handle file selection
function handleFileSelect(event, type) {
    if (type === 'team') {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        if (file.size > MAX_PROJECT_IMAGE_BYTES) {
            alert('Image size must be less than 5MB');
            return;
        }
        currentCropType = 'team';
        openCropModal(file);
        event.target.value = '';
        return;
    }

    if (type === 'blog') {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        if (file.size > MAX_PROJECT_IMAGE_BYTES) {
            alert('Image size must be less than 5MB');
            return;
        }
        currentCropType = 'blog';
        openCropModal(file);
        event.target.value = '';
        return;
    }

    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (!files.length) return;

    const valid = [];
    const skipped = [];
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            skipped.push(file.name || 'unnamed');
            console.warn('Skipped non-image file:', file.name);
            continue;
        }
        if (file.size > MAX_PROJECT_IMAGE_BYTES) {
            skipped.push(file.name || 'unnamed');
            console.warn('Skipped file over 5MB:', file.name);
            continue;
        }
        valid.push(file);
    }

    if (!valid.length) {
        alert('No valid images selected. Use image files under 5MB each.');
        return;
    }

    if (skipped.length) {
        console.warn(
            skipped.length === 1
                ? 'Skipped file (not an image or over 5MB):'
                : `Skipped ${skipped.length} files (not images or over 5MB):`,
            skipped.join(', ')
        );
        const msg =
            skipped.length === 1
                ? `1 file was skipped (not an image or over 5MB). Cropping ${valid.length} image(s).`
                : `${skipped.length} files were skipped (not images or over 5MB). Cropping ${valid.length} image(s).`;
        alert(msg);
    }

    pendingProjectCropFiles = valid;
    pendingProjectCropIndex = 0;
    pendingReeditIndex = null;
    currentCropType = 'project';
    updateProjectFileInputLabel();
    openCropModal(valid[0]);
}

// Clear file picker (gallery thumbnails stay unless removed individually)
function removeProjectImage() {
    resetProjectFilePicker();
    const cropOpen = document.getElementById('cropModal')?.classList.contains('active');
    if (!cropOpen) {
        pendingProjectCropFiles = [];
        pendingProjectCropIndex = 0;
    }
    updateProjectFileInputLabel();
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
    cropSessionOriginalFile = file instanceof File ? file : null;

    const modal = document.getElementById('cropModal');
    const cropImage = document.getElementById('cropImage');
    const thumb = document.getElementById('cropPreviewThumb');
    const range = document.getElementById('cropZoomRange');
    const loadId = ++cropModalLoadId;

    if (cropper) {
        cropper.destroy();
        cropper = null;
    }

    if (thumb) {
        thumb.style.backgroundImage = '';
    }
    if (range) {
        range.value = '100';
        cropZoomSliderLast = 100;
    }
    setActiveCropRatioButton('free');

    const reader = new FileReader();
    reader.onload = (e) => {
        if (loadId !== cropModalLoadId) {
            return;
        }
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        cropImage.removeAttribute('style');
        cropImage.src = '';
        cropImage.src = e.target.result;
        modal.classList.add('active');

        requestAnimationFrame(() => {
            cropper = new Cropper(cropImage, {
                viewMode: 2,
                dragMode: 'move',
                autoCropArea: 1,
                restore: false,
                guides: true,
                center: true,
                highlight: true,
                background: true,
                movable: true,
                rotatable: true,
                scalable: true,
                zoomable: true,
                zoomOnTouch: true,
                zoomOnWheel: true,
                wheelZoomRatio: 0.085,
                responsive: true,
                checkOrientation: true,
                toggleDragModeOnDblclick: false,
                aspectRatio: NaN,
                cropBoxMovable: true,
                cropBoxResizable: true,
                minCropBoxWidth: 20,
                minCropBoxHeight: 20,
                crop: () => {
                    scheduleCropPreviewThumb();
                    syncCropZoomSliderFromCropper();
                },
                ready: () => {
                    scheduleCropPreviewThumb();
                    syncCropZoomSliderFromCropper();
                },
            });
        });
    };
    reader.readAsDataURL(file);
}

// Close crop modal
function closeCropModal(options = {}) {
    const { keepProjectCropQueue = false } = options;
    const modal = document.getElementById('cropModal');
    modal.classList.remove('active');
    if (cropPreviewRaf) {
        cancelAnimationFrame(cropPreviewRaf);
        cropPreviewRaf = null;
    }
    const thumb = document.getElementById('cropPreviewThumb');
    if (thumb) thumb.style.backgroundImage = '';
    const range = document.getElementById('cropZoomRange');
    if (range) {
        range.value = '100';
        cropZoomSliderLast = 100;
    }
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    if (!keepProjectCropQueue && currentCropType === 'project' && pendingProjectCropFiles.length) {
        pendingProjectCropFiles = [];
        pendingProjectCropIndex = 0;
        updateProjectFileInputLabel();
    }
    if (!keepProjectCropQueue) {
        pendingReeditIndex = null;
    }
    currentCropType = null;
    cropSessionOriginalFile = null;
}

// Apply crop
function applyCrop() {
    if (!cropper || !currentCropType) return;

    const canvas = cropper.getCroppedCanvas({
        maxWidth: 4096,
        maxHeight: 4096,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });
    if (!canvas || !canvas.width) {
        alert('Could not read crop. Try resetting or adjusting the crop area.');
        return;
    }

    canvas.toBlob((blob) => {
        if (!blob) {
            alert('Error creating cropped image');
            return;
        }

        const fileName = `cropped-${Date.now()}.jpg`;
        const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });

        if (currentCropType === 'team') {
            teamImageFile = croppedFile;
            document.getElementById('teamFileName').textContent = fileName;
            const previewUrl = URL.createObjectURL(blob);
            document.getElementById('teamPreviewImg').src = previewUrl;
            document.getElementById('teamImagePreview').style.display = 'block';
            closeCropModal();
            return;
        }

        if (currentCropType === 'blog') {
            blogCoverFile = croppedFile;
            if (blogCoverBlobUrl) {
                try {
                    URL.revokeObjectURL(blogCoverBlobUrl);
                } catch {
                    /* ignore */
                }
            }
            blogCoverBlobUrl = URL.createObjectURL(blob);
            const prev = document.getElementById('blogCoverPreview');
            const img = document.getElementById('blogCoverPreviewImg');
            const fn = document.getElementById('blogCoverFileName');
            if (img) img.src = blogCoverBlobUrl;
            if (prev) prev.style.display = 'block';
            if (fn) fn.textContent = croppedFile.name;
            const paste = document.getElementById('blogCoverPasteUrl');
            if (paste) paste.value = '';
            closeCropModal();
            return;
        }

        // project — re-crop existing gallery slot
        if (pendingReeditIndex !== null) {
            const idx = pendingReeditIndex;
            const old = projectImageItems[idx];
            if (old?.previewUrl?.startsWith('blob:')) {
                revokeProjectItemBlob(old);
            }
            const previewUrl = URL.createObjectURL(blob);
            projectImageItems[idx] = {
                previewUrl,
                remoteUrl: null,
                uploadFile: croppedFile,
                originalFile: cropSessionOriginalFile || croppedFile,
                fileName: cropSessionOriginalFile?.name || croppedFile.name,
            };
            pendingReeditIndex = null;
            closeCropModal();
            renderProjectImagesList();
            updateProjectFileInputLabel();
            return;
        }

        const previewUrl = URL.createObjectURL(blob);
        projectImageItems.push({
            previewUrl,
            remoteUrl: null,
            uploadFile: croppedFile,
            originalFile: cropSessionOriginalFile || croppedFile,
            fileName: cropSessionOriginalFile?.name || croppedFile.name,
        });

        pendingProjectCropIndex += 1;
        const hasMore = pendingProjectCropIndex < pendingProjectCropFiles.length;

        closeCropModal({ keepProjectCropQueue: true });

        renderProjectImagesList();
        updateProjectFileInputLabel();

        if (hasMore) {
            currentCropType = 'project';
            openCropModal(pendingProjectCropFiles[pendingProjectCropIndex]);
        } else {
            pendingProjectCropFiles = [];
            pendingProjectCropIndex = 0;
            resetProjectFilePicker();
            updateProjectFileInputLabel();
        }
    }, 'image/jpeg', 0.9);
}

async function reCropProjectImage(index) {
    if (document.getElementById('cropModal')?.classList.contains('active') && currentCropType === 'blog') {
        alert('Finish the blog cover crop first.');
        return;
    }
    if (pendingProjectCropFiles.length) {
        alert('Finish or cancel the current image crop batch first.');
        return;
    }
    const it = projectImageItems[index];
    if (!it) return;

    let sourceFile = null;
    if (it.originalFile instanceof File) {
        sourceFile = it.originalFile;
    } else if (it.uploadFile instanceof File) {
        sourceFile = it.uploadFile;
    } else {
        const u = it.remoteUrl || it.previewUrl;
        if (!u || u.startsWith('blob:')) {
            alert('Cannot load this image for editing.');
            return;
        }
        try {
            const r = await fetch(u, { mode: 'cors' });
            if (!r.ok) throw new Error(String(r.status));
            const b = await r.blob();
            if (!b.type.startsWith('image/')) throw new Error('Not an image');
            sourceFile = new File([b], it.fileName || 'image.jpg', { type: b.type || 'image/jpeg' });
            it.originalFile = sourceFile;
        } catch (e) {
            console.warn('reCropProjectImage fetch failed:', e);
            alert('Could not load image for editing (network or CORS). Add a new image instead.');
            return;
        }
    }

    pendingReeditIndex = index;
    currentCropType = 'project';
    openCropModal(sourceFile);
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
    document.getElementById('importSitePortfolioBtn')?.addEventListener('click', importSitePortfolioToSupabase);
    document.getElementById('closeProjectModal').addEventListener('click', closeProjectModal);
    document.getElementById('cancelProjectBtn').addEventListener('click', closeProjectModal);
    document.getElementById('projectForm').addEventListener('submit', handleProjectSubmit);

    const addReviewBtn = document.getElementById('addReviewBtn');
    if (addReviewBtn) addReviewBtn.addEventListener('click', () => openReviewModal());
    const closeReviewModalBtn = document.getElementById('closeReviewModal');
    if (closeReviewModalBtn) closeReviewModalBtn.addEventListener('click', closeReviewModal);
    const cancelReviewBtn = document.getElementById('cancelReviewBtn');
    if (cancelReviewBtn) cancelReviewBtn.addEventListener('click', closeReviewModal);
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) reviewForm.addEventListener('submit', handleReviewSubmit);

    document.getElementById('addBlogBtn')?.addEventListener('click', () => openBlogModal());
    document.getElementById('closeBlogModal')?.addEventListener('click', closeBlogModal);
    document.getElementById('cancelBlogBtn')?.addEventListener('click', closeBlogModal);
    document.getElementById('blogForm')?.addEventListener('submit', (e) => handleBlogSubmit(e, null));
    document.getElementById('blogSaveDraftBtn')?.addEventListener('click', (e) => handleBlogSubmit(e, 'draft'));
    document.getElementById('blogPublishBtn')?.addEventListener('click', (e) => handleBlogSubmit(e, 'published'));
    document.getElementById('removeBlogCoverBtn')?.addEventListener('click', () => removeBlogCover());
    document.getElementById('blogModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'blogModal') closeBlogModal();
    });
    document.getElementById('blogTitle')?.addEventListener('input', syncBlogSlugFromTitle);
    document.getElementById('blogSlug')?.addEventListener('input', () => {
        blogSlugManuallyEdited = true;
    });
    
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
    const reviewModalEl = document.getElementById('reviewModal');
    if (reviewModalEl) reviewModalEl.addEventListener('click', (e) => {
        if (e.target.id === 'reviewModal') closeReviewModal();
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

    setupCropToolbarListeners();
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (validateAdminPassword(password)) {
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
    } else if (tabName === 'reviews') {
        loadReviews();
    } else if (tabName === 'blogs') {
        loadBlogs();
    }
}

// Load all data
function loadData() {
    loadProjects();
    loadTeam();
    loadApplications();
    loadMessages();
    loadReviews();
    loadBlogs();
}

// ========== PROJECTS ==========
/**
 * Inserts default portfolio rows into Supabase (same as public site). Skips existing titles.
 * Removes the placeholder "Test" row. Requires `image_urls` column (see migration-project-images.sql).
 */
async function importSitePortfolioToSupabase() {
    if (
        !confirm(
            'This adds all site projects to your database. Rows that already exist (same title) are skipped. The "Test" project will be deleted. Continue?'
        )
    ) {
        return;
    }
    if (!window.supabaseClient) {
        alert('Supabase is not configured.');
        return;
    }
    try {
        await window.supabaseClient.from('portfolio_projects').delete().eq('title', 'Test');

        const n = PORTFOLIO_SITE_PROJECTS.length;
        let added = 0;
        let skipped = 0;

        for (let idx = 0; idx < n; idx++) {
            const p = PORTFOLIO_SITE_PROJECTS[idx];
            const { data: existing, error: selErr } = await window.supabaseClient
                .from('portfolio_projects')
                .select('id')
                .eq('title', p.title)
                .maybeSingle();
            if (selErr) throw selErr;
            if (existing) {
                skipped++;
                continue;
            }
            const created_at = new Date(Date.now() + (n - idx) * 60000).toISOString();
            const row = {
                title: p.title,
                description: p.description,
                platform: p.platform,
                technologies: p.technologies,
                project_link: p.project_link,
                image_url: p.image_url,
                image_urls: p.image_urls,
                created_at,
            };
            const { error: insErr } = await window.supabaseClient.from('portfolio_projects').insert([row]);
            if (insErr) throw insErr;
            added++;
        }

        await loadProjects();
        alert(`Done. Added ${added} project(s). Skipped ${skipped} that were already in the database.`);
    } catch (e) {
        console.error(e);
        alert(
            'Import failed: ' +
                (e.message || String(e)) +
                '\n\nIf the error mentions image_urls, open Supabase → SQL and run database/migrations/migration-project-images.sql first.'
        );
    }
}

window.importSitePortfolioToSupabase = importSitePortfolioToSupabase;

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
    revokeAllProjectImageBlobs();
    projectImageItems = [];
    pendingProjectCropFiles = [];
    pendingProjectCropIndex = 0;
    pendingReeditIndex = null;
    resetProjectFilePicker();

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
        updateProjectFileInputLabel();
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

    if (!projectImageItems.length) {
        listEl.innerHTML = `<div class="project-images-empty">${emptyText}</div>`;
        listEl.classList.remove('has-items');
        return;
    }

    listEl.classList.add('has-items');
    listEl.innerHTML = projectImageItems
        .map((item, index) => {
            const url = escapeAttr(item.previewUrl);
            const safeName = escapeAttr(item.fileName || `Image ${index + 1}`);
            return `
        <div class="project-image-item" draggable="true" data-index="${index}">
            <span class="project-image-drag" title="Drag to reorder">⋮⋮</span>
            <img src="${url}" alt="${safeName}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22>?</text></svg>'">
            <button type="button" class="project-image-remove" onclick="removeProjectImageByIndex(${index})" title="Remove">✕</button>
            <button type="button" class="project-image-edit" onclick="reCropProjectImage(${index})" title="Edit crop">Crop</button>
        </div>`;
        })
        .join('');

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
            e.dataTransfer.setData('text/plain', String(index));
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            listEl.querySelectorAll('.project-image-item').forEach((i) => i.classList.remove('drag-over'));
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
            const next = [...projectImageItems];
            const [removed] = next.splice(draggedIndex, 1);
            next.splice(index, 0, removed);
            projectImageItems = next;
            renderProjectImagesList();
        });
    });
}

function removeProjectImageByIndex(index) {
    const [removed] = projectImageItems.splice(index, 1);
    if (removed) revokeProjectItemBlob(removed);
    renderProjectImagesList();
    updateProjectFileInputLabel();
}

window.removeProjectImageByIndex = removeProjectImageByIndex;

function closeProjectModal() {
    const cropModal = document.getElementById('cropModal');
    if (cropModal?.classList.contains('active')) {
        closeCropModal();
    }
    document.getElementById('projectModal').classList.remove('active');
    revokeAllProjectImageBlobs();
    projectImageItems = [];
    pendingProjectCropFiles = [];
    pendingProjectCropIndex = 0;
    pendingReeditIndex = null;
    resetProjectFilePicker();
    document.getElementById('projectForm').reset();
    currentEditingId = null;
    renderProjectImagesList();
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

        const urls = normalizeImageUrlsFromProjectRow(data);
        projectImageItems = urls.map((url) => {
            const fileName = url.split('/').pop() || 'image';
            return {
                previewUrl: url,
                remoteUrl: url,
                uploadFile: null,
                originalFile: null,
                fileName,
            };
        });
        renderProjectImagesList();
        updateProjectFileInputLabel();
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
        
        const pastedUrl = document.getElementById('projectImageUrl').value.trim();
        if (pastedUrl) {
            const fileName = pastedUrl.split('/').pop() || 'image';
            projectImageItems.push({
                previewUrl: pastedUrl,
                remoteUrl: pastedUrl,
                uploadFile: null,
                originalFile: null,
                fileName,
            });
            document.getElementById('projectImageUrl').value = '';
        }

        const pendingUploads = projectImageItems.filter((it) => it.uploadFile);
        if (pendingUploads.length) {
            const progressDiv = document.getElementById('projectUploadProgress');
            const progressText = document.getElementById('projectProgressText');
            const progressFill = document.getElementById('projectProgressFill');
            progressDiv.style.display = 'block';

            try {
                let uploadDone = 0;
                for (let i = 0; i < projectImageItems.length; i++) {
                    const item = projectImageItems[i];
                    if (!item.uploadFile) continue;

                    uploadDone += 1;
                    submitBtn.textContent = `Uploading image ${uploadDone} of ${pendingUploads.length}…`;

                    const uploadedUrl = await uploadImage(item.uploadFile, 'images', 'projects', (progress) => {
                        const base = ((uploadDone - 1) / pendingUploads.length) * 100;
                        const slice = (1 / pendingUploads.length) * 100;
                        const fillPct = base + (progress / 100) * slice;
                        if (progressFill) progressFill.style.width = fillPct + '%';
                        if (progress < 50) progressText.textContent = `Uploading ${uploadDone}/${pendingUploads.length}… ${Math.round(progress)}%`;
                        else if (progress < 100) progressText.textContent = `Processing ${uploadDone}/${pendingUploads.length}… ${Math.round(progress)}%`;
                        else progressText.textContent = 'Complete!';
                    });

                    if (!uploadedUrl) {
                        throw new Error('Image upload failed');
                    }
                    if (item.previewUrl?.startsWith('blob:')) {
                        revokeProjectItemBlob(item);
                    }
                    item.previewUrl = uploadedUrl;
                    item.remoteUrl = uploadedUrl;
                    item.uploadFile = null;
                    item.originalFile = null;
                }
            } finally {
                progressDiv.style.display = 'none';
                if (progressFill) progressFill.style.width = '0%';
            }
        }

        const rawFinal = projectImageItems
            .map((it) => {
                const u = (it.remoteUrl || it.previewUrl || '').trim();
                return u;
            })
            .filter((u) => u && !u.startsWith('blob:'));
        const finalUrls = dedupeUrlsPreserveOrder(rawFinal);

        const formData = {
            title: document.getElementById('projectTitle').value.trim(),
            description: document.getElementById('projectDescription').value.trim(),
            platform: document.getElementById('projectPlatform').value,
            technologies: document.getElementById('projectTechnologies').value.trim(),
            image_url: finalUrls.length ? finalUrls[0] : null,
            image_urls: finalUrls,
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

// ========== REVIEWS ==========
async function loadReviews() {
    const tbody = document.getElementById('reviewsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading reviews...</td></tr>';

    try {
        if (!window.supabaseClient) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Supabase not configured</td></tr>';
            return;
        }

        const { data, error } = await window.supabaseClient
            .from('client_reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">No reviews yet. Click "Add Review" to add one.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(review => {
            const snippet = review.review_text.length > 60 ? review.review_text.substring(0, 60) + '…' : review.review_text;
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            return `
            <tr>
                <td><strong>${escapeHtml(review.client_name)}</strong></td>
                <td>${escapeHtml(snippet)}</td>
                <td>${stars}</td>
                <td>${review.visible ? 'Yes' : 'No'}</td>
                <td>${new Date(review.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-edit" onclick="editReview(${review.id})">Edit</button>
                        <button class="btn-small btn-delete" onclick="deleteReview(${review.id})">Delete</button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Error loading reviews. Run migration-client-reviews.sql in Supabase first.</td></tr>';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openReviewModal(reviewId = null) {
    const modal = document.getElementById('reviewModal');
    const form = document.getElementById('reviewForm');
    const title = document.getElementById('reviewModalTitle');

    if (reviewId) {
        title.textContent = 'Edit Review';
        loadReviewData(reviewId);
    } else {
        title.textContent = 'Add Review';
        form.reset();
        document.getElementById('reviewId').value = '';
        document.getElementById('reviewVisible').checked = true;
    }
    modal.classList.add('active');
}

function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
}

async function loadReviewData(id) {
    try {
        const { data, error } = await window.supabaseClient
            .from('client_reviews')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('reviewId').value = data.id;
        document.getElementById('reviewClientName').value = data.client_name || '';
        document.getElementById('reviewText').value = data.review_text || '';
        document.getElementById('reviewRole').value = data.role_or_location || '';
        document.getElementById('reviewRating').value = data.rating || 5;
        document.getElementById('reviewVisible').checked = data.visible !== false;
    } catch (error) {
        console.error('Error loading review:', error);
        alert('Error loading review');
    }
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('reviewId').value;
    const clientName = document.getElementById('reviewClientName').value.trim();
    const reviewText = document.getElementById('reviewText').value.trim();
    const roleOrLocation = document.getElementById('reviewRole').value.trim();
    const rating = parseInt(document.getElementById('reviewRating').value, 10);
    const visible = document.getElementById('reviewVisible').checked;

    if (!clientName || !reviewText) {
        alert('Please fill in client name and review text.');
        return;
    }

    try {
        if (id) {
            const { error } = await window.supabaseClient
                .from('client_reviews')
                .update({
                    client_name: clientName,
                    review_text: reviewText,
                    role_or_location: roleOrLocation || null,
                    rating,
                    visible
                })
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await window.supabaseClient
                .from('client_reviews')
                .insert({
                    client_name: clientName,
                    review_text: reviewText,
                    role_or_location: roleOrLocation || null,
                    rating,
                    visible
                });
            if (error) throw error;
        }
        closeReviewModal();
        loadReviews();
    } catch (error) {
        console.error('Error saving review:', error);
        alert('Error saving review: ' + (error.message || error));
    }
}

function editReview(id) {
    openReviewModal(id);
}

async function deleteReview(id) {
    if (!confirm('Delete this review?')) return;
    try {
        const { error } = await window.supabaseClient
            .from('client_reviews')
            .delete()
            .eq('id', id);
        if (error) throw error;
        loadReviews();
    } catch (error) {
        console.error('Error deleting review:', error);
        alert('Error deleting review');
    }
}

window.editReview = editReview;
window.deleteReview = deleteReview;

// ========== BLOGS ==========
function slugifyTitle(title) {
    return String(title || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'post';
}

function syncBlogSlugFromTitle() {
    if (blogSlugManuallyEdited) return;
    const titleEl = document.getElementById('blogTitle');
    const slugEl = document.getElementById('blogSlug');
    if (!titleEl || !slugEl) return;
    slugEl.value = slugifyTitle(titleEl.value);
}

function estimateReadingMinutes(text) {
    const words = String(text || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}

function parseBlogTagsInput(s) {
    return String(s || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
}

function revokeBlogCoverState() {
    blogCoverFile = null;
    if (blogCoverBlobUrl) {
        try {
            URL.revokeObjectURL(blogCoverBlobUrl);
        } catch {
            /* ignore */
        }
        blogCoverBlobUrl = null;
    }
    const prev = document.getElementById('blogCoverPreview');
    const img = document.getElementById('blogCoverPreviewImg');
    if (img) img.src = '';
    if (prev) prev.style.display = 'none';
    const fi = document.getElementById('blogCoverImageFile');
    if (fi) fi.value = '';
    const fn = document.getElementById('blogCoverFileName');
    if (fn) fn.textContent = 'No file chosen';
}

function removeBlogCover() {
    revokeBlogCoverState();
    blogExistingCoverUrl = null;
    const paste = document.getElementById('blogCoverPasteUrl');
    if (paste) paste.value = '';
}

async function ensureUniqueBlogSlug(rawSlug, excludeId) {
    let base = slugifyTitle(rawSlug);
    if (!base) base = 'post';
    base = base.slice(0, 200);
    let candidate = base;
    for (let n = 0; n < 80; n++) {
        const { data, error } = await window.supabaseClient.from('blogs').select('id').eq('slug', candidate).limit(2);
        if (error) throw error;
        if (!data || data.length === 0) return candidate;
        if (data.length === 1 && excludeId != null && String(data[0].id) === String(excludeId)) return candidate;
        candidate = `${base}-${Date.now().toString(36)}-${n}`.slice(0, 240);
    }
    throw new Error('Could not resolve a unique slug');
}

async function loadBlogs() {
    const tbody = document.getElementById('blogsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading blogs...</td></tr>';

    try {
        if (!window.supabaseClient) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Supabase not configured</td></tr>';
            return;
        }

        const { data, error } = await window.supabaseClient.from('blogs').select('*').order('updated_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="7" class="loading">No blog posts yet. Run migration-blogs.sql in Supabase, then click Add Blog.</td></tr>';
            return;
        }

        tbody.innerHTML = data
            .map((b) => {
                const pub = b.published_at ? new Date(b.published_at).toLocaleString() : '—';
                return `
            <tr>
                <td><strong>${escapeHtml(b.title)}</strong></td>
                <td>${escapeHtml(b.type || '')}</td>
                <td>${escapeHtml(b.category || '—')}</td>
                <td>${escapeHtml(b.status || '')}</td>
                <td>${b.featured ? 'Yes' : 'No'}</td>
                <td>${escapeHtml(pub)}</td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn-small btn-edit" onclick="editBlog(${b.id})">Edit</button>
                        <button type="button" class="btn-small btn-delete" onclick="deleteBlog(${b.id})">Delete</button>
                    </div>
                </td>
            </tr>`;
            })
            .join('');
    } catch (err) {
        console.error('Error loading blogs:', err);
        tbody.innerHTML =
            '<tr><td colspan="7" class="loading">Error loading blogs. Run database/migrations/migration-blogs.sql in Supabase.</td></tr>';
    }
}

async function openBlogModal(blogId = null) {
    const modal = document.getElementById('blogModal');
    const form = document.getElementById('blogForm');
    const title = document.getElementById('blogModalTitle');
    if (!modal || !form || !title) return;

    if (blogId) {
        title.textContent = 'Edit Blog';
        await loadBlogData(blogId);
    } else {
        title.textContent = 'Add Blog';
        form.reset();
        document.getElementById('blogId').value = '';
        blogSlugManuallyEdited = false;
        blogPublishedAtExisting = null;
        blogExistingCoverUrl = null;
        revokeBlogCoverState();
        document.getElementById('blogStatus').value = 'draft';
        document.getElementById('blogFeatured').checked = false;
        syncBlogSlugFromTitle();
    }
    modal.classList.add('active');
    setTimeout(() => setupFileUploadListeners(), 100);
}

function closeBlogModal() {
    const cropModal = document.getElementById('cropModal');
    if (cropModal?.classList.contains('active')) {
        closeCropModal();
    }
    document.getElementById('blogModal')?.classList.remove('active');
    document.getElementById('blogForm')?.reset();
    revokeBlogCoverState();
    blogSlugManuallyEdited = false;
    blogPublishedAtExisting = null;
    blogExistingCoverUrl = null;
}

async function loadBlogData(id) {
    try {
        const { data, error } = await window.supabaseClient.from('blogs').select('*').eq('id', id).single();
        if (error) throw error;

        document.getElementById('blogId').value = data.id;
        document.getElementById('blogTitle').value = data.title || '';
        document.getElementById('blogSlug').value = data.slug || '';
        blogSlugManuallyEdited = true;
        document.getElementById('blogExcerpt').value = data.excerpt || '';
        document.getElementById('blogContent').value = data.content || '';
        document.getElementById('blogCategory').value = data.category || '';
        document.getElementById('blogType').value = data.type || 'Article';
        let tagsArr = [];
        if (Array.isArray(data.tags)) {
            tagsArr = data.tags.map(String).filter(Boolean);
        } else if (typeof data.tags === 'string') {
            tagsArr = parseBlogTagsInput(data.tags);
        }
        document.getElementById('blogTags').value = tagsArr.join(', ');
        document.getElementById('blogAuthorName').value = data.author_name || '';
        document.getElementById('blogStatus').value = data.status === 'published' ? 'published' : 'draft';
        document.getElementById('blogFeatured').checked = !!data.featured;
        document.getElementById('blogCoverPasteUrl').value = '';

        blogPublishedAtExisting = data.published_at || null;
        revokeBlogCoverState();
        if (data.cover_image_url) {
            blogExistingCoverUrl = data.cover_image_url;
            const prev = document.getElementById('blogCoverPreview');
            const img = document.getElementById('blogCoverPreviewImg');
            const fn = document.getElementById('blogCoverFileName');
            if (img) img.src = data.cover_image_url;
            if (prev) prev.style.display = 'block';
            if (fn) fn.textContent = 'Current cover';
        } else {
            blogExistingCoverUrl = null;
        }
    } catch (e) {
        console.error('loadBlogData:', e);
        alert('Error loading blog');
    }
}

async function handleBlogSubmit(e, forcedStatus) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const id = document.getElementById('blogId').value;
    const title = document.getElementById('blogTitle').value.trim();
    let slug = document.getElementById('blogSlug').value.trim();
    const excerpt = document.getElementById('blogExcerpt').value.trim();
    const content = document.getElementById('blogContent').value.trim();
    const category = document.getElementById('blogCategory').value.trim();
    const blogType = document.getElementById('blogType').value;
    const tags = parseBlogTagsInput(document.getElementById('blogTags').value);
    const author_name = document.getElementById('blogAuthorName').value.trim() || null;
    const featured = document.getElementById('blogFeatured').checked;
    const status = forcedStatus || document.getElementById('blogStatus').value;
    if (forcedStatus) {
        document.getElementById('blogStatus').value = forcedStatus;
    }

    if (!title) {
        alert('Title is required.');
        return;
    }
    if (!content) {
        alert('Content is required.');
        return;
    }
    if (!slug) {
        slug = slugifyTitle(title);
        document.getElementById('blogSlug').value = slug;
    }
    slug = slug.trim();
    if (!slug) {
        alert('Slug is required. Add a title or enter a slug manually.');
        return;
    }
    if (status !== 'draft' && status !== 'published') {
        alert('Invalid status.');
        return;
    }

    try {
        if (!window.supabaseClient) throw new Error('Supabase not configured');

        slug = await ensureUniqueBlogSlug(slug, id || null);

        const reading_time = estimateReadingMinutes(content);
        const nowIso = new Date().toISOString();

        let cover_image_url = null;
        const pasteCover = document.getElementById('blogCoverPasteUrl').value.trim();

        if (blogCoverFile) {
            const uploadedUrl = await uploadImage(blogCoverFile, 'images', 'blogs', null);
            if (!uploadedUrl) throw new Error('Cover image upload failed');
            cover_image_url = uploadedUrl;
        } else if (pasteCover) {
            cover_image_url = pasteCover;
        } else {
            cover_image_url = blogExistingCoverUrl;
        }

        let published_at = blogPublishedAtExisting;
        if (status === 'published') {
            published_at = blogPublishedAtExisting || nowIso;
        }

        const row = {
            title,
            slug,
            excerpt: excerpt || null,
            content,
            category: category || null,
            tags,
            type: blogType,
            cover_image_url,
            cover_image_urls: null,
            author_name,
            status,
            featured,
            reading_time,
            updated_at: nowIso,
            published_at,
        };

        if (id) {
            const { error } = await window.supabaseClient.from('blogs').update(row).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await window.supabaseClient.from('blogs').insert({
                ...row,
                created_at: nowIso,
            });
            if (error) throw error;
        }

        closeBlogModal();
        loadBlogs();
        alert(id ? 'Blog updated.' : 'Blog created.');
    } catch (err) {
        console.error('handleBlogSubmit:', err);
        alert('Error saving blog: ' + (err.message || err));
    }
}

function editBlog(id) {
    openBlogModal(id);
}

async function deleteBlog(id) {
    if (!confirm('Delete this blog post? This cannot be undone.')) return;
    try {
        const { error } = await window.supabaseClient.from('blogs').delete().eq('id', id);
        if (error) throw error;
        loadBlogs();
    } catch (e) {
        console.error('deleteBlog:', e);
        alert('Error deleting blog');
    }
}

window.editBlog = editBlog;
window.deleteBlog = deleteBlog;
window.removeBlogCover = removeBlogCover;

// Make functions globally available for onclick handlers
window.editProject = editProject;
window.deleteProject = deleteProject;
window.editTeamMember = editTeamMember;
window.deleteTeamMember = deleteTeamMember;
window.viewMessage = viewMessage;
window.markAsRead = markAsRead;
window.removeProjectImage = removeProjectImage;
window.removeTeamImage = removeTeamImage;
window.reCropProjectImage = reCropProjectImage;

// ===================================
// SUPABASE CLIENT INITIALIZATION
// ===================================
const { createClient } = supabase;

// Validate config before initialization
const isConfigValid = window.supabaseConfig.url &&
    window.supabaseConfig.url !== 'YOUR_SUPABASE_URL' &&
    window.supabaseConfig.anonKey &&
    window.supabaseConfig.anonKey !== 'YOUR_SUPABASE_ANON_KEY';

let supabaseClient = null;

if (isConfigValid) {
    try {
        supabaseClient = createClient(
            window.supabaseConfig.url,
            window.supabaseConfig.anonKey
        );
    } catch (e) {
        console.error('Supabase Initialization Error:', e);
    }
} else {
    console.error('Supabase config is invalid! Please update config.js with your real credentials.');
}

// ===================================
// STATE MANAGEMENT
// ===================================
let allAnime = [];
let currentFilter = 'all';
let currentSearchQuery = '';
let editingAnimeId = null;
let seasonCounter = 1;
let currentUser = null;
let isLoginMode = true; // Toggle between Login and Sign Up

// ===================================
// DOM ELEMENTS
// ===================================
const elements = {
    // Buttons
    addAnimeBtn: document.getElementById('addAnimeBtn'),
    closeModal: document.getElementById('closeModal'),
    cancelBtn: document.getElementById('cancelBtn'),
    submitBtn: document.getElementById('submitBtn'),
    addSeasonBtn: document.getElementById('addSeasonBtn'),

    // Inputs
    searchInput: document.getElementById('searchInput'),
    animeForm: document.getElementById('animeForm'),
    animeId: document.getElementById('animeId'),
    animeName: document.getElementById('animeName'),
    animeType: document.getElementById('animeType'),
    animeStatus: document.getElementById('animeStatus'),
    posterUpload: document.getElementById('posterUpload'),
    fileName: document.getElementById('fileName'),
    movieWatched: document.getElementById('movieWatched'),

    // Containers
    animeModal: document.getElementById('animeModal'),
    animeGrid: document.getElementById('animeGrid'),
    continueWatchingGrid: document.getElementById('continueWatchingGrid'),
    myCollectionGrid: document.getElementById('myCollectionGrid'),
    continueWatchingSection: document.getElementById('continueWatchingSection'),
    myCollectionSection: document.getElementById('myCollectionSection'),
    emptyState: document.getElementById('emptyState'),
    imagePreview: document.getElementById('imagePreview'),
    seasonsList: document.getElementById('seasonsList'),
    seriesFields: document.getElementById('seriesFields'),
    movieFields: document.getElementById('movieFields'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    submitBtnText: document.getElementById('submitBtnText'),

    // Filters
    customDropdown: document.getElementById('customFilterDropdown'),
    dropdownTrigger: document.querySelector('.dropdown-trigger'),
    dropdownMenu: document.querySelector('.dropdown-menu'),
    dropdownItems: document.querySelectorAll('.dropdown-item'),
    dropdownSelectedText: document.getElementById('dropdownSelectedText'),
    activeFilterBadge: document.getElementById('activeFilterBadge'),

    // Auth Elements
    authSection: document.getElementById('authSection'),
    appContent: document.getElementById('appContent'),
    authForm: document.getElementById('authForm'),
    authEmail: document.getElementById('authEmail'),
    authPassword: document.getElementById('authPassword'),
    authSubmitBtn: document.getElementById('authSubmitBtn'),
    authTitle: document.getElementById('authTitle'),
    authSubtitle: document.getElementById('authSubtitle'),
    authSwitchLink: document.getElementById('authSwitchLink'),
    authSwitchText: document.getElementById('authSwitchText'),
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),
    resetPasswordForm: document.getElementById('resetPasswordForm'),
    resetEmailInput: document.getElementById('resetEmail'),
    backToLoginLink: document.getElementById('backToLoginLink'),

    // Profile Elements
    profileBtn: document.getElementById('profileBtn'),
    profileModal: document.getElementById('profileModal'),
    closeProfileModal: document.getElementById('closeProfileModal'),
    userEmailDisplay: document.getElementById('userEmailDisplay'),
    changePasswordForm: document.getElementById('changePasswordForm'),
    profileLogoutBtn: document.getElementById('profileLogoutBtn'),
    newPasswordInput: document.getElementById('newPassword'),
    confirmNewPasswordInput: document.getElementById('confirmNewPassword')
};

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    attachEventListeners();
});

async function initializeApp() {
    showLoading();

    // Check initial session
    const { data: { session } } = await supabaseClient.auth.getSession();
    currentUser = session?.user || null;
    updateUIForAuth();

    if (currentUser) {
        await loadAnime();
    }

    hideLoading();

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        updateUIForAuth();
        if (currentUser) {
            loadAnime();
        } else {
            allAnime = [];
            renderAnime();
        }
    });
}

function updateUIForAuth() {
    if (currentUser) {
        elements.authSection.style.display = 'none';
        elements.appContent.style.display = 'block';
        elements.addAnimeBtn.style.display = 'inline-flex';
        elements.profileBtn.style.display = 'inline-flex';
        elements.userEmailDisplay.textContent = currentUser.email;
    } else {
        elements.authSection.style.display = 'flex';
        elements.appContent.style.display = 'none';
        elements.addAnimeBtn.style.display = 'none';
        elements.profileBtn.style.display = 'none';

        // Reset auth form
        isLoginMode = true;
        updateAuthFormUI();
    }
}

function updateAuthFormUI() {
    if (isLoginMode) {
        elements.authTitle.textContent = 'Welcome back';
        elements.authSubtitle.textContent = 'Login to sync your anime journey';
        elements.authSubmitBtn.textContent = 'Login';
        elements.authSwitchText.innerHTML = `Don't have an account? <a href="#" id="authSwitchLink">Sign Up</a>`;
    } else {
        elements.authTitle.textContent = 'Join WatchVault';
        elements.authSubtitle.textContent = 'Start your anime tracking journey';
        elements.authSubmitBtn.textContent = 'Create Account';
        elements.authSwitchText.innerHTML = `Already have an account? <a href="#" id="authSwitchLink">Login</a>`;
    }

    // Re-attach switch link listener as innerHTML replaces it
    document.getElementById('authSwitchLink').addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        updateAuthFormUI();
    });
}

// ===================================
// EVENT LISTENERS
// ===================================
function attachEventListeners() {
    // Modal controls
    elements.addAnimeBtn.addEventListener('click', openAddModal);
    elements.closeModal.addEventListener('click', closeModal);
    elements.cancelBtn.addEventListener('click', closeModal);
    elements.animeModal.addEventListener('click', (e) => {
        if (e.target === elements.animeModal) closeModal();
    });

    // Form submission
    elements.animeForm.addEventListener('submit', handleFormSubmit);

    // Type change (Series/Movie)
    elements.animeType.addEventListener('change', handleTypeChange);

    // File upload
    elements.posterUpload.addEventListener('change', handleFileSelect);

    // Season management
    elements.addSeasonBtn.addEventListener('click', addSeasonInput);

    // Search
    elements.searchInput.addEventListener('input', handleSearch);

    // Custom Filter Dropdown Logic
    elements.dropdownTrigger.addEventListener('click', () => {
        elements.customDropdown.classList.toggle('active');
    });

    elements.dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
            const status = item.dataset.value;
            handleFilterChange(status);

            // Update UI
            elements.dropdownSelectedText.textContent = item.textContent;
            elements.dropdownItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            elements.customDropdown.classList.remove('active');
        });
    });

    // Auth Listeners
    elements.authForm.addEventListener('submit', handleAuthSubmit);
    elements.authSwitchLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        updateAuthFormUI();
    });

    elements.forgotPasswordLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showResetView();
    });

    elements.backToLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginView();
    });

    elements.resetPasswordForm?.addEventListener('submit', handleResetSubmit);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (elements.customDropdown && !elements.customDropdown.contains(e.target)) {
            elements.customDropdown.classList.remove('active');
        }
    });

    // Profile Listeners
    elements.profileBtn?.addEventListener('click', openProfileModal);
    elements.closeProfileModal?.addEventListener('click', closeProfileModal);
    elements.profileLogoutBtn?.addEventListener('click', logout);
    elements.changePasswordForm?.addEventListener('submit', handleChangePassword);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.animeModal.classList.contains('active')) closeModal();
            if (elements.profileModal.classList.contains('active')) closeProfileModal();
        }
    });
}

// ===================================
// AUTHENTICATION HANDLERS
// ===================================
async function handleAuthSubmit(e) {
    e.preventDefault();
    showLoading();

    const email = elements.authEmail.value;
    const password = elements.authPassword.value;

    try {
        let result;
        if (isLoginMode) {
            result = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
        } else {
            result = await supabaseClient.auth.signUp({
                email,
                password
            });
            if (result.data.user && result.data.session === null) {
                alert('Success! Please check your email for confirmation link.');
            }
        }

        if (result.error) throw result.error;
    } catch (error) {
        console.error('Auth Error:', error);
        alert(error.message);
    } finally {
        hideLoading();
    }
}

async function logout() {
    showLoading();
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    } catch (error) {
        console.error('Logout Error:', error);
        alert('Failed to logout. Please try again.');
    } finally {
        hideLoading();
    }
}

function showResetView() {
    elements.authForm.style.display = 'none';
    elements.resetPasswordForm.style.display = 'block';
    elements.authTitle.textContent = 'Reset Password';
    elements.authSubtitle.textContent = 'Enter your email to receive a reset link';
}

function showLoginView() {
    elements.authForm.style.display = 'block';
    elements.resetPasswordForm.style.display = 'none';
    updateAuthFormUI();
}

async function handleResetSubmit(e) {
    e.preventDefault();
    showLoading();

    const email = elements.resetEmailInput.value;

    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href // Redirect back to current page
        });

        if (error) throw error;

        alert('Password reset link sent! Please check your email.');
        showLoginView();
    } catch (error) {
        console.error('Reset Error:', error);
        alert(error.message);
    } finally {
        hideLoading();
    }
}

// ===================================
// PROFILE MANAGEMENT
// ===================================
function openProfileModal() {
    elements.profileModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
    elements.profileModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    elements.changePasswordForm.reset();
}

async function handleChangePassword(e) {
    e.preventDefault();
    const newPassword = elements.newPasswordInput.value;
    const confirmPassword = elements.confirmNewPasswordInput.value;

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    showLoading();
    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        alert('Password updated successfully!');
        closeProfileModal();
    } catch (error) {
        console.error('Password Update Error:', error);
        alert(error.message);
    } finally {
        hideLoading();
    }
}

// ===================================
// MODAL MANAGEMENT
// ===================================
function openAddModal() {
    editingAnimeId = null;
    elements.animeForm.reset();
    elements.animeId.value = '';
    elements.modalTitle.textContent = 'Add New Anime';
    elements.submitBtnText.textContent = 'Add Anime';
    elements.imagePreview.innerHTML = '';
    elements.imagePreview.classList.remove('active');
    elements.fileName.textContent = 'Choose an image file';

    // Reset seasons
    elements.seasonsList.innerHTML = '';
    seasonCounter = 1;
    addSeasonInput();

    // Show appropriate fields
    handleTypeChange();

    elements.animeModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openEditModal(anime) {
    editingAnimeId = anime.id;
    elements.animeId.value = anime.id;
    elements.animeName.value = anime.name;
    elements.animeType.value = anime.type;
    elements.animeStatus.value = anime.status;

    elements.modalTitle.textContent = 'Edit Anime';
    elements.submitBtnText.textContent = 'Update Anime';

    // Show poster preview if exists
    if (anime.poster_url) {
        elements.imagePreview.innerHTML = `<img src="${anime.poster_url}" alt="${anime.name}">`;
        elements.imagePreview.classList.add('active');
        elements.fileName.textContent = 'Change image (optional)';
    }

    // Handle type-specific fields
    if (anime.type === 'Series') {
        elements.seriesFields.style.display = 'block';
        elements.movieFields.style.display = 'none';

        // Load seasons
        elements.seasonsList.innerHTML = '';
        seasonCounter = 1;
        if (anime.seasons && anime.seasons.length > 0) {
            anime.seasons.forEach(season => {
                addSeasonInput(season);
            });
        } else {
            addSeasonInput();
        }
    } else {
        elements.seriesFields.style.display = 'none';
        elements.movieFields.style.display = 'block';
        elements.movieWatched.checked = anime.watched || false;
    }

    elements.animeModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.animeModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    elements.animeForm.reset();
    editingAnimeId = null;
}

// ===================================
// FORM HANDLING
// ===================================
function handleTypeChange() {
    const type = elements.animeType.value;

    if (type === 'Series') {
        elements.seriesFields.style.display = 'block';
        elements.movieFields.style.display = 'none';

        // Add initial season if empty
        if (elements.seasonsList.children.length === 0) {
            addSeasonInput();
        }
    } else {
        elements.seriesFields.style.display = 'none';
        elements.movieFields.style.display = 'block';
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        elements.fileName.textContent = file.name;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            elements.imagePreview.classList.add('active');
        };
        reader.readAsDataURL(file);
    }
}

function addSeasonInput(seasonData = null) {
    const seasonNum = seasonData ? seasonData.season_number : seasonCounter++;
    const totalEps = seasonData ? seasonData.total_episodes : '';
    const lastWatched = seasonData ? seasonData.last_watched : 0;
    const seasonId = seasonData ? seasonData.id : '';

    const seasonDiv = document.createElement('div');
    seasonDiv.className = 'season-input-group';
    seasonDiv.innerHTML = `
        <input type="hidden" class="season-id" value="${seasonId}">
        
        <div class="season-field">
            <label>Season</label>
            <input 
                type="number" 
                class="season-number" 
                placeholder="#" 
                value="${seasonNum}" 
                min="1" 
                required
            >
        </div>

        <div class="season-field">
            <label>Total Ep</label>
            <input 
                type="number" 
                class="season-episodes" 
                placeholder="Total" 
                value="${totalEps}" 
                min="1" 
                required
            >
        </div>

        <div class="season-field">
            <label>Watched</label>
            <input 
                type="number" 
                class="season-last-watched" 
                placeholder="Watched" 
                value="${lastWatched}" 
                min="0"
            >
        </div>

        <button type="button" class="remove-season-btn" title="Remove Season">×</button>
    `;

    // Remove season button
    seasonDiv.querySelector('.remove-season-btn').addEventListener('click', () => {
        if (elements.seasonsList.children.length > 1) {
            seasonDiv.remove();
        } else {
            alert('At least one season is required for a series!');
        }
    });

    elements.seasonsList.appendChild(seasonDiv);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    showLoading();

    try {
        const name = elements.animeName.value.trim();
        const type = elements.animeType.value;
        const status = elements.animeStatus.value;

        let posterUrl = null;

        // Upload poster if new file selected
        const file = elements.posterUpload.files[0];
        if (file) {
            posterUrl = await uploadPoster(file, name);
        } else if (editingAnimeId) {
            // Keep existing poster URL
            const existingAnime = allAnime.find(a => a.id === editingAnimeId);
            posterUrl = existingAnime?.poster_url || null;
        }

        // Prepare anime data
        const animeData = {
            name,
            type,
            status,
            poster_url: posterUrl,
            watched: type === 'Movie' ? elements.movieWatched.checked : false,
            user_id: currentUser.id
        };

        let animeId;

        if (editingAnimeId) {
            // Update existing anime
            const { error } = await supabaseClient
                .from('anime')
                .update(animeData)
                .eq('id', editingAnimeId);

            if (error) throw error;
            animeId = editingAnimeId;
        } else {
            // Insert new anime
            const { data, error } = await supabaseClient
                .from('anime')
                .insert([animeData])
                .select();

            if (error) throw error;
            animeId = data[0].id;
        }

        // Handle seasons for series
        if (type === 'Series') {
            await handleSeasons(animeId);
        }

        closeModal();
        await loadAnime();
        hideLoading();

    } catch (error) {
        console.error('Error saving anime:', error);
        alert('Failed to save anime. Please try again.');
        hideLoading();
    }
}

async function handleSeasons(animeId) {
    const seasonInputs = elements.seasonsList.querySelectorAll('.season-input-group');

    // Delete existing seasons if editing
    if (editingAnimeId) {
        await supabaseClient
            .from('seasons')
            .delete()
            .eq('anime_id', animeId);
    }

    // Insert new seasons
    const seasonsData = [];
    seasonInputs.forEach(input => {
        const seasonNumber = parseInt(input.querySelector('.season-number').value);
        const totalEpisodes = parseInt(input.querySelector('.season-episodes').value);
        const lastWatched = parseInt(input.querySelector('.season-last-watched').value) || 0;

        seasonsData.push({
            anime_id: animeId,
            season_number: seasonNumber,
            total_episodes: totalEpisodes,
            last_watched: Math.min(lastWatched, totalEpisodes)
        });
    });

    const { error } = await supabaseClient
        .from('seasons')
        .insert(seasonsData);

    if (error) throw error;
}

// ===================================
// SUPABASE OPERATIONS
// ===================================
async function loadAnime() {
    try {
        // Load anime
        const { data: animeData, error: animeError } = await supabaseClient
            .from('anime')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (animeError) throw animeError;

        // Load seasons for each anime
        const { data: seasonsData, error: seasonsError } = await supabaseClient
            .from('seasons')
            .select('*')
            .order('season_number', { ascending: true });

        if (seasonsError) throw seasonsError;

        // Combine data
        allAnime = animeData.map(anime => ({
            ...anime,
            seasons: seasonsData.filter(s => s.anime_id === anime.id)
        }));

        renderAnime();
        updateCounts();

    } catch (error) {
        console.error('Error loading anime:', error);
        alert('Failed to load anime. Please refresh the page.');
    }
}

async function uploadPoster(file, animeName) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${animeName.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`;
        const filePath = fileName;

        const { data, error } = await supabaseClient.storage
            .from(window.supabaseConfig.storageBucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from(window.supabaseConfig.storageBucket)
            .getPublicUrl(filePath);

        return urlData.publicUrl;

    } catch (error) {
        console.error('Error uploading poster:', error);
        throw error;
    }
}

async function deleteAnime(id) {
    if (!confirm('Are you sure you want to delete this anime?')) return;

    showLoading();

    try {
        // Delete seasons first (foreign key constraint)
        await supabaseClient
            .from('seasons')
            .delete()
            .eq('anime_id', id);

        // Delete anime
        const { error } = await supabaseClient
            .from('anime')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await loadAnime();
        hideLoading();

    } catch (error) {
        console.error('Error deleting anime:', error);
        alert('Failed to delete anime. Please try again.');
        hideLoading();
    }
}

async function updateEpisode(animeId, seasonId, increment = true) {
    showLoading();

    try {
        const anime = allAnime.find(a => a.id === animeId);
        const season = anime.seasons.find(s => s.id === seasonId);

        let newLastWatched = season.last_watched + (increment ? 1 : -1);
        newLastWatched = Math.max(0, Math.min(newLastWatched, season.total_episodes));

        // Update season
        const { error } = await supabaseClient
            .from('seasons')
            .update({ last_watched: newLastWatched })
            .eq('id', seasonId);

        if (error) throw error;

        // If season completed, check if we should move to next season
        if (newLastWatched === season.total_episodes && increment) {
            const currentSeasonIndex = anime.seasons.findIndex(s => s.id === seasonId);
            if (currentSeasonIndex < anime.seasons.length - 1) {
                // Auto-start next season
                const nextSeason = anime.seasons[currentSeasonIndex + 1];
                if (nextSeason.last_watched === 0) {
                    await supabaseClient
                        .from('seasons')
                        .update({ last_watched: 1 })
                        .eq('id', nextSeason.id);
                }
            }
        }

        await loadAnime();
        hideLoading();

    } catch (error) {
        console.error('Error updating episode:', error);
        alert('Failed to update episode. Please try again.');
        hideLoading();
    }
}

async function toggleMovieWatched(animeId, currentStatus) {
    showLoading();

    try {
        const { error } = await supabaseClient
            .from('anime')
            .update({ watched: !currentStatus })
            .eq('id', animeId);

        if (error) throw error;

        await loadAnime();
        hideLoading();

    } catch (error) {
        console.error('Error toggling movie status:', error);
        alert('Failed to update movie status. Please try again.');
        hideLoading();
    }
}

// ===================================
// RENDERING
// ===================================
function renderAnime() {
    const filteredAnime = getFilteredAnime();

    if (filteredAnime.length === 0) {
        if (elements.animeGrid) elements.animeGrid.innerHTML = '';
        if (elements.continueWatchingGrid) elements.continueWatchingGrid.innerHTML = '';
        if (elements.myCollectionGrid) elements.myCollectionGrid.innerHTML = '';

        elements.continueWatchingSection.classList.add('hidden');
        elements.myCollectionSection.classList.add('hidden');
        elements.emptyState.classList.add('active');
        return;
    }

    elements.emptyState.classList.remove('active');

    // Split anime into Continue Watching and My Collection
    // Continue Watching: Status is 'Watching'
    const continueWatching = filteredAnime.filter(a => a.status === 'Watching');
    const myCollection = filteredAnime.filter(a => a.status !== 'Watching');

    // Render Continue Watching
    if (continueWatching.length > 0) {
        elements.continueWatchingSection.classList.remove('hidden');
        elements.continueWatchingGrid.innerHTML = continueWatching.map(anime => createAnimeCard(anime)).join('');
    } else {
        elements.continueWatchingSection.classList.add('hidden');
    }

    // Render My Collection
    if (myCollection.length > 0) {
        elements.myCollectionSection.classList.remove('hidden');
        elements.myCollectionGrid.innerHTML = myCollection.map(anime => createAnimeCard(anime)).join('');
    } else {
        elements.myCollectionSection.classList.add('hidden');
    }

    // Attach event listeners to cards
    attachCardEventListeners();
}

function createAnimeCard(anime) {
    const statusClass = anime.status.toLowerCase().replace(/\s+/g, '-');
    const posterUrl = anime.poster_url || 'https://via.placeholder.com/280x380?text=No+Poster';

    if (anime.type === 'Series') {
        return createSeriesCard(anime, statusClass, posterUrl);
    } else {
        return createMovieCard(anime, statusClass, posterUrl);
    }
}

function createSeriesCard(anime, statusClass, posterUrl) {
    const totalEpisodes = anime.seasons.reduce((sum, s) => sum + s.total_episodes, 0);
    const watchedEpisodes = anime.seasons.reduce((sum, s) => sum + s.last_watched, 0);
    const progress = totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0;

    // Find current season and episode
    let currentSeason = null;
    let currentEpisode = 0;
    let overallEpisode = 0;

    for (let i = 0; i < anime.seasons.length; i++) {
        const season = anime.seasons[i];
        if (season.last_watched < season.total_episodes) {
            currentSeason = season;
            currentEpisode = season.last_watched + 1;
            overallEpisode = anime.seasons.slice(0, i).reduce((sum, s) => sum + s.total_episodes, 0) + currentEpisode;
            break;
        } else if (i === anime.seasons.length - 1) {
            // All seasons completed
            currentSeason = season;
            currentEpisode = season.total_episodes;
            overallEpisode = totalEpisodes;
        }
    }

    const isCompleted = watchedEpisodes === totalEpisodes;

    return `
        <div class="anime-card" data-id="${anime.id}">
            <div class="card-top-line"></div>
            <img src="${posterUrl}" alt="${anime.name}" class="card-poster">
            
            <div class="card-content">
                <div class="card-label-row">
                    <span class="type-label">${anime.type}</span>
                    <div class="badge-group">
                        <span class="season-badge">S${currentSeason ? currentSeason.season_number : 1}</span>
                        <div class="trend-badge quick-add-btn" data-anime-id="${anime.id}" title="Quick Add New Season"><span class="arrow-up">▲</span></div>
                    </div>
                </div>

                <h3 class="card-title">${anime.name}</h3>
                
                <div class="status-summary">
                    <span class="ep-text">S${currentSeason ? currentSeason.season_number : 1} • Ep ${currentEpisode} <span style="opacity: 0.5; font-size: 0.85rem;">/ ${currentSeason ? currentSeason.total_episodes : 0}</span></span>
                    <button class="episode-plus-btn" data-anime-id="${anime.id}" data-season-id="${currentSeason?.id}" ${isCompleted ? 'disabled' : ''}>+</button>
                    <span class="dot-separator">•</span>
                    <span class="status-text">${anime.status}</span>
                </div>

                <div class="overall-progress-info">
                    Overall Progress: ${watchedEpisodes} / ${totalEpisodes}
                </div>

                <div class="progress-container">
                    <div class="progress-bar-gradient" style="width: ${progress}%"></div>
                </div>
                
                <div class="card-footer">
                    <div class="card-actions">
                        <button class="action-icon-btn seasons-toggle" data-anime-id="${anime.id}" title="View Seasons">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </button>
                        <button class="action-icon-btn edit" data-id="${anime.id}" title="Edit">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="action-icon-btn delete" data-id="${anime.id}" title="Delete">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>

                <div class="seasons-list-view" id="seasons-${anime.id}">
                    ${anime.seasons.map(season => {
        const seasonProgress = season.total_episodes > 0 ? (season.last_watched / season.total_episodes) * 100 : 0;
        return `
                            <div class="season-item-mini">
                                <span>S${season.season_number}</span>
                                <div class="mini-bar-container"><div class="mini-bar" style="width: ${seasonProgress}%"></div></div>
                                <span>${season.last_watched}/${season.total_episodes}</span>
                            </div>
                        `;
    }).join('')}
                </div>
            </div>
        </div>
    `;
}

function createMovieCard(anime, statusClass, posterUrl) {
    return `
        <div class="anime-card movie-card" data-id="${anime.id}">
            <div class="card-top-line"></div>
            <img src="${posterUrl}" alt="${anime.name}" class="card-poster">
            <div class="card-content">
                <div class="card-label-row">
                    <span class="type-label">${anime.type}</span>
                    <label class="toggle-switch">
                        <input type="checkbox" class="movie-toggle" data-id="${anime.id}" ${anime.watched ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <h3 class="card-title">${anime.name}</h3>
                <span class="status-text">${anime.status}</span>
                
                <div class="card-footer" style="margin-top: 20px;">
                    <div class="card-actions">
                        <button class="action-icon-btn edit" data-id="${anime.id}">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="action-icon-btn delete" data-id="${anime.id}">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function attachCardEventListeners() {
    // Episode plus buttons (the small circles)
    document.querySelectorAll('.episode-plus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const animeId = btn.dataset.animeId;
            const seasonId = btn.dataset.seasonId;
            updateEpisode(animeId, seasonId, true);
        });
    });

    // Trending/Quick Add button in header
    document.querySelectorAll('.trend-badge.quick-add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const animeId = btn.dataset.animeId;
            quickAddSeason(animeId);
        });
    });

    // Seasons toggle
    document.querySelectorAll('.seasons-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const animeId = btn.dataset.animeId;
            const seasonsList = document.getElementById(`seasons-${animeId}`);
            seasonsList.classList.toggle('active');
            btn.classList.toggle('active');
        });
    });

    // Movie watched toggle
    document.querySelectorAll('.movie-toggle').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            e.stopPropagation();
            const animeId = toggle.dataset.id;
            const anime = allAnime.find(a => a.id === animeId);
            toggleMovieWatched(animeId, anime.watched);
        });
    });

    // Edit buttons
    document.querySelectorAll('.action-icon-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const animeId = btn.dataset.id;
            const anime = allAnime.find(a => a.id === animeId);
            openEditModal(anime);
        });
    });

    // Delete buttons
    document.querySelectorAll('.action-icon-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const animeId = btn.dataset.id;
            deleteAnime(animeId);
        });
    });
}

// ===================================
// FILTERING & SEARCH
// ===================================
function getFilteredAnime() {
    let filtered = allAnime;

    // Apply status filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(anime => anime.status === currentFilter);
    }

    // Apply search
    if (currentSearchQuery) {
        const query = currentSearchQuery.toLowerCase();
        filtered = filtered.filter(anime =>
            anime.name.toLowerCase().includes(query)
        );
    }

    return filtered;
}

function handleFilterChange(status) {
    currentFilter = status;
    renderAnime();
    updateCounts();
}

function handleSearch(e) {
    currentSearchQuery = e.target.value.trim();
    renderAnime();
}

function updateCounts() {
    let count = 0;
    if (currentFilter === 'all') {
        count = allAnime.length;
    } else {
        count = allAnime.filter(a => a.status === currentFilter).length;
    }

    // Update the active filter badge
    if (elements.activeFilterBadge) {
        elements.activeFilterBadge.textContent = count;
    }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================
// ===================================
// QUICK ADD SEASON
// ===================================
window.quickAddSeason = async function (animeId) {
    const anime = allAnime.find(a => a.id === animeId);
    const nextSeasonNumber = anime.seasons.length + 1;

    const totalEpisodes = prompt(`Enter total episodes for Season ${nextSeasonNumber}: `, "12");

    if (totalEpisodes === null || totalEpisodes === "" || isNaN(totalEpisodes)) {
        return; // User cancelled or invalid input
    }

    showLoading();

    try {
        const { error } = await supabaseClient
            .from('seasons')
            .insert([{
                anime_id: animeId,
                season_number: nextSeasonNumber,
                total_episodes: parseInt(totalEpisodes),
                last_watched: 0
            }]);

        if (error) throw error;

        await loadAnime();
        hideLoading();
        alert(`Season ${nextSeasonNumber} added successfully!`);

    } catch (error) {
        console.error('Error adding season:', error);
        alert('Failed to add season.');
        hideLoading();
    }
};

function showLoading() {
    elements.loadingOverlay.classList.add('active');
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('active');
}

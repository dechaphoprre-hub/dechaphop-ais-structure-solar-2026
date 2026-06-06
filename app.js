// DOM Elements - Navigation & Core
const lastUpdatedDate = document.getElementById('last-updated-date');
const scrollToTopBtn = document.getElementById('scroll-to-top');
const toast = document.getElementById('toast');

// Stats Indicators
const statTotalVal = document.querySelector('#stat-total .stat-value');
const statCategoriesVal = document.querySelector('#stat-categories .stat-value');
const statVendorsVal = document.querySelector('#stat-vendors .stat-value');
const statTypesVal = document.querySelector('#stat-types .stat-value');
const statFavoritesVal = document.getElementById('stat-favorites-val');

// Wizard Steps Headers
const stepTab1 = document.getElementById('step-tab-1');
const stepTab2 = document.getElementById('step-tab-2');
const stepTab3 = document.getElementById('step-tab-3');
const stepTab4 = document.getElementById('step-tab-4');

// Wizard Labels
const selectedCatLbl = document.getElementById('selected-cat-lbl');
const selectedVendorLbl = document.getElementById('selected-vendor-lbl');
const selectedTypeLbl = document.getElementById('selected-type-lbl');
const selectedCountLbl = document.getElementById('selected-count-lbl');

// Wizard Panels
const panelStep1 = document.getElementById('panel-step-1');
const panelStep2 = document.getElementById('panel-step-2');
const panelStep3 = document.getElementById('panel-step-3');
const panelStep4 = document.getElementById('panel-step-4');

// Wizard Options Lists
const catOptionsList = document.getElementById('cat-options-list');
const vendorOptionsList = document.getElementById('vendor-options-list');
const typeOptionsList = document.getElementById('type-options-list');
const drawingsList = document.getElementById('drawings-list');

// Global Search (Fast Search) Elements
const globalSearchInput = document.getElementById('global-search-input');
const clearGlobalSearchBtn = document.getElementById('clear-global-search');
const wizardContainer = document.getElementById('wizard-container');
const directSearchResultsPanel = document.getElementById('direct-search-results-panel');
const directDrawingsList = document.getElementById('direct-drawings-list');
const resultsCount = document.getElementById('results-count');
const noResults = document.getElementById('no-results');

const cancelSearchBtn = document.getElementById('cancel-search-btn');
const clearSearchBtnNoRes = document.getElementById('clear-search-btn-no-res');

// PDF Modal Elements
const pdfModal = document.getElementById('pdf-modal');
const pdfIframe = document.getElementById('pdf-iframe');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalDrawingTitle = document.getElementById('modal-drawing-title');
const modalMaterialTitle = document.getElementById('modal-material-title');

// App State
let activeStep = 1;
let selectedCat = '';
let selectedVendor = '';
let selectedType = '';
let globalSearchQuery = '';

// Favorites State & Persistence
let favoriteDrawings = JSON.parse(localStorage.getItem('solar-favorites') || '[]');

function toggleFavorite(code) {
    const idx = favoriteDrawings.indexOf(code);
    if (idx === -1) {
        favoriteDrawings.push(code);
        showToast('Added to Favorites ⭐');
    } else {
        favoriteDrawings.splice(idx, 1);
        showToast('Removed from Favorites');
    }
    localStorage.setItem('solar-favorites', JSON.stringify(favoriteDrawings));
    updateFavoritesStats();
    
    // If we are currently viewing favorites, re-render the list immediately
    if (selectedCat === '⭐ Favorites') {
        renderFavoritesList();
    }
}

function updateFavoritesStats() {
    if (statFavoritesVal) {
        statFavoritesVal.textContent = favoriteDrawings.length;
    }
}

function showFavoritesFlow() {
    selectedCat = '⭐ Favorites';
    selectedVendor = '';
    selectedType = '';
    activeStep = 4;
    
    // Update Stepper Headers
    stepTab1.className = 'wizard-step completed';
    stepTab2.className = 'wizard-step disabled';
    stepTab3.className = 'wizard-step disabled';
    stepTab4.className = 'wizard-step active';
    
    selectedCatLbl.textContent = '⭐ Favorites';
    selectedVendorLbl.textContent = 'N/A';
    selectedTypeLbl.textContent = 'N/A';
    
    panelStep1.style.display = 'none';
    panelStep2.style.display = 'none';
    panelStep3.style.display = 'none';
    panelStep4.style.display = 'flex';
    noResults.style.display = 'none';
    directSearchResultsPanel.style.display = 'none';
    wizardContainer.style.display = 'block';
    
    renderFavoritesList();
}

function renderFavoritesList() {
    drawingsList.innerHTML = '';
    
    const finalData = DRAWING_DATA.filter(item => 
        favoriteDrawings.includes(item['Structure Code'])
    );
    
    selectedCountLbl.textContent = `Found ${finalData.length} items`;
    
    if (finalData.length === 0) {
        drawingsList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
                <i class="fa-regular fa-star" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                <p>No bookmarked favorites yet. Click the star icon on any drawing row to add it here!</p>
            </div>
        `;
    } else {
        finalData.forEach(item => {
            const row = createDrawingRow(item);
            drawingsList.appendChild(row);
        });
    }
}

function renderSkeletonLoader() {
    if (!vendorOptionsList) return;
    vendorOptionsList.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton-icon"></div>
            <div class="skeleton-text-group">
                <div class="skeleton-text-1"></div>
                <div class="skeleton-text-2"></div>
            </div>
        `;
        vendorOptionsList.appendChild(skeleton);
    }
}

function highlightText(text, query) {
    if (!query || !text) return text;
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return String(text).replace(regex, '<mark class="search-highlight">$1</mark>');
}

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQm0CGw3poRvXcSVv33aSs1QbSqA9OmJXIIFv6JCAcJC-ZE-iLP1TRugoZCQFNgn1ygeiRGfpC04rLQ/pub?gid=2088776154&single=true&output=csv';

function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        const row = {};
        headers.forEach((header, index) => {
            let val = values[index] !== undefined ? values[index] : '';
            val = val.replace(/^"|"$/g, '').trim();
            if (header === 'Material Code' && val !== '') {
                if (!isNaN(val) && val.indexOf('.') === -1) {
                    val = String(val);
                }
            }
            row[header] = val;
        });
        
        if (row['Structure Code'] || row['Google Drive File URL']) {
            data.push(row);
        }
    }
    return data;
}

async function loadLiveCSV() {
    renderSkeletonLoader();
    const minDelay = new Promise(resolve => setTimeout(resolve, 600)); // Smooth skeleton loader delay
    
    try {
        const [response] = await Promise.all([
            fetch(CSV_URL),
            minDelay
        ]);
        
        if (!response.ok) throw new Error("Network response was not ok");
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        if (parsedData.length > 0) {
            DRAWING_DATA.length = 0;
            parsedData.forEach(row => DRAWING_DATA.push(row));
            
            const now = new Date();
            const dateStr = now.getFullYear() + '-' + 
                            String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(now.getDate()).padStart(2, '0') + ' ' + 
                            String(now.getHours()).padStart(2, '0') + ':' + 
                            String(now.getMinutes()).padStart(2, '0') + ':' + 
                            String(now.getSeconds()).padStart(2, '0');
            lastUpdatedDate.innerHTML = `<span style="color: var(--accent-teal); font-weight: 600;"><i class="fa-solid fa-cloud"></i> Live (Google Sheets)</span> (Synced: ${dateStr})`;
            console.log("Successfully loaded live Google Sheet data. Row count:", parsedData.length);
        }
    } catch (err) {
        console.warn("Failed to load Google Sheet live data. Falling back to local cache data.js", err);
        lastUpdatedDate.innerHTML = `<span style="color: var(--accent-orange); font-weight: 600;"><i class="fa-solid fa-database"></i> Offline Cache</span> (Updated: ${typeof LAST_UPDATED !== 'undefined' ? LAST_UPDATED : 'Unknown'})`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof DRAWING_DATA === 'undefined') {
        alert("Data file data.js not found! Please run update_data.bat first.");
        return;
    }

    // Load and Apply Theme from localStorage
    initThemeSwitcher();

    // Set initial last updated text
    lastUpdatedDate.textContent = typeof LAST_UPDATED !== 'undefined' ? LAST_UPDATED : 'Unknown Update';

    // Load Google Sheets Live Data
    await loadLiveCSV();

    // Populate Initial Metadata & Stats
    calculateInitialStats();
    updateFavoritesStats();

    // Render Step 1 immediately
    renderStep1();

    // Set Event Listeners
    setupEventListeners();
});

// Calculate metrics and populate stats indicators
function calculateInitialStats() {
    const categories = new Set();
    const vendors = new Set();
    const types = new Set();

    DRAWING_DATA.forEach(item => {
        if (item['หมวดหมู่หลัก (Main Cat)']) categories.add(item['หมวดหมู่หลัก (Main Cat)']);
        if (item['Vendor']) vendors.add(item['Vendor']);
        if (item['Structure Type']) types.add(item['Structure Type']);
    });

    statTotalVal.textContent = DRAWING_DATA.length;
    statCategoriesVal.textContent = categories.size;
    statVendorsVal.textContent = vendors.size;
    statTypesVal.textContent = types.size;
}

// Setup Event Listeners
function setupEventListeners() {
    // Header navigation clicks (jump steps)
    const stepTabs = [stepTab1, stepTab2, stepTab3, stepTab4];
    stepTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.classList.contains('disabled')) return;
            const targetStep = parseInt(tab.getAttribute('data-step'));
            goToStep(targetStep);
        });
    });

    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetStep = parseInt(btn.getAttribute('data-back-to'));
            goToStep(targetStep);
        });
    });

    // Reset buttons
    document.querySelectorAll('.reset-wizard-btn').forEach(btn => {
        btn.addEventListener('click', resetWizard);
    });

    // Global Fast Search Input
    globalSearchInput.addEventListener('input', (e) => {
        globalSearchQuery = e.target.value.toLowerCase().trim();
        clearGlobalSearchBtn.style.display = globalSearchQuery.length > 0 ? 'block' : 'none';
        
        if (globalSearchQuery.length > 0) {
            runDirectSearch();
        } else {
            clearDirectSearch();
        }
    });

    // Clear search buttons
    const clearActions = [clearGlobalSearchBtn, cancelSearchBtn, clearSearchBtnNoRes];
    clearActions.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                globalSearchInput.value = '';
                globalSearchQuery = '';
                clearGlobalSearchBtn.style.display = 'none';
                clearDirectSearch();
                globalSearchInput.focus();
            });
        }
    });

    // Scroll to Top button
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // PDF Modal event listeners
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    const modalBackdrop = pdfModal.querySelector('.modal-backdrop');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Favorites stat card click trigger
    const favCardBtn = document.getElementById('stat-favorites');
    if (favCardBtn) {
        favCardBtn.addEventListener('click', () => {
            showFavoritesFlow();
        });
    }
}

// Color Theme Switcher Logic
function initThemeSwitcher() {
    const savedTheme = localStorage.getItem('solar-theme') || 'midnight';
    applyTheme(savedTheme);

    const themeDots = document.querySelectorAll('.theme-dot');
    themeDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const theme = dot.getAttribute('data-theme');
            applyTheme(theme);
        });
    });
}

// Apply theme attribute to documentElement and preserve state
function applyTheme(theme) {
    if (theme === 'midnight') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('solar-theme', theme);
    
    // Set matching dot to active visually
    const themeDots = document.querySelectorAll('.theme-dot');
    themeDots.forEach(d => {
        d.classList.toggle('active', d.getAttribute('data-theme') === theme);
    });
}

// Flow step controller
function goToStep(step) {
    activeStep = step;
    
    // Hide all panels
    panelStep1.style.display = 'none';
    panelStep2.style.display = 'none';
    panelStep3.style.display = 'none';
    panelStep4.style.display = 'none';
    noResults.style.display = 'none';

    // Hide/Show specific panel
    if (step === 1) {
        panelStep1.style.display = 'flex';
        renderStep1();
    } else if (step === 2) {
        panelStep2.style.display = 'flex';
        renderStep2();
    } else if (step === 3) {
        panelStep3.style.display = 'flex';
        renderStep3();
    } else if (step === 4) {
        panelStep4.style.display = 'flex';
        if (selectedCat === '⭐ Favorites') {
            renderFavoritesList();
        } else {
            renderStep4();
        }
    }

    updateStepIndicators();
}

// Update wizard progress classes
function updateStepIndicators() {
    // Step 1
    if (activeStep === 1) {
        stepTab1.className = 'wizard-step active';
        stepTab2.className = 'wizard-step disabled';
        stepTab3.className = 'wizard-step disabled';
        stepTab4.className = 'wizard-step disabled';
        
        selectedVendorLbl.textContent = 'Not Selected';
        selectedCatLbl.textContent = 'Not Selected';
        selectedTypeLbl.textContent = 'Not Selected';
        selectedCountLbl.textContent = '-';
    } 
    // Step 2
    else if (activeStep === 2) {
        stepTab1.className = 'wizard-step completed';
        stepTab2.className = 'wizard-step active';
        stepTab3.className = 'wizard-step disabled';
        stepTab4.className = 'wizard-step disabled';

        selectedVendorLbl.textContent = selectedVendor;
        selectedCatLbl.textContent = 'Not Selected';
        selectedTypeLbl.textContent = 'Not Selected';
        selectedCountLbl.textContent = '-';
    } 
    // Step 3
    else if (activeStep === 3) {
        stepTab1.className = 'wizard-step completed';
        stepTab2.className = 'wizard-step completed';
        stepTab3.className = 'wizard-step active';
        stepTab4.className = 'wizard-step disabled';

        selectedVendorLbl.textContent = selectedVendor;
        selectedCatLbl.textContent = selectedCat;
        selectedTypeLbl.textContent = 'Not Selected';
        selectedCountLbl.textContent = '-';
    } 
    // Step 4
    else if (activeStep === 4) {
        stepTab1.className = 'wizard-step completed';
        stepTab2.className = 'wizard-step completed';
        stepTab3.className = 'wizard-step completed';
        stepTab4.className = 'wizard-step active';

        selectedVendorLbl.textContent = selectedVendor;
        selectedCatLbl.textContent = selectedCat;
        selectedTypeLbl.textContent = selectedType;
    }
}

// Reset wizard state
function resetWizard() {
    selectedCat = '';
    selectedVendor = '';
    selectedType = '';
    goToStep(1);
}

// ==========================================
// STEP RENDERERS (WIZARD FLOW)
// ==========================================

// Step 1: Vendor List Cards
function renderStep1() {
    vendorOptionsList.innerHTML = '';
    
    // Virtual Category Card: Favorites
    const isFavoritesSelected = selectedCat === '⭐ Favorites';
    const favCard = document.createElement('div');
    favCard.className = `option-card favorites-card ${isFavoritesSelected ? 'selected' : ''}`;
    favCard.innerHTML = `
        <div class="option-card-icon"><i class="fa-solid fa-star"></i></div>
        <div class="option-card-info">
            <div class="option-card-label">⭐ Favorites</div>
            <div class="option-card-count">${favoriteDrawings.length} Saved</div>
        </div>
    `;
    favCard.addEventListener('click', () => {
        showFavoritesFlow();
    });
    vendorOptionsList.appendChild(favCard);
    
    // Count drawings for each Vendor
    const vendorCounts = {};
    DRAWING_DATA.forEach(item => {
        const vendor = item['Vendor'];
        if (vendor) {
            vendorCounts[vendor] = (vendorCounts[vendor] || 0) + 1;
        }
    });

    const sortedVendors = Object.keys(vendorCounts).sort();

    sortedVendors.forEach(vendor => {
        const isSelected = selectedVendor === vendor;
        const card = document.createElement('div');
        card.className = `option-card ${isSelected ? 'selected' : ''}`;
        
        card.innerHTML = `
            <div class="option-card-icon" style="color: var(--accent-teal);"><i class="fa-solid fa-industry"></i></div>
            <div class="option-card-info">
                <div class="option-card-label">${vendor}</div>
                <div class="option-card-count">${vendorCounts[vendor]} Drawings</div>
            </div>
        `;

        card.addEventListener('click', () => {
            selectedVendor = vendor;
            goToStep(2);
        });

        vendorOptionsList.appendChild(card);
    });
}

// Step 2: Main Category Cards
function renderStep2() {
    catOptionsList.innerHTML = '';
    
    const filteredByVendor = DRAWING_DATA.filter(item => item['Vendor'] === selectedVendor);
    
    const catCounts = {};
    filteredByVendor.forEach(item => {
        const cat = item['หมวดหมู่หลัก (Main Cat)'];
        if (cat) {
            catCounts[cat] = (catCounts[cat] || 0) + 1;
        }
    });

    const sortedCats = Object.keys(catCounts).sort();

    sortedCats.forEach(cat => {
        const isSelected = selectedCat === cat;
        const card = document.createElement('div');
        card.className = `option-card cat-card ${isSelected ? 'selected' : ''}`;
        card.setAttribute('data-cat', cat);
        
        let iconClass = 'fa-solid fa-folder-open';
        if (cat.startsWith('E')) {
            iconClass = 'fa-solid fa-solar-panel';
        } else if (cat.startsWith('N')) {
            iconClass = 'fa-solid fa-server';
        } else if (cat.startsWith('R')) {
            iconClass = 'fa-solid fa-house-chimney-window';
        }
        
        card.innerHTML = `
            <div class="option-card-icon"><i class="${iconClass}"></i></div>
            <div class="option-card-info">
                <div class="option-card-label">${cat}</div>
                <div class="option-card-count">${catCounts[cat]} Drawings</div>
            </div>
        `;

        card.addEventListener('click', () => {
            selectedCat = cat;
            goToStep(3);
        });

        catOptionsList.appendChild(card);
    });
}

// Step 3: Structure Type Cards
function renderStep3() {
    typeOptionsList.innerHTML = '';
    
    const filtered = DRAWING_DATA.filter(item => 
        item['หมวดหมู่หลัก (Main Cat)'] === selectedCat && 
        item['Vendor'] === selectedVendor
    );

    const typeCounts = {};
    filtered.forEach(item => {
        const type = item['Structure Type'];
        if (type) {
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
    });

    const sortedTypes = Object.keys(typeCounts).sort();

    sortedTypes.forEach(type => {
        const isSelected = selectedType === type;
        const card = document.createElement('div');
        card.className = `option-card ${isSelected ? 'selected' : ''}`;
        
        card.innerHTML = `
            <div class="option-card-icon" style="color: #a2d2ff;"><i class="fa-solid fa-cubes"></i></div>
            <div class="option-card-info">
                <div class="option-card-label" style="font-size: 0.85rem;">${type}</div>
                <div class="option-card-count">${typeCounts[type]} Drawings</div>
            </div>
        `;

        card.addEventListener('click', () => {
            selectedType = type;
            goToStep(4);
        });

        typeOptionsList.appendChild(card);
    });
}

// Step 4: Compact List table rows
function renderStep4() {
    drawingsList.innerHTML = '';
    
    // Filter final data
    const finalData = DRAWING_DATA.filter(item => 
        item['หมวดหมู่หลัก (Main Cat)'] === selectedCat && 
        item['Vendor'] === selectedVendor && 
        item['Structure Type'] === selectedType
    );

    selectedCountLbl.textContent = `Found ${finalData.length} items`;

    if (finalData.length === 0) {
        noResults.style.display = 'flex';
        panelStep4.style.display = 'none';
    } else {
        noResults.style.display = 'none';
        panelStep4.style.display = 'flex';
        
        finalData.forEach(item => {
            const row = createDrawingRow(item);
            drawingsList.appendChild(row);
        });
    }
}

// ==========================================
// DIRECT SEARCH BYPASS LOGIC
// ==========================================

function runDirectSearch() {
    wizardContainer.style.display = 'none';
    noResults.style.display = 'none';
    
    directSearchResultsPanel.style.display = 'flex';
    directDrawingsList.innerHTML = '';

    const filtered = DRAWING_DATA.filter(item => {
        return (item['Structure Code'] && item['Structure Code'].toLowerCase().includes(globalSearchQuery)) ||
            (item['Material Code'] && String(item['Material Code']).toLowerCase().includes(globalSearchQuery)) ||
            (item['Vendor'] && item['Vendor'].toLowerCase().includes(globalSearchQuery)) ||
            (item['Structure Type'] && item['Structure Type'].toLowerCase().includes(globalSearchQuery)) ||
            (item['หมวดหมู่หลัก (Main Cat)'] && item['หมวดหมู่หลัก (Main Cat)'].toLowerCase().includes(globalSearchQuery));
    });

    resultsCount.textContent = `Found ${filtered.length} items out of ${DRAWING_DATA.length}`;

    if (filtered.length === 0) {
        noResults.style.display = 'flex';
        directSearchResultsPanel.style.display = 'none';
    } else {
        directSearchResultsPanel.style.display = 'flex';
        filtered.forEach(item => {
            const row = createDrawingRow(item, globalSearchQuery);
            directDrawingsList.appendChild(row);
        });
    }
}

function clearDirectSearch() {
    directSearchResultsPanel.style.display = 'none';
    noResults.style.display = 'none';
    wizardContainer.style.display = 'block';
    goToStep(activeStep);
}

// ==========================================
// PDF INLINE MODAL PREVIEW HANDLERS
// ==========================================

function openDrawingPreview(driveId, code, materialCode) {
    if (!driveId) return;
    
    // Set title and details
    modalDrawingTitle.textContent = code;
    modalMaterialTitle.textContent = `Material Code: ${materialCode !== '-' ? materialCode : 'N/A'}`;
    
    // Google Drive file preview URL
    const embedUrl = `https://drive.google.com/file/d/${driveId}/preview`;
    
    // Load embed in iframe
    pdfIframe.src = embedUrl;
    
    // Show Modal with animation classes
    pdfModal.classList.add('show');
    document.body.classList.add('modal-open');
}

function closeModal() {
    // Reset iframe to stop streaming network data
    pdfIframe.src = '';
    
    // Hide modal
    pdfModal.classList.remove('show');
    document.body.classList.remove('modal-open');
}

// ==========================================
// COMPACT ROW RENDER COMPONENT
// ==========================================
function createDrawingRow(item, highlightQuery = '') {
    const mainCat = item['หมวดหมู่หลัก (Main Cat)'] || 'UNKNOWN';
    const vendor = item['Vendor'] || 'Unknown Vendor';
    const type = item['Structure Type'] || 'Unknown Type';
    const code = item['Structure Code'] || 'No Code';
    const materialCode = item['Material Code'] || '-';
    const driveId = item['Google Drive File URL'] || '';

    // Assign row border color based on category prefix (E = Orange, N = Teal, R = Blue, default = Gray)
    let rowAccent = 'var(--accent-orange)';
    let badgeBg = 'var(--cat-e-bg)';
    let badgeColor = 'var(--cat-e-color)';

    if (mainCat.startsWith('N')) {
        rowAccent = 'var(--accent-teal)';
        badgeBg = 'var(--cat-n-bg)';
        badgeColor = 'var(--cat-n-color)';
    } else if (mainCat.startsWith('R')) {
        rowAccent = 'var(--accent-blue)';
        badgeBg = 'var(--cat-r-bg)';
        badgeColor = 'var(--cat-r-color)';
    }

    // New filename format: Material Code + _ + Structure Code
    const newFilename = materialCode !== '-' ? `${materialCode}_${code}` : `${code}`;

    // Highlight text if search query is active
    const codeText = highlightQuery ? highlightText(code, highlightQuery) : code;
    const materialText = highlightQuery ? highlightText(materialCode, highlightQuery) : materialCode;
    const isFav = favoriteDrawings.includes(code);

    // Check if the page is served over HTTP via local server (localhost or local IP) vs public static cloud
    const isLocalServer = window.location.protocol.startsWith('http') && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname.startsWith('192.168.') || 
         window.location.hostname.startsWith('10.'));

    const downloadUrl = isLocalServer 
        ? `/download?id=${driveId}&name=${encodeURIComponent(newFilename)}`
        : `https://drive.google.com/uc?export=download&id=${driveId}`;

    const row = document.createElement('div');
    row.className = 'drawing-row';
    row.style.setProperty('--row-accent', rowAccent);
    row.style.setProperty('--badge-bg', badgeBg);
    row.style.setProperty('--badge-color', badgeColor);

    row.innerHTML = `
        <div class="col-cat row-cat">
            <button class="btn-row-favorite ${isFav ? 'active' : ''}" title="${isFav ? 'Remove from Favorites' : 'Add to Favorites'}">
                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i>
            </button>
            <span class="tag-main-cat">${mainCat}</span>
        </div>
        <div class="col-material row-material">
            <span class="material-code-val">${materialText}</span>
            ${materialCode !== '-' ? `
            <button class="copy-icon-btn" title="Copy Material Code">
                <i class="fa-regular fa-copy"></i>
            </button>
            ` : ''}
        </div>
        <div class="col-code row-code" title="${code}">
            <span>${codeText}</span>
            <button class="copy-filename-btn" title="Copy Formatted Filename (${newFilename})">
                <i class="fa-regular fa-copy"></i>
            </button>
        </div>
        <div class="col-details row-details">
            <span class="vendor-lbl">${vendor}</span>
            <span class="type-lbl" title="${type}">${type}</span>
        </div>
        <div class="col-actions row-actions">
            <button class="btn-row-action btn-row-view ${!driveId ? 'disabled' : ''}">
                <i class="fa-regular fa-eye"></i> View
            </button>
            <a href="${downloadUrl}" target="_blank" class="btn-row-action btn-row-download ${!driveId ? 'disabled' : ''}">
                <i class="fa-solid fa-download"></i> Download
            </a>
        </div>
    `;

    // Favorites click handler
    const favBtn = row.querySelector('.btn-row-favorite');
    if (favBtn) {
        favBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFavorite(code);
            const active = favoriteDrawings.includes(code);
            const icon = favBtn.querySelector('i');
            if (active) {
                favBtn.classList.add('active');
                icon.className = 'fa-solid fa-star';
                favBtn.title = 'Remove from Favorites';
            } else {
                favBtn.classList.remove('active');
                icon.className = 'fa-regular fa-star';
                favBtn.title = 'Add to Favorites';
            }
        });
    }

    // Copy Formatted Filename handler
    const copyFilenameBtn = row.querySelector('.copy-filename-btn');
    if (copyFilenameBtn) {
        copyFilenameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(newFilename).then(() => {
                showToast(`Filename copied: ${newFilename}`);
                const icon = copyFilenameBtn.querySelector('i');
                icon.className = 'fa-solid fa-check';
                icon.style.color = 'var(--theme-accent)';
                setTimeout(() => {
                    icon.className = 'fa-regular fa-copy';
                    icon.style.color = 'var(--text-muted)';
                }, 1500);
            });
        });
    }

    // Copy Material Code Listener
    if (materialCode !== '-') {
        const copyBtn = row.querySelector('.copy-icon-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(materialCode).then(() => {
                    showToast('Material Code copied to clipboard!');
                    const icon = copyBtn.querySelector('i');
                    icon.className = 'fa-solid fa-check';
                    icon.style.color = 'var(--accent-teal)';
                    setTimeout(() => {
                        icon.className = 'fa-regular fa-copy';
                        icon.style.color = 'var(--text-secondary)';
                    }, 1500);
                });
            });
        }
    }

    // Bind Inline PDF Preview Modal Trigger to "ดูแบบ" Button
    const viewBtn = row.querySelector('.btn-row-view');
    if (viewBtn && driveId) {
        viewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openDrawingPreview(driveId, code, materialCode);
        });
    }

    // Intercept Download to provide fallback notifications if running in file:// mode
    const downloadBtn = row.querySelector('.btn-row-download');
    if (downloadBtn && driveId) {
        downloadBtn.addEventListener('click', (e) => {
            if (!isLocalServer) {
                navigator.clipboard.writeText(newFilename).then(() => {
                    showToast(`New filename copied! Press Ctrl+V to paste when saving`);
                }).catch(err => {
                    console.error("Failed to copy: ", err);
                });
            } else {
                showToast(`Starting download: ${newFilename}`);
            }
        });
    }

    return row;
}

// Show Toast feedback utility with custom messages
function showToast(message = 'Copied successfully!') {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

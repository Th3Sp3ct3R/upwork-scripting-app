/* ================================================================
   Upwork Auto-Apply Dashboard
   ================================================================ */

const API = window.location.origin;
let currentTab = 'pending';
let currentFilterReason = null;

// ================================================================
// Toast
// ================================================================

let toastTimer = null;
function toast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    const typeMap = { '#ef4444': 'error', '#3b82f6': 'info', '#8b5cf6': 'info', '#10b981': 'success' };
    type = typeMap[type] || type;
    const styles = {
        success: { border: '#166534', color: '#34d399' },
        error:   { border: '#991b1b', color: '#fb7185' },
        info:    { border: '#3730a3', color: '#a5b4fc' },
    };
    const s = styles[type] || styles.info;
    t.style.borderColor = s.border;
    t.style.color = s.color;
    t.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.style.display = 'none', 3000);
}

// ================================================================
// Stats
// ================================================================

async function loadStats() {
    try {
        const r = await fetch(`${API}/api/stats`);
        const d = await r.json();
        document.getElementById('stats').innerHTML = [
            ['Today', d.jobs_fetched_today, '#6366f1'],
            ['New', d.new_jobs, '#a5b4fc'],
            ['Filtered', d.filtered_out, '#fb7185'],
            ['Pending', d.pending_proposal, '#fbbf24'],
            ['Ready', d.proposals_pending, '#c4b5fd'],
            ['Approved', d.proposals_approved, '#34d399'],
            ['Sent', d.proposals_sent, '#67e8f9'],
        ].map(([label, val, color]) => `
            <div class="stat-card">
                <div class="stat-value" style="color:${color}">${val || 0}</div>
                <div class="stat-label">${label}</div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Failed to load stats:', e);
    }
}

// ================================================================
// Config / Sidebar
// ================================================================

async function loadConfig() {
    try {
        const r = await fetch(`${API}/api/config`);
        const cfg = await r.json();

        renderKeywordTags('search-keywords', cfg.search_keywords, 'search_keywords');
        renderKeywordTags('blacklist-keywords', cfg.keyword_blacklist, 'keyword_blacklist');
        renderKeywordTags('whitelist-keywords', cfg.keyword_whitelist, 'keyword_whitelist');

        const bf = cfg.budget_filters || {};
        setVal('filter-fixed-min', bf.fixed_min);
        setVal('filter-hourly-min', bf.hourly_min);
        setChecked('filter-allow-no-budget', bf.allow_no_budget);

        const cf = cfg.client_filters || {};
        setVal('filter-min-spent', cf.min_client_spent);
        setChecked('filter-payment-verified', cf.require_payment_verified);
        setVal('filter-blocked-countries', (cf.blocked_countries || []).join(', '));
        setVal('filter-allowed-countries', (cf.allowed_countries || []).join(', '));

        setVal('filter-min-score', cfg.whitelist_min_score);
    } catch (e) {
        console.error('Failed to load config:', e);
    }
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
}
function setChecked(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
}

function renderKeywordTags(containerId, keywords, configKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tags = (keywords || []).map((kw, i) => `
        <span class="tag">
            ${escapeHtml(kw)}
            <button class="tag-remove" onclick="removeTag('${configKey}', ${i})">&times;</button>
        </span>
    `).join('');

    container.innerHTML = `
        <div class="tag-container">${tags}</div>
        <div class="tag-input-row">
            <input class="tag-input" id="input-${configKey}" placeholder="Add..."
                   onkeydown="if(event.key==='Enter'){addTag('${configKey}');event.preventDefault()}">
            <button class="btn-secondary btn-xs" onclick="addTag('${configKey}')">+</button>
        </div>
    `;
}

async function removeTag(configKey, index) {
    const r = await fetch(`${API}/api/config`);
    const cfg = await r.json();
    const arr = cfg[configKey] || [];
    arr.splice(index, 1);
    await updateConfigKey(configKey, arr);
    loadConfig();
}

async function addTag(configKey) {
    const input = document.getElementById(`input-${configKey}`);
    const val = input.value.trim();
    if (!val) return;

    const r = await fetch(`${API}/api/config`);
    const cfg = await r.json();
    const arr = cfg[configKey] || [];
    arr.push(val);
    await updateConfigKey(configKey, arr);
    input.value = '';
    loadConfig();
}

async function updateConfigKey(key, value) {
    await fetch(`${API}/api/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
    });
}

async function applyFilters() {
    const update = {
        budget_filters: {
            fixed_min: parseInt(document.getElementById('filter-fixed-min').value) || 0,
            hourly_min: parseInt(document.getElementById('filter-hourly-min').value) || 0,
            allow_no_budget: document.getElementById('filter-allow-no-budget').checked,
        },
        client_filters: {
            min_client_spent: parseInt(document.getElementById('filter-min-spent').value) || 0,
            require_payment_verified: document.getElementById('filter-payment-verified').checked,
            blocked_countries: parseCSV(document.getElementById('filter-blocked-countries').value),
            allowed_countries: parseCSV(document.getElementById('filter-allowed-countries').value),
            max_proposals_tier: '',
            allowed_job_types: [],
            allowed_experience: [],
        },
        whitelist_min_score: parseInt(document.getElementById('filter-min-score').value) || 2,
    };

    try {
        await fetch(`${API}/api/config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update)
        });
        toast('Filters applied');
    } catch (e) {
        toast('Failed to apply filters', 'error');
    }
}

function parseCSV(val) {
    return (val || '').split(',').map(s => s.trim()).filter(Boolean);
}

// ================================================================
// Saved Searches
// ================================================================

async function loadSavedSearches() {
    try {
        const r = await fetch(`${API}/api/searches`);
        const d = await r.json();
        const list = document.getElementById('search-list');
        if (!list) return;

        if (!d.searches?.length) {
            list.innerHTML = '<div class="text-muted" style="font-size:12px;padding:4px 8px">No saved searches</div>';
            return;
        }

        list.innerHTML = d.searches.map(s => `
            <li class="search-item ${s.is_active ? 'active' : ''}" onclick="activateSearch(${s.id})">
                <span>${escapeHtml(s.name)}</span>
                <button class="delete-btn" onclick="event.stopPropagation();deleteSearch(${s.id})">&times;</button>
            </li>
        `).join('');
    } catch (e) {
        console.error('Failed to load searches:', e);
    }
}

async function activateSearch(id) {
    try {
        const r = await fetch(`${API}/api/searches/${id}/activate`, { method: 'POST' });
        const d = await r.json();
        toast(`Activated: ${d.name}`, 'info');
        loadSavedSearches();
        loadConfig();
    } catch (e) {
        toast('Failed to activate', 'error');
    }
}

async function saveCurrentSearch() {
    const name = prompt('Search name:');
    if (!name) return;
    try {
        await fetch(`${API}/api/searches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        toast(`Saved: ${name}`);
        loadSavedSearches();
    } catch (e) {
        toast('Failed to save', 'error');
    }
}

async function deleteSearch(id) {
    if (!confirm('Delete this search?')) return;
    try {
        await fetch(`${API}/api/searches/${id}`, { method: 'DELETE' });
        toast('Search deleted');
        loadSavedSearches();
    } catch (e) {
        toast('Failed to delete', 'error');
    }
}

// ================================================================
// Tabs
// ================================================================

let currentFeedSource = null;

function switchTab(el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    currentTab = el.dataset.status;

    if (currentTab === 'feed') {
        loadFeedJobs();
    } else if (currentTab === 'filtered_out') {
        loadFilteredJobs();
    } else if (currentTab === 'saved') {
        loadSavedJobs();
    } else {
        loadProposals(currentTab);
    }
}

// ================================================================
// Proposals
// ================================================================

async function loadProposals(status) {
    status = status || currentTab;
    const container = document.getElementById('proposals-container');
    try {
        const r = await fetch(`${API}/api/proposals?status=${status}`);
        const d = await r.json();
        if (!d.proposals?.length) {
            container.innerHTML = `<div class="empty-state">No ${status} proposals</div>`;
            return;
        }
        container.innerHTML = d.proposals.map(p => renderProposalCard(p, status)).join('');
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="empty-state">Failed to load</div>';
    }
}

function renderProposalCard(p, status) {
    let actions = '';
    if (status === 'pending') {
        actions = `
            <button class="btn-approve btn-sm" onclick="approve(${p.id})">Approve</button>
            <button class="btn-reject btn-sm" onclick="reject(${p.id})">Reject</button>
        `;
    } else if (status === 'approved') {
        actions = `<button class="btn-submit btn-sm" onclick="submitOne(${p.id})">Submit Now</button>`;
    }

    return `
        <div class="proposal-card" id="card-${p.id}">
            <div class="proposal-header">
                <div style="flex:1">
                    <div class="proposal-title">
                        <a href="#" onclick="event.preventDefault();showJobDetail('${p.job_id}')">${escapeHtml(p.title || 'Untitled')}</a>
                    </div>
                    <div class="proposal-meta">
                        <span>Budget: ${escapeHtml(p.budget || 'Not specified')}</span>
                        <span>Client: ${escapeHtml(p.client_country || '?')}</span>
                        <span>Spent: $${escapeHtml(String(p.client_spent || '0'))}</span>
                        <span class="badge badge-${p.status}">${p.status}</span>
                    </div>
                </div>
                <button class="btn-save" onclick="event.stopPropagation();toggleSave('${p.job_id}', this)" title="Save job">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>
            </div>
            <div class="proposal-text">${escapeHtml(p.proposal_text)}</div>
            <div class="proposal-actions">
                ${actions}
                <button class="btn-secondary btn-sm" onclick="showJobDetail('${p.job_id}')">View Job</button>
                <button class="btn-secondary btn-sm" onclick="window.open('${escapeHtml(p.url)}','_blank')">Open on Upwork</button>
            </div>
        </div>
    `;
}

// ================================================================
// Saved Jobs
// ================================================================

async function toggleSave(jobId, btn) {
    // Check current state from button
    const isSaved = btn?.classList.contains('saved');
    const endpoint = isSaved ? 'unsave' : 'save';

    try {
        await fetch(`${API}/api/jobs/${jobId}/${endpoint}`, { method: 'POST' });
        if (btn) btn.classList.toggle('saved');
        toast(isSaved ? 'Job unsaved' : 'Job saved', 'info');
        // Refresh saved tab if viewing it
        if (currentTab === 'saved') loadSavedJobs();
    } catch (e) {
        toast('Failed to save job', 'error');
    }
}

async function loadSavedJobs() {
    const container = document.getElementById('proposals-container');
    try {
        const r = await fetch(`${API}/api/jobs/saved`);
        const d = await r.json();

        if (!d.jobs?.length) {
            container.innerHTML = '<div class="empty-state">No saved jobs yet</div>';
            return;
        }

        container.innerHTML = d.jobs.map(j => `
            <div class="filtered-card">
                <div style="display:flex;justify-content:space-between;align-items:start">
                    <div class="job-title">
                        <a href="#" onclick="event.preventDefault();showJobDetail('${j.id}')">${escapeHtml(j.title)}</a>
                    </div>
                    <button class="btn-save saved" onclick="event.stopPropagation();toggleSave('${j.id}', this)" title="Unsave">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>
                <div class="job-meta">
                    <span>Budget: ${escapeHtml(j.budget || 'N/A')}</span>
                    <span>Country: ${escapeHtml(j.client_country || '?')}</span>
                    <span>Score: ${j.filter_score || 0}</span>
                    <span class="badge badge-${j.status === 'filtered_out' ? 'rejected' : 'pending'}">${escapeHtml(j.status)}</span>
                    ${j.proposal_status ? `<span class="badge badge-${j.proposal_status}">${j.proposal_status}</span>` : ''}
                </div>
                <div class="job-desc">${escapeHtml((j.description || '').slice(0, 200))}</div>
                <div class="card-actions">
                    <button class="btn-secondary btn-sm" onclick="showJobDetail('${j.id}')">View Details</button>
                    <a href="${escapeHtml(j.url)}" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none;display:inline-block">Open on Upwork</a>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="empty-state">Failed to load saved jobs</div>';
    }
}

// ================================================================
// Feed (Best Matches + Most Recent + Saved Jobs)
// ================================================================

async function loadFeedJobs(source) {
    currentFeedSource = source || null;
    const container = document.getElementById('proposals-container');

    try {
        const params = new URLSearchParams({ limit: '100' });
        if (source) params.set('source', source);

        const r = await fetch(`${API}/api/jobs/feed?${params}`);
        const d = await r.json();

        const sourceLabels = {
            'best-matches': 'Best Matches',
            'most-recent': 'Most Recent',
            'saved-jobs': 'Saved Jobs',
        };

        let pills = '<div class="reason-filters">';
        pills += `<span class="reason-pill ${!source ? 'active' : ''}" onclick="loadFeedJobs()">All <span class="count">${d.total || 0}</span></span>`;
        for (const [src, count] of Object.entries(d.source_counts || {})) {
            pills += `<span class="reason-pill ${source === src ? 'active' : ''}" onclick="loadFeedJobs('${src}')">${sourceLabels[src] || src} <span class="count">${count}</span></span>`;
        }
        pills += '</div>';

        if (!d.jobs?.length) {
            container.innerHTML = pills + '<div class="empty-state">No feed jobs yet — click Best Matches or Most Recent to pull jobs</div>';
            return;
        }

        const cards = d.jobs.map(j => {
            const sourceBadge = j.feed_source ? `<span class="badge badge-source">${sourceLabels[j.feed_source] || j.feed_source}</span>` : '';
            const statusBadge = j.proposal_status
                ? `<span class="badge badge-${j.proposal_status}">${j.proposal_status}</span>`
                : `<span class="badge badge-${j.status === 'filtered_out' ? 'rejected' : 'pending'}">${j.status}</span>`;

            return `
                <div class="filtered-card">
                    <div style="display:flex;justify-content:space-between;align-items:start">
                        <div class="job-title">
                            <a href="#" onclick="event.preventDefault();showJobDetail('${j.id}')">${escapeHtml(j.title)}</a>
                        </div>
                        <button class="btn-save ${j.is_saved ? 'saved' : ''}" onclick="event.stopPropagation();toggleSave('${j.id}', this)" title="Save job">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="${j.is_saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="job-meta">
                        ${sourceBadge}
                        <span>Budget: ${escapeHtml(j.budget || 'N/A')}</span>
                        <span>Country: ${escapeHtml(j.client_country || '?')}</span>
                        <span>Spent: $${escapeHtml(String(j.client_spent || '0'))}</span>
                        ${statusBadge}
                    </div>
                    <div class="job-desc">${escapeHtml((j.description || '').slice(0, 200))}</div>
                    <div class="card-actions">
                        <button class="btn-secondary btn-sm" onclick="showJobDetail('${j.id}')">View Details</button>
                        <a href="${escapeHtml(j.url)}" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none;display:inline-block">Open on Upwork</a>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = pills + cards;
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="empty-state">Failed to load feed</div>';
    }
}

// ================================================================
// Filtered Jobs
// ================================================================

async function loadFilteredJobs(reason) {
    currentFilterReason = reason || null;
    const container = document.getElementById('proposals-container');

    try {
        const params = new URLSearchParams({ limit: '50', offset: '0' });
        if (reason) params.set('reason', reason);

        const r = await fetch(`${API}/api/jobs/filtered?${params}`);
        const d = await r.json();

        let pills = '<div class="reason-filters">';
        pills += `<span class="reason-pill ${!reason ? 'active' : ''}" onclick="loadFilteredJobs()">All <span class="count">${d.total || 0}</span></span>`;
        for (const [r, count] of Object.entries(d.reason_counts || {})) {
            pills += `<span class="reason-pill ${reason === r ? 'active' : ''}" onclick="loadFilteredJobs('${escapeHtml(r)}')">${escapeHtml(r)} <span class="count">${count}</span></span>`;
        }
        pills += '</div>';

        let refilterBar = `
            <div class="refilter-bar">
                <span class="info">${d.jobs?.length || 0} filtered jobs shown</span>
                <button class="btn-primary btn-sm" onclick="refilterAll()">Re-filter All</button>
            </div>
        `;

        if (!d.jobs?.length) {
            container.innerHTML = pills + refilterBar + '<div class="empty-state">No filtered jobs</div>';
            return;
        }

        const cards = d.jobs.map(j => `
            <div class="filtered-card">
                <div style="display:flex;justify-content:space-between;align-items:start">
                    <div class="job-title">
                        <a href="#" onclick="event.preventDefault();showJobDetail('${j.id}')">${escapeHtml(j.title)}</a>
                    </div>
                    <button class="btn-save ${j.is_saved ? 'saved' : ''}" onclick="event.stopPropagation();toggleSave('${j.id}', this)" title="Save job">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="${j.is_saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>
                <div class="job-meta">
                    <span>Budget: ${escapeHtml(j.budget || 'N/A')}</span>
                    <span>Country: ${escapeHtml(j.client_country || '?')}</span>
                    <span>Score: ${j.filter_score || 0}</span>
                    <span class="badge badge-reason">${escapeHtml(j.filter_reason || 'unknown')}</span>
                </div>
                <div class="job-desc">${escapeHtml((j.description || '').slice(0, 200))}</div>
                <div class="card-actions">
                    <button class="btn-secondary btn-sm" onclick="showJobDetail('${j.id}')">View Details</button>
                    <button class="btn-primary btn-sm" onclick="refilterJob('${j.id}')">Re-filter</button>
                    <a href="${escapeHtml(j.url)}" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none;display:inline-block">Open on Upwork</a>
                </div>
            </div>
        `).join('');

        container.innerHTML = pills + refilterBar + cards;
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="empty-state">Failed to load filtered jobs</div>';
    }
}

// ================================================================
// Refilter
// ================================================================

async function refilterJob(id) {
    try {
        const r = await fetch(`${API}/api/jobs/${id}/refilter`, { method: 'POST' });
        const d = await r.json();
        toast(d.passed ? 'Job passed filters!' : 'Job still filtered out');
        loadFilteredJobs(currentFilterReason);
        loadStats();
    } catch (e) {
        toast('Refilter failed', 'error');
    }
}

async function refilterAll() {
    if (!confirm('Re-evaluate all filtered jobs against current filters?')) return;
    toast('Re-filtering all jobs...', 'info');
    try {
        const r = await fetch(`${API}/api/jobs/refilter-all`, { method: 'POST' });
        const d = await r.json();
        toast(`Re-filter done: ${d.passed} passed, ${d.filtered} filtered`);
        loadFilteredJobs();
        loadStats();
    } catch (e) {
        toast('Re-filter failed', 'error');
    }
}

// ================================================================
// Job Detail Panel
// ================================================================

async function showJobDetail(jobId) {
    try {
        const r = await fetch(`${API}/api/jobs/${jobId}`);
        if (!r.ok) throw new Error('Not found');
        const job = await r.json();

        document.getElementById('detail-title').textContent = job.title || 'Untitled';

        const saveClass = job.is_saved ? 'saved' : '';
        const saveFill = job.is_saved ? 'currentColor' : 'none';

        document.getElementById('detail-body-content').innerHTML = `
            <div class="detail-meta">
                <div class="detail-meta-item">
                    <div class="label">Budget</div>
                    <div class="value">${escapeHtml(job.budget || 'Not specified')}</div>
                </div>
                <div class="detail-meta-item">
                    <div class="label">Job Type</div>
                    <div class="value">${escapeHtml(job.job_type || 'N/A')}</div>
                </div>
                <div class="detail-meta-item">
                    <div class="label">Client Country</div>
                    <div class="value">${escapeHtml(job.client_country || 'Unknown')}</div>
                </div>
                <div class="detail-meta-item">
                    <div class="label">Client Spent</div>
                    <div class="value">$${escapeHtml(String(job.client_spent || '0'))}</div>
                </div>
                <div class="detail-meta-item">
                    <div class="label">Payment Verified</div>
                    <div class="value">${job.client_verified ? 'Yes' : 'No'}</div>
                </div>
                <div class="detail-meta-item">
                    <div class="label">Experience Level</div>
                    <div class="value">${escapeHtml(job.experience_level || 'N/A')}</div>
                </div>
                <div class="detail-meta-item">
                    <div class="label">Proposals Tier</div>
                    <div class="value">${escapeHtml(job.proposals_tier || 'N/A')}</div>
                </div>
                <div class="detail-meta-item">
                    <div class="label">Status</div>
                    <div class="value"><span class="badge badge-${job.status === 'filtered_out' ? 'rejected' : 'pending'}">${escapeHtml(job.status)}</span></div>
                </div>
                ${job.filter_reason ? `
                <div class="detail-meta-item">
                    <div class="label">Filter Reason</div>
                    <div class="value"><span class="badge badge-reason">${escapeHtml(job.filter_reason)}</span></div>
                </div>
                ` : ''}
                <div class="detail-meta-item">
                    <div class="label">Filter Score</div>
                    <div class="value">${job.filter_score || 0}</div>
                </div>
            </div>
            <div class="detail-description">${escapeHtml(job.description || 'No description available')}</div>
            <div class="detail-actions">
                <button class="btn-save-full ${saveClass}" onclick="toggleSave('${job.id}', this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="${saveFill}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    ${job.is_saved ? 'Saved' : 'Save Job'}
                </button>
                <a href="${escapeHtml(job.url)}" target="_blank" class="btn-primary btn-sm" style="text-decoration:none;display:inline-block">Open on Upwork</a>
                ${job.status === 'filtered_out' ? `<button class="btn-secondary btn-sm" onclick="refilterJob('${job.id}');closeDetail()">Re-filter</button>` : ''}
            </div>
        `;

        document.getElementById('detail-overlay').classList.add('open');
        document.getElementById('detail-panel').classList.add('open');
    } catch (e) {
        console.error(e);
        toast('Failed to load job details', 'error');
    }
}

function closeDetail() {
    document.getElementById('detail-overlay').classList.remove('open');
    document.getElementById('detail-panel').classList.remove('open');
}

// ================================================================
// Proposal Actions
// ================================================================

async function approve(id) {
    await fetch(`${API}/api/proposal/${id}/approve`, { method: 'POST' });
    toast('Proposal approved');
    loadProposals(); loadStats();
}

async function reject(id) {
    await fetch(`${API}/api/proposal/${id}/reject`, { method: 'POST' });
    toast('Proposal rejected', 'error');
    loadProposals(); loadStats();
}

async function scrapeFeed(source) {
    const labels = { 'best-matches': 'Best Matches', 'most-recent': 'Most Recent', 'saved-jobs': 'My Saves' };
    const label = labels[source] || source;
    toast(`Pulling ${label} jobs...`, 'info');
    try {
        const r = await fetch(`${API}/api/scrape-feed/${source}`, { method: 'POST' });
        if (!r.ok) throw new Error(await r.text());
        const d = await r.json();
        toast(`${label}: ${d.new_jobs} new jobs, ${d.proposals_generated || 0} proposals generated`);
        loadStats();
        if (currentTab === 'feed') loadFeedJobs(currentFeedSource);
        else loadProposals();
    } catch (e) {
        toast(`${label} failed: ${e.message || e}`, 'error');
    }
}

async function runCycle() {
    toast('Running cycle...', 'info');
    try {
        const r = await fetch(`${API}/api/run-cycle`, { method: 'POST' });
        const d = await r.json();
        toast(`Cycle done: ${d.proposals_generated || 0} proposals generated`);
        loadStats(); loadProposals();
    } catch (e) {
        toast('Cycle failed: ' + e, 'error');
    }
}

async function submitApproved() {
    toast('Submitting approved proposals...', 'info');
    try {
        const r = await fetch(`${API}/api/submit-approved`, { method: 'POST' });
        const d = await r.json();
        toast(`Submitted ${d.submitted || 0} proposals`);
        loadStats(); loadProposals();
    } catch (e) {
        toast('Submit failed', 'error');
    }
}

async function submitOne(id) {
    toast('Submitting...', 'info');
    try {
        const r = await fetch(`${API}/api/submit/${id}`, { method: 'POST' });
        const d = await r.json();
        toast(d.status === 'submitted' ? 'Submitted!' : 'Failed');
        loadStats(); loadProposals();
    } catch (e) {
        toast('Submit failed', 'error');
    }
}

// ================================================================
// Sidebar Collapse
// ================================================================

function toggleSection(header) {
    header.classList.toggle('collapsed');
    const body = header.nextElementSibling;
    body.classList.toggle('hidden');
}

// ================================================================
// Utilities
// ================================================================

function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s || '';
    return div.innerHTML;
}

// ================================================================
// Init
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadProposals();
    loadConfig();
    loadSavedSearches();

    document.getElementById('detail-overlay')?.addEventListener('click', closeDetail);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDetail();
    });

    setInterval(() => {
        loadStats();
        if (currentTab === 'feed') loadFeedJobs(currentFeedSource);
        else if (currentTab === 'filtered_out') loadFilteredJobs(currentFilterReason);
        else if (currentTab === 'saved') loadSavedJobs();
        else loadProposals();
    }, 30000);
});

// ============================================
// SUPABASE CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://nkuqrucociafwqnytpai.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rdXFydWNvY2lhZndxbnl0cGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODk4ODQsImV4cCI6MjA5ODQ2NTg4NH0.fvOfoR-VZqyJVXu7faxGk5KrMMhaSBTGfCluV00I-Kw'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ============================================
// ADMIN CREDENTIALS
// ============================================
const ADMIN_USERNAME = 'dcpAdmin'
const ADMIN_PASSWORD = 'Skiza2027'

// ============================================
// STATE
// ============================================
let allSupporters = []
let allMembers = []
let allMeetings = []
let currentTab = 'supporters'

// ============================================
// DOM ELEMENTS
// ============================================
const loginScreen = document.getElementById('admin-login')
const dashboard = document.getElementById('admin-dashboard')
const loginBtn = document.getElementById('admin-login-btn')
const logoutBtn = document.getElementById('logout-btn')
const loginFeedback = document.getElementById('login-feedback')
 
// ============================================
// LOGIN / LOGOUT — SUPABASE AUTH
// ============================================

// Check if already logged in on page load
db.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        loginScreen.style.display = 'none'
        dashboard.style.display = 'block'
        initDashboard()
    }
})

loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('admin-username').value.trim()
    const password = document.getElementById('admin-password').value.trim()

    if (!email || !password) {
        loginFeedback.style.color = '#dc3545'
        loginFeedback.textContent = 'Please enter your email and password.'
        return
    }

    loginBtn.textContent = 'Logging in...'
    loginBtn.disabled = true

    const { error } = await db.auth.signInWithPassword({ email, password })

    if (error) {
        loginFeedback.style.color = '#dc3545'
        loginFeedback.textContent = 'Invalid email or password.'
        loginBtn.textContent = 'Login'
        loginBtn.disabled = false
        return
    }

    loginScreen.style.display = 'none'
    dashboard.style.display = 'block'
    initDashboard()
})

logoutBtn.addEventListener('click', async () => {
    await db.auth.signOut()
    loginScreen.style.display = 'flex'
    dashboard.style.display = 'none'
    document.getElementById('admin-username').value = ''
    document.getElementById('admin-password').value = ''
})

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && loginScreen.style.display !== 'none') {
        loginBtn.click()
    }
})

// ============================================
// LIVE CLOCK
// ============================================
function startClock() {
    const timeEl = document.getElementById('admin-time')
    setInterval(() => {
        timeEl.textContent = new Date().toLocaleString('en-KE', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }, 1000)
}

// ============================================
// TAB SWITCHING
// ============================================
function initTabs() {
    const tabs = document.querySelectorAll('.admin-tab')
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'))
            tab.classList.add('active')
            const target = tab.dataset.tab
            currentTab = target
            document.querySelectorAll('.tab-section').forEach(section => {
                section.style.display = 'none'
            })
            document.getElementById(`tab-${target}`).style.display = 'block'
        })
    })
}

// ============================================
// INIT DASHBOARD
// ============================================
async function initDashboard() {
    startClock()
    initTabs()
    await loadSupporters()
    await loadMembers()
    await loadMeetings()
}

// ============================================
// TAB 1 — SUPPORTERS
// ============================================
async function loadSupporters() {
    try {
        const { data, error } = await db
            .from('supporters')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        allSupporters = data
        updateStats(data)
        renderSupportersTable(data)

    } catch (error) {
        console.error('Load supporters error:', error)
    }
}

function updateStats(data) {
    document.getElementById('stat-total').textContent = data.length.toLocaleString()
    document.getElementById('stat-voters').textContent = data.filter(s => s.role === 'voter').length.toLocaleString()
    document.getElementById('stat-volunteers').textContent = data.filter(s => s.role === 'volunteer').length.toLocaleString()
    document.getElementById('stat-agents').textContent = data.filter(s => s.role === 'agent').length.toLocaleString()
    document.getElementById('stat-mobilizers').textContent = data.filter(s => s.role === 'mobilizer').length.toLocaleString()
}

function renderSupportersTable(data) {
    const tbody = document.getElementById('supporters-tbody')
    const noData = document.getElementById('no-data-msg')

    if (data.length === 0) {
        tbody.innerHTML = ''
        noData.style.display = 'block'
        return
    }

    noData.style.display = 'none'
    tbody.innerHTML = data.map((s, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${s.full_name}</td>
            <td>${s.phone}</td>
            <td>${s.email || '—'}</td>
            <td>${s.ward}</td>
            <td><span class="role-badge ${s.role}">${s.role}</span></td>
            <td>${new Date(s.created_at).toLocaleDateString('en-KE')}</td>
        </tr>
    `).join('')

    renderWardBreakdown(data)
}

function renderWardBreakdown(data) {
    const wardGrid = document.getElementById('ward-grid')
    const wardCounts = {}

    data.forEach(s => {
        wardCounts[s.ward] = (wardCounts[s.ward] || 0) + 1
    })

    wardGrid.innerHTML = Object.entries(wardCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([ward, count]) => `
            <div class="ward-card">
                <h3>${count.toLocaleString()}</h3>
                <p>${ward}</p>
            </div>
        `).join('')
}

document.getElementById('search-input').addEventListener('input', filterSupporters)
document.getElementById('ward-filter').addEventListener('change', filterSupporters)
document.getElementById('role-filter').addEventListener('change', filterSupporters)

function filterSupporters() {
    const search = document.getElementById('search-input').value.toLowerCase()
    const ward = document.getElementById('ward-filter').value
    const role = document.getElementById('role-filter').value

    let filtered = allSupporters

    if (search) {
        filtered = filtered.filter(s =>
            s.full_name.toLowerCase().includes(search) ||
            s.phone.includes(search)
        )
    }

    if (ward !== 'all') {
        filtered = filtered.filter(s => s.ward === ward)
    }

    if (role !== 'all') {
        filtered = filtered.filter(s => s.role === role)
    }

    renderSupportersTable(filtered)
}

document.getElementById('refresh-btn').addEventListener('click', loadSupporters)

document.getElementById('export-btn').addEventListener('click', () => {
    const headers = ['#', 'Full Name', 'Phone', 'Email', 'Ward', 'Role', 'Registered']
    const rows = allSupporters.map((s, i) => [
        i + 1,
        s.full_name,
        s.phone,
        s.email || '',
        s.ward,
        s.role,
        new Date(s.created_at).toLocaleDateString('en-KE')
    ])

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `supporters_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
})

// ============================================
// TAB 2 — TEAM MEMBERS
// ============================================
async function loadMembers() {
    try {
        const { data, error } = await db
            .from('members')
            .select('*')
            .order('rank', { ascending: true })

        if (error) throw error

        allMembers = data
        renderMembersTable(data)

    } catch (error) {
        console.error('Load members error:', error)
    }
}

function renderMembersTable(data) {
    const tbody = document.getElementById('members-tbody')

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#666; padding:40px;">No team members added yet.</td></tr>`
        return
    }

    tbody.innerHTML = data.map((m, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${m.full_name}</td>
            <td>${m.phone}</td>
            <td><span class="level-badge ${m.level}">${m.role_title}</span></td>
            <td>${m.sub_county || m.ward || '—'}</td>
            <td>
                <button class="btn-delete" onclick="deleteMember('${m.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('')
}

document.getElementById('add-member-btn').addEventListener('click', async () => {
    const name = document.getElementById('member-name').value.trim()
    const phone = document.getElementById('member-phone').value.trim()
    const roleTitle = document.getElementById('member-role').value.trim()
    const level = document.getElementById('member-level').value
    const area = document.getElementById('member-area').value.trim()
    const feedback = document.getElementById('member-feedback')

    if (!name || !phone || !roleTitle || !level) {
        feedback.style.color = '#dc3545'
        feedback.textContent = 'Please fill in all required fields.'
        return
    }

    try {
        const { error } = await db
            .from('members')
            .insert([{
                full_name: name,
                phone: phone,
                role_title: roleTitle,
                level: level,
                sub_county: level === 'subcounty' ? area : null,
                ward: level === 'ward' ? area : null
            }])

        if (error) throw error

        feedback.style.color = '#28a745'
        feedback.textContent = 'Member added successfully <i class="fa-solid fa-school-circle-check" style="color: rgb(30, 216, 31);"></i>'

        document.getElementById('member-name').value = ''
        document.getElementById('member-phone').value = ''
        document.getElementById('member-role').value = ''
        document.getElementById('member-level').value = ''
        document.getElementById('member-area').value = ''

        await loadMembers()

    } catch (error) {
        console.error('Add member error:', error)
        feedback.style.color = '#dc3545'
        feedback.textContent = 'Something went wrong. Please try again.'
    }
})

function deleteMember(id) {
    if (!confirm('Are you sure you want to remove this member?')) return

    db.from('members')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
            if (error) {
                console.error('Delete member error:', error)
                return
            }
            loadMembers()
        })
}

// ============================================
// TAB 3 — ATTENDANCE
// ============================================
async function loadMeetings() {
    try {
        const { data, error } = await db
            .from('meetings')
            .select('*')
            .order('meeting_date', { ascending: false })

        if (error) throw error

        allMeetings = data
        renderMeetingsList(data)
        populateMeetingSelect(data)

    } catch (error) {
        console.error('Load meetings error:', error)
    }
}

function openAttendance(meetingId, meetingTitle) {
    document.getElementById('attendance-title').textContent = `Taking Attendance — ${meetingTitle}`
    document.getElementById('attendance-register').style.display = 'block'
    document.getElementById('attendance-meeting-select').value = meetingId
    renderAttendanceRegister(meetingId)
}

function renderMeetingsList(data) {
    const list = document.getElementById('meetings-list')

    if (data.length === 0) {
        list.innerHTML = '<p style="color:#666;">No meetings created yet.</p>'
        return
    }

    list.innerHTML = data.map(m => `
        <div class="meeting-card" onclick="openAttendance('${m.id}', '${m.title}')">
            <div class="meeting-card-left">
                <h3>${m.title}</h3>
                <p><i class="fa-solid fa-location-dot"></i> ${m.location}</p>
            </div>
             <div class="meeting-card-right">
                <span class="meeting-date">${new Date(m.meeting_date).toLocaleDateString('en-KE', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })}</span>
                <button class="btn-edit" onclick="event.stopPropagation(); openEditMeeting('${m.id}')">
                    <i class="fa-solid fa-pen"></i> Edit
                </button>
            </div>
        </div>
    `).join('')
}

function populateMeetingSelect(data) {
    const select = document.getElementById('attendance-meeting-select')
    select.innerHTML = '<option value="">Select a meeting</option>' +
        data.map(m => `<option value="${m.id}">${m.title} — ${m.meeting_date}</option>`).join('')
}

document.getElementById('create-meeting-btn').addEventListener('click', async () => {
    const title = document.getElementById('meeting-title').value.trim()
    const location = document.getElementById('meeting-location').value.trim()
    const date = document.getElementById('meeting-date').value
    const feedback = document.getElementById('meeting-feedback')

    if (!title || !location || !date) {
        feedback.style.color = '#dc3545'
        feedback.textContent = 'Please fill in all meeting details.'
        return
    }

    try {
        const { error } = await db
            .from('meetings')
            .insert([{ title, location, meeting_date: date }])

        if (error) throw error

        feedback.style.color = '#28a745'
        feedback.textContent = 'Meeting created successfully <i class="fa-solid fa-clipboard-check" style="color: rgb(30, 216, 31);"></i>'

        document.getElementById('meeting-title').value = ''
        document.getElementById('meeting-location').value = ''
        document.getElementById('meeting-date').value = ''

        await loadMeetings()

    } catch (error) {
        console.error('Create meeting error:', error)
        feedback.style.color = '#dc3545'
        feedback.textContent = 'Something went wrong. Please try again.'
    }
})

// ============================================
// ATTENDANCE REGISTER — GROUPED BY ROLE
// ============================================
const LEVEL_ORDER = [
    { key: 'national', label: 'President & Deputy President' },
    { key: 'secretariat', label: 'Secretary General & Deputy' },
    { key: 'county', label: 'County Directors' },
    { key: 'subcounty', label: 'Sub-County Coordinators' },
    { key: 'ward', label: 'Ward Coordinators' }
]

async function renderAttendanceRegister(meetingId) {
    const container = document.getElementById('attendance-list')
    container.innerHTML = '<p style="color:#666;">Loading members...</p>'

    try {
        const { data: existing, error } = await db
            .from('attendance')
            .select('member_id, status, checked_at')
            .eq('meeting_id', meetingId)

        if (error) throw error

        const existingMap = {}
        existing.forEach(a => {
            existingMap[a.member_id] = {
                status: a.status,
                checked_at: a.checked_at
            }
        })

        const grouped = {}
        LEVEL_ORDER.forEach(l => { grouped[l.key] = [] })

        allMembers.forEach(m => {
            if (grouped[m.level]) {
                grouped[m.level].push(m)
            }
        })

        let html = ''

        LEVEL_ORDER.forEach(({ key, label }) => {
            const members = grouped[key]
            if (members.length === 0) return

            html += `
                <div class="attendance-group">
                    <div class="attendance-group-header">
                        <i class="fa-solid fa-chevron-right"></i>
                        <h3>${label}</h3>
                        <span class="group-count">${members.length} member${members.length > 1 ? 's' : ''}</span>
                    </div>
                    <div class="attendance-group-body">
                        ${members.map(m => {
                            const record = existingMap[m.id]
                            const isPresent = record?.status === 'present'
                            const checkedAt = record?.checked_at
                                ? new Date(record.checked_at).toLocaleTimeString('en-KE', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })
                                : null

                            return `
                                <div class="attendance-row" id="row-${m.id}">
                                    <div class="att-checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            class="att-checkbox"
                                            id="chk-${m.id}"
                                            ${isPresent ? 'checked' : ''}
                                            onchange="markAttendance('${meetingId}', '${m.id}', this)">
                                        <label for="chk-${m.id}"></label>
                                    </div>
                                    <div class="att-member-info">
                                        <p class="att-name">${m.full_name}</p>
                                        <p class="att-role">${m.role_title}</p>
                                    </div>
                                    <div class="att-status" id="status-${m.id}">
                                        ${isPresent
                                            ? `<span class="att-present-badge">
                                                <i class="fa-solid fa-circle-check"></i> Present
                                               </span>
                                               <span class="att-time">
                                                <i class="fa-regular fa-clock"></i> ${checkedAt}
                                               </span>`
                                            : record?.status === 'absent'
                                            ? `<span class="att-absent-badge">
                                                <i class="fa-solid fa-circle-xmark"></i> Absent
                                               </span>`
                                            : `<span class="att-pending">
                                                <i class="fa-regular fa-circle"></i> Not marked
                                               </span>`
                                        }
                                    </div>
                                </div>
                            `
                        }).join('')}
                    </div>
                </div>
            `
        })

        container.innerHTML = html

    } catch (error) {
        console.error('Render attendance error:', error)
        container.innerHTML = '<p style="color:#dc3545;">Failed to load attendance.</p>'
    }
}

function markAttendance(meetingId, memberId, checkbox) {
    const status = checkbox.checked ? 'present' : 'absent'
    const now = new Date().toISOString()
    const statusEl = document.getElementById(`status-${memberId}`)

    if (status === 'present') {
        const displayTime = new Date().toLocaleTimeString('en-KE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
        statusEl.innerHTML = `
            <span class="att-present-badge">
                <i class="fa-solid fa-circle-check"></i> Present
            </span>
            <span class="att-time">
                <i class="fa-regular fa-clock"></i> ${displayTime}
            </span>
        `
    } else {
        statusEl.innerHTML = `
            <span class="att-absent-badge">
                <i class="fa-solid fa-circle-xmark"></i> Absent
            </span>
        `
    }

    db.from('attendance')
        .upsert([{
            meeting_id: meetingId,
            member_id: memberId,
            status: status,
            checked_at: status === 'present' ? now : null
        }], { onConflict: 'meeting_id,member_id' })
        .then(({ error }) => {
            if (error) {
                console.error('Mark attendance error:', error)
                checkbox.checked = !checkbox.checked
                statusEl.innerHTML = `<span class="att-pending">
                    <i class="fa-regular fa-circle"></i> Not marked
                </span>`
            }
        })
}
// ============================================
// EDIT MEMBER MODAL
// ============================================
function openEditMember(id) {
    const member = allMembers.find(m => m.id === id)
    if (!member) return

    document.getElementById('edit-member-id').value = member.id
    document.getElementById('edit-member-name').value = member.full_name
    document.getElementById('edit-member-phone').value = member.phone
    document.getElementById('edit-member-role').value = member.role_title
    document.getElementById('edit-member-level').value = member.level
    document.getElementById('edit-member-area').value = member.sub_county || member.ward || ''
    document.getElementById('edit-member-feedback').textContent = ''
    document.getElementById('edit-member-modal').style.display = 'flex'
}

function closeEditMember() {
    document.getElementById('edit-member-modal').style.display = 'none'
}

document.getElementById('close-member-modal').addEventListener('click', closeEditMember)
document.getElementById('close-member-modal-btn').addEventListener('click', closeEditMember)
document.getElementById('edit-member-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('edit-member-modal')) closeEditMember()
})

document.getElementById('save-member-btn').addEventListener('click', async () => {
    const id = document.getElementById('edit-member-id').value
    const name = document.getElementById('edit-member-name').value.trim()
    const phone = document.getElementById('edit-member-phone').value.trim()
    const roleTitle = document.getElementById('edit-member-role').value.trim()
    const level = document.getElementById('edit-member-level').value
    const area = document.getElementById('edit-member-area').value.trim()
    const feedback = document.getElementById('edit-member-feedback')

    if (!name || !phone || !roleTitle || !level) {
        feedback.style.color = '#dc3545'
        feedback.textContent = 'Please fill in all required fields.'
        return
    }

    try {
        const { error } = await db
            .from('members')
            .update({
                full_name: name,
                phone: phone,
                role_title: roleTitle,
                level: level,
                sub_county: level === 'subcounty' ? area : null,
                ward: level === 'ward' ? area : null
            })
            .eq('id', id)

        if (error) throw error

        feedback.style.color = '#28a745'
        feedback.textContent = '✅ Member updated successfully.'
        await loadMembers()
        setTimeout(() => closeEditMember(), 1000)

    } catch (error) {
        console.error('Edit member error:', error)
        feedback.style.color = '#dc3545'
        feedback.textContent = 'Something went wrong. Please try again.'
    }
})

// ============================================
// EDIT MEETING MODAL
// ============================================
function openEditMeeting(id) {
    const meeting = allMeetings.find(m => m.id === id)
    if (!meeting) return

    document.getElementById('edit-meeting-id').value = meeting.id
    document.getElementById('edit-meeting-title').value = meeting.title
    document.getElementById('edit-meeting-location').value = meeting.location
    document.getElementById('edit-meeting-date').value = meeting.meeting_date
    document.getElementById('edit-meeting-feedback').textContent = ''
    document.getElementById('edit-meeting-modal').style.display = 'flex'
}

function closeEditMeeting() {
    document.getElementById('edit-meeting-modal').style.display = 'none'
}

document.getElementById('close-meeting-modal').addEventListener('click', closeEditMeeting)
document.getElementById('close-meeting-modal-btn').addEventListener('click', closeEditMeeting)
document.getElementById('edit-meeting-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('edit-meeting-modal')) closeEditMeeting()
})

document.getElementById('save-meeting-btn').addEventListener('click', async () => {
    const id = document.getElementById('edit-meeting-id').value
    const title = document.getElementById('edit-meeting-title').value.trim()
    const location = document.getElementById('edit-meeting-location').value.trim()
    const date = document.getElementById('edit-meeting-date').value
    const feedback = document.getElementById('edit-meeting-feedback')

    if (!title || !location || !date) {
        feedback.style.color = '#dc3545'
        feedback.textContent = 'Please fill in all fields.'
        return
    }

    try {
        const { error } = await db
            .from('meetings')
            .update({ title, location, meeting_date: date })
            .eq('id', id)

        if (error) throw error

        feedback.style.color = '#28a745'
        feedback.textContent = '✅ Meeting updated successfully.'
        await loadMeetings()
        setTimeout(() => closeEditMeeting(), 1000)

    } catch (error) {
        console.error('Edit meeting error:', error)
        feedback.style.color = '#dc3545'
        feedback.textContent = 'Something went wrong. Please try again.'
    }
})
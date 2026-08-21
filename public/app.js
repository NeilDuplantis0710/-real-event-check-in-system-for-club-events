document.addEventListener('DOMContentLoaded', () => {
    // API Endpoints Base URL
    const API_BASE = '/api/v1/users';

    // Socket.IO Client Initialization
    let socket;
    try {
        socket = io();
        
        socket.on('connect', () => {
            console.log('Socket.IO Connected! ID:', socket.id);
            const statusText = document.getElementById('socket-text');
            if (statusText) statusText.innerText = 'Socket Live';
        });

        socket.on('disconnect', () => {
            console.warn('Socket.IO Disconnected');
            const statusText = document.getElementById('socket-text');
            if (statusText) statusText.innerText = 'Offline';
        });

        // Listen for live check-in updates from backend
        socket.on('chekInUpdate', (data) => {
            console.log('Live Check-in Event Received:', data);
            handleLiveCheckInUpdate(data);
        });
    } catch (err) {
        console.error('Socket initialization failed:', err);
    }

    // State Variables
    let clubsData = [];
    let eventsData = [];
    let checkedInAttendees = [];
    let html5QrScanner = null;
    let isCameraActive = false;

    // Element References
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const toastContainer = document.getElementById('toast-container');

    // --- Tab Navigation Setup ---
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const content = document.getElementById(targetTab);
            if (content) content.classList.add('active');

            // Refresh tab specific data
            if (targetTab === 'clubs-tab') loadClubs();
            if (targetTab === 'events-tab') { loadClubs(); loadEvents(); }
            if (targetTab === 'register-tab') loadEvents();
            if (targetTab === 'checkin-tab') { loadEvents(); loadCheckedInList(); }
        });
    });

    // --- Toast Notification Helper ---
    function showToast(message, type = 'info') {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconClass = 'fa-info-circle';
        if (type === 'success') iconClass = 'fa-check-circle';
        if (type === 'error') iconClass = 'fa-exclamation-circle';

        toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // --- Audio Feedback Chime ---
    function playBeep(success = true) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = success ? 'sine' : 'sawtooth';
            osc.frequency.setValueAtTime(success ? 880 : 300, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);

            osc.start();
            osc.stop(ctx.currentTime + (success ? 0.15 : 0.3));
        } catch (e) {
            // Audio context not allowed without interaction
        }
    }

    // --- API Calls ---

    // Load Clubs
    async function loadClubs() {
        try {
            const res = await fetch(`${API_BASE}/viewAllClubs`);
            const data = await res.json();
            clubsData = data.data || [];
            renderClubs();
            updateClubDropdowns();
        } catch (err) {
            console.error('Error fetching clubs:', err);
            showToast('Failed to load clubs', 'error');
        }
    }

    // Render Clubs Grid
    function renderClubs() {
        const container = document.getElementById('clubs-list-container');
        if (!container) return;

        if (clubsData.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fa-solid fa-folder-open empty-icon"></i>
                    <p>No clubs registered yet. Create your first club using the form!</p>
                </div>`;
            return;
        }

        container.innerHTML = clubsData.map(club => `
            <div class="item-card">
                <span class="item-badge badge-indigo">OFFICIAL CLUB</span>
                <h3 class="item-title">${club.ClubName}</h3>
                <div class="item-meta">
                    <div class="item-meta-row">
                        <i class="fa-solid fa-id-card"></i> ID: ${club._id}
                    </div>
                    <div class="item-meta-row">
                        <i class="fa-solid fa-clock"></i> Registered: ${new Date(club.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Update Club Dropdowns
    function updateClubDropdowns() {
        const select = document.getElementById('event-club-select');
        if (!select) return;

        const currentVal = select.value;
        select.innerHTML = '<option value="">Select a Club...</option>' + 
            clubsData.map(c => `<option value="${c.ClubName}" ${currentVal === c.ClubName ? 'selected' : ''}>${c.ClubName}</option>`).join('');
    }

    // Create Club
    const createClubForm = document.getElementById('create-club-form');
    if (createClubForm) {
        createClubForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('club-name-input');
            const clubName = nameInput.value.trim();

            if (!clubName) return;

            try {
                const res = await fetch(`${API_BASE}/createClub`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ClubName: clubName })
                });

                const data = await res.json();
                if (res.ok) {
                    showToast(data.message || 'Club created successfully!', 'success');
                    nameInput.value = '';
                    loadClubs();
                } else {
                    showToast(data.message || 'Failed to create club', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Error creating club', 'error');
            }
        });
    }

    // Load Events
    async function loadEvents() {
        try {
            const res = await fetch(`${API_BASE}/viewAllEvents`);
            const data = await res.json();
            eventsData = data.data || [];
            renderEvents();
            updateEventDropdowns();
        } catch (err) {
            console.error('Error fetching events:', err);
            showToast('Failed to load events', 'error');
        }
    }

    // Render Events Grid
    function renderEvents() {
        const container = document.getElementById('events-list-container');
        if (!container) return;

        if (eventsData.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fa-solid fa-calendar-xmark empty-icon"></i>
                    <p>No events scheduled. Create a new event using the form!</p>
                </div>`;
            return;
        }

        container.innerHTML = eventsData.map(event => `
            <div class="item-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="item-badge badge-cyan">${event.ClubName}</span>
                    <span class="item-badge ${event.Status === 'Active' ? 'badge-emerald' : 'badge-indigo'}">${event.Status}</span>
                </div>
                <h3 class="item-title">${event.EventName}</h3>
                <div class="item-meta">
                    <div class="item-meta-row">
                        <i class="fa-solid fa-calendar"></i> Date: ${event.EventDate}
                    </div>
                    <div class="item-meta-row">
                        <i class="fa-solid fa-clock"></i> Time: ${event.StartTime} - ${event.EndTime}
                    </div>
                    <div class="item-meta-row">
                        <i class="fa-solid fa-location-dot"></i> Venue: ${event.Venue}
                    </div>
                    <div class="item-meta-row" style="margin-top: 0.25rem;">
                        <i class="fa-solid fa-user-tie"></i> Student Coord: ${event.StudentCoordinator}
                    </div>
                </div>
                <button class="btn btn-secondary btn-block select-event-btn" data-event="${event.EventName}" data-club="${event.ClubName}" style="margin-top: 1rem; font-size: 0.85rem; padding: 0.5rem;">
                    <i class="fa-solid fa-ticket"></i> Register For Event
                </button>
            </div>
        `).join('');

        // Attach Register CTA buttons
        document.querySelectorAll('.select-event-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const eventName = btn.getAttribute('data-event');
                const clubName = btn.getAttribute('data-club');

                // Switch to Register Tab
                const regTabBtn = document.querySelector('[data-tab="register-tab"]');
                if (regTabBtn) regTabBtn.click();

                setTimeout(() => {
                    const regEventSelect = document.getElementById('reg-event-select');
                    const regClubName = document.getElementById('reg-club-name');
                    if (regEventSelect) regEventSelect.value = eventName;
                    if (regClubName) regClubName.value = clubName;
                }, 100);
            });
        });
    }

    // Update Event Dropdowns in Registration & Check-In Desk
    function updateEventDropdowns() {
        const regSelect = document.getElementById('reg-event-select');
        const checkinSelect = document.getElementById('checkin-event-select');

        if (regSelect) {
            const currentReg = regSelect.value;
            regSelect.innerHTML = '<option value="">Choose an Event...</option>' +
                eventsData.map(e => `<option value="${e.EventName}" data-club="${e.ClubName}" ${currentReg === e.EventName ? 'selected' : ''}>${e.EventName} (${e.ClubName})</option>`).join('');
        }

        if (checkinSelect) {
            const currentCheckin = checkinSelect.value;
            checkinSelect.innerHTML = '<option value="">All Events Feed</option>' +
                eventsData.map(e => `<option value="${e.EventName}" ${currentCheckin === e.EventName ? 'selected' : ''}>${e.EventName}</option>`).join('');
        }
    }

    // Auto Fill Club Name when Event selected in Registration
    const regEventSelect = document.getElementById('reg-event-select');
    if (regEventSelect) {
        regEventSelect.addEventListener('change', () => {
            const selectedOpt = regEventSelect.options[regEventSelect.selectedIndex];
            const clubName = selectedOpt ? selectedOpt.getAttribute('data-club') || '' : '';
            const clubInput = document.getElementById('reg-club-name');
            if (clubInput) clubInput.value = clubName;
        });
    }

    // Create Event Form Submit
    const createEventForm = document.getElementById('create-event-form');
    if (createEventForm) {
        createEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                ClubName: document.getElementById('event-club-select').value,
                EventName: document.getElementById('event-name-input').value.trim(),
                EventDate: document.getElementById('event-date-input').value,
                StartTime: document.getElementById('event-start-time').value,
                EndTime: document.getElementById('event-end-time').value,
                Venue: document.getElementById('event-venue-input').value.trim(),
                Status: document.getElementById('event-status-select').value,
                StudentCoordinator: document.getElementById('student-coord-input').value.trim(),
                FacultyCoordinator: document.getElementById('faculty-coord-input').value.trim()
            };

            try {
                const res = await fetch(`${API_BASE}/registerEvent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok) {
                    showToast(data.message || 'Event created successfully!', 'success');
                    createEventForm.reset();
                    loadEvents();
                } else {
                    showToast(data.message || 'Failed to create event', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Error creating event', 'error');
            }
        });
    }

    // Register Student for Event Submit
    const regForm = document.getElementById('registration-form');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const payload = {
                EventName: document.getElementById('reg-event-select').value,
                ClubName: document.getElementById('reg-club-name').value,
                Name: document.getElementById('reg-student-name').value.trim(),
                Email: document.getElementById('reg-student-email').value.trim(),
                RegisterationNumber: document.getElementById('reg-student-id').value.trim()
            };

            try {
                const res = await fetch(`${API_BASE}/registerForEvent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const responseData = await res.json();
                if (res.ok) {
                    showToast(responseData.message || 'Successfully registered!', 'success');
                    playBeep(true);
                    renderPassTicket(responseData.data);
                } else {
                    showToast(responseData.message || 'Registration failed', 'error');
                    playBeep(false);
                }
            } catch (err) {
                console.error(err);
                showToast('Error registering for event', 'error');
            }
        });
    }

    // Render Digital Ticket Pass
    function renderPassTicket(data) {
        const placeholder = document.getElementById('pass-placeholder');
        const container = document.getElementById('pass-display-container');

        if (!data || !data.registration || !data.qrCode) return;

        const reg = data.registration;
        const qrCode = data.qrCode;

        if (placeholder) placeholder.style.display = 'none';
        if (container) {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="ticket-container" id="printable-ticket">
                    <div class="ticket-header">
                        <div>
                            <div class="ticket-header-title">${reg.EventName}</div>
                            <span class="item-badge badge-cyan" style="margin-top: 0.2rem;">${reg.ClubName}</span>
                        </div>
                        <i class="fa-solid fa-ticket-simple" style="font-size: 1.8rem; opacity: 0.8;"></i>
                    </div>
                    <div class="ticket-body">
                        <div class="ticket-row">
                            <div>
                                <div class="ticket-label">ATTENDEE NAME</div>
                                <div class="ticket-value">${reg.Name}</div>
                            </div>
                            <div>
                                <div class="ticket-label">REGISTRATION NO.</div>
                                <div class="ticket-value">${reg.RegisterationNumber}</div>
                            </div>
                        </div>
                        <div class="ticket-row">
                            <div>
                                <div class="ticket-label">EMAIL ADDRESS</div>
                                <div class="ticket-value" style="font-size: 0.85rem; word-break: break-all;">${reg.Email}</div>
                            </div>
                            <div>
                                <div class="ticket-label">STATUS</div>
                                <div class="ticket-value" style="color: var(--accent-emerald);">VALID ENTRY PASS</div>
                            </div>
                        </div>

                        <div class="ticket-divider"></div>

                        <div style="text-align: center;">
                            <div class="ticket-qr">
                                <img src="${qrCode}" alt="Ticket QR Code" id="ticket-qr-img">
                            </div>
                            <div class="ticket-id">REG ID: ${reg._id}</div>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; width: 100%;">
                    <button class="btn btn-secondary" id="print-ticket-btn">
                        <i class="fa-solid fa-print"></i> Print Pass
                    </button>
                    <button class="btn btn-primary" id="goto-checkin-btn" data-regid="${reg._id}">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i> Check-In Now
                    </button>
                </div>
            `;

            // Print button listener
            document.getElementById('print-ticket-btn').addEventListener('click', () => {
                window.print();
            });

            // Quick Check-In CTA listener
            document.getElementById('goto-checkin-btn').addEventListener('click', (e) => {
                const regId = e.currentTarget.getAttribute('data-regid');
                const checkinTabBtn = document.querySelector('[data-tab="checkin-tab"]');
                if (checkinTabBtn) checkinTabBtn.click();

                setTimeout(() => {
                    const manualInput = document.getElementById('manual-id-input');
                    if (manualInput) manualInput.value = regId;
                }, 150);
            });
        }
    }

    // --- CHECK-IN DESK & LIVE FEED ---

    // Load checked-in attendees
    async function loadCheckedInList() {
        const eventSelect = document.getElementById('checkin-event-select');
        const selectedEvent = eventSelect ? eventSelect.value : '';

        try {
            const url = selectedEvent ? `${API_BASE}/checkedInList?EventName=${encodeURIComponent(selectedEvent)}` : `${API_BASE}/checkedInList`;
            const res = await fetch(url);
            const data = await res.json();

            if (res.ok && data.data) {
                checkedInAttendees = data.data.checkedInList || [];
                updateCheckInTable(checkedInAttendees);
                updateCounter(data.data.checkedInCount || 0);

                const badge = document.getElementById('feed-event-badge');
                if (badge) badge.innerText = selectedEvent || 'All Events';
            }
        } catch (err) {
            console.error('Error fetching checked-in list:', err);
        }
    }

    // Event select change in Check-In Desk
    const checkinEventSelect = document.getElementById('checkin-event-select');
    if (checkinEventSelect) {
        checkinEventSelect.addEventListener('change', loadCheckedInList);
    }

    // Update Counter Widget
    function updateCounter(count) {
        const counterEl = document.getElementById('live-checkin-count');
        if (counterEl) {
            counterEl.innerText = count;
        }
    }

    // Update Table Feed
    function updateCheckInTable(list) {
        const tbody = document.getElementById('checkedin-table-body');
        if (!tbody) return;

        if (!list || list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state" style="padding: 2rem;">
                        <i class="fa-solid fa-clipboard-user empty-icon"></i>
                        <p>No check-ins recorded yet for this event.</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = list.map((item, index) => `
            <tr>
                <td style="font-weight: 600;">${index + 1}</td>
                <td><i class="fa-solid fa-user" style="color: var(--primary); margin-right: 0.4rem;"></i> ${item.Name}</td>
                <td style="font-family: monospace; font-weight: 600;">${item.RegisterationNumber}</td>
                <td style="color: var(--text-muted);">${item.Email}</td>
                <td><span class="item-badge badge-indigo">${item.EventName}</span></td>
                <td><span class="item-badge badge-emerald"><i class="fa-solid fa-check"></i> Checked-In</span></td>
            </tr>
        `).join('');
    }

    // Live Socket Update Handler
    function handleLiveCheckInUpdate(data) {
        const checkinSelect = document.getElementById('checkin-event-select');
        const currentEvent = checkinSelect ? checkinSelect.value : '';

        // If update matches current view or all events view
        if (!currentEvent || currentEvent === data.EventName) {
            updateCounter(data.checkedInCount || 0);
            if (data.checkedInList) {
                checkedInAttendees = data.checkedInList;
                updateCheckInTable(checkedInAttendees);
            }
        }
    }

    // Perform Check-in API Request
    async function processCheckIn(payload) {
        try {
            const res = await fetch(`${API_BASE}/checkIn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: typeof payload === 'string' ? payload : JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                showToast(`Check-In Verified: ${data.data ? data.data.Name : 'Success'}`, 'success');
                playBeep(true);
                loadCheckedInList();
            } else {
                showToast(data.message || 'Check-in failed', 'error');
                playBeep(false);
            }
        } catch (err) {
            console.error('Check-in error:', err);
            showToast('Network error during check-in', 'error');
            playBeep(false);
        }
    }

    // Manual Check-In Form Submit
    const manualForm = document.getElementById('manual-checkin-form');
    if (manualForm) {
        manualForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputVal = document.getElementById('manual-id-input').value.trim();
            if (!inputVal) return;

            let payload;
            try {
                payload = JSON.parse(inputVal);
            } catch {
                payload = { registerationID: inputVal };
            }

            processCheckIn(payload);
            document.getElementById('manual-id-input').value = '';
        });
    }

    // Camera QR Scanner Toggle
    const toggleCamBtn = document.getElementById('toggle-camera-btn');
    if (toggleCamBtn) {
        toggleCamBtn.addEventListener('click', () => {
            if (isCameraActive) {
                stopCamera();
            } else {
                startCamera();
            }
        });
    }

    function startCamera() {
        if (typeof Html5QrcodeScanner === 'undefined') {
            showToast('QR Scanner library loading...', 'info');
            return;
        }

        try {
            html5QrScanner = new Html5QrcodeScanner('reader', {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            }, false);

            html5QrScanner.render((decodedText, decodedResult) => {
                console.log('Scanned QR:', decodedText);
                let payload;
                try {
                    payload = JSON.parse(decodedText);
                } catch {
                    payload = { registerationID: decodedText };
                }
                processCheckIn(payload);
            }, (error) => {
                // Ignore frame read errors
            });

            isCameraActive = true;
            if (toggleCamBtn) toggleCamBtn.innerHTML = '<i class="fa-solid fa-video-slash"></i> Stop Camera';
        } catch (err) {
            console.error('Failed to start camera:', err);
            showToast('Unable to access camera', 'error');
        }
    }

    function stopCamera() {
        if (html5QrScanner) {
            html5QrScanner.clear().catch(err => console.error(err));
            isCameraActive = false;
            if (toggleCamBtn) toggleCamBtn.innerHTML = '<i class="fa-solid fa-video"></i> Start Camera';
        }
    }

    // QR Image File Upload Scanner
    const qrFileInput = document.getElementById('qr-file-input');
    if (qrFileInput) {
        qrFileInput.addEventListener('change', (e) => {
            if (e.target.files.length === 0) return;
            const imageFile = e.target.files[0];

            if (typeof Html5Qrcode === 'undefined') {
                showToast('QR Library not ready', 'error');
                return;
            }

            const html5QrCode = new Html5Qrcode('reader');
            html5QrCode.scanFile(imageFile, true)
                .then(decodedText => {
                    console.log('Decoded file QR:', decodedText);
                    let payload;
                    try {
                        payload = JSON.parse(decodedText);
                    } catch {
                        payload = { registerationID: decodedText };
                    }
                    processCheckIn(payload);
                })
                .catch(err => {
                    console.error('Error scanning file:', err);
                    showToast('Could not read QR code from image', 'error');
                });
        });
    }

    // --- Initial Load ---
    loadClubs();
    loadEvents();

    // Event listener refresh buttons
    const refreshClubsBtn = document.getElementById('refresh-clubs-btn');
    if (refreshClubsBtn) refreshClubsBtn.addEventListener('click', loadClubs);

    const refreshEventsBtn = document.getElementById('refresh-events-btn');
    if (refreshEventsBtn) refreshEventsBtn.addEventListener('click', loadEvents);

});

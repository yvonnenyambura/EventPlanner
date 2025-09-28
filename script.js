// Main App Controller
const app = {
    currentView: "home",
    // list of events
    events: [],
    // user id
    currentUser: "user123",

    // starting point
    init() {
        console.log("Initializing Event Planner App...");
        // getting the data from local storage
        this.loadData();
        // setting up the listeners to allow reactivy when the data changes
        this.setupEventListeners();
        // this will be used to control the current page of view
        this.showView("home");
    },

    showView(viewName) {
        console.log(`Switching to view: ${viewName}`);

        // Update current view
        this.currentView = viewName;

        // Update navigation active states
        this.updateNavigation(viewName);

        // Get the template and main content area
        const template = document.getElementById(`${viewName}-template`);
        const mainContent = document.getElementById("main-content");

        if (template && mainContent) {
            // Clear current content and add fade effect
            mainContent.innerHTML = "";
            // mainContent.classList.add("fade-in");

            // Clone and append the template content
            const content = template.cloneNode(true);
            content.classList.remove("hidden");
            content.id = `${viewName}-view`;
            mainContent.appendChild(content);

            // Initialize view-specific functionality
            this.initializeView(viewName);
        } else {
            console.error(`Template not found for view: ${viewName}`);
        }
    },

    updateNavigation(activeView) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current view links
        document.querySelectorAll(`[data-view="${activeView}"]`).forEach(link => {
            if (link.classList.contains('nav-link')) {
                link.classList.add('active');
            }
        });
    },

    initializeView(viewName) {
        switch (viewName) {
            case 'home':
                this.initializeHomeView();
                break;
            case 'events':
                this.initializeEventsView();
                break;
            case 'create':
                this.initializeCreateView();
                break;
            case 'event-details':
                this.initializeEventDetailsView();
                break;
            case 'dashboard':
                this.initializeDashboardView();
                break;
        }
    },

    initializeHomeView() {
        // Add click handlers for CTA buttons in the home view
        const homeView = document.getElementById('home-view');
        if (homeView) {
            const discoverBtn = homeView.querySelector('[data-view="events"]');
            const createBtn = homeView.querySelector('[data-view="create"]');

            if (discoverBtn) {
                discoverBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showView('events');
                });
            }

            if (createBtn) {
                createBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showView('create');
                });
            }
        }
    },

    initializeEventsView() {
        console.log("Events view initialized");
        this.setupEventsView();
        this.renderEventsList();
    },

    initializeCreateView() {
        console.log("Create view initialized");
        this.setupCreateEventForm();
    },

    initializeEventDetailsView() {
        console.log("Event details view initialized");

        // Get the event ID and render the details
        if (this.currentEventId) {
            this.renderEventDetails(this.currentEventId);
        } else {
            // If no event ID, show error and go back to events list
            this.showToast('Event not found', 'error');
            this.showView('events');
        }

        // Setup invite modal handlers (idempotent)
        this.setupInviteModal();
    },

    initializeDashboardView() {
        console.log("Dashboard view initialized");
        this.renderDashboard();
    },

    setupEventListeners() {
        // Navigation links
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-view]') || e.target.closest('[data-view]')) {
                e.preventDefault();
                const target = e.target.matches('[data-view]') ? e.target : e.target.closest('[data-view]');
                const viewName = target.getAttribute('data-view');
                if (viewName) {
                    this.showView(viewName);
                }
            }
        });

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');

        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Close mobile menu when clicking on a link
        document.querySelectorAll('#mobile-menu .nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    },

    loadData() {
        try {
            const savedEvents = localStorage.getItem('eventPlannerEvents');
            this.events = savedEvents ? JSON.parse(savedEvents) : [];
            console.log(`Loaded ${this.events.length} events from localStorage`);
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            this.events = [];
        }
    },

    saveData() {
        try {
            localStorage.setItem('eventPlannerEvents', JSON.stringify(this.events));
            console.log('Data saved to localStorage');
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
    },

    setupCreateEventForm() {
        const form = document.getElementById('create-event-form');
        if (!form) return;

        // Set minimum date to today
        const dateInput = document.getElementById('event-date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }

        // Setup character counters
        this.setupCharacterCounters();

        // Add real-time validation
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => {
                this.clearFieldError(input);
                this.updateCharacterCounter(input);
            });
        });

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEventSubmit();
        });
    },

    setupCharacterCounters() {
        // Setup title counter
        const titleInput = document.getElementById('event-title');
        const titleCounter = document.getElementById('title-counter');
        if (titleInput && titleCounter) {
            titleInput.addEventListener('input', () => {
                titleCounter.textContent = titleInput.value.length;
            });
        }

        // Setup description counter
        const descInput = document.getElementById('event-description');
        const descCounter = document.getElementById('description-counter');
        if (descInput && descCounter) {
            descInput.addEventListener('input', () => {
                descCounter.textContent = descInput.value.length;
            });
        }
    },

    updateCharacterCounter(input) {
        // Update character counters when typing
        if (input.id === 'event-title') {
            const counter = document.getElementById('title-counter');
            if (counter) counter.textContent = input.value.length;
        } else if (input.id === 'event-description') {
            const counter = document.getElementById('description-counter');
            if (counter) counter.textContent = input.value.length;
        }
    },

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.id.replace('event-', '');
        let isValid = true;
        let errorMessage = '';

        // Clear previous errors
        this.clearFieldError(field);

        // Required field validation - simple check if field is empty
        if (field.required && !value) {
            isValid = false;
            errorMessage = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
        }
        // Title validation - check length
        else if (fieldName === 'title' && value && (value.length < 3 || value.length > 100)) {
            isValid = false;
            errorMessage = `Title must be between 3 and 100 characters (currently ${value.length})`;
        }
        // Description validation - check length
        else if (fieldName === 'description' && value && (value.length < 10 || value.length > 500)) {
            isValid = false;
            errorMessage = `Description must be between 10 and 500 characters (currently ${value.length})`;
        }
        // Date validation - make sure it's not in the past
        else if (fieldName === 'date' && value) {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                isValid = false;
                errorMessage = 'Event date must be today or in the future';
            }
        }
        // Time validation - simple regex for HH:MM format
        else if (fieldName === 'time' && value) {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter time in HH:MM format (e.g., 14:30)';
            }
        }
        // Venue validation - just check it's not empty
        else if (fieldName === 'venue' && value && value.length < 2) {
            isValid = false;
            errorMessage = 'Please enter a valid venue name';
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    },

    showFieldError(field, message) {
        const errorDiv = field.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            field.classList.add('border-red-500');
        }
    },

    clearFieldError(field) {
        const errorDiv = field.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
            field.classList.remove('border-red-500');
        }
    },

    handleEventSubmit() {
        const form = document.getElementById('create-event-form');

        // Get form values
        const eventData = {
            title: document.getElementById('event-title').value.trim(),
            description: document.getElementById('event-description').value.trim(),
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            venue: document.getElementById('event-venue').value.trim(),
            duration: document.getElementById('event-duration').value.trim() || '2 hours'
        };

        // Validate all fields
        let isFormValid = true;
        const requiredFields = ['title', 'description', 'date', 'time', 'venue'];

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(`event-${fieldName}`);
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showToast('Please fix the errors before submitting', 'error');
            return;
        }

        // Create event object
        const event = {
            id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11),
            ...eventData,
            organizer: this.currentUser,
            guests: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save event
        this.events.push(event);
        this.saveData();

        // Show success message
        this.showToast('Event created successfully!', 'success');

        // Add success animation to form
        form.classList.add('success-submitted');

        // Reset form and counters
        form.reset();
        const titleCounter = document.getElementById('title-counter');
        const descCounter = document.getElementById('description-counter');
        if (titleCounter) titleCounter.textContent = '0';
        if (descCounter) descCounter.textContent = '0';

        // Redirect to event details after a short delay
        setTimeout(() => {
            this.showEventDetails(event.id);
        }, 1500);
    },

    showEventDetails(eventId) {
        // Store the event ID for the details view
        this.currentEventId = eventId;
        this.showView('event-details');
    },

    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    setupEventsView() {
        // Setup search functionality
        const searchInput = document.getElementById('search-events');
        const filterSelect = document.getElementById('filter-events');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.renderEventsList();
                }, 300);
            });
        }

        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                this.renderEventsList();
            });
        }
    },

    renderEventsList() {
        const eventsGrid = document.getElementById('events-grid');
        if (!eventsGrid) return;

        // Get search and filter values
        const searchTerm = document.getElementById('search-events')?.value.toLowerCase() || '';
        const filterValue = document.getElementById('filter-events')?.value || '';

        // Filter events - simple and clear logic
        let filteredEvents = this.events.filter(event => {
            // Search filter - check if search term appears in title, description, or venue
            const matchesSearch = !searchTerm ||
                event.title.toLowerCase().includes(searchTerm) ||
                event.description.toLowerCase().includes(searchTerm) ||
                event.venue.toLowerCase().includes(searchTerm);

            // Date filter - filter by time periods
            let matchesFilter = true;
            if (filterValue) {
                const eventDate = new Date(event.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Set to start of day

                switch (filterValue) {
                    case 'upcoming':
                        // Show events from today onwards
                        matchesFilter = eventDate >= today;
                        break;
                    case 'today':
                        // Show only today's events
                        const todayStr = today.toISOString().split('T')[0];
                        matchesFilter = event.date === todayStr;
                        break;
                    case 'this-week':
                        // Show events in the next 7 days
                        const weekFromNow = new Date(today);
                        weekFromNow.setDate(today.getDate() + 7);
                        matchesFilter = eventDate >= today && eventDate <= weekFromNow;
                        break;
                }
            }

            return matchesSearch && matchesFilter;
        });

        // Sort events by date
        filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Clear current content
        eventsGrid.innerHTML = '';

        // Show message when no events found
        if (filteredEvents.length === 0) {
            eventsGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-gray-500 text-lg mb-4">
                        ${this.events.length === 0
                    ? '🎉 No events created yet!'
                    : '🔍 No events match your search criteria.'}
                    </div>
                    <div class="text-gray-400 text-sm mb-6">
                        ${this.events.length === 0
                    ? 'Create your first event to get started!'
                    : 'Try adjusting your search or filter options.'}
                    </div>
                    ${this.events.length === 0 ? `
                        <button class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium" data-view="create">
                            ✨ Create Your First Event
                        </button>
                    ` : `
                        <button class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors" onclick="app.clearSearch()">
                            Clear Search
                        </button>
                    `}
                </div>
            `;
            return;
        }

        // Render event cards
        filteredEvents.forEach(event => {
            const eventCard = this.createEventCard(event);
            eventsGrid.appendChild(eventCard);
        });
    },

    createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover-scale border border-gray-100';

        // Format date and time - make it easy to read
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Check if event is today, upcoming, or past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDateOnly = new Date(event.date);
        eventDateOnly.setHours(0, 0, 0, 0);

        let dateStatus = '';
        if (eventDateOnly.getTime() === today.getTime()) {
            dateStatus = 'today';
        } else if (eventDateOnly > today) {
            dateStatus = 'upcoming';
        } else {
            dateStatus = 'past';
        }

        // Check if user has RSVP'd
        const userRSVP = event.guests.find(guest => guest.userId === this.currentUser);
        const rsvpStatus = userRSVP ? userRSVP.status : null;

        card.innerHTML = `
            <div class="p-6">
                <!-- Header with title and status badge -->
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-semibold text-gray-800 line-clamp-2 flex-1">${event.title}</h3>
                    <div class="ml-3 flex flex-col items-end">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${dateStatus === 'today' ? 'bg-orange-100 text-orange-800' :
                dateStatus === 'upcoming' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-600'
            }">
                            ${dateStatus === 'today' ? 'Today' :
                dateStatus === 'upcoming' ? 'Upcoming' :
                    'Past'}
                        </span>
                        <div class="text-sm text-gray-500 mt-1">${event.guests.length} attending</div>
                    </div>
                </div>
                
                <!-- Description -->
                <p class="text-gray-600 mb-4 line-clamp-3">${event.description}</p>
                
                <!-- Event details -->
                <div class="space-y-2 mb-4">
                    <div class="flex items-center text-sm text-gray-500">
                        <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>${formattedDate} at ${event.time}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-500">
                        <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span>${event.venue}</span>
                    </div>
                    ${event.duration ? `
                        <div class="flex items-center text-sm text-gray-500">
                            <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>${event.duration}</span>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Action buttons -->
                <div class="flex justify-between items-center pt-2 border-t border-gray-100">
                    <button class="text-blue-600 hover:text-blue-800 font-medium transition-colors" onclick="app.showEventDetails('${event.id}')">
                        View Details
                    </button>
                    <button class="rsvp-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${rsvpStatus === 'confirmed'
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : rsvpStatus === 'declined'
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
            }" onclick="app.handleQuickRSVP('${event.id}', event)">
                        ${rsvpStatus === 'confirmed' ? 'Attending' :
                rsvpStatus === 'declined' ? 'Declined' :
                    'RSVP'}
                    </button>
                </div>
            </div>
        `;

        return card;
    },

    handleQuickRSVP(eventId, clickEvent) {
        clickEvent.stopPropagation();

        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const existingRSVP = event.guests.find(guest => guest.userId === this.currentUser);

        if (existingRSVP) {
            // Toggle between confirmed and declined
            existingRSVP.status = existingRSVP.status === 'confirmed' ? 'declined' : 'confirmed';
            existingRSVP.rsvpDate = new Date().toISOString();
        } else {
            // Add new RSVP
            event.guests.push({
                userId: this.currentUser,
                name: 'Current User', // In a real app, this would be the actual user name
                status: 'confirmed',
                rsvpDate: new Date().toISOString()
            });
        }

        // Update the event
        event.updatedAt = new Date().toISOString();
        this.saveData();

        // Show feedback
        const newStatus = existingRSVP ? existingRSVP.status : 'confirmed';
        this.showToast(
            newStatus === 'confirmed' ? 'RSVP confirmed!' : 'RSVP declined',
            newStatus === 'confirmed' ? 'success' : 'info'
        );

        // Re-render the events list to update the button
        this.renderEventsList();
    },

    clearSearch() {
        // Clear search input and filter
        const searchInput = document.getElementById('search-events');
        const filterSelect = document.getElementById('filter-events');

        if (searchInput) searchInput.value = '';
        if (filterSelect) filterSelect.value = '';

        // Re-render the list
        this.renderEventsList();
    },

    renderEventDetails(eventId) {
        // Find the event
        const event = this.events.find(e => e.id === eventId);
        if (!event) {
            this.showToast('Event not found', 'error');
            this.showView('events');
            return;
        }

        const detailsContent = document.getElementById('event-details-content');
        if (!detailsContent) return;

        // Format date and time nicely
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Check user's RSVP status
        const userRSVP = event.guests.find(guest => guest.userId === this.currentUser);
        const rsvpStatus = userRSVP ? userRSVP.status : null;

        // Check if event is today, upcoming, or past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDateOnly = new Date(event.date);
        eventDateOnly.setHours(0, 0, 0, 0);

        let dateStatus = '';
        if (eventDateOnly.getTime() === today.getTime()) {
            dateStatus = 'today';
        } else if (eventDateOnly > today) {
            dateStatus = 'upcoming';
        } else {
            dateStatus = 'past';
        }

        // Render the event details
        detailsContent.innerHTML = `
            <!-- Back button -->
            <div class="mb-6">
                <button class="flex items-center text-blue-600 hover:text-blue-800 transition-colors" onclick="app.showView('events')">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Back to Events
                </button>
            </div>

            <!-- Event header -->
            <div class="bg-white rounded-sm shadow-lg p-8 mb-6">
                <div class="flex justify-between items-start mb-4">
                    <h1 class="text-3xl font-bold text-gray-800">${event.title}</h1>
                    <span class="px-3 py-1 text-sm font-medium rounded-full ${dateStatus === 'today' ? 'bg-orange-100 text-orange-800' :
                dateStatus === 'upcoming' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-600'
            }">
                        ${dateStatus === 'today' ? 'Today' :
                dateStatus === 'upcoming' ? 'Upcoming' :
                    'Past Event'}
                    </span>
                </div>

                <p class="text-gray-600 text-lg mb-6">${event.description}</p>

                <!-- Event details grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="space-y-4">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <div>
                                <div class="font-medium text-gray-800">Date & Time</div>
                                <div class="text-gray-600">${formattedDate} at ${event.time}</div>
                            </div>
                        </div>

                        <div class="flex items-center">
                            <svg class="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <div>
                                <div class="font-medium text-gray-800">Venue</div>
                                <div class="text-gray-600">${event.venue}</div>
                            </div>
                        </div>

                        ${event.duration ? `
                            <div class="flex items-center">
                                <svg class="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-800">Duration</div>
                                    <div class="text-gray-600">${event.duration}</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Countdown timer (for upcoming events) -->
                    <div class="flex items-center justify-center">
                        ${dateStatus === 'upcoming' ? `
                            <div class="text-center p-6 bg-blue-50 rounded-lg">
                                <div class="text-sm text-blue-600 font-medium mb-2">Event starts in</div>
                                <div id="countdown-timer" class="text-2xl font-bold text-blue-800">
                                    <!-- Countdown will be inserted here -->
                                </div>
                            </div>
                        ` : dateStatus === 'today' ? `
                            <div class="text-center p-6 bg-orange-50 rounded-lg">
                                <div class="text-lg font-bold text-orange-800">🎉 Event is Today!</div>
                                <div class="text-sm text-orange-600 mt-1">Don't miss it!</div>
                            </div>
                        ` : `
                            <div class="text-center p-6 bg-gray-50 rounded-lg">
                                <div class="text-lg font-medium text-gray-600">📋 Past Event</div>
                                <div class="text-sm text-gray-500 mt-1">This event has ended</div>
                            </div>
                        `}
                    </div>
                </div>

                <!-- RSVP Section -->
                <div class="border-t pt-6">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-1">Your RSVP Status</h3>
                            <p class="text-gray-600">
                                ${rsvpStatus === 'confirmed' ? 'You are attending this event' :
                rsvpStatus === 'declined' ? 'You declined this event' :
                    'You haven\'t responded yet'}
                            </p>
                        </div>
                        <div class="flex gap-3">
                            <button class="px-6 py-2 rounded-lg font-medium transition-all duration-200 ${rsvpStatus === 'confirmed'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }" onclick="app.handleRSVP('${event.id}', 'confirmed')">
                                ${rsvpStatus === 'confirmed' ? '✅ Attending' : '✅ Attend'}
                            </button>
                            <button class="px-6 py-2 rounded-lg font-medium transition-all duration-200 ${rsvpStatus === 'declined'
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }" onclick="app.handleRSVP('${event.id}', 'declined')">
                                ${rsvpStatus === 'declined' ? '❌ Declined' : '❌ Decline'}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="mt-4">
                    <button id="invite-button" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Invite</button>
                </div>
            </div>

            <!-- Guest List -->
            <div class="bg-white rounded-lg shadow-lg p-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">Guest List (${event.guests.length})</h2>
                <div id="guest-list">
                    ${this.renderGuestList(event.guests)}
                </div>
            </div>
        `;

        // Start countdown timer if event is upcoming
        if (dateStatus === 'upcoming') {
            this.startCountdownTimer(event.date, event.time);
        }
    },

    renderGuestList(guests) {
        if (guests.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-lg mb-2">👥 No guests yet</div>
                    <div class="text-sm">Be the first to RSVP!</div>
                </div>
            `;
        }

        return guests.map(guest => `
            <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span class="text-blue-600 font-medium text-sm">
                            ${guest.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <div class="font-medium text-gray-800">${guest.name}</div>
                        <div class="text-sm text-gray-500">
                            RSVP'd ${new Date(guest.rsvpDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <span class="px-3 py-1 text-sm font-medium rounded-full ${guest.status === 'confirmed'
                ? 'bg-green-100 text-green-800'
                : guest.status === 'declined'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
            }">
                    ${guest.status === 'confirmed' ? 'Attending' :
                guest.status === 'declined' ? 'Declined' :
                    'Pending'}
                </span>
            </div>
        `).join('');
    },

    handleRSVP(eventId, status) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        // Find existing RSVP or create new one
        let existingRSVP = event.guests.find(guest => guest.userId === this.currentUser);

        if (existingRSVP) {
            // Update existing RSVP
            existingRSVP.status = status;
            existingRSVP.rsvpDate = new Date().toISOString();
        } else {
            // Add new RSVP
            event.guests.push({
                userId: this.currentUser,
                name: 'Current User', // In a real app, this would be the actual user name
                status: status,
                rsvpDate: new Date().toISOString()
            });
        }

        // Update the event
        event.updatedAt = new Date().toISOString();
        this.saveData();

        // Show feedback
        this.showToast(
            status === 'confirmed' ? '✅ RSVP confirmed!' : '❌ RSVP declined',
            status === 'confirmed' ? 'success' : 'info'
        );

        // Re-render the event details to update the UI
        this.renderEventDetails(eventId);
    },

    startCountdownTimer(eventDate, eventTime) {
        const countdownElement = document.getElementById('countdown-timer');
        if (!countdownElement) return;

        // Clear any existing countdown
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // Create target date
        const targetDate = new Date(`${eventDate}T${eventTime}`);

        const updateCountdown = () => {
            const now = new Date();
            const timeDiff = targetDate - now;

            if (timeDiff <= 0) {
                countdownElement.innerHTML = '🎉 Event Started!';
                clearInterval(this.countdownInterval);
                return;
            }

            // Calculate time units
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

            // Format countdown - simple and easy to read
            let countdownText = '';
            if (days > 0) {
                countdownText = `${days}d ${hours}h ${minutes}m`;
            } else if (hours > 0) {
                countdownText = `${hours}h ${minutes}m ${seconds}s`;
            } else {
                countdownText = `${minutes}m ${seconds}s`;
            }

            countdownElement.textContent = countdownText;
        };

        // Update immediately and then every second
        updateCountdown();
        this.countdownInterval = setInterval(updateCountdown, 1000);
    },

    renderDashboard() {
        const dashboardContent = document.getElementById('dashboard-content');
        if (!dashboardContent) return;

        // Calculate analytics - simple and clear
        const analytics = this.calculateAnalytics();

        dashboardContent.innerHTML = `
            <!-- Analytics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <!-- Events Hosted Card -->
                <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Events Hosted</p>
                            <p class="text-3xl font-bold text-blue-600">${analytics.eventsHosted}</p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-full">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                        </div>
                    </div>
                    <p class="text-sm text-gray-500 mt-2">Total events you've created</p>
                </div>

                <!-- Events Attended Card -->
                <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Events Attended</p>
                            <p class="text-3xl font-bold text-green-600">${analytics.eventsAttended}</p>
                        </div>
                        <div class="p-3 bg-green-100 rounded-full">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                    <p class="text-sm text-gray-500 mt-2">Events you've RSVP'd to</p>
                </div>

                <!-- Upcoming Events Card -->
                <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Upcoming Events</p>
                            <p class="text-3xl font-bold text-orange-600">${analytics.upcomingEvents}</p>
                        </div>
                        <div class="p-3 bg-orange-100 rounded-full">
                            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <p class="text-sm text-gray-500 mt-2">Events coming up</p>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
                <div class="flex flex-wrap gap-4">
                    <button class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium" data-view="create">
                        ✨ Create New Event
                    </button>
                    <button class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium" data-view="events">
                        🔍 Browse Events
                    </button>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Your Events -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Your Events</h3>
                    <div id="hosted-events-list">
                        ${this.renderHostedEventsList(analytics.hostedEvents)}
                    </div>
                </div>

                <!-- Events You're Attending -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Events You're Attending</h3>
                    <div id="attending-events-list">
                        ${this.renderAttendingEventsList(analytics.attendingEvents)}
                    </div>
                </div>
            </div>
        `;
    },

    calculateAnalytics() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Events hosted by current user
        const hostedEvents = this.events.filter(event => event.organizer === this.currentUser);

        // Events user is attending (RSVP'd as confirmed)
        const attendingEvents = this.events.filter(event => {
            const userRSVP = event.guests.find(guest => guest.userId === this.currentUser);
            return userRSVP && userRSVP.status === 'confirmed';
        });

        // Upcoming events (both hosted and attending)
        const upcomingHosted = hostedEvents.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
        });

        const upcomingAttending = attendingEvents.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
        });

        return {
            eventsHosted: hostedEvents.length,
            eventsAttended: attendingEvents.length,
            upcomingEvents: upcomingHosted.length + upcomingAttending.length,
            hostedEvents: hostedEvents.slice(0, 5), // Show only recent 5
            attendingEvents: attendingEvents.slice(0, 5) // Show only recent 5
        };
    },

    renderHostedEventsList(events) {
        if (events.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-lg mb-2">No events created yet</div>
                    <div class="text-sm mb-4">Create your first event to get started!</div>
                    <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" data-view="create">
                        Create Event
                    </button>
                </div>
            `;
        }

        return events.map(event => {
            const eventDate = new Date(event.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const eventDateOnly = new Date(event.date);
            eventDateOnly.setHours(0, 0, 0, 0);

            let statusBadge = '';
            if (eventDateOnly.getTime() === today.getTime()) {
                statusBadge = '<span class="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">Today</span>';
            } else if (eventDateOnly > today) {
                statusBadge = '<span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Upcoming</span>';
            } else {
                statusBadge = '<span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Past</span>';
            }

            return `
                <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                    <div class="flex-1 cursor-pointer" onclick="app.showEventDetails('${event.id}')">
                        <div class="font-medium text-gray-800">${event.title}</div>
                        <div class="text-sm text-gray-500">
                            ${eventDate.toLocaleDateString()} • ${event.guests.length} guests
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${statusBadge}
                        <button class="text-blue-600 hover:text-blue-800 text-sm" onclick="app.showEventDetails('${event.id}')">
                            View
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderAttendingEventsList(events) {
        if (events.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-lg mb-2">🎟️ No events attended yet</div>
                    <div class="text-sm mb-4">Browse events and RSVP to get started!</div>
                    <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors" data-view="events">
                        Browse Events
                    </button>
                </div>
            `;
        }

        return events.map(event => {
            const eventDate = new Date(event.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const eventDateOnly = new Date(event.date);
            eventDateOnly.setHours(0, 0, 0, 0);

            let statusBadge = '';
            if (eventDateOnly.getTime() === today.getTime()) {
                statusBadge = '<span class="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">Today</span>';
            } else if (eventDateOnly > today) {
                statusBadge = '<span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Upcoming</span>';
            } else {
                statusBadge = '<span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Attended</span>';
            }

            return `
                <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                    <div class="flex-1 cursor-pointer" onclick="app.showEventDetails('${event.id}')">
                        <div class="font-medium text-gray-800">${event.title}</div>
                        <div class="text-sm text-gray-500">
                            ${eventDate.toLocaleDateString()} • ${event.venue}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${statusBadge}
                        <button class="text-blue-600 hover:text-blue-800 text-sm" onclick="app.showEventDetails('${event.id}')">
                            View
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});


// If left empty, the app will simulate sending email
app.EMAILJS_USER_ID = '';
app.EMAILJS_SERVICE_ID = '';
app.EMAILJS_TEMPLATE_ID = '';

app.setupInviteModal = function () {
    // Avoid re-binding multiple times
    if (this._inviteModalSetup) return;
    this._inviteModalSetup = true;

    // Initialize EmailJS if user provided key
    try {
        if (app.EMAILJS_USER_ID && window.emailjs && typeof emailjs.init === 'function') {
            emailjs.init(app.EMAILJS_USER_ID);
            console.log('EmailJS initialized');
        }
    } catch (e) {
        console.warn('EmailJS not available or failed to init:', e);
    }

    // Modal elements
    const inviteModal = document.getElementById('invite-modal');
    const inviteClose = document.getElementById('invite-modal-close');
    const inviteCancel = document.getElementById('invite-cancel');
    const inviteSend = document.getElementById('invite-send');
    const inviteEmailInput = document.getElementById('invite-recipient-email');
    const inviteMessageInput = document.getElementById('invite-message');
    const inviteError = document.getElementById('invite-email-error');

    // Open invite modal when invite button is clicked (delegated because it's rendered dynamically)
    document.addEventListener('click', (e) => {
        const el = e.target.closest && e.target.closest('#invite-button');
        if (el) {
            e.preventDefault();
            // Pre-fill message with event info when possible
            const event = this.events.find(ev => ev.id === this.currentEventId);
            if (event && inviteMessageInput) {
                inviteMessageInput.value = `Hi! You're invited to ${event.title} on ${event.date} at ${event.time} at ${event.venue}.\n\n${event.description}`;
            }
            if (inviteModal) inviteModal.classList.remove('hidden');
        }
    });

    // Close handlers
    if (inviteClose) inviteClose.addEventListener('click', () => inviteModal.classList.add('hidden'));
    if (inviteCancel) inviteCancel.addEventListener('click', () => inviteModal.classList.add('hidden'));

    // Send handler
    if (inviteSend) inviteSend.addEventListener('click', async (e) => {
        e.preventDefault();
        const toEmail = inviteEmailInput.value.trim();
        const message = inviteMessageInput.value.trim();

        // Basic email validation
        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailRegex.test(toEmail)) {
            inviteError.classList.remove('hidden');
            return;
        } else {
            inviteError.classList.add('hidden');
        }

        // Prepare template params
        const event = this.events.find(ev => ev.id === this.currentEventId) || {};
        const templateParams = {
            to_email: toEmail,
            to_name: toEmail.split('@')[0],
            event_title: event.title || 'An event',
            event_date: event.date || '',
            event_time: event.time || '',
            event_venue: event.venue || '',
            message: message || ''
        };

        // If EmailJS is configured, send real email. Otherwise, simulate.
        if (app.EMAILJS_USER_ID && app.EMAILJS_SERVICE_ID && app.EMAILJS_TEMPLATE_ID && window.emailjs && typeof emailjs.send === 'function') {
            try {
                inviteSend.disabled = true;
                inviteSend.textContent = 'Sending...';
                const result = await emailjs.send(app.EMAILJS_SERVICE_ID, app.EMAILJS_TEMPLATE_ID, templateParams);
                console.log('EmailJS send result:', result);
                this.showToast('Invitation sent!', 'success');
                inviteModal.classList.add('hidden');
            } catch (err) {
                console.error('EmailJS send error', err);
                this.showToast('Failed to send invitation. See console for details.', 'error');
            } finally {
                inviteSend.disabled = false;
                inviteSend.textContent = 'Send Invite';
            }
        } else {
            // Mock sending - just show success after a short delay
            inviteSend.disabled = true;
            inviteSend.textContent = 'Sending...';
            setTimeout(() => {
                console.log('Mock invite sent to', toEmail, 'with params', templateParams);
                this.showToast(`Mock invite sent to ${toEmail}`, 'success');
                inviteSend.disabled = false;
                inviteSend.textContent = 'Send Invite';
                inviteModal.classList.add('hidden');
            }, 800);
        }
    });
};

// Expose a small helper to set EmailJS config at runtime (useful for dev without editing files)
app.configureEmailJS = function ({ userId, serviceId, templateId }) {
    if (userId) this.EMAILJS_USER_ID = userId;
    if (serviceId) this.EMAILJS_SERVICE_ID = serviceId;
    if (templateId) this.EMAILJS_TEMPLATE_ID = templateId;
    try {
        if (this.EMAILJS_USER_ID && window.emailjs && typeof emailjs.init === 'function') {
            emailjs.init(this.EMAILJS_USER_ID);
        }
    } catch (e) {
        console.warn('EmailJS init failed during configure:', e);
    }
};
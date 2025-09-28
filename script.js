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
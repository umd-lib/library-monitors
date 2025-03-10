// Configuration
const CONFIG = {
  isDevelopment: false,
  apiBaseUrl: "",
  refreshInterval: 60000, // 1 minute
  endpoints: {
    hours: "/api/libtools/mckeldin/hours/today",
    rooms: "/api/libtools/mckeldin/availability",
    computers: "/monitors/api/workstations-mckeldin.json",
  },
};

// Data Service - handles all API requests
const DataService = {
  /**
   * Fetch data from API or use mock data in development
   * @param {string} dataType - Type of data to fetch (hours, rooms, computers)
   * @returns {Promise<Object>} - The fetched or mock data
   */
  async fetchData(dataType) {
    try {
      if (CONFIG.isDevelopment) {
        console.log(`Using mock ${dataType} data`);
        return MOCK_DATA[
          `library${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`
        ];
      } else {
        const endpoint = CONFIG.endpoints[dataType];
        const url = `${CONFIG.apiBaseUrl}${endpoint}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
      }
    } catch (error) {
      console.error(`Error fetching ${dataType} data:`, error);
      UIService.showError(`Failed to load ${dataType} data`);
      return null;
    }
  },
};

// Utility functions for data transformation
const Utils = {
  /**
   * Converts timestamp to a human-readable format
   * @param {string} time - ISO timestamp
   * @returns {string|boolean} - Formatted time or false if in the past
   */
  convertTimeFormat(time) {
    const now = new Date();
    const date = new Date(time);

    // Get the current and available dates for comparison
    const currentDate = now.getDate();
    const availableDate = date.getDate();

    // Return false for past dates
    if (date < now) {
      return false;
    }

    // Format time components
    let hours = date.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = date.getMinutes().toString().padStart(2, "0");

    // Determine format based on date difference
    if (availableDate === currentDate) {
      // Same day - show time
      return `${hours}:${minutes} ${ampm}`;
    } else if (availableDate === currentDate + 1) {
      // Next day - show "Tomorrow"
      return "Tomorrow";
    } else {
      // Future date - show MM/DD/YY
      const month = date.getMonth() + 1;
      const day = availableDate;
      const year = date.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    }
  },

  /**
   * Format time string to ensure proper spacing
   * @param {string} timeString - Time string in format "HH:MMAM/PM"
   * @returns {string} - Formatted time string with proper spacing
   */
  formatTimeString(timeString) {
    return timeString.replace(/([0-9]{1,2}:[0-9]{2})([APM]{2})/, "$1 $2");
  },

  /**
   * Get current time in formatted string
   * @returns {string} - Current time as "H:MM AM/PM"
   */
  getCurrentFormattedTime() {
    const now = new Date();

    // Format hours (12-hour format without leading zeros)
    let hours = now.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12 for midnight

    // Format minutes (with leading zeros)
    const minutes = now.getMinutes().toString().padStart(2, "0");

    // Create formatted time string
    return `${hours}:${minutes} ${ampm}`;
  },
};

// UI Service - handles all DOM updates
const UIService = {
  /**
   * Update library hours display
   * @param {Object} data - Library hours data
   */
  updateLibraryHours(data) {
    if (!data) return;

    const libraryHourTitle = document.getElementById("library-status-title");
    const libraryHour = document.getElementById("close-time");

    if (data.status === "24hours") {
      libraryHourTitle.innerHTML = "Opens";
      libraryHour.innerHTML = "24 hours";
    } else if (data.status === "closed" || data.status === "open") {
      libraryHourTitle.innerHTML = "Closes Today at";
      libraryHour.innerHTML = Utils.formatTimeString(data.hours_to);
    }
    // other status = show original data
  },

  /**
   * Update library available rooms display
   * @param {Object} data - Library rooms data
   */
  updateLibraryRooms(data) {
    if (!data) return;

    // Study carrels
    this.updateRoomSection("info-carrel", data[23067]);

    // Group study rooms
    this.updateRoomSection("info-group", data[23065]);
  },

  /**
   * Helper function to update a room section
   * @param {string} sectionId - HTML element ID for the section
   * @param {Object} roomData - Room data object
   */
  updateRoomSection(sectionId, roomData) {
    const section = document.getElementById(sectionId);
    const availableEl = section.querySelector("#available-count");
    const totalEl = section.querySelector("#total-count");
    const statusEl = section.querySelector("#available-status");
    const decoEl = section.querySelector("#content-deco");
    const barEl = section.querySelector("span.status-bar");

    if (parseInt(roomData.available) > 0) {
      statusEl.innerHTML = "Available";
      availableEl.innerHTML = roomData.available;
      totalEl.innerHTML = roomData.total;
      decoEl.innerHTML = "/";
    } else {
      let nextAvailableTime = Utils.convertTimeFormat(roomData.next_available);

      if (nextAvailableTime === false) {
        statusEl.innerHTML = "Available";
        availableEl.innerHTML = roomData.available;
        totalEl.innerHTML = roomData.total;
        decoEl.innerHTML = "/";
      } else {
        statusEl.innerHTML = "Next Available";
        availableEl.innerHTML = nextAvailableTime;
        totalEl.innerHTML = "";
        decoEl.innerHTML = "";
      }
    }

    // update the availability bar
    let progressBarValue = (roomData.available / roomData.total) * 100;
    if (progressBarValue > 100) {
      progressBarValue = 100;
    }
    barEl.style.width = `${progressBarValue}%`;
  },

  /**
   * Update library available computers display
   * @param {Object} data - Library computers data
   */
  updateLibraryComputers(data) {
    if (!data) return;

    // First floor
    this.updateComputerSection("info-1st", data.MCK1F);

    // Second floor
    this.updateComputerSection("info-2nd", data.MCK2F);
  },

  /**
   * Helper function to update a computer section
   * @param {string} sectionId - HTML element ID for the section
   * @param {Object} floorData - Floor data object
   */
  updateComputerSection(sectionId, floorData) {
    const section = document.getElementById(sectionId);
    const availableEl = section.querySelector("#available-count");
    const totalEl = section.querySelector("#total-count");
    const decoEl = section.querySelector("#content-deco");
    const barEl = section.querySelector("span.status-bar");

    availableEl.innerHTML = floorData.available;
    totalEl.innerHTML = floorData.total;
    decoEl.innerHTML = "/";

    // update the availability bar
    let progressBarValue = (floorData.available / floorData.total) * 100;
    if (progressBarValue > 100) {
      progressBarValue = 100;
    }
    barEl.style.width = `${progressBarValue}%`;
  },

  /**
   * Update current time display
   */
  updateCurrentTime() {
    document.getElementById("current-time").textContent =
      Utils.getCurrentFormattedTime();
  },

  /**
   * Show error message to user
   * @param {string} message - Error message to display
   */
  showError(message) {
    console.error(message);
    // Implement visual error feedback here if needed
    // For example, add a toast notification or error banner
  },
};

// App Controller - coordinates the application
const LibraryApp = {
  /**
   * Initialize the app
   */
  init() {
    this.updateAll();
    this.startPeriodicUpdates();
  },

  /**
   * Update all library information
   */
  async updateAll() {
    UIService.updateCurrentTime();

    const hoursData = await DataService.fetchData("hours");
    UIService.updateLibraryHours(hoursData);

    const roomsData = await DataService.fetchData("rooms");
    UIService.updateLibraryRooms(roomsData);

    const computersData = await DataService.fetchData("computers");
    UIService.updateLibraryComputers(computersData);

    console.log(`Last updated: ${new Date().toLocaleTimeString()}`);
  },

  /**
   * Start periodic updates
   */
  startPeriodicUpdates() {
    this.intervalId = setInterval(() => {
      this.updateAll();
    }, CONFIG.refreshInterval);
  },

  /**
   * Stop periodic updates
   */
  stopPeriodicUpdates() {
    clearInterval(this.intervalId);
    console.log("Stopped fetching library data");
  },
};

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  LibraryApp.init();
});

// Configuration
const CONFIG = {
  isDevelopment: false,
  apiBaseUrl: "",
  refreshInterval: 60000, // 1 minute
  endpoints: {
    hours: "/api/libtools/stem/hours/today",
    hours_makerspace: "/api/libtools/makerspace/hours/today",
    equipment: "https://api.www.lib.umd.edu/alma-service/equipment",
  },
  equipmentIds: {
    laptop_charger: ["990063177290108238"],
    phone_charger: ["990063177290108238", "990043548720108238"],
    calculator: ["990062992380108238", "990047016260108238"],
    marker_kit: ["990040147850108238"],
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

  /**
   * Fetch equipment data from new API
   * @returns {Promise<Object>} - Equipment availability data by category
   */
  async fetchEquipmentData() {
    try {
      // Collect all unique equipment IDs
      const allEquipmentIds = new Set();
      Object.values(CONFIG.equipmentIds).forEach((ids) => {
        ids.forEach((id) => allEquipmentIds.add(id));
      });

      const response = await fetch(CONFIG.endpoints.equipment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...allEquipmentIds]),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const rawData = await response.json();
      return this.aggregateEquipmentData(rawData);
    } catch (error) {
      console.error("Error fetching equipment data:", error);
      UIService.showError("Failed to load equipment data");
      return null;
    }
  },

  /**
   * Aggregate equipment counts by category
   * @param {Object} rawData - Raw API response
   * @returns {Object} - Aggregated data by category
   */
  aggregateEquipmentData(rawData) {
    const aggregated = {};

    // Initialize categories with zero counts
    Object.keys(CONFIG.equipmentIds).forEach((category) => {
      aggregated[category] = { available: 0, total: 0 };
    });

    // Aggregate counts for each category
    Object.keys(CONFIG.equipmentIds).forEach((category) => {
      const categoryIds = CONFIG.equipmentIds[category];

      categoryIds.forEach((equipmentId) => {
        // Find matching entries in raw data (format: "mms_id--location")
        Object.keys(rawData).forEach((key) => {
          if (key.startsWith(equipmentId)) {
            const item = rawData[key];
            const available = parseInt(item.count) || 0;
            const total = parseInt(item.total) || 0;

            aggregated[category].available += available;
            aggregated[category].total += total;
          }
        });
      });
    });

    return aggregated;
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
    } else if (data.status === "close" || data.status === "open") {
      libraryHourTitle.innerHTML = "Closes Today at";
      libraryHour.innerHTML = Utils.formatTimeString(data.hours_to);
    }
  },

  /**
   * Update makerspace hours display
   * @param {Object} data - Makerspace hours data
   */
  updateMakerspaceHours(data) {
    if (!data) return;

    const makerspaceHourCardOpen =
      document.getElementById("jsg-time-open-card");
    const makerspaceHourCardClose = document.getElementById(
      "jsg-time-close-card"
    );
    const makerspaceHourTitle = document.getElementById("jsg-status-title");
    const makerspaceOpenHour = document.getElementById("jsg-time-open");
    const makerspaceCloseHour = document.getElementById("jsg-time-close");

    if (data.status === "closed") {
      // expand the open card to full width and hide the close card
      makerspaceHourCardOpen.classList.add("makerspace-closed");
      makerspaceHourCardClose.classList.add("hidden");

      makerspaceHourTitle.innerHTML = "Today";
      makerspaceOpenHour.innerHTML = "Closed";
    } else if (data.status === "open") {
      makerspaceHourCardOpen.classList.remove("makerspace-closed");
      makerspaceHourCardClose.classList.remove("hidden");

      makerspaceOpenHour.innerHTML = Utils.formatTimeString(data.hours_from);
      makerspaceCloseHour.innerHTML = Utils.formatTimeString(data.hours_to);
    }
  },

  /**
   * Update equipment availability display
   * @param {Object} data - Aggregated equipment data
   */
  updateEquipmentAvailability(data) {
    if (!data) return;

    const equipmentMap = {
      laptop_charger: "info-laptop-charger",
      phone_charger: "info-phone-charger",
      calculator: "info-calculator",
      marker_kit: "info-marker-kit",
    };

    // Update each equipment category
    Object.keys(equipmentMap).forEach((category) => {
      const containerId = equipmentMap[category];
      const container = document.getElementById(containerId);

      if (container && data[category]) {
        const availableEl = container.querySelector("#available-count");
        const totalEl = container.querySelector("#total-count");
        const decoEl = container.querySelector("#content-deco");
        const barEl = container.querySelector("span.status-bar");

        if (availableEl) availableEl.textContent = data[category].available;
        if (totalEl) totalEl.textContent = data[category].total;
        if (decoEl) decoEl.textContent = "/";

        // Update the availability bar
        if (barEl && data[category].total > 0) {
          let progressBarValue =
            (data[category].available / data[category].total) * 100;
          if (progressBarValue > 100) {
            progressBarValue = 100;
          }
          barEl.style.width = `${progressBarValue}%`;
        }
      }
    });
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
    this.scheduleMidnightReload();
  },

  /**
   * Update all library information
   */
  async updateAll() {
    UIService.updateCurrentTime();

    const hoursData = await DataService.fetchData("hours");
    UIService.updateLibraryHours(hoursData);

    const makerspaceHoursData = await DataService.fetchData("hours_makerspace");
    UIService.updateMakerspaceHours(makerspaceHoursData);

    const equipmentData = await DataService.fetchEquipmentData();
    UIService.updateEquipmentAvailability(equipmentData);

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

  /**
   * Schedule page reload at midnight (00:00) every day
   */
  scheduleMidnightReload() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to midnight

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    console.log(
      `Scheduling page reload at midnight (${timeUntilMidnight}ms from now)`
    );

    // Set timeout to reload at midnight
    setTimeout(() => {
      console.log("Reloading page at midnight");
      window.location.reload();
    }, timeUntilMidnight);
  },
};

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  LibraryApp.init();
});

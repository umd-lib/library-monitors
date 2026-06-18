// Configuration
const CONFIG = {
  apiBaseUrl: "",
  refreshInterval: 60000, // 1 minute
  endpoints: {
    hours: "/api/libtools/stem/hours/today",
    hours_makerspace: "/api/libtools/makerspace/hours/today",
    equipment: "/alma-service/equipment",
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
      const endpoint = CONFIG.endpoints[dataType];
      const url = `${CONFIG.apiBaseUrl}${endpoint}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return await response.json();
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

    // Initialize categories with zero counts. `status` stays "unavailable"
    // until a matching holding reports live availability counts.
    Object.keys(CONFIG.equipmentIds).forEach((category) => {
      aggregated[category] = { available: 0, total: 0, status: "unavailable" };
    });

    // Aggregate counts for each category
    Object.keys(CONFIG.equipmentIds).forEach((category) => {
      const categoryIds = CONFIG.equipmentIds[category];

      categoryIds.forEach((equipmentId) => {
        // Find matching entries in raw data (format: "mms_id--location")
        Object.keys(rawData).forEach((key) => {
          if (key.startsWith(equipmentId)) {
            const item = rawData[key];

            if (item.status === "available") {
              // This holding reports live counts - sum them in.
              aggregated[category].available += parseInt(item.count) || 0;
              aggregated[category].total += parseInt(item.total) || 0;
              aggregated[category].status = "available";
            } else if (aggregated[category].status !== "available") {
              // No live counts (e.g. "Check Holding"). Preserve the API status
              // so the UI can decide what to show, unless an available holding
              // has already been found for this category.
              aggregated[category].status = item.status;
            }
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
   * Parse a free-text hours string (used when status === "text").
   * Extracts the first two time tokens (e.g. "10am", "5pm") as hour_from /
   * hour_to and determines whether hour_from is earlier than hour_to,
   * accounting for am/pm. The returned times are normalized to the same
   * "H:MM AM/PM" format used elsewhere in the UI.
   * @param {string} text - Raw text such as
   *   "10am – 5pm, <a href=\"mailto:...\">Appointment Required</a>"
   * @returns {Object|null} - { hour_from, hour_to, isValidRange } or null when
   *   two time tokens cannot be found
   */
  parseTextHours(text) {
    if (!text) return null;

    // Match time tokens like "10am", "5 pm", or "10:30am"
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi;
    const matches = [...text.matchAll(timeRegex)];

    if (matches.length < 2) return null;

    // Normalize a matched time token into a canonical "H:MM AM/PM" string plus
    // its minutes-since-midnight value for range comparison.
    const normalize = (match) => {
      let hour24 = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const meridiem = match[3].toUpperCase();

      if (meridiem === "PM" && hour24 !== 12) hour24 += 12;
      if (meridiem === "AM" && hour24 === 12) hour24 = 0;

      const hour12 = hour24 % 12 || 12;

      return {
        formatted: `${hour12}:${minutes.toString().padStart(2, "0")} ${meridiem}`,
        minutesOfDay: hour24 * 60 + minutes,
      };
    };

    const from = normalize(matches[0]);
    const to = normalize(matches[1]);

    return {
      hour_from: from.formatted,
      hour_to: to.formatted,
      isValidRange: from.minutesOfDay < to.minutesOfDay,
    };
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
    const libraryCloseCard = document.getElementById("library-time-close");
    const currentTimeCard = document.getElementById("library-time-current");

    if (data.status === "24hours") {
      libraryHourTitle.innerHTML = "Opens";
      libraryHour.innerHTML = "24 hours";
    } else if (data.status === "open") {
      if (data.hours_to === "12:00AM") {
        libraryHourTitle.innerHTML = "Opens";
        libraryHour.innerHTML = "24 hours";
      } else {
        libraryHourTitle.innerHTML = "Closes at";
        libraryHour.innerHTML = Utils.formatTimeString(data.hours_to);
      }
    } else if (data.status === "closed") {
      libraryHourTitle.innerHTML = "Currently";
      libraryHour.innerHTML = "CLOSED";
    } else {
      libraryCloseCard.style.display = "none"; // Hide the card if status is unknown
      currentTimeCard.classList.add("full-width"); // Make the current time card full width
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
      "jsg-time-close-card",
    );
    const makerspaceHourTitle = document.getElementById("jsg-status-title");
    const makerspaceOpenHour = document.getElementById("jsg-time-open");
    const makerspaceCloseHour = document.getElementById("jsg-time-close");

    if (data.status === "closed") {
      // expand the open card to full width and hide the close card
      makerspaceHourCardOpen.classList.add("makerspace-closed");
      makerspaceHourCardClose.classList.add("hidden");

      makerspaceHourTitle.innerHTML = "Today's Hours";
      makerspaceOpenHour.innerHTML = "Closed";
    } else if (data.status === "open") {
      makerspaceHourCardOpen.classList.remove("makerspace-closed");
      makerspaceHourCardClose.classList.remove("hidden");

      makerspaceOpenHour.innerHTML = Utils.formatTimeString(data.hours_from);
      makerspaceCloseHour.innerHTML = Utils.formatTimeString(data.hours_to);
    } else if (data.status === "text") {
      const parsed = Utils.parseTextHours(data.text);

      if (parsed && parsed.isValidRange) {
        makerspaceHourCardOpen.classList.remove("makerspace-closed");
        makerspaceHourCardClose.classList.remove("hidden");

        makerspaceOpenHour.innerHTML = parsed.hour_from;
        makerspaceCloseHour.innerHTML = parsed.hour_to;
      } else {
        // Could not parse a valid range - direct visitors to the service desk
        makerspaceHourCardOpen.classList.add("makerspace-closed");
        makerspaceHourCardClose.classList.add("hidden");

        makerspaceHourTitle.innerHTML = "Today's Hours";
        makerspaceOpenHour.innerHTML = "See Staff";
      }
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
      const categoryData = data[category];

      if (!container || !categoryData) return;

      const availableEl = container.querySelector("#available-count");
      const totalEl = container.querySelector("#total-count");
      const decoEl = container.querySelector("#content-deco");
      const statusEl = container.querySelector("#available-status");
      const barEl = container.querySelector("span.status-bar");

      if (categoryData.status === "available" && categoryData.total > 0) {
        // Live counts available - show "available / total" with a status bar.
        // Restore visibility in case a previous refresh hit the "See Staff"
        // branch below, which hides these elements.
        if (availableEl) {
          availableEl.style.display = "";
          availableEl.textContent = categoryData.available;
        }
        if (totalEl) totalEl.textContent = categoryData.total;
        if (decoEl) {
          decoEl.style.display = "";
          decoEl.textContent = "/";
        }
        if (statusEl) statusEl.textContent = "Available";

        if (barEl) {
          let progressBarValue =
            (categoryData.available / categoryData.total) * 100;
          if (progressBarValue > 100) {
            progressBarValue = 100;
          }
          barEl.style.width = `${progressBarValue}%`;
        }
      } else {
        // No live count for this item (e.g. status "Check Holding") - direct
        // visitors to staff instead of showing numbers.
        if (availableEl) availableEl.style.display = "none";
        if (totalEl) totalEl.textContent = "SEE STAFF";
        if (decoEl) decoEl.style.display = "none";
        if (statusEl) statusEl.textContent = "";
        if (barEl) barEl.style.width = "0%";
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
      `Scheduling page reload at midnight (${timeUntilMidnight}ms from now)`,
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

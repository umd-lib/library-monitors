// // mock data
// const mockLibraryHours = {
//   status: "open",
//   hours_from: "12:00AM",
//   hours_to: "8:00PM",
// };

// const mocckLibraryAvailableRoom = {
//   23065: {
//     name: "McKeldin Library Terrapin Learning Commons Group Study Rooms",
//     available: "0",
//     total: "11",
//     next_available: "2025-03-07T08:00:00-05:00",
//   },
//   23067: {
//     name: "McKeldin Library Study Carrels",
//     available: "0",
//     total: "59",
//     next_available: "2025-03-07T08:00:00-05:00",
//   },
//   23071: {
//     name: "McKeldin Library Faculty Office Room 7233",
//     available: "0",
//     total: "1",
//     next_available: "2025-03-07T08:00:00-05:00",
//   },
//   23082: {
//     name: "McKeldin Library Family Study Room 3233",
//     available: "0",
//     total: "1",
//     next_available: "2025-03-07T08:00:00-05:00",
//   },
//   30085: {
//     name: "McKeldin Library Terrapin Learning Commons Podcasting Lab",
//     available: "0",
//     total: "1",
//     next_available: "2025-03-07T08:00:00-05:00",
//   },
//   40070: {
//     name: "McKeldin Conversation Room ",
//     available: "0",
//     total: "1",
//     next_available: "2025-03-07T10:30:00-05:00",
//   },
//   overall_available: 0,
//   total: 74,
// };

// const mockLibraryAvailableComputer = {
//   floor1: {
//     name: "First Floor",
//     available: 15,
//     occupied: 5,
//   },
//   floor2: {
//     name: "Second Floor",
//     available: 20,
//     occupied: 10,
//   },
//   floor3: {
//     name: "Third Floor",
//     available: 8,
//     occupied: 12,
//   },
// };

// // convert time format
// function convertTimeFormat(time) {
//   // Initialize dates
//   const now = new Date();
//   const date = new Date(time);

//   // Get the current and available dates for comparison
//   const currentDate = now.getDate();
//   const availableDate = date.getDate();

//   // Return false for past dates
//   if (date < now) {
//     return false;
//   }

//   // Format time components (for today's times)
//   let hours = date.getHours();
//   const ampm = hours >= 12 ? "PM" : "AM";
//   hours = hours % 12;
//   hours = hours ? hours : 12;
//   const minutes = date.getMinutes().toString().padStart(2, "0");

//   // Determine format based on date difference
//   if (availableDate === currentDate) {
//     // Same day - show time
//     return `${hours}:${minutes} ${ampm}`;
//   } else if (availableDate === currentDate + 1) {
//     // Next day - show "Tomorrow"
//     return "Tomorrow";
//   } else {
//     // Future date - show MM/DD/YY
//     const month = date.getMonth() + 1;
//     const day = availableDate;
//     const year = date.getFullYear().toString().slice(-2);
//     return `${month}/${day}/${year}`;
//   }
// }

// // Library Operstion Hours Section
// async function fetchLibraryHours() {
//   try {
//     // Check if we're in development mode
//     const isDevelopment = true; // Set this based on your environment variables or configuration

//     let data;

//     if (isDevelopment) {
//       // Use mock data in development
//       data = mockLibraryHours;
//       console.log("Using mock data:", data);
//     } else {
//       // Fetch real data in production
//       const response = await fetch(
//         "https://display-test.lib.umd.edu/api/libtools/mckeldin/hours/today"
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       data = await response.json();
//     }

//     console.log("Fetched library hours:", data);
//     // Process the data (same code for both mock and real data)
//     updateLibraryHoursDisplay(data);

//     // Log the time of the last update
//     console.log(`Last updated: ${new Date().toLocaleTimeString()}`);
//   } catch (error) {
//     console.error("Error fetching library hours:", error);
//   }
// }

// function updateLibraryHoursDisplay(data) {
//   const libraryHourTitle = document.getElementById("library-status-title");
//   const libearyHour = document.getElementById("close-time");
//   console.log(libraryHourTitle);

//   // status = 24hours
//   if (data.status === "24hours") {
//     libraryHourTitle.innerHTML = "Opens";
//     libearyHour.innerHTML = "24 hours";
//   }

//   // status = closed or open
//   if (data.status === "closed" || data.status === "open") {
//     libraryHourTitle.innerHTML = "Closes Today at";
//     libearyHour.innerHTML = data.hours_to.replace(
//       /([0-9]{1,2}:[0-9]{2})([APM]{2})/,
//       "$1 $2"
//     );
//   }

//   // other status = show original data
// }

// // update local time
// function updateCurrentTime() {
//   // Get current date and time
//   const now = new Date();

//   // Format hours (12-hour format without leading zeros)
//   let hours = now.getHours();
//   const ampm = hours >= 12 ? "PM" : "AM";
//   hours = hours % 12;
//   hours = hours ? hours : 12; // Convert 0 to 12 for midnight

//   // Format minutes (with leading zeros)
//   const minutes = now.getMinutes().toString().padStart(2, "0");

//   // Create formatted time string
//   const timeString = `${hours}:${minutes} ${ampm}`;

//   // Update the element with the current time
//   document.getElementById("current-time").textContent = timeString;
// }

// // Library Available Rooms Section
// async function fetchLibraryAvailableRoom() {
//   try {
//     // Check if we're in development mode
//     const isDevelopment = true; // Set this based on your environment variables or configuration

//     let data;

//     if (isDevelopment) {
//       // Use mock data in development
//       data = mocckLibraryAvailableRoom;
//       console.log("Using mock data:", data);
//     } else {
//       // Fetch real data in production
//       const response = await fetch(
//         "https://display-test.lib.umd.edu/api/libtools/mckeldin/hours/today"
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       data = await response.json();
//     }

//     console.log("Fetched library available rooms:", data);
//     // Process the data (same code for both mock and real data)
//     updateLibraryAvailableRoomDisplay(data);

//     // Log the time of the last update
//     console.log(`Last updated: ${new Date().toLocaleTimeString()}`);
//   } catch (error) {
//     console.error("Error fetching library available rooms:", error);
//   }
// }

// function updateLibraryAvailableRoomDisplay(data) {
//   // study carrel
//   const studyCarrel = document.getElementById("info-carrel");
//   const studyCarrelAvailable = studyCarrel.querySelector("#available-count");
//   const studyCarrelTotal = studyCarrel.querySelector("#total-count");
//   const studyCarrelStatus = studyCarrel.querySelector("#available-status");
//   const studyCarrelDeco = studyCarrel.querySelector("#content-deco");

//   if (data) {
//     if (data[23067].available > 0) {
//       studyCarrelStatus.innerHTML = "Available";
//       studyCarrelAvailable.innerHTML = data[23067].available;
//       studyCarrelTotal.innerHTML = data[23067].total;
//       studyCarrelDeco.innerHTML = "/";
//     }
//     if (data[23067].available == 0) {
//       let nextAvailableTime = convertTimeFormat(data[23067].next_available);

//       if (nextAvailableTime === false) {
//         studyCarrelStatus.innerHTML = "Available";
//         studyCarrelAvailable.innerHTML = data[23067].available;
//         studyCarrelTotal.innerHTML = data[23067].total;
//         studyCarrelDeco.innerHTML = "/";
//       } else {
//         studyCarrelStatus.innerHTML = "Next Available";
//         studyCarrelAvailable.innerHTML = nextAvailableTime;
//         studyCarrelTotal.innerHTML = "";
//         studyCarrelDeco.innerHTML = "";
//       }
//     }
//   }

//   // group study rooms
//   const groupStudyRoom = document.getElementById("info-group");
//   const groupStudyRoomAvailable =
//     groupStudyRoom.querySelector("#available-count");
//   const groupStudyRoomTotal = groupStudyRoom.querySelector("#total-count");
//   const groupStudyRoomStatus =
//     groupStudyRoom.querySelector("#available-status");
//   const groupStudyRoomDeco = groupStudyRoom.querySelector("#content-deco");

//   if (data) {
//     if (data[23065].available > 0) {
//       groupStudyRoomStatus.innerHTML = "Available";
//       groupStudyRoomAvailable.innerHTML = data[23065].available;
//       groupStudyRoomTotal.innerHTML = data[23065].total;
//       groupStudyRoomDeco.innerHTML = "/";
//     }
//     if (data[23065].available == 0) {
//       let nextAvailableTime = convertTimeFormat(data[23065].next_available);

//       if (nextAvailableTime === false) {
//         groupStudyRoomStatus.innerHTML = "Available";
//         groupStudyRoomAvailable.innerHTML = data[23065].available;
//         groupStudyRoomTotal.innerHTML = data[23065].total;
//         groupStudyRoomDeco.innerHTML = "/";
//       } else {
//         groupStudyRoomStatus.innerHTML = "Next Available";
//         groupStudyRoomAvailable.innerHTML = nextAvailableTime;
//         groupStudyRoomTotal.innerHTML = "";
//         groupStudyRoomDeco.innerHTML = "";
//       }
//     }
//   }
// }

// async function fetchLibraryAvailableComputer() {
//   try {
//     // Check if we're in development mode
//     const isDevelopment = true; // Set this based on your environment variables or configuration

//     let data;

//     if (isDevelopment) {
//       // Use mock data in development
//       data = mockLibraryAvailableComputer;
//       console.log("Using mock data:", data);
//     } else {
//       // Fetch real data in production
//       const response = await fetch(
//         "https://display-test.lib.umd.edu/api/libtools/mckeldin/hours/today"
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       data = await response.json();
//     }

//     console.log("Fetched library available computers:", data);
//     // Process the data (same code for both mock and real data)
//     updateLibraryAvailableComputerDisplay(data);

//     // Log the time of the last update
//     console.log(`Last updated: ${new Date().toLocaleTimeString()}`);
//   } catch (error) {
//     console.error("Error fetching library available computers:", error);
//   }
// }

// function updateLibraryAvailableComputerDisplay(data) {
//   const firstFloor = document.getElementById("info-1st");
//   const firstFloorAvailable = firstFloor.querySelector("#available-count");
//   const firstFloorTotal = firstFloor.querySelector("#total-count");
//   const firstFloorDeco = firstFloor.querySelector("#content-deco");

//   if (data) {
//     firstFloorAvailable.innerHTML = data.floor1.available;
//     const total = data.floor1.available + data.floor1.occupied;
//     firstFloorTotal.innerHTML = total;
//     firstFloorDeco.innerHTML = "/";
//   }

//   const secondFloor = document.getElementById("info-2nd");
//   const secondFloorAvailable = secondFloor.querySelector("#available-count");
//   const secondFloorTotal = secondFloor.querySelector("#total-count");
//   const secondFloorDeco = secondFloor.querySelector("#content-deco");

//   if (data) {
//     secondFloorAvailable.innerHTML = data.floor2.available;
//     const total = data.floor2.available + data.floor2.occupied;
//     secondFloorTotal.innerHTML = total;
//     secondFloorDeco.innerHTML = "/";
//   }
// }

// // Exucute functions
// // Run immediately to avoid delay on page load
// document.addEventListener("DOMContentLoaded", function () {
//   updateCurrentTime();
//   fetchLibraryHours();
//   fetchLibraryAvailableRoom();
//   fetchLibraryAvailableComputer();
// });

// // Fetch data every minute
// const intervalId = setInterval(() => {
//   updateCurrentTime();
//   fetchLibraryHours();
//   fetchLibraryAvailableRoom();
//   fetchLibraryAvailableComputer();
//   // any other functions you want to call
// }, 60000);

// // Optional: Function to stop the interval if needed
// function stopFetching() {
//   clearInterval(intervalId);
//   console.log("Stopped fetching library hours");
// }

// Configuration
const CONFIG = {
  isDevelopment: true,
  apiBaseUrl: "",
  refreshInterval: 60000, // 1 minute
  endpoints: {
    hours: "/api/libtools/mckeldin/hours/today",
    rooms: "/api/libtools/mckeldin/availability",
    computers: "/monitors/api/workstations-mckeldin.json",
  },
};

// Mock data
const MOCK_DATA = {
  libraryHours: {
    status: "open",
    hours_from: "12:00AM",
    hours_to: "8:00PM",
  },

  libraryRooms: {
    23065: {
      name: "McKeldin Library Terrapin Learning Commons Group Study Rooms",
      available: "200",
      total: "11",
      next_available: "2025-03-07T08:00:00-05:00",
    },
    23067: {
      name: "McKeldin Library Study Carrels",
      available: "30",
      total: "59",
      next_available: "2025-03-07T08:00:00-05:00",
    },
    23071: {
      name: "McKeldin Library Faculty Office Room 7233",
      available: "0",
      total: "1",
      next_available: "2025-03-07T08:00:00-05:00",
    },
    23082: {
      name: "McKeldin Library Family Study Room 3233",
      available: "0",
      total: "1",
      next_available: "2025-03-07T08:00:00-05:00",
    },
    30085: {
      name: "McKeldin Library Terrapin Learning Commons Podcasting Lab",
      available: "0",
      total: "1",
      next_available: "2025-03-07T08:00:00-05:00",
    },
    40070: {
      name: "McKeldin Conversation Room ",
      available: "0",
      total: "1",
      next_available: "2025-03-07T10:30:00-05:00",
    },
    overall_available: 0,
    total: 74,
  },

  libraryComputers: {
    MCK7F: {
      pc_total: 2,
      mac_total: 0,
      pc_available: 2,
      mac_available: 0,
      occupied: 0,
      total: 2,
      name: "7th",
      available: 2,
      key: "MCK7F",
      class: "bg-grey",
    },
    MCK6F: {
      pc_total: 2,
      mac_total: 0,
      pc_available: 2,
      mac_available: 0,
      occupied: 0,
      total: 2,
      name: "6th",
      available: 2,
      key: "MCK6F",
      class: "bg-white",
    },
    MCK5F: {
      pc_total: 2,
      mac_total: 0,
      pc_available: 2,
      mac_available: 0,
      occupied: 0,
      total: 2,
      name: "5th",
      available: 2,
      key: "MCK5F",
      class: "bg-grey",
    },
    MCK4F: {
      pc_total: 2,
      mac_total: 0,
      pc_available: 1,
      mac_available: 0,
      occupied: 1,
      total: 2,
      name: "4th",
      available: 1,
      key: "MCK4F",
      class: "bg-white",
    },
    MCK3F: {
      pc_total: 2,
      mac_total: 0,
      pc_available: 2,
      mac_available: 0,
      occupied: 0,
      total: 2,
      name: "3rd",
      available: 2,
      key: "MCK3F",
      class: "bg-grey",
    },
    MCK2F: {
      pc_total: 40,
      mac_total: 12,
      pc_available: 40,
      mac_available: 10,
      occupied: 2,
      total: 52,
      name: "2nd",
      available: 50,
      key: "MCK2F",
      class: "bg-white",
    },
    MCK1F: {
      pc_total: 62,
      mac_total: 12,
      pc_available: 62,
      mac_available: 3,
      occupied: 9,
      total: 74,
      name: "1st",
      available: 65,
      key: "MCK1F",
      class: "bg-grey",
    },
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
    console.log("value", progressBarValue);
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
    console.log("value", progressBarValue);
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

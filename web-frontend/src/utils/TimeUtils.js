/**
 * Time Utilities - Centralized time calculation and formatting functions
 * 
 * This module consolidates all time-related operations to avoid duplication
 * and provide consistent time handling across the application.
 */

export class TimeUtils {
  /**
   * Calculate time remaining until an end time
   * @param {Date|string} endTime - The end time to calculate from
   * @returns {string} Formatted time remaining string
   */
  static calculateTimeLeft(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const timeDiff = end - now;
    
    if (timeDiff <= 0) {
      return "Ended";
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  }

  /**
   * Calculate time left with shorter format (for modals/compact display)
   * @param {Date|string} endTime - The end time to calculate from
   * @returns {string} Shorter formatted time remaining string
   */
  static calculateTimeLeftShort(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const timeDiff = end - now;
    
    if (timeDiff <= 0) {
      return "Ended";
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  }

  /**
   * Check if a tournament is ending soon (within 1 hour)
   * @param {Date|string} endTime - The end time to check
   * @returns {boolean} True if ending within 1 hour
   */
  static isEndingSoon(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const timeDiff = end - now;
    
    // Consider "ending soon" if less than 1 hour remaining
    return timeDiff > 0 && timeDiff <= (60 * 60 * 1000);
  }

  /**
   * Get tournament status based on start and end times
   * @param {Date|string} startTime - Tournament start time
   * @param {Date|string} endTime - Tournament end time
   * @returns {string} Tournament status: 'Scheduled', 'Active', or 'Ended'
   */
  static getTournamentStatus(startTime, endTime) {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) {
      return "Scheduled";
    } else if (now >= start && now < end) {
      return "Active";
    } else {
      return "Ended";
    }
  }

  /**
   * Format a date for display in tournament cards
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  static formatTournamentDate(date) {
    return new Date(date).toLocaleDateString();
  }

  /**
   * Format a date and time for form inputs
   * @param {Date} date - Date to format
   * @returns {object} Object with date and time strings for HTML inputs
   */
  static formatForInput(date) {
    const isoString = date.toISOString();
    return {
      date: isoString.split('T')[0],
      time: isoString.split('T')[1].slice(0, 5)
    };
  }

  /**
   * Create a date from form input values
   * @param {string} dateString - Date string from date input
   * @param {string} timeString - Time string from time input  
   * @returns {Date} Combined date object
   */
  static createFromInput(dateString, timeString) {
    return new Date(`${dateString}T${timeString}`);
  }

  /**
   * Add duration to a date using preset values
   * @param {Date} startDate - Starting date
   * @param {string} preset - Duration preset ('1hour', '1day', etc.)
   * @param {object} presets - Duration presets object
   * @returns {Date} End date
   */
  static addPresetDuration(startDate, preset, presets) {
    const duration = presets[preset];
    if (!duration) {
      return startDate;
    }
    
    return new Date(startDate.getTime() + duration);
  }

  /**
   * Validate that end time is after start time
   * @param {Date|string} startTime - Start time
   * @param {Date|string} endTime - End time
   * @returns {boolean} True if end time is after start time
   */
  static isValidTimeRange(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return end > start;
  }

  /**
   * Validate that start time is in the future
   * @param {Date|string} startTime - Start time to validate
   * @returns {boolean} True if start time is in the future
   */
  static isValidFutureTime(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    return start > now;
  }

  /**
   * Get current timestamp in ISO format
   * @returns {string} Current timestamp
   */
  static getCurrentTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Sleep/delay utility for async operations
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
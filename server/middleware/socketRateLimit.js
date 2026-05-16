/**
 * Rate limiting for Socket.io events to prevent spam/DoS
 */

const logger = require('../utils/logger');

class SocketRateLimiter {
  constructor() {
    // Store: socketId -> { eventName -> [timestamps] }
    this.requests = new Map();
    
    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   * @param {string} socketId - Socket ID
   * @param {string} eventName - Event name
   * @param {number} maxRequests - Max requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} - True if allowed, false if rate limited
   */
  isAllowed(socketId, eventName, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const key = `${socketId}:${eventName}`;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const timestamps = this.requests.get(key);
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
    
    // Check if limit exceeded
    if (validTimestamps.length >= maxRequests) {
      logger.warn(`Socket rate limit exceeded: ${socketId} - ${eventName}`);
      return false;
    }
    
    // Add current timestamp
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    
    return true;
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(ts => now - ts < maxAge);
      
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
    
    logger.debug(`Socket rate limiter cleanup: ${this.requests.size} active entries`);
  }

  /**
   * Clear all entries for a socket (on disconnect)
   */
  clear(socketId) {
    for (const key of this.requests.keys()) {
      if (key.startsWith(socketId)) {
        this.requests.delete(key);
      }
    }
  }
}

module.exports = new SocketRateLimiter();

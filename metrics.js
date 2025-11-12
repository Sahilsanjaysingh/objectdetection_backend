/**
 * 📈 metrics.js
 * Lightweight in-memory performance tracker.
 * Stores the last API response time and optional timestamp for debugging.
 */

const metrics = {
  lastResponseTimeMs: null,
  lastUpdatedAt: null,

  /**
   * Updates the last response time in milliseconds.
   * @param {number} ms - Response duration in milliseconds
   */
  setLastResponseTime(ms) {
    this.lastResponseTimeMs = ms;
    this.lastUpdatedAt = new Date();
    console.log(`⚡ Response time recorded: ${ms}ms`);
  },

  /**
   * Retrieves the most recent response time (ms).
   * @returns {number|null}
   */
  getLastResponseTime() {
    return this.lastResponseTimeMs;
  },

  /**
   * Retrieves the timestamp of the last response metric.
   * @returns {string|null}
   */
  getLastUpdatedAt() {
    return this.lastUpdatedAt;
  },
};

export default metrics;

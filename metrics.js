const metrics = {
  lastResponseTimeMs: null,
  setLastResponseTime(ms) {
    this.lastResponseTimeMs = ms;
  },
  getLastResponseTime() {
    return this.lastResponseTimeMs;
  }
};

module.exports = metrics;

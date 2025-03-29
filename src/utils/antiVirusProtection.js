/**
 * Anti-virus protection middleware
 * Detects and handles requests from automated scanners
 */

/**
 * Check if a request is likely from an automated scanner
 * @param {Object} req - Express request object
 * @returns {boolean} - Whether the request is likely from a scanner
 */
const isAutomatedScanner = (req) => {
  // Check User-Agent for common scanner patterns
  const userAgent = req.get('User-Agent') || '';
  const scannerPatterns = [
    'scanner', 'crawl', 'bot', 'spider', 'virus', 'security', 
    'check', 'scan', 'antivirus', 'protection'
  ];
  
  const lowerUserAgent = userAgent.toLowerCase();
  return scannerPatterns.some(pattern => lowerUserAgent.includes(pattern));
};

/**
 * Middleware to handle requests from automated scanners
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const antiVirusProtection = (req, res, next) => {
  // Add a flag to the request object indicating if it's from a scanner
  req.isAutomatedScanner = isAutomatedScanner(req);
  
  // Continue processing the request
  next();
};

module.exports = {
  antiVirusProtection,
  isAutomatedScanner
};

// Logger utility for consistent logging across the application

// Log types with their emoji prefixes
const LOG_TYPES = {
  TIME: '⏱️',
  DATA: '📊',
  ERROR: '❌',
  INFO: '📌',
  DEBUG: '🔍',
  WEATHER: '☁️',
  MAP: '🗺️',
  UI: '🖥️',
}

/**
 * Create formatted log messages with consistent styling
 * @param type The type of log (TIME, DATA, ERROR, etc.)
 * @param source The source file or component generating the log
 * @param message The main message to log
 * @param data Optional data object to include in the log
 */
export function createLog(
  type: keyof typeof LOG_TYPES,
  source: string,
  message: string,
  data?: any
) {
  const prefix = LOG_TYPES[type];
  const sourceInfo = source ? `${source}:` : '';
  
  if (data) {
    console.log(`${prefix} ${sourceInfo} ${message}`, data);
  } else {
    console.log(`${prefix} ${sourceInfo} ${message}`);
  }
}

// Specialized logging functions for common use cases
export const logTime = (source: string, message: string, data?: any) => 
  createLog('TIME', source, message, data);

export const logData = (source: string, message: string, data?: any) => 
  createLog('DATA', source, message, data);

export const logError = (source: string, message: string, data?: any) => 
  createLog('ERROR', source, message, data);

export const logInfo = (source: string, message: string, data?: any) => 
  createLog('INFO', source, message, data);

export const logDebug = (source: string, message: string, data?: any) => 
  createLog('DEBUG', source, message, data); 
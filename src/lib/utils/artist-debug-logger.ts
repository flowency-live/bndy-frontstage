// src/lib/utils/artist-debug-logger.ts
// Logging and debugging tools to understand current data issues
// Provides comprehensive logging for artist data problems

import { Artist, Event } from "@/lib/types";

export interface DebugLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: 'api' | 'validation' | 'data' | 'performance';
  message: string;
  data?: any;
}

class ArtistDebugLogger {
  private logs: DebugLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs
  private isEnabled = true;

  constructor() {
    // Enable debug logging in development
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     typeof window !== 'undefined' && window.location.hostname === 'localhost';
  }

  private addLog(level: DebugLogEntry['level'], category: DebugLogEntry['category'], message: string, data?: any) {
    if (!this.isEnabled) return;

    const entry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with appropriate styling
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }[level];

    const categoryTag = `[${category.toUpperCase()}]`;
    const fullMessage = `${emoji} ${categoryTag} ${message}`;

    switch (level) {
      case 'info':
        console.log(fullMessage, data || '');
        break;
      case 'warn':
        console.warn(fullMessage, data || '');
        break;
      case 'error':
        console.error(fullMessage, data || '');
        break;
    }
  }

  // API logging methods
  logApiRequest(endpoint: string, params?: any) {
    this.addLog('info', 'api', `API Request: ${endpoint}`, params);
  }

  logApiResponse(endpoint: string, status: number, data?: any) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.addLog(level, 'api', `API Response: ${endpoint} (${status})`, data);
  }

  logApiError(endpoint: string, error: any) {
    this.addLog('error', 'api', `API Error: ${endpoint}`, error);
  }

  // Data validation logging
  logValidationSuccess(type: 'artist' | 'event', id: string, name?: string) {
    this.addLog('info', 'validation', `${type} validation passed: ${name || id}`);
  }

  logValidationFailure(type: 'artist' | 'event', id: string, reason: string, data?: any) {
    this.addLog('error', 'validation', `${type} validation failed for ${id}: ${reason}`, data);
  }

  // Data structure logging
  logDataStructureIssue(type: 'artist' | 'event', issue: string, data: any) {
    this.addLog('warn', 'data', `Data structure issue in ${type}: ${issue}`, data);
  }

  logLegacyFieldDetected(type: 'artist' | 'event', field: string, value: any) {
    this.addLog('warn', 'data', `Legacy field detected in ${type}: ${field}`, value);
  }

  logMissingRequiredField(type: 'artist' | 'event', field: string, data: any) {
    this.addLog('error', 'data', `Missing required field in ${type}: ${field}`, data);
  }

  // Performance logging
  logPerformanceMetric(operation: string, duration: number, details?: any) {
    const level = duration > 2000 ? 'warn' : 'info'; // Warn if over 2 seconds
    this.addLog(level, 'performance', `${operation} took ${duration}ms`, details);
  }

  // Comprehensive artist analysis
  analyzeArtistData(artist: any): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    this.addLog('info', 'data', `Analyzing artist data for: ${artist?.name || 'Unknown'}`);

    if (!artist) {
      issues.push('Artist data is null or undefined');
      return { isValid: false, issues, warnings, suggestions };
    }

    // Check required fields
    if (!artist.id) issues.push('Missing required field: id');
    if (!artist.name) issues.push('Missing required field: name');

    // Check artist_type field (requirement: no "Band" entity)
    if (artist.artist_type !== undefined) {
      const validTypes = ['band', 'solo', 'duo', 'group', 'collective'];
      if (!validTypes.includes(artist.artist_type)) {
        issues.push(`Invalid artist_type: ${artist.artist_type}. Must be one of: ${validTypes.join(', ')}`);
      }
    } else {
      suggestions.push('Consider adding artist_type field to distinguish between bands, solo artists, etc.');
    }

    // Check for legacy fields
    const legacyFields = ['websiteUrl', 'facebookUrl', 'instagramUrl', 'spotifyUrl'];
    legacyFields.forEach(field => {
      if (artist[field]) {
        warnings.push(`Legacy field detected: ${field}. Should be migrated to socialMediaURLs array`);
        this.logLegacyFieldDetected('artist', field, artist[field]);
      }
    });

    // Check social media URLs structure
    if (artist.socialMediaURLs) {
      if (!Array.isArray(artist.socialMediaURLs)) {
        issues.push('socialMediaURLs must be an array');
      } else {
        artist.socialMediaURLs.forEach((social: any, index: number) => {
          if (!social.platform || !social.url) {
            issues.push(`Invalid social media URL at index ${index}: missing platform or url`);
          }
        });
      }
    }

    // Check genres structure
    if (artist.genres && !Array.isArray(artist.genres)) {
      issues.push('genres must be an array');
    }

    // Performance suggestions
    if (artist.profileImageUrl && !artist.profileImageUrl.includes('optimized')) {
      suggestions.push('Consider using optimized images for better performance');
    }

    const isValid = issues.length === 0;
    
    this.addLog(isValid ? 'info' : 'error', 'validation', 
      `Artist analysis complete for ${artist.name}: ${isValid ? 'VALID' : 'INVALID'}`, 
      { issues, warnings, suggestions }
    );

    return { isValid, issues, warnings, suggestions };
  }

  // Comprehensive event analysis
  analyzeEventData(event: any): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    this.addLog('info', 'data', `Analyzing event data for: ${event?.name || 'Unknown'}`);

    if (!event) {
      issues.push('Event data is null or undefined');
      return { isValid: false, issues, warnings, suggestions };
    }

    // Check required fields
    const requiredFields = ['id', 'name', 'date', 'startTime', 'venueId', 'venueName'];
    requiredFields.forEach(field => {
      if (!event[field]) {
        issues.push(`Missing required field: ${field}`);
        this.logMissingRequiredField('event', field, event);
      }
    });

    // Check artistIds array
    if (!Array.isArray(event.artistIds)) {
      issues.push('artistIds must be an array');
    } else if (event.artistIds.length === 0) {
      warnings.push('Event has no associated artists');
    }

    // Check location object
    if (!event.location) {
      issues.push('Missing location object');
    } else {
      if (typeof event.location.lat !== 'number') issues.push('location.lat must be a number');
      if (typeof event.location.lng !== 'number') issues.push('location.lng must be a number');
    }

    // Check date format
    if (event.date && isNaN(Date.parse(event.date))) {
      issues.push('Invalid date format');
    }

    // Check time format
    if (event.startTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(event.startTime)) {
      warnings.push('startTime format should be HH:MM or HH:MM:SS');
    }

    // Suggestions for better data
    if (!event.description) {
      suggestions.push('Consider adding event description for better user experience');
    }

    if (!event.imageUrl) {
      suggestions.push('Consider adding event image for better visual appeal');
    }

    const isValid = issues.length === 0;
    
    this.addLog(isValid ? 'info' : 'error', 'validation', 
      `Event analysis complete for ${event.name}: ${isValid ? 'VALID' : 'INVALID'}`, 
      { issues, warnings, suggestions }
    );

    return { isValid, issues, warnings, suggestions };
  }

  // Get logs for debugging
  getLogs(category?: DebugLogEntry['category'], level?: DebugLogEntry['level']): DebugLogEntry[] {
    let filteredLogs = this.logs;

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    return filteredLogs;
  }

  // Export logs for analysis
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.addLog('info', 'data', 'Debug logs cleared');
  }

  // Generate summary report
  generateSummaryReport(): {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    categories: Record<string, number>;
    recentErrors: DebugLogEntry[];
  } {
    const errorCount = this.logs.filter(log => log.level === 'error').length;
    const warningCount = this.logs.filter(log => log.level === 'warn').length;
    
    const categories = this.logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = this.logs
      .filter(log => log.level === 'error')
      .slice(-10); // Last 10 errors

    return {
      totalLogs: this.logs.length,
      errorCount,
      warningCount,
      categories,
      recentErrors
    };
  }
}

// Create singleton instance
export const artistDebugLogger = new ArtistDebugLogger();

// Export for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).artistDebugLogger = artistDebugLogger;
}

// Utility functions for easy access
export const logApiRequest = (endpoint: string, params?: any) => 
  artistDebugLogger.logApiRequest(endpoint, params);

export const logApiResponse = (endpoint: string, status: number, data?: any) => 
  artistDebugLogger.logApiResponse(endpoint, status, data);

export const logApiError = (endpoint: string, error: any) => 
  artistDebugLogger.logApiError(endpoint, error);

export const analyzeArtistData = (artist: any) => 
  artistDebugLogger.analyzeArtistData(artist);

export const analyzeEventData = (event: any) => 
  artistDebugLogger.analyzeEventData(event);

export const logPerformanceMetric = (operation: string, duration: number, details?: any) => 
  artistDebugLogger.logPerformanceMetric(operation, duration, details);
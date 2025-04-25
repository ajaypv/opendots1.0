'use client';

/**
 * Utility functions to collect user platform, browser, and location information
 */

export async function getUserInfo() {
  // Get platform and browser info
  const platform = getPlatformInfo();
  const browser = getBrowserInfo();
  
  // Get location info (with user permission)
  let location = 'unknown';
  try {
    const locationData = await getLocationInfo();
    if (locationData) {
      location = `${locationData.city}, ${locationData.country}`;
    }
  } catch (error) {
    console.error('Error getting location:', error);
  }
  
  return {
    platform,
    browser,
    location
  };
}

function getPlatformInfo() {
  const ua = navigator.userAgent;
  
  if (/Android/i.test(ua)) return 'Mobile - Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'Mobile - iOS';
  if (/Windows/i.test(ua)) return 'Desktop - Windows';
  if (/Mac/i.test(ua)) return 'Desktop - Mac';
  if (/Linux/i.test(ua)) return 'Desktop - Linux';
  
  return 'Unknown Platform';
}

function getBrowserInfo() {
  const ua = navigator.userAgent;
  
  if (/Chrome/i.test(ua) && !/Chromium|Edge/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Edge/i.test(ua)) return 'Edge';
  if (/MSIE|Trident/i.test(ua)) return 'Internet Explorer';
  if (/Opera|OPR/i.test(ua)) return 'Opera';
  
  return 'Unknown Browser';
}

async function getLocationInfo() {
  try {
    // Using a free IP geolocation API
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) throw new Error('Failed to fetch location data');
    
    const data = await response.json();
    return {
      city: data.city || 'Unknown',
      country: data.country_name || 'Unknown'
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
} 
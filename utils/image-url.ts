/**
 * Generates a properly formatted URL for images stored in Cloudflare R2
 */
export function getImageUrl(key: string, options?: { width?: number, height?: number }): string {
  // Base URL from environment or default to the application URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://opendots-alphav1.pages.dev';
  
  // Format the image URL
  let url = `${baseUrl}/images/${key}`;
  
  // Add any transformation options as query parameters
  if (options) {
    const params = new URLSearchParams();
    
    if (options.width) {
      params.append('width', options.width.toString());
    }
    
    if (options.height) {
      params.append('height', options.height.toString());
    }
    
    const paramsString = params.toString();
    if (paramsString) {
      url += `?${paramsString}`;
    }
  }
  
  return url;
}

/**
 * Generates a profile avatar URL with appropriate sizing
 */
export function getProfileAvatarUrl(key: string, size: number = 128): string {
  return getImageUrl(key, { width: size, height: size });
}

/**
 * Creates a fallback avatar based on initials if no image is available
 */
export function getInitialAvatar(name: string | null | undefined, email: string | null | undefined): string {
  // Get the first letter of name, or email, or use a default
  const initial = name?.charAt(0)?.toUpperCase() || 
                 email?.charAt(0)?.toUpperCase() || 
                 '?';
                 
  // Return SVG avatar for fallback
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23718096'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='50' fill='white' text-anchor='middle' dominant-baseline='central'%3E${initial}%3C/text%3E%3C/svg%3E`;
} 
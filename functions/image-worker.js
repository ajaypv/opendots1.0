/**
 * Cloudflare Worker for serving R2 images with optional transformations
 * 
 * Route pattern: /images/:userId/:imageName
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Paths will be of the form /images/{userId}/{imageName}
    const imagePathMatch = path.match(/^\/images\/([^\/]+)\/([^\/]+)$/);
    
    if (!imagePathMatch) {
      return new Response('Image not found', { status: 404 });
    }
    
    const [, userId, imageName] = imagePathMatch;
    const key = `${userId}/${imageName}`;
    
    try {
      // Fetch the image from R2
      const object = await env.PROFILE_IMAGES.get(key);
      
      if (!object) {
        return new Response('Image not found', { status: 404 });
      }
      
      // Get image data
      const data = await object.arrayBuffer();
      
      // Parse query params for any transformations
      const width = parseInt(url.searchParams.get('width') || '0');
      const height = parseInt(url.searchParams.get('height') || '0');
      
      // Set up response headers
      const headers = new Headers();
      
      // Set content type based on the object's metadata or file extension
      const contentType = object.httpMetadata?.contentType || 
        key.endsWith('.jpg') || key.endsWith('.jpeg') ? 'image/jpeg' :
        key.endsWith('.png') ? 'image/png' :
        key.endsWith('.gif') ? 'image/gif' :
        key.endsWith('.webp') ? 'image/webp' :
        'application/octet-stream';
      
      headers.set('Content-Type', contentType);
      
      // Set cache control headers
      headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      headers.set('ETag', object.httpEtag);
      
      // Set security headers
      headers.set('Access-Control-Allow-Origin', '*'); // CORS
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // If there are no transformations, return the image directly
      if (!width && !height) {
        return new Response(data, { headers });
      }
      
      // If transformations are requested but not available, just return the original
      // In a full implementation, you would use Cloudflare Image Resizing API here
      return new Response(data, { headers });
      
    } catch (error) {
      console.error(`Error serving image: ${error}`);
      return new Response('Error serving image', { status: 500 });
    }
  }
}; 
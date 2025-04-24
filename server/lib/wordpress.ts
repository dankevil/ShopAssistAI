import fetch from 'node-fetch';
import { Buffer } from 'buffer';

interface WordPressCredentials {
  username: string;
  applicationPassword?: string; // Preferred
  password?: string; // Fallback, less secure
}

export class WordPressService {
  private apiUrl: string;
  private credentials: WordPressCredentials;
  private authHeader: string;

  constructor(domain: string, credentials: WordPressCredentials) {
    // Normalize domain to ensure it includes protocol and ends with /wp-json
    let normalizedDomain = domain.trim();
    if (!normalizedDomain.startsWith('http://') && !normalizedDomain.startsWith('https://')) {
      // Assume https if no protocol provided
      normalizedDomain = 'https://' + normalizedDomain;
    }
    // Remove trailing slash if present
    if (normalizedDomain.endsWith('/')) {
        normalizedDomain = normalizedDomain.slice(0, -1);
    }
    
    this.apiUrl = `${normalizedDomain}/wp-json`;
    this.credentials = credentials;

    // Prepare Basic Auth header
    const username = this.credentials.username;
    const password = this.credentials.applicationPassword || this.credentials.password; // Prefer application password
    if (!username || !password) {
      throw new Error('WordPress username and application password (or regular password) are required.');
    }
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
    this.authHeader = `Basic ${basicAuth}`;
  }

  private async makeRequest<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Authorization': this.authHeader,
    };

    try {
      console.log(`Making WP Request: ${method} ${url}`); // Basic logging
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        let errorText = '';
        try {
            errorText = await response.text();
        } catch (e) {
            // Ignore if text cannot be read
        }
        console.error(`WordPress API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`WordPress API error: ${response.status} ${response.statusText}. Check credentials and API availability.`);
      }

      // Handle potential empty response body for certain status codes (e.g., 204 No Content)
      if (response.status === 204) {
          return {} as T; // Or return null/undefined based on expected behavior
      }

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
          return await response.json() as T;
      } else {
          console.warn(`Unexpected content type received from ${url}: ${contentType}`);
          // Handle non-JSON responses if necessary, e.g., return text or throw error
          return await response.text() as unknown as T; 
      }

    } catch (error: any) {
      console.error(`Error making WordPress API request to ${endpoint}:`, error);
      // Rethrow or handle specific errors (e.g., network errors, auth errors)
       if (error.message.includes('WordPress API error')) {
            throw error; // Re-throw API errors directly
        } else {
            throw new Error(`Network error or failed request to WordPress site: ${error.message}`);
        }
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // Attempt to fetch basic site info
      await this.makeRequest('/wp/v2/');
      return true;
    } catch (error) {
      console.error("WordPress connection verification failed:", error);
      return false;
    }
  }

  async getSiteInfo(): Promise<any> {
    // Fetches basic site information from the root endpoint
    return this.makeRequest<any>('/wp/v2/'); 
  }

  // Fetch all posts, handling pagination
  async fetchAllPosts(perPage: number = 100): Promise<any[]> {
    let allPosts: any[] = [];
    let page = 1;
    let totalPages = 1; // Assume at least one page

    try {
        do {
            const response = await fetch(`${this.apiUrl}/wp/v2/posts?per_page=${perPage}&page=${page}&_embed`, {
                headers: { 'Authorization': this.authHeader }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch posts page ${page}: ${response.statusText}`);
            }

            // Get total pages from headers (X-WP-TotalPages)
            const totalPagesHeader = response.headers.get('X-WP-TotalPages');
            if (totalPagesHeader) {
                totalPages = parseInt(totalPagesHeader, 10);
            } else if (page === 1) {
                // If header missing on first page, assume only one page unless data suggests otherwise
                 totalPages = 1;
            }
            
            const posts = await response.json();
            if (Array.isArray(posts) && posts.length > 0) {
                 allPosts = allPosts.concat(posts);
                 if (posts.length < perPage) break; // Exit if last page had fewer items than perPage
            } else {
                 break; // Exit if no posts returned or not an array
            }

            page++;
        } while (page <= totalPages);
    
        return allPosts;

    } catch (error) {
        console.error('Error fetching all WordPress posts:', error);
        throw error; // Re-throw after logging
    }
  }
  
  // Fetch all pages, handling pagination
  async fetchAllPages(perPage: number = 100): Promise<any[]> {
      let allPages: any[] = [];
      let page = 1;
      let totalPages = 1;

      try {
          do {
              const response = await fetch(`${this.apiUrl}/wp/v2/pages?per_page=${perPage}&page=${page}&_embed`, {
                  headers: { 'Authorization': this.authHeader }
              });

              if (!response.ok) {
                  throw new Error(`Failed to fetch pages page ${page}: ${response.statusText}`);
              }

              const totalPagesHeader = response.headers.get('X-WP-TotalPages');
               if (totalPagesHeader) {
                  totalPages = parseInt(totalPagesHeader, 10);
              } else if (page === 1) {
                  totalPages = 1;
              }

              const pages = await response.json();
               if (Array.isArray(pages) && pages.length > 0) {
                  allPages = allPages.concat(pages);
                  if (pages.length < perPage) break; 
              } else {
                  break; 
              }
              page++;
          } while (page <= totalPages);
          return allPages;
      } catch (error) {
          console.error('Error fetching all WordPress pages:', error);
          throw error;
      }
  }
  
  // Fetch all categories, handling pagination
  async fetchAllCategories(perPage: number = 100): Promise<any[]> {
      let allCategories: any[] = [];
      let page = 1;
      let totalPages = 1;
      
      try {
          do {
               const response = await fetch(`${this.apiUrl}/wp/v2/categories?per_page=${perPage}&page=${page}`, {
                  headers: { 'Authorization': this.authHeader }
              });

              if (!response.ok) {
                  throw new Error(`Failed to fetch categories page ${page}: ${response.statusText}`);
              }
              
              const totalPagesHeader = response.headers.get('X-WP-TotalPages');
              if (totalPagesHeader) {
                  totalPages = parseInt(totalPagesHeader, 10);
              } else if (page === 1) {
                  totalPages = 1;
              }

              const categories = await response.json();
              if (Array.isArray(categories) && categories.length > 0) {
                  allCategories = allCategories.concat(categories);
                  if (categories.length < perPage) break; 
              } else {
                  break; 
              }
              page++;
          } while (page <= totalPages);
           return allCategories;
      } catch (error) {
          console.error('Error fetching all WordPress categories:', error);
          throw error;
      }
  }
  
  // Fetch all WooCommerce products, handling pagination (if WooCommerce is active)
  async fetchAllWooCommerceProducts(perPage: number = 100): Promise<any[] | null> {
      let allProducts: any[] = [];
      let page = 1;
      let totalPages = 1;
      const wcApiUrl = `${this.apiUrl}/wc/v3/products`; // WooCommerce API endpoint

      try {
          // First, check if the endpoint exists (basic check for WooCommerce)
          const checkResponse = await fetch(wcApiUrl, { method: 'OPTIONS', headers: { 'Authorization': this.authHeader } });
          if (checkResponse.status === 404) {
              console.log("WooCommerce API endpoint not found. Skipping product fetch.");
              return null; // Indicate WooCommerce not detected or API unavailable
          }
          // Handle other non-OK statuses if needed, e.g., 401 Unauthorized
          if (!checkResponse.ok && checkResponse.status !== 404) {
               console.warn(`WooCommerce API check returned status ${checkResponse.status}. Products might not be fetchable.`);
               // Optionally throw an error or return null based on desired behavior
               // For now, let's try fetching anyway but be aware it might fail.
          }


          do {
              const response = await fetch(`${wcApiUrl}?per_page=${perPage}&page=${page}`, {
                  headers: { 'Authorization': this.authHeader }
              });

              // Handle 404 specifically again in case OPTIONS check passed but GET fails
              if (response.status === 404) {
                   console.log("WooCommerce API endpoint not found during GET request. Skipping product fetch.");
                   return null; 
              }
              
              if (!response.ok) {
                  throw new Error(`Failed to fetch WooCommerce products page ${page}: ${response.statusText}`);
              }

              const totalPagesHeader = response.headers.get('X-WP-TotalPages');
              if (totalPagesHeader) {
                  totalPages = parseInt(totalPagesHeader, 10);
              } else if (page === 1) {
                  totalPages = 1;
              }
              
              const products = await response.json();
               if (Array.isArray(products) && products.length > 0) {
                  allProducts = allProducts.concat(products);
                  if (products.length < perPage) break; 
              } else {
                  break; 
              }
              page++;
          } while (page <= totalPages);
          
          return allProducts;

      } catch (error: any) {
          // Handle specific errors, e.g., if WC is not installed, API might return 404 or similar
          if (error.message && error.message.includes('404')) {
             console.log("WooCommerce API endpoint not found or inaccessible. Skipping product fetch.");
             return null; // Return null to indicate WC products couldn't be fetched
          }
          console.error('Error fetching all WooCommerce products:', error);
          throw error; // Re-throw other errors
      }
  }
} 
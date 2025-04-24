import { apiRequest } from \"./apiRequest\";

interface ConnectWordPressPayload {
  domain: string;
  username: string;
  applicationPassword: string;
}

// Connect a WordPress store
export const connectWordPress = async (payload: ConnectWordPressPayload) => {
  try {
    const response = await apiRequest(\'POST\', \'/api/wordpress/connect\', payload);
    // Assuming backend returns { message: string, store: Store } on success
    const data = await response.json(); 
    if (!response.ok) {
      // Throw an error with the message from the backend if available
      throw new Error(data.message || `WordPress connection failed: ${response.statusText}`);
    }
    return data; // Contains { message, store }
  } catch (error) {
    console.error(\'Error connecting to WordPress:\', error);
    // Re-throw the error so the mutation hook can catch it
    throw error;
  }
};

// Trigger manual data sync for a WordPress store
export const syncWordPressData = async (storeId: number) => {
  try {
    const response = await apiRequest(\'POST\', \'/api/wordpress/sync\', { storeId });
    // Assuming backend returns { message: string, errors?: string[] } 
    const data = await response.json();
     if (!response.ok && response.status !== 207) { // 207 is Multi-Status for partial success
      throw new Error(data.message || `WordPress sync failed: ${response.statusText}`);
    }
    // Return data which might include success message or errors list
    return data; 
  } catch (error) {
    console.error(\'Error syncing WordPress data:\', error);
    throw error;
  }
}; 
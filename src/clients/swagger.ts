import axios from 'axios';
import consola from 'consola';
import { ApiConfig } from '../types';

export async function fetchSwaggerData(config: ApiConfig): Promise<any> {
  try {
    const apiUrl = config.serverUrl;

    // Log debug information if enabled
    if (process.env.DEBUG) {
      consola.debug(`Fetching Swagger data from: ${apiUrl}`);
    }

    // Make the API request
    const response = await axios.get(apiUrl);

    return response.data;
  } catch (error: any) {
    consola.error('Failed to fetch data from Swagger:', error.message);
    throw error;
  }
}

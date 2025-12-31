/**
 * Countries Now API - Free API for countries and cities
 * Documentation: https://countriesnow.space/api/v0.1/docs
 */

export interface Country {
  name: string;
  iso2?: string;
  iso3?: string;
}

export interface City {
  name: string;
}

/**
 * API service for fetching countries and cities
 * Uses Countries Now API (free, no API key required)
 */
export const countriesApi = {
  /**
   * Get all countries
   * Returns list of countries with their names
   */
  getCountries: async (): Promise<Country[]> => {
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries');
      const data = await response.json();
      
      if (data.error === false && Array.isArray(data.data)) {
        return data.data.map((country: any) => ({
          name: country.country,
          iso2: country.iso2,
          iso3: country.iso3,
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  },

  /**
   * Get cities for a specific country
   * @param countryName - Name of the country (e.g., "Morocco", "France")
   */
  getCities: async (countryName: string): Promise<string[]> => {
    if (!countryName || !countryName.trim()) {
      return [];
    }

    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country: countryName }),
      });
      
      const data = await response.json();
      
      if (data.error === false && Array.isArray(data.data)) {
        return data.data.sort(); // Sort cities alphabetically
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  },
};


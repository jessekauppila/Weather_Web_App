export async function fetchStations() {
    try {
      //console.log('🏔️ Fetching stations data...');
      const stationsResponse = await fetch('/api/getStations');
      
      if (!stationsResponse.ok) {
        throw new Error('Failed to fetch stations');
      }
      
      const stations = await stationsResponse.json();
      //console.log('📍 Stations data:', stations);
      return stations;
      
    } catch (error) {
      console.error('Error fetching stations:', error);
      throw error;
    }
  }
//src\lib\services\places-service.ts
export async function searchVenueWithIncreasingRadius(
  venueName: string
): Promise<google.maps.places.PlaceResult[]> {
  // Create a dummy div for the Places service - we don't need a real map!
  const dummyDiv = document.createElement('div');
  const service = new google.maps.places.PlacesService(dummyDiv);
  
  try {
    const results = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
      service.textSearch({
        query: venueName,
        type: 'establishment'
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(status);
        }
      });
    });

    return results;
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}
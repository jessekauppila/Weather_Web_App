interface Observation {
    station_name: string;
    elevation: number;
    date_time: string;
    air_temp: number | null;
    // ... add other observation fields as needed
  }
  
  interface FormattedObservation {
    Station: string;
    Elevation: string;
    Day: string;
    Hour: string;
    'Air Temp': string;
    // ... add other formatted fields as needed
  }
  
  export default function hourWxTableDataFiltered(data: Record<string, Observation[]>) {
    // Flatten the nested structure into a single array
    const flattenedData: FormattedObservation[] = Object.values(data)
      .flat()
      .map(obs => {
        const date = new Date(obs.date_time);
        
        return {
          Station: obs.station_name,
          Elevation: `${obs.elevation} ft`,
          Day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          Hour: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          'Air Temp': obs.air_temp ? `${Math.round(obs.air_temp)}°F` : '-',
          // ... map other fields as needed
        };
      })
      .sort((a, b) => {
        // Sort by date/time first, then by station name
        const dateA = new Date(`${a.Day} ${a.Hour}`);
        const dateB = new Date(`${b.Day} ${b.Hour}`);
        const dateCompare = dateA.getTime() - dateB.getTime();
        return dateCompare || a.Station.localeCompare(b.Station);
      });
  
      console.log('flattenedData in hourWxTableDataFiltered:', flattenedData);
    return {
      data: flattenedData,
      title: 'Hourly Observations'
    };
  }
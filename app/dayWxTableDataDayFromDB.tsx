import moment from 'moment-timezone';
import {
  formatAveragesData,
  UnitConversions,
  UnitConversionType,
} from '../utils/formatAveragesFromDB';

function wxTableDataDayFromDB(
  observationsData: Array<Record<string, any>>,
  units: Array<Record<string, string>>
): {
  data: Array<{ [key: string]: number | string }>;
  title: string;
} {
  console.log(
    'observationsData from wxTableDataDayFromDB:',
    observationsData
  );

  // Group observations by station
  const groupedObservations = observationsData.reduce((acc, obs) => {
    if (!acc[obs.stid]) {
      acc[obs.stid] = [];
    }
    acc[obs.stid].push(obs);
    return acc;
  }, {} as Record<string, Array<Record<string, any>>>);

  // Convert units array to a more usable format
  const unitConversions = units.reduce((acc, unit) => {
    acc[unit.measurement] = unit.unit;
    return acc;
  }, {} as Record<string, string>);

  const processedData = Object.entries(groupedObservations).map(
    ([stid, stationObs]) => {
      const averages: { [key: string]: number | string } = {
        Stid: stid,
        Station: stationObs[0].station_name,
        Latitude: stationObs[0].latitude,
        Longitude: stationObs[0].longitude,
      };

      // Process each measurement type
      for (const [key, unit] of Object.entries(unitConversions)) {
        if (key === 'date_time') continue;

        const values = stationObs
          .map((obs) => Number(obs[key]))
          .filter((val) => !isNaN(val));

        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          const avg = sum / values.length;
          const max = Math.max(...values);
          const min = Math.min(...values);

          averages[
            `Cur ${key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())}`
          ] = Number(avg.toFixed(2));
          averages[
            `${key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())} Max`
          ] = Number(max.toFixed(2));
          averages[
            `${key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())} Min`
          ] = Number(min.toFixed(2));
        } else {
          averages[
            `Cur ${key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())}`
          ] = '-';
          averages[
            `${key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())} Max`
          ] = '-';
          averages[
            `${key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())} Min`
          ] = '-';
        }
      }

      // Process date_time
      const dateTimes = stationObs.map((obs) =>
        moment(obs.date_time)
      );
      averages['Start Date Time'] = dateTimes[0].format(
        'MMM D, YYYY, h:mm a'
      );
      averages['End Date Time'] = dateTimes[
        dateTimes.length - 1
      ].format('MMM D, YYYY, h:mm a');
      averages['Date Time'] = `${dateTimes[0].format(
        'h:mm a'
      )} - ${dateTimes[dateTimes.length - 1].format(
        'h:mm a, MMM D, YYYY'
      )}`;

      return averages;
    }
  );

  // Format the averages with unit labels
  const formattedData = processedData.map((averages) =>
    formatAveragesData(averages, unitConversions as UnitConversions)
  );

  console.log(
    'formattedData from wxTableDataDayFromDB:',
    formattedData
  );

  const title =
    formattedData.length > 0
      ? `Station Data: ${formattedData[0]['Start Date Time']} - ${formattedData[0]['End Date Time']}`
      : 'Station Data';

  return { data: formattedData, title };
}

export default wxTableDataDayFromDB;

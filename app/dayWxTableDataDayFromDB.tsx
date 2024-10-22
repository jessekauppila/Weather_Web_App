import moment from 'moment-timezone';
import {
  formatAveragesData,
  UnitConversions,
  UnitConversionType,
} from '../utils/formatAverages';

function wxTableDataDayFromDB(
  observationsData: Array<Record<string, any>>,
  units: Array<Record<string, string>>
): {
  data: Array<{ [key: string]: number | string }>;
  title: string;
} {
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
      const averages: { [key: string]: number | string } = { stid };

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

          averages[key] = Number(avg.toFixed(2));
          averages[`${key}_max`] = Number(max.toFixed(2));
          averages[`${key}_min`] = Number(min.toFixed(2));
        } else {
          averages[key] = '-';
          averages[`${key}_max`] = '-';
          averages[`${key}_min`] = '-';
        }
      }

      // Process date_time
      const dateTimes = stationObs.map((obs) =>
        moment(obs.date_time)
      );
      averages['start_date_time'] = dateTimes[0].format(
        'MMM D, YYYY, h:mm a'
      );
      averages['end_date_time'] = dateTimes[
        dateTimes.length - 1
      ].format('MMM D, YYYY, h:mm a');

      return averages;
    }
  );

  // Format the averages with unit labels
  const formattedData = processedData.map((averages) =>
    formatAveragesData(averages, unitConversions as UnitConversions)
  );

  console.log('formattedData:', formattedData);

  const title =
    formattedData.length > 0
      ? `Station Data: ${formattedData[0]['start_date_time']} - ${formattedData[0]['end_date_time']}`
      : 'Station Data';

  return { data: formattedData, title };
}

export default wxTableDataDayFromDB;

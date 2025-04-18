// import React from 'react';
// import { regions } from '@/app/config/regions';
// import DayAveragesTable from '../vis/dayWxTable';

// interface RegionTablesProps {
//   observationsDataDay: {
//     data: any[];
//     title: string;
//   } | null;
//   handleStationClick: (stationId: string) => void;
//   tableMode: 'summary' | 'daily';
// }

// function RegionTables({ 
//   observationsDataDay, 
//   handleStationClick, 
//   tableMode 
// }: RegionTablesProps) {
//   if (!observationsDataDay || tableMode !== 'summary') return null;

//   return (
//     <div className="space-y-4">
//       {regions.map(region => {
//         const regionData = {
//           ...observationsDataDay,
//           title: `${region.title} - ${observationsDataDay.title}`,
//           data: observationsDataDay.data.filter(station => 
//             region.stationIds.includes(station.Stid)
//           )
//         };
        
//         if (regionData.data.length === 0) return null;

//         return (
//           <div key={region.id} className="bg-white rounded-lg shadow">
//             <DayAveragesTable 
//               dayAverages={regionData}
//               onStationClick={handleStationClick}
//               mode={tableMode}
//             />
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// export default React.memo(RegionTables); 
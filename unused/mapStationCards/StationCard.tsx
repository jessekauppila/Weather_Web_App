// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import { grey } from '@mui/material/colors';
// import Typography from '@mui/material/Typography';
// import MeasurementCard from './MeasurementCard';
// import './StationCard.css';

// // Importing the visualization components
// import DayAveragesTable from '../../vis/dayWxTable';
// import DayWxSnowGraph from '../../vis/dayWxSnowGraph';
// import HourWxTable from '../../vis/hourWxTable';
// import WxSnowGraph from '../../vis/wxSnowGraph';
// import AccordionWrapper from './AccordionWrapper';

// interface StationCardProps {
//   station: {
//     Station: string;
//     'Cur Air Temp': string;
//     '24h Snow Accumulation': string;
//     'Cur Wind Speed': string;
//     'Elevation': string;
//     'Stid': string;
//     'Air Temp Min': string;
//     'Air Temp Max': string;
//     'Wind Speed Avg': string;
//     'Max Wind Gust': string;
//     'Wind Direction': string;
//     'Total Snow Depth Change': string;
//     'Precip Accum One Hour': string;
//     'Total Snow Depth': string;
//     [key: string]: string;
//   };
//   onStationClick: (stid: string) => void;
//   observationsData: { data: any[]; title: string; } | null;
//   isActive: boolean;
//   onDropdownToggle: (stid: string | null) => void;
//   observationsDataDay: any;
//   observationsDataHour: any;
//   dayAverages: any;
//   filteredObservationsDataHour: any;
//   isMetric: boolean;
//   tableMode: 'summary' | 'daily';
//   stationIds: string[];
// }

// const StationCard = ({ 
//   station, 
//   stationIds, 
//   onStationClick, 
//   observationsData, 
//   observationsDataDay, 
//   observationsDataHour, 
//   isActive, 
//   onDropdownToggle, 
//   filteredObservationsDataHour, 
//   tableMode, 
//   isMetric 
// }: StationCardProps) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [snowAccordionOpen, setSnowAccordionOpen] = useState(false);
//   const [tempAccordionOpen, setTempAccordionOpen] = useState(false);
//   const [windAccordionOpen, setWindAccordionOpen] = useState(false);

//   // Only render if station is in stationIds
//   if (!stationIds.includes(station.Stid)) {
//     return null;
//   }

//   // Filter and format the data for the graphs
//   const stationDataHourFiltered = {
//     data: filteredObservationsDataHour?.data?.filter(
//       (obs: { Station: string }) => obs.Station === station.Station
//     ) || [],
//     title: `Filtered Hourly Data - ${station.Station}`
//   };


//   console.log('filteredObservationsDataHour StationCard', filteredObservationsDataHour);

//   console.log('observationsDataDay StationCard', observationsDataDay);

//   const stationDataHourUnFiltered = {
//     data: observationsDataHour?.data?.filter(
//       (obs: { Station: string }) => obs.Station === station.Station
//     ) || [],
//     title: `Raw Hourly Data - ${station.Station}`
//   };

//   const stationDataForGraph = {
//     data: filteredObservationsDataHour?.data?.filter(
//       (obs: { Station: string }) => obs.Station === station.Station
//     ).map((obs: { 
//       Station: string; 
//       Day: string; 
//       Hour: string; 
//       'Snow Depth'?: string; 
//       'New Snow'?: string;
//       'Air Temp'?: string;
//       'Precip'?: string;
//     }) => ({
//       Date: `${obs.Day} ${obs.Hour}`,
//       'Total Snow Depth': obs['Snow Depth'] || '0 in',
//       '24h Snow Accumulation': obs['New Snow'] || '0 in',
//       'Air Temp Min': obs['Air Temp'],
//       'Air Temp Max': obs['Air Temp'],
//       'Precip Accum One Hour': obs['Precip'] || '0 in'
//     })) || [],
//     title: station.Station
//   };

//   return (
//     <div>
//       <div className="station-card" onClick={() => setIsOpen(true)}>
//         <div className="station-card-header">
//           <h2 className="station-name">{station.Station}</h2>
//         </div>
        
//         <p className="station-elevation">
//           {station.Elevation}
//         </p>

//         <div className="measurement-grid">
//           <MeasurementCard 
//             title="Snow"
//             isOpen={snowAccordionOpen}
//             onToggle={() => setSnowAccordionOpen(!snowAccordionOpen)}
//             metricValue={station['24h Snow Accumulation'].replace(' in', '')}
//             metricUnit=" in"
//             subtitle="Accumulated"
//             station={station}
//           />

//           <MeasurementCard 
//             title="Temp"
//             isOpen={tempAccordionOpen}
//             onToggle={() => setTempAccordionOpen(!tempAccordionOpen)}
//             metricValue={station['Cur Air Temp'].replace(' °F', '')}
//             metricUnit="°F"
//             subtitle="Current"
//             station={station}
//           />

//           <MeasurementCard 
//             title="Wind"
//             isOpen={windAccordionOpen}
//             onToggle={() => setWindAccordionOpen(!windAccordionOpen)}
//             metricValue={station['Cur Wind Speed'].replace(' mph', '')}
//             metricUnit=" mph"
//             subtitle="Current"
//             station={station}
//           />
//         </div>
//       </div>

//       <motion.div
//         className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl"
//         style={{
//           height: "95vh",
//           width: "100%",
//           zIndex: 1000,
//           touchAction: 'none',
//           transformOrigin: "bottom"
//         }}
//         initial={{ y: "100%", scale: 0.9 }}
//         animate={{ 
//           y: isOpen ? "0%" : "100%",
//           scale: isOpen ? 1 : 0.9
//         }}
//         transition={{ 
//           type: "spring", 
//           stiffness: 400,
//           damping: 40,
//           scale: {
//             type: "spring",
//             stiffness: 500,
//             damping: 30
//           }
//         }}
//         drag="y"
//         dragPropagation={false}
//         dragConstraints={{ 
//           top: 0,
//           bottom: window.innerHeight * 0.95
//         }}
//         dragElastic={0.2}
//         dragMomentum={false}
//         onDragEnd={(event, info) => {
//           const currentY = info.point.y;
//           const windowHeight = window.innerHeight;
          
//           // Only close when released past threshold
//           if (currentY > windowHeight * 0.95) {
//             setIsOpen(false);
//           } else if (currentY < windowHeight * 0.05) {
//             setIsOpen(true);
//           }
//         }}
//       >
//         <div className="p-4">
//           <div
//             className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing"
//             onClick={() => setIsOpen(!isOpen)}
//           />
//           <Typography className="text-gray-600 text-sm font-semibold mb-4">
//             {station.Station}
//           </Typography>
          
//           <div className="overflow-auto" style={{ height: 'calc(95vh - 100px)' }}>
//             {station && (
//               <DayAveragesTable 
//                 dayAverages={{ 
//                   data: [station],
//                   title: station.Station
//                 }}
//                 onStationClick={onStationClick}
//                 mode={tableMode}
//               />
//             )}

//           {/* Hourly Snow and Temperature Graph */}
//           {stationDataHourFiltered && (
//             <AccordionWrapper
//               title="Hourly Snow and Temperature Graph"
//               subtitle={station.title}
//               defaultExpanded={false}
//             >
//               <WxSnowGraph 
//                 dayAverages={stationDataHourFiltered}
//                 isHourly={true}
//                 isMetric={isMetric}
//               />
//             </AccordionWrapper>
//           )}

//           {/* Daily Snow and Temperature Graph */}
//           {stationDataForGraph && (
//             <AccordionWrapper
//               title="Daily Snow and Temperature Graph"
//               subtitle={station.title}
//               defaultExpanded={false}
//             >
//               <DayWxSnowGraph 
//                 dayAverages={stationDataForGraph}
//                 isMetric={isMetric}
//               />
//             </AccordionWrapper>
//           )}

//           {/* Filtered Hourly Data Table */}
//             {stationDataHourFiltered && (
//               <HourWxTable 
//                 hourAverages={stationDataHourFiltered} 
//               />
//             )}

//           {/* Raw Hourly Data Table */}
//             {stationDataHourUnFiltered && (
//               <HourWxTable 
//                 hourAverages={stationDataHourUnFiltered} 
//               />
//             )}
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default StationCard; 
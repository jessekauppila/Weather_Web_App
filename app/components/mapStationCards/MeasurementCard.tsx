// import React from "react";
// import {
//   Accordion as MuiAccordion,
//   AccordionSummary,
//   AccordionDetails,
//   Typography,
//   Box
// } from '@mui/material';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// interface MeasurementCardProps {
//   title: string;
//   isOpen: boolean;
//   onToggle: () => void;
//   metricValue: string | null;
//   metricUnit: string;
//   subtitle: string;
//   station: {
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
// }

// const MeasurementCard = ({ 
//   title, 
//   isOpen, 
//   onToggle, 
//   metricValue, 
//   metricUnit, 
//   subtitle, 
//   station 
// }: MeasurementCardProps) => {
//   const renderValue = (value: string, unit: string) => {
//     if (!value || value === '-') {
//       return (
//         <Typography sx={{ fontSize: '0.625rem', color: '#9ca3af' }}>
//           no data
//         </Typography>
//       );
//     }

//     // Special handling for precipitation to round to 3 decimal places
//     let displayValue = value;
//     if (typeof value === 'string' && value.includes('Precip Accum One Hour')) {
//       const numValue = parseFloat(value.replace(` ${unit}`, ''));
//       displayValue = numValue.toFixed(3);
//     } else {
//       displayValue = value.replace(` ${unit}`, '');
//     }

//     return (
//       <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
//         <Typography sx={{ fontSize: '1rem', color: '#1f2937', fontWeight: 700 }}>
//           {displayValue}
//         </Typography>
//         <Typography sx={{ fontSize: '0.625rem', color: '#6b7280' }}>{unit}</Typography>
//       </Box>
//     );
//   };

//   const renderAccordionContent = () => {
//     switch (title) {
//       case 'Temp':
//         return (
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
//               {renderValue(station['Air Temp Min'], '°F')}
//               <Box component="p" className="metric-subtitle">Min</Box>
//             </Box>

//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
//               {renderValue(station['Air Temp Max'], '°F')}
//               <Box component="p" className="metric-subtitle">Max</Box>
//             </Box>
//           </Box>
//         );

//       case 'Wind':
//         return (
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
//               {renderValue(station['Wind Speed Avg'], 'mph')}
//               <Box component="p" className="metric-subtitle">Average</Box>
//             </Box>

//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
//               {renderValue(station['Max Wind Gust'], 'mph')}
//               <Box component="p" className="metric-subtitle">Gust</Box>
//             </Box>

//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
//               {renderValue(station['Wind Direction'], '')}
//               <Box component="p" className="metric-subtitle">Direction</Box>
//             </Box>
//           </Box>
//         );

//       case 'Snow':
//         return (
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
//               {renderValue(station['Total Snow Depth'], 'in')}
//               <Box component="p" className="metric-subtitle">Snow Depth</Box>
//             </Box>

//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
//               {renderValue(station['Total Snow Depth Change'], 'in')}
//               <Box component="p" className="metric-subtitle">Depth Change</Box>
//             </Box>

//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
//               {renderValue(
//                 station['Precip Accum One Hour'] !== '-' 
//                   ? parseFloat(station['Precip Accum One Hour']).toFixed(2) + ' in'
//                   : '-',
//                 'in'
//               )}
//               <Box component="p" className="metric-subtitle">Liquid Precip</Box>
//             </Box>
//           </Box>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <MuiAccordion 
//       expanded={isOpen}
//       onChange={(e: React.SyntheticEvent) => {
//         // Only handle the accordion toggle
//         e.stopPropagation();  // Stop click from bubbling to station card
//         onToggle();  // Toggle accordion state
//       }}
//       sx={{
//         backgroundColor: 'white',
//         boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
//         borderRadius: '0.5rem !important',
//         maxWidth: '100%',
//         overflow: 'visible',
//         position: 'relative',
//         padding: '0.1rem',
//         '&:before': {
//           display: 'none',
//         },
//         '& .MuiAccordionSummary-root': {
//           padding: '0.1rem',
//           minHeight: 'unset',
//           width: '100%'
//         },
//         '& .MuiAccordionSummary-content': {
//           margin: 0,
//           display: 'flex',
//           flexDirection: 'column',
//           gap: '0.05rem',
//           width: '100%'
//         }
//       }}
//     >
//       <AccordionSummary
//         expandIcon={<ExpandMoreIcon sx={{ 
//           fontSize: '0.8rem', 
//           color: '#6b7280',
//           padding: '0.25rem'
//         }} />}
//       >
//         <Box sx={{ 
//           width: 'calc(100% - 1.5rem)',
//           pointerEvents: 'none',
//           display: 'flex',
//           flexDirection: 'column',
//           gap: '0.05rem'
//         }}>
//           <Box>
//             <Box sx={{ 
//               display: 'flex', 
//               alignItems: 'center', 
//               gap: '0.15rem'
//             }}>
//               <Typography sx={{ fontSize: '0.625rem', color: '#4b5563', fontWeight: 500 }}>
//                 {title}
//               </Typography>
//               <ExpandMoreIcon sx={{ 
//                 fontSize: '0.625rem', 
//                 color: '#6b7280',
//                 transform: isOpen ? 'rotate(180deg)' : 'none',
//                 transition: 'transform 0.2s'
//               }} />
//             </Box>
            
//             {metricValue === '-' ? (
//               <Typography sx={{ fontSize: '0.625rem', color: '#9ca3af' }}>
//                 no data
//               </Typography>
//             ) : (
//               <>
//                 <Box sx={{ 
//                   display: 'flex', 
//                   alignItems: 'baseline',
//                   gap: '2px'
//                 }}>
//                   <Typography sx={{ fontSize: '1rem', color: '#1f2937', fontWeight: 700 }}>
//                     {metricValue}
//                   </Typography>
//                   <Typography sx={{ fontSize: '0.625rem', color: '#6b7280' }}>
//                     {metricUnit}
//                   </Typography>
//                 </Box>

//                 <Typography sx={{ 
//                   fontSize: '0.5rem', 
//                   color: '#6b7280',
//                   whiteSpace: 'nowrap'
//                 }}>
//                   {subtitle}
//                 </Typography>
//               </>
//             )}
//           </Box>
//         </Box>
//       </AccordionSummary>
//       <AccordionDetails 
//         onClick={(e: React.MouseEvent<HTMLDivElement>) => {
//           // Only stop propagation for accordion content clicks
//           const target = e.target as HTMLElement;
//           if (target.closest('.MuiAccordionDetails-root')) {
//             e.stopPropagation();
//           }
//         }}
//       >
//         <Box sx={{ 
//           backgroundColor: '#f9fafb',
//           padding: '0.1rem',
//           borderRadius: '0.25rem'
//         }}>
//           <Box sx={{ 
//             display: 'flex', 
//             flexDirection: 'column', 
//             gap: '0.1rem'
//           }}>
//             {renderAccordionContent()}
//           </Box>
//         </Box>
//       </AccordionDetails>
//     </MuiAccordion>
//   );
// };

// export default MeasurementCard;

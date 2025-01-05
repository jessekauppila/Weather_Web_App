// Define station groups by stids
export const stationGroups = {
    westSlopesNorth: ['5', '6'],
    westSlopesCentral: ['57'],
    westSlopesSouth: ['29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '54'],
    eastSlopesNorth: ['7', '8', '9'],
    eastSlopesCentral: ['11', '24', '25', '26', '19'],
    eastSlopesSouth: [],
    olympics: ['4'],
    mtHood: ['41', '42', '43', '44', '45', '46', '47', '56'],
    snoqualmie: ['1', '2', '20', '21', '22', '23'],
    stevensPass: ['13', '14', '17', '18', '50', '51'],
  };
  
  // Define the regions configuration
  export const regions = [
    { id: 'olympics', title: 'Olympics', stationIds: stationGroups.olympics },
    { id: 'westSlopesNorth', title: 'West Slopes North', stationIds: stationGroups.westSlopesNorth },
    { id: 'westSlopesCentral', title: 'West Slopes Central', stationIds: stationGroups.westSlopesCentral },
    { id: 'stevensPass', title: 'Stevens Pass', stationIds: stationGroups.stevensPass },
    { id: 'snoqualmie', title: 'Snoqualmie', stationIds: stationGroups.snoqualmie },
    { id: 'westSlopesSouth', title: 'West Slopes South', stationIds: stationGroups.westSlopesSouth },
    { id: 'eastSlopesNorth', title: 'East Slopes North', stationIds: stationGroups.eastSlopesNorth },
    { id: 'eastSlopesCentral', title: 'East Slopes Central', stationIds: stationGroups.eastSlopesCentral },
    { id: 'eastSlopesSouth', title: 'East Slopes South', stationIds: stationGroups.eastSlopesSouth },
    { id: 'mtHood', title: 'Mt Hood', stationIds: stationGroups.mtHood }
  ];
  
  // Export types if needed
  export interface Region {
    id: string;
    title: string;
    stationIds: string[];
  }
export type LayerId =
  | 'forecastZones'
  | 'terrain'
  | 'currentTemp'
  | 'minMaxTemp'
  | 'avgMaxWind'
  | 'snowDepthIcons'
  | 'snowDepthColumns'
  | 'maxTempCol'
  | 'minTempCol'
  | 'currentTempCol'
  | 'snowDepthIconsRedo'
  | 'liquidPrecipIcons'
  | 'snowAccumColumns'
  | 'liquidPrecipIcons'
  | 'liquidPrecipColumns'
  | 'combinedPrecipIcons';


  export type LayerGroup = 
  | 'temperature' 
  | 'wind' 
  | 'precipitation' 
  | 'precipitationTemp' 
  | 'other'
  | 'justWind'
  | 'justMaxMinTemp'
  | 'justCurrentTemp'
  | 'justSnowDepth';


// Single source of truth for layer configuration
export const LAYER_CONFIG = {
  forecastZones: {
    id: 'forecastZones' as LayerId,
    group: 'other' as LayerGroup,
    label: 'Forecast Zones',
  },
  terrain: {
    id: 'terrain' as LayerId,
    group: 'other' as LayerGroup,
    label: 'Terrain',
  },
  currentTemp: {
    id: 'currentTemp' as LayerId,
    group: 'justCurrentTemp' as LayerGroup,
    label: 'Current Temp Icons',
  },
  // currentTempCol: {
  //   id: 'currentTempCol' as LayerId,
  //   group: 'temperature' as LayerGroup,
  //   label: 'Current Temp Columns',
  // },
  minMaxTemp: {
    id: 'minMaxTemp' as LayerId,
    group: 'justMaxMinTemp' as LayerGroup,
    label: 'Min/Max Temp',
  },
  // maxTempCol: {
  //   id: 'maxTempCol' as LayerId,
  //   group: 'temperature' as LayerGroup,
  //   label: 'Max Temp Columns',
  // },
  // minTempCol: {
  //   id: 'minTempCol' as LayerId,
  //   group: 'temperature' as LayerGroup,
  //   label: 'Min Temp Columns',
  // },
  avgMaxWind: {
    id: 'avgMaxWind' as LayerId,
    group: 'justWind' as LayerGroup,
    label: 'Avg/Max/Dir Wind',
  },
  snowDepthIcons: {
    id: 'snowDepthIcons' as LayerId,
    group: 'justSnowDepth' as LayerGroup,
    label: 'Snow Depth',
  },
  snowDepthColumns: {
    id: 'snowDepthColumns' as LayerId,
    group: 'precipitation' as LayerGroup,
    label: 'Snow Depth Columns',
  },
  // snowDepthIconsRedo: {
  //   id: 'snowDepthIconsRedo' as LayerId,
  //   group: 'precipitation' as LayerGroup,
  //   label: 'Snow Accum Icons',
  // },

  // snowAccumColumns: {
  //   id: 'snowAccumColumns' as LayerId,
  //   group: 'precipitation' as LayerGroup,
  //   label: 'Snow Accum Columns',
  // },


  // liquidPrecipColumns: {
  //   id: 'liquidPrecipColumns' as LayerId,
  //   group: 'precipitation' as LayerGroup,
  //   label: 'Liquid Precipitation Columns',
  // },
  // liquidPrecipIcons: {
  //   id: 'liquidPrecipIcons' as LayerId,
  //   group: 'precipitation' as LayerGroup,
  //   label: 'Liquid Precipitation Icons',
  // },
  combinedPrecipIcons: {
    id: 'combinedPrecipIcons' as LayerId,
    group: 'precipitationTemp' as LayerGroup,
    label: 'Snow & Water Accumulation',
  },
} as const;

// Derived configurations
export const LAYER_GROUPS: Record<LayerId, LayerGroup> = Object.values(LAYER_CONFIG).reduce(
  (acc, layer) => ({ ...acc, [layer.id]: layer.group }),
  {} as Record<LayerId, LayerGroup>
);

export const LAYER_LABELS: Record<LayerId, string> = Object.values(LAYER_CONFIG).reduce(
  (acc, layer) => ({ ...acc, [layer.id]: layer.label }),
  {} as Record<LayerId, string>
);

export interface LayerState {
  temperature: Set<LayerId>;
  wind: Set<LayerId>;
  precipitation: Set<LayerId>;
  precipitationTemp: Set<LayerId>;
  other: Set<LayerId>;
  justWind: Set<LayerId>;
  justMaxMinTemp: Set<LayerId>;
  justCurrentTemp: Set<LayerId>;
  justSnowDepth: Set<LayerId>;
}

export const DEFAULT_LAYER_STATE: LayerState = {
  temperature: new Set(),
  wind: new Set(),
  precipitation: new Set(),
  precipitationTemp: new Set(['combinedPrecipIcons']),
  other: new Set(['forecastZones']),
  justWind: new Set(),
  justMaxMinTemp: new Set(['minMaxTemp']),
  justCurrentTemp: new Set( ),
  justSnowDepth: new Set(),
};

// Helper function to get layer visibility state
export function getLayerVisibility(activeLayerState: LayerState) {
  // Start with all layers set to false
  const visibility = Object.values(LAYER_CONFIG).reduce(
    (acc, layer) => ({
      ...acc,
      [layer.id]: false
    }),
    {} as Record<LayerId, boolean>
  );

  // Update visibility based on active layers in each group
  Object.entries(activeLayerState).forEach(([group, activeLayerIds]) => {
    activeLayerIds.forEach((layerId: LayerId) => {
      visibility[layerId] = true;
    });
  });

  return visibility;
} 
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
  | 'liquidPrecipColumns';


export type LayerGroup = 'temperature' | 'wind' | 'precipitation' | 'other';

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
    group: 'temperature' as LayerGroup,
    label: 'Current Temp Icons',
  },
  currentTempCol: {
    id: 'currentTempCol' as LayerId,
    group: 'temperature' as LayerGroup,
    label: 'Current Temp Columns',
  },
  minMaxTemp: {
    id: 'minMaxTemp' as LayerId,
    group: 'temperature' as LayerGroup,
    label: 'Min/Max Temp',
  },
  maxTempCol: {
    id: 'maxTempCol' as LayerId,
    group: 'temperature' as LayerGroup,
    label: 'Max Temp Columns',
  },
  minTempCol: {
    id: 'minTempCol' as LayerId,
    group: 'temperature' as LayerGroup,
    label: 'Min Temp Columns',
  },
  avgMaxWind: {
    id: 'avgMaxWind' as LayerId,
    group: 'wind' as LayerGroup,
    label: 'Avg/Max Wind',
  },
  snowDepthIcons: {
    id: 'snowDepthIcons' as LayerId,
    group: 'precipitation' as LayerGroup,
    label: 'Snow Depth Change Icons',
  },
  snowDepthIconsRedo: {
    id: 'snowDepthIconsRedo' as LayerId,
    group: 'precipitation' as LayerGroup,
    label: 'Snow Accum Icons',
  },

  snowAccumColumns: {
    id: 'snowAccumColumns' as LayerId,
    group: 'precipitation' as LayerGroup,
    label: 'Snow Accum Columns',
  },
  snowDepthColumns: {
      id: 'snowDepthColumns' as LayerId,
      group: 'precipitation' as LayerGroup,
      label: 'Snow Depth Change Columns',
    },

  liquidPrecipColumns: {
    id: 'liquidPrecipColumns' as LayerId,
    group: 'precipitation' as LayerGroup,
    label: 'Liquid Precipitation Columns',
  },
  liquidPrecipIcons: {
    id: 'liquidPrecipIcons' as LayerId,
    group: 'precipitation' as LayerGroup,
    label: 'Liquid Precipitation Icons',
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
  other: Set<LayerId>;
}

export const DEFAULT_LAYER_STATE: LayerState = {
  temperature: new Set(['currentTemp']),
  wind: new Set(),
  precipitation: new Set(),
  other: new Set(['forecastZones']),
};

// Helper function to get layer visibility state
export function getLayerVisibility(activeLayerState: LayerState) {
  return Object.values(LAYER_CONFIG).reduce(
    (acc, layer) => ({
      ...acc,
      [layer.id]: activeLayerState[layer.group].has(layer.id),
    }),
    {} as Record<LayerId, boolean>
  );
} 
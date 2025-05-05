export type LayerId =
  | 'snowDepthIcons'
  | 'snowDepthColumns'
  | 'currentTemp'
  | 'minMaxTemp'
  | 'avgMaxWind'
  | 'forecastZones'
  | 'terrain';

export type LayerGroup = 'temperature' | 'wind' | 'precipitation' | 'other';

export const LAYER_GROUPS: Record<LayerId, LayerGroup> = {
  currentTemp: 'temperature',
  minMaxTemp: 'temperature',
  avgMaxWind: 'wind',
  snowDepthIcons: 'precipitation',
  snowDepthColumns: 'precipitation',
  forecastZones: 'other',
  terrain: 'other',
} as const;

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
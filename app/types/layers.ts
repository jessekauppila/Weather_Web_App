export type LayerId =
  | 'forecastZones'
  | 'windArrows'
  | 'snowDepthChange'
  | 'terrain'
  | 'currentTemp'
  | 'minMaxTemp'
  | 'avgMaxWind'
  | 'snowDepthIcons'
  | 'snowDepthColumns';

export type LayerGroup = 'temperature' | 'wind' | 'precipitation' | 'other';

export const LAYER_GROUPS: Record<LayerId, LayerGroup> = {
  currentTemp: 'temperature',
  minMaxTemp: 'temperature',
  avgMaxWind: 'wind',
  windArrows: 'wind',
  snowDepthIcons: 'precipitation',
  snowDepthColumns: 'precipitation',
  snowDepthChange: 'precipitation',
  forecastZones: 'other',
  terrain: 'other',
} as const;

export interface LayerState {
  temperature: LayerId | null;
  wind: LayerId | null;
  precipitation: LayerId | null;
  other: Set<LayerId>;
}

export const DEFAULT_LAYER_STATE: LayerState = {
  temperature: 'currentTemp',
  wind: null,
  precipitation: null,
  other: new Set(['forecastZones']),
}; 
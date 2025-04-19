import React, { useCallback, useState, useEffect } from 'react';
import { Box, Grid, FormControl, FormGroup, Grow } from '@mui/material';
import DateControls from './DateControls';
import TimeRangeSelector from './TimeRangeSelector';
import UnitsSwitch from './UnitsSwitch';
import RefreshButton from './RefreshButton';
import TableModeSwitch from './TableModeSwitch';
import TimeModeSwitch from './TimeModeSwitch';
import StationSelector from '../StationSelector';
import CustomTimeModal from './CustomTimeModal';
import TimeSlider from './TimeSlider';
import TimePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Types
export type TimeMode = 'real-time' | 'historical';
export type DayRangeType = '1d' | '3d' | '7d' | '14d' | '30d' | 'custom';
export interface StationObject {
  id: string;
  name: string;
  [key: string]: any;
}

export interface TimeToolbarProps {
  selectedStation?: StationObject | null;
  onStationSelect?: (station: StationObject | null) => void;
  onSliderChange?: (newValue: number[]) => void;
  onRangeTypeChange?: (dayRange: DayRangeType) => void;
  onTimeRangeCalculate?: (start: Date, end: Date) => void;
  onRefreshClick?: () => void;
  onDateChange?: (date: Date) => void;
  onTimeModeChange?: (mode: TimeMode) => void;
  onTableModeChange?: (mode: 'summary' | 'daily') => void;
  onUnitsToggle?: (isMetric: boolean) => void;
  customTime?: string;
  onCustomTimeChange?: (time: string) => void;
  dayRangeType?: DayRangeType;
  isMetric?: boolean;
  hideStationSelect?: boolean;
  hideUnitsToggle?: boolean;
  mobile?: boolean;
}

export default function TimeToolbar({
  selectedStation,
  onStationSelect,
  onSliderChange,
  onRangeTypeChange,
  onTimeRangeCalculate,
  onRefreshClick,
  onDateChange,
  onTimeModeChange,
  onTableModeChange,
  onUnitsToggle,
  customTime,
  onCustomTimeChange,
  dayRangeType = '1d',
  isMetric = false,
  hideStationSelect = false,
  hideUnitsToggle = false,
  mobile = false,
}: TimeToolbarProps) {
  // handle table mode change
  const handleTableModeChange = (mode: 'summary' | 'daily') => {
    if (onTableModeChange) {
      onTableModeChange(mode);
    }
  };
} 
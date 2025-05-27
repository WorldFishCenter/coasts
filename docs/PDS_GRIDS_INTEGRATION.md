# PDS Grids Integration

## Overview

The PDS (Position Data System) grids visualization has been successfully integrated into the map application. This feature displays GPS movement data aggregated into 1km x 1km grid cells, showing fishing effort distribution based on time spent in each area.

## Features

### 1. Grid Layer Visualization
- **3D Grid Cells**: Uses deck.gl's GridLayer to create extruded 3D grid cells
- **Color Coding**: Cells are colored based on average time spent (green gradient from light to dark)
- **Height Mapping**: Cell height represents the average time spent in that grid area
- **1km Resolution**: Each cell represents a 1 square kilometer area

### 2. Interactive Controls
- **Toggle Button**: "Show/Hide GPS Data" button to toggle the PDS grid layer visibility
- **Time Range Filters**: Interactive filters to show data for specific time ranges:
  - < 0.5 hours
  - 0.5 - 1 hour
  - 1 - 2 hours
  - 2 - 4 hours
  - 4 - 8 hours
  - > 8 hours

### 3. Information Panel
When the PDS grid layer is visible, an info panel displays:
- Grid resolution information
- Color scale legend
- Time range filters
- Statistics:
  - Total visits recorded
  - Active grid cells count
  - Average time per visit
  - Maximum time recorded
  - Average speed

### 4. Tooltips
Hovering over grid cells shows:
- Average time spent in the cell
- Total number of visits to that cell

## Technical Implementation

### Components
1. **PdsGridLayer.jsx**: Main component handling the deck.gl GridLayer
2. **gridLayerConfig.js**: Configuration constants for colors, time breaks, and layer settings

### Data Structure
The PDS grids data (`pds_grids.json`) contains:
```json
{
  "_id": "unique_id",
  "lat_grid_1km": -14.23,
  "lng_grid_1km": 34.8,
  "avg_speed": 2.799,
  "avg_range": 63676.625,
  "total_visits": 3,
  "original_cells": 3,
  "total_points": 1430,
  "avg_time_hours": 0.255
}
```

### Integration Points
- **useMapData hook**: Extended to load PDS grids data
- **Map.jsx**: Integrated PDS grid layer with toggle controls
- **dataService.js**: Already had `loadPdsGridsData` function

## Usage

1. Click the "Show GPS Data" button to display the PDS grid layer
2. The WIO regions layer opacity automatically reduces to 0.3 when PDS grids are visible
3. Use the time range filters in the info panel to filter data by time spent
4. Hover over grid cells to see detailed information
5. Click "Hide GPS Data" to return to the standard map view

## Performance Considerations

- Data is pre-filtered and transformed on load to optimize rendering
- Memoization is used extensively to prevent unnecessary re-renders
- The grid layer only renders when visible

## Future Enhancements

Potential improvements could include:
- Additional metrics for grid visualization (speed, range, etc.)
- Export functionality for filtered grid data
- Animation showing temporal changes
- Heatmap alternative visualization
- Integration with the existing time series data 
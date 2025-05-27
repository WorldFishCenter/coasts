# Map Components Architecture

This directory contains all map-related components that were refactored from the monolithic `Map.jsx` file to improve maintainability, performance, and code organization.

## Component Structure

### Main Component
- **Map.jsx** - The main container component that orchestrates all map functionality
  - Reduced from 862 lines to ~300 lines
  - Focuses on state management and component composition
  - Delegates specific functionality to child components and hooks

### Sub-Components

#### Visual Components
- **UnifiedLegend.jsx** - Displays both metric and fishing activity legends
  - Handles color scales for choropleth data
  - Shows time ranges or heatmap gradient based on visualization mode
  
- **MapStyleToggle.jsx** - Toggle button for switching between satellite and standard map views
  - Self-contained component with hover effects
  - Accepts theme, satellite state, and toggle callback as props

- **DistributionHistogram.jsx** - (Pre-existing) Shows data distribution for selected regions

- **GridInfoPanel.jsx** - (Pre-existing) Displays grid information

### Custom Hooks

#### Data Processing
- **useMapLayers.js** - Creates and manages all deck.gl layers
  - Handles choropleth layer for boundaries
  - Creates column or heatmap layers for PDS grid data
  - Optimizes layer updates with proper memoization

- **useMapTooltip.js** - Generates tooltips for map features
  - Handles different tooltip styles for regions and grid data
  - Applies proper theming and color coding

#### Data Management
- **useMapData.js** - (Pre-existing) Loads map data from APIs

### Utility Functions

- **pdsDataProcessor.js** - Processes and filters PDS grid data
  - Handles data transformation outside of React components
  - Maintains a singleton pattern for filtered data

- **metricCalculations.js** - Calculates metric statistics and color grades
  - Separates computation logic from components
  - Provides consistent grade calculations

## Performance Optimizations

1. **Component Splitting** - Breaking down the large component reduces re-render scope
2. **Memoization** - All expensive calculations are properly memoized
3. **Data Processing** - PDS data is processed once and stored outside React
4. **Layer Updates** - Only necessary layer properties trigger updates
5. **Removed Unused Code** - Eliminated unused states and dependencies

## Removed/Cleaned Up

- Removed unused `activeTab` state
- Removed unused `selectedDistricts` and `selectedTotal` states
- Removed unused `timeRange` state and constants
- Removed unused `hoverInfo` state
- Removed unused `totalValue` from useMapData
- Removed commented-out sidebar toggle button
- Removed NavigationControl import
- Cleaned up excessive console.log statements

## Usage

The refactored Map component maintains the same external API but with improved internal structure:

```jsx
import MapComponent from './components/Map';

function App() {
  return <MapComponent />;
}
```

All functionality remains the same, but the code is now more maintainable and performant. 
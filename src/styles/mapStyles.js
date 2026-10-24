export const getMapStyles = (isDarkTheme) => {
  return isDarkTheme
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11';
};

# Coasts Map

Interactive map visualization for coastal regions using React and Mapbox GL JS.

## Features

- Interactive map visualization
- District selection and analysis
- Data visualization with charts
- Dark/Light theme support
- Mobile responsive design
- Daily data updates from MongoDB via GitHub Actions

## Technologies

- React
- Mapbox GL JS
- Vite for build tooling
- MongoDB for data storage
- GitHub Actions for automated data updates

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Mapbox token and MongoDB URI (see `.env.example`). The map requires `VITE_MAPBOX_TOKEN` for local development; `.env` is gitignored and is not committed.
   ```
   VITE_MAPBOX_TOKEN=your_token_here
   MONGODB_URI=your_mongodb_uri_here
   ```
4. Run development server: `npm run dev`

## MongoDB Data Processing

This project uses a GitHub Actions workflow to fetch data from MongoDB daily and store it as static JSON files. The data comes from two collections:

1. `pds_grids` - Spatially aggregated GPS movement data
2. `wio_summaries_geo` - Fisheries data from coastal regions in Kenya and Zanzibar

### Manual Data Update

To manually update the data:

```bash
npm run fetch-data
```

### GitHub Secrets Setup

For the automated workflow to function, you need to set up the following secrets in your GitHub repository:

1. `MONGODB_URI` - Your MongoDB connection string
2. `VITE_MAPBOX_TOKEN` - Your Mapbox access token

See `.github/README.md` for detailed instructions.

## Building for Production

```bash
npm run build
```

## Deployment

The project is configured for deployment on Vercel.

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

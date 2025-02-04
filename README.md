# Coasts Map

Interactive map visualization for coastal regions using React, Leaflet, and D3.js.

## Features

- Interactive district selection
- Real-time data visualization
- Customizable map parameters
- Data export capabilities
- Modern dark theme map style

## Tech Stack

- React
- Vite
- Leaflet (react-leaflet)
- D3.js

## Development

To run the project locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at `http://localhost:5173`

## Building

To build the project:

```bash
npm run build
```

The build output will be in the `dist` directory.

## Deployment

This project is configured for deployment on Vercel. To deploy:

1. Fork or clone this repository
2. Connect your GitHub repository to Vercel:
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select "Vite" as the framework
   - Deploy!

The deployment will automatically use the following settings:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Environment Variables

No environment variables are required for basic functionality.

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

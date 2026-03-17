# 🌐 SwingMusic Extended Web Client

A modern, responsive web client for SwingMusic with comprehensive features and beautiful UI.

## ✨ Features

### Core Music Features
- **Full Library Access** - Browse tracks, albums, and artists
- **Advanced Search** - Full-text search across your music library
- **Playlist Management** - Create, edit, and organize playlists
- **High-Quality Streaming** - Adaptive bitrate streaming
- **Folder View** - Navigate by directory structure

### Enhanced Features
- **Spotify Integration** - Import playlists and metadata
- **Universal Downloader** - Download from multiple streaming services
- **Audio Quality Dashboard** - Monitor and control streaming quality
- **Mobile Offline Support** - Sync music for offline listening
- **Music Catalog Browser** - Advanced library exploration
- **Recap Features** - Year-end listening statistics
- **Real-time Updates** - Live progress and notifications

### User Interface
- **Modern Vue.js** - Built with Vue 3 and Composition API
- **Responsive Design** - Optimized for all screen sizes
- **Dark/Light Themes** - System-aware theming
- **Progressive Web App** - Installable on mobile devices
- **Beautiful Animations** - Smooth transitions and micro-interactions

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ for development
- **Yarn** 1.22+ for package management
- **Modern Browser** - Chrome, Firefox, Safari, Edge

### Installation

```bash
# Clone repository
git clone https://github.com/Dvorinka/swingmusic-extended-webclient.git
cd swingmusic-extended-webclient

# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build
```

### Development Setup

```bash
# Install dependencies
yarn install

# Start development with hot reload
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

## 📁 Project Structure

```
swingmusic-webclient/
├── src/
│   ├── components/          # Vue.js components
│   │   ├── common/        # Reusable components
│   │   ├── player/        # Music player components
│   │   ├── library/       # Library browsing
│   │   └── enhanced/      # Enhanced features
│   ├── views/              # Page components
│   ├── stores/             # Pinia state management
│   ├── composables/        # Vue composables
│   ├── router/             # Vue Router configuration
│   ├── assets/             # Static assets
│   └── styles/             # CSS/SCSS styles
├── public/                 # Public assets
├── tests/                  # Test files
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_TITLE` - Application title
- `VITE_THEME_DEFAULT` - Default theme (light/dark)

### Build Configuration
- **Vite** - Build tool and dev server
- **Vue Router** - Client-side routing
- **Pinia** - State management
- **TypeScript** - Type safety

## 🎨 UI Components

### Core Components
- **MusicPlayer** - Full-featured audio player
- **TrackList** - Track listing with controls
- **AlbumView** - Album browsing and playback
- **ArtistView** - Artist pages and discography
- **SearchInterface** - Advanced search functionality

### Enhanced Components
- **SpotifyDownloader** - Universal URL downloader
- **AudioQualityDashboard** - Quality control interface
- **MobileOfflineManager** - Offline sync management
- **MusicCatalogBrowser** - Advanced library browser
- **RecapExperience** - Year-end statistics
- **EnhancedVirtualList** - Optimized list rendering

## 📱 Features Deep Dive

### Spotify Integration
- **URL Input** - Support for all Spotify URL types
- **Metadata Fetching** - Automatic metadata extraction
- **Download Queue** - Multiple concurrent downloads
- **Progress Tracking** - Real-time download progress
- **Quality Selection** - Configurable download quality

### Audio Quality
- **Adaptive Streaming** - Automatic quality adjustment
- **Manual Control** - User-selected quality settings
- **Bandwidth Detection** - Network-aware streaming
- **Format Support** - Multiple audio formats

### Mobile Features
- **PWA Support** - Install as mobile app
- **Offline Downloads** - Wi-Fi only downloads
- **Touch Gestures** - Mobile-optimized interactions
- **Responsive Layout** - Adaptive to screen size

## 🛠️ Development

### Development Commands

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# Lint code
yarn lint

# Format code
yarn format
```

### Technology Stack
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vitest** - Unit testing framework
- **Cypress** - End-to-end testing

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
yarn test:unit

# Run with coverage
yarn test:unit:coverage

# Watch mode
yarn test:unit:watch
```

### E2E Tests
```bash
# Run E2E tests
yarn test:e2e

# Run in headed mode
yarn test:e2e:headed

# Run specific test file
yarn test:e2e --spec "login.spec.ts"
```

## 🚀 Deployment

### Build Process

```bash
# Build for production
yarn build

# Output will be in dist/
# Ready for deployment to any static host
```

### Deployment Options
- **Static Hosting** - Deploy `dist/` folder to any web server
- **CDN** - Upload to CDN for global distribution
- **Docker** - Use nginx or Apache containers
- **Vercel/Netlify** - One-click deployment

### Environment Configuration
```bash
# Production
NODE_ENV=production yarn build

# Development
NODE_ENV=development yarn dev
```

## 🔌 API Integration

### Backend Connection
```typescript
// API client configuration
const api = createApi({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

// WebSocket connection
const ws = new WebSocket(
  `${import.meta.env.VITE_WS_BASE_URL}/ws`
)
```

### Enhanced Features API
```typescript
// Spotify downloader
import { useSpotifyDownloader } from '@/composables/useSpotifyDownloader'

// Audio quality
import { useAudioQuality } from '@/composables/useAudioQuality'

// Mobile offline
import { useMobileOffline } from '@/composables/useMobileOffline'
```

## 🎨 Theming

### Theme System
- **CSS Variables** - Customizable color scheme
- **Dark Mode** - System-aware dark theme
- **Light Mode** - Clean light theme
- **Auto Switch** - Follows system preferences

### Customization
```css
:root {
  --primary-color: #1db954;
  --background-color: #121212;
  --text-color: #ffffff;
}
```

## 📊 Performance

### Optimizations
- **Code Splitting** - Lazy-loaded components
- **Tree Shaking** - Unused code elimination
- **Asset Optimization** - Compressed images and fonts
- **Caching** - Intelligent browser caching
- **Bundle Analysis** - Visual bundle analysis

### Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.0s
- **Bundle Size**: < 500KB (gzipped)
- **Lighthouse Score**: 95+

## 🐛 Troubleshooting

### Common Issues

#### Development Issues
```bash
# Clear node_modules
rm -rf node_modules yarn.lock
yarn install

# Clear Vite cache
rm -rf .vite

# Restart dev server
yarn dev --force
```

#### Build Issues
```bash
# Check for TypeScript errors
yarn type-check

# Check for ESLint errors
yarn lint

# Build with verbose output
yarn build --mode production --verbose
```

#### Performance Issues
- Check network connection
- Verify API endpoint accessibility
- Clear browser cache
- Disable browser extensions temporarily

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes
4. Add tests for new features
5. Submit pull request

### Development Guidelines
- Follow Vue.js style guide
- Use TypeScript for type safety
- Write meaningful commit messages
- Add tests for new functionality
- Update documentation

## 📄 License

This project is licensed under AGPL-3.0 License - see the [LICENSE](../LICENSE) file for details.

## 🔗 Links

- **Backend**: [swingmusic-extended](https://github.com/Dvorinka/swingmusic-extended)
- **Desktop App**: [swingmusic-extended-desktop](https://github.com/Dvorinka/swingmusic-extended-desktop)
- **Android App**: [swingmusic-extended-android](https://github.com/Dvorinka/swingmusic-extended-android)

---

**Built with ❤️ using Vue.js and Vite**

# Throttle Plugin

The throttle plugin limits the frequency of state updates by ensuring they occur at most once per specified time interval. Unlike debounce, throttle ensures regular updates during periods of continuous activity.

## Import

```typescript
import { throttle } from 'react-pouch/plugins';
```

## Configuration

```typescript
throttle(ms: number)  // Time interval in milliseconds
```

## Usage Examples

### Basic Usage

```typescript
import { pouch } from 'react-pouch';
import { throttle } from 'react-pouch/plugins';

const scrollPosition = pouch(0, [
  throttle(100)  // Update at most once every 100ms
]);

// Rapid scroll events are throttled
window.addEventListener('scroll', () => {
  scrollPosition.set(window.scrollY);
});

// Updates occur maximum once every 100ms during scrolling
```

### Mouse Movement Tracking

```typescript
const mousePosition = pouch(
  { x: 0, y: 0 },
  [
    throttle(16)  // ~60fps updates
  ]
);

document.addEventListener('mousemove', (e) => {
  mousePosition.set({ x: e.clientX, y: e.clientY });
});

// Smooth tracking without overwhelming the state system
```

### Real-time Data Updates

```typescript
const sensorData = pouch(
  { temperature: 0, humidity: 0, pressure: 0 },
  [
    throttle(1000),  // Update once per second
    sync('/api/sensors')
  ]
);

// Continuous sensor readings are throttled before sending to server
```

## API Methods

This plugin modifies the behavior of the `set` method but doesn't add any new methods to the pouch instance.

## Common Use Cases

### 1. Scroll Position Tracking

```typescript
interface ScrollState {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right' | null;
}

const scrollTracker = pouch<ScrollState>(
  { x: 0, y: 0, direction: null },
  [
    throttle(50),  // 20 updates per second max
    computed((state) => ({
      isNearTop: state.y < 100,
      isNearBottom: state.y > document.body.scrollHeight - window.innerHeight - 100,
      scrollPercent: (state.y / (document.body.scrollHeight - window.innerHeight)) * 100
    }))
  ]
);

let lastScrollTop = 0;
window.addEventListener('scroll', () => {
  const currentScrollTop = window.scrollY;
  const direction = currentScrollTop > lastScrollTop ? 'down' : 'up';
  lastScrollTop = currentScrollTop;
  
  scrollTracker.set({
    x: window.scrollX,
    y: currentScrollTop,
    direction
  });
});
```

### 2. Window Resize Handler

```typescript
interface WindowSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const windowSize = pouch<WindowSize>(
  {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: false,
    isTablet: false,
    isDesktop: true
  },
  [
    throttle(100),  // Don't overwhelm with resize events
    middleware((size) => ({
      ...size,
      isMobile: size.width < 768,
      isTablet: size.width >= 768 && size.width < 1024,
      isDesktop: size.width >= 1024
    }))
  ]
);

window.addEventListener('resize', () => {
  windowSize.set({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: false,
    isTablet: false,
    isDesktop: false
  });
});
```

### 3. Real-time Search

```typescript
const searchPouch = pouch(
  { query: '', results: [] },
  [
    throttle(300),  // Limit search requests
    middleware(async (state) => {
      if (state.query.length >= 2) {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(state.query)}`);
          const results = await response.json();
          return { ...state, results };
        } catch (error) {
          console.error('Search failed:', error);
          return { ...state, results: [] };
        }
      }
      return { ...state, results: [] };
    })
  ]
);

// User typing is throttled to avoid excessive API calls
```

### 4. Performance Monitoring

```typescript
interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  timestamp: number;
  renderTime: number;
}

const performanceTracker = pouch<PerformanceMetrics>(
  { fps: 0, memoryUsage: 0, timestamp: 0, renderTime: 0 },
  [
    throttle(1000),  // Collect metrics once per second
    analytics('performance_metrics', {
      sanitize: (metrics) => ({
        fps: Math.round(metrics.fps),
        memoryUsage: Math.round(metrics.memoryUsage / 1024 / 1024), // MB
        renderTime: Math.round(metrics.renderTime)
      })
    })
  ]
);

// Continuous performance monitoring
function trackPerformance() {
  const now = performance.now();
  const memInfo = (performance as any).memory;
  
  performanceTracker.set({
    fps: 1000 / (now - lastFrameTime),
    memoryUsage: memInfo ? memInfo.usedJSHeapSize : 0,
    timestamp: now,
    renderTime: now - lastRenderStart
  });
  
  requestAnimationFrame(trackPerformance);
}
```

### 5. Audio Visualizer

```typescript
interface AudioData {
  frequencyData: number[];
  volume: number;
  dominant: number;
}

const audioVisualizer = pouch<AudioData>(
  { frequencyData: [], volume: 0, dominant: 0 },
  [
    throttle(16),  // ~60fps for smooth animation
    computed((data) => ({
      volumeLevel: data.volume > 0.7 ? 'high' : data.volume > 0.3 ? 'medium' : 'low',
      isActive: data.volume > 0.01
    }))
  ]
);

// Audio analysis loop
function analyzeAudio() {
  if (audioContext && analyser) {
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);
    
    const volume = frequencyData.reduce((sum, freq) => sum + freq, 0) / frequencyData.length / 255;
    const dominant = frequencyData.indexOf(Math.max(...Array.from(frequencyData)));
    
    audioVisualizer.set({
      frequencyData: Array.from(frequencyData),
      volume,
      dominant
    });
  }
  
  requestAnimationFrame(analyzeAudio);
}
```

### 6. Game State Updates

```typescript
interface GameState {
  playerPosition: { x: number; y: number };
  enemies: Array<{ id: string; x: number; y: number; health: number }>;
  score: number;
  level: number;
}

const gameState = pouch<GameState>(
  { playerPosition: { x: 0, y: 0 }, enemies: [], score: 0, level: 1 },
  [
    throttle(33),  // 30fps updates
    history(100),  // Keep game history
    sync('/api/game/state', {
      debounce: 5000  // Sync to server every 5 seconds
    })
  ]
);

// Game loop with throttled state updates
function gameLoop() {
  // Update game logic...
  updatePhysics();
  updateEnemies();
  checkCollisions();
  
  // State update is throttled
  gameState.set({
    playerPosition: player.position,
    enemies: enemies.map(e => ({ id: e.id, x: e.x, y: e.y, health: e.health })),
    score: player.score,
    level: currentLevel
  });
  
  requestAnimationFrame(gameLoop);
}
```

### 7. Network Status Monitoring

```typescript
interface NetworkStatus {
  online: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

const networkStatus = pouch<NetworkStatus>(
  { online: navigator.onLine, connectionType: '', effectiveType: '', downlink: 0, rtt: 0 },
  [
    throttle(5000),  // Check every 5 seconds
    persist('network-status'),
    analytics('network_status')
  ]
);

// Monitor network changes
setInterval(() => {
  const connection = (navigator as any).connection;
  networkStatus.set({
    online: navigator.onLine,
    connectionType: connection?.type || 'unknown',
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0
  });
}, 1000);
```

### 8. Form Auto-save with Throttling

```typescript
interface FormData {
  title: string;
  content: string;
  tags: string[];
  lastSaved: string;
}

const formData = pouch<FormData>(
  { title: '', content: '', tags: [], lastSaved: '' },
  [
    throttle(2000),  // Save at most every 2 seconds
    middleware((data) => ({
      ...data,
      lastSaved: new Date().toISOString()
    })),
    persist('form-autosave'),
    sync('/api/drafts/123', {
      debounce: 0  // No additional debounce since throttle handles it
    })
  ]
);
```

## Throttle vs Debounce

### When to Use Throttle
- Scroll events
- Mouse movement
- Window resize
- Real-time data updates
- Animation frames
- Performance monitoring

### When to Use Debounce
- Search input
- Form validation
- Button clicks
- API calls triggered by user input

### Combining Both
```typescript
const searchWithBoth = pouch('', [
  throttle(100),   // Limit to 10 updates per second
  debounce(300),   // Wait for user to stop typing
  sync('/api/search')
]);
```

## Notes

- Throttle ensures updates happen at regular intervals during continuous activity
- The first update in a sequence is immediate
- Subsequent updates are delayed until the throttle period has passed
- If updates occur faster than the throttle period, they are queued and the most recent is applied
- Function updates are resolved with the current state when the throttle period expires
- Throttle is ideal for:
  - High-frequency events (scroll, mousemove, resize)
  - Real-time data streams
  - Animation-related state updates
  - Performance-critical applications
- Unlike debounce, throttle doesn't wait for activity to stop
- Consider combining with other plugins like `analytics` or `sync` for controlled data flow
- The throttle interval should match your performance requirements (e.g., 16ms for 60fps)
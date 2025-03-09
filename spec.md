```markdown
# Angel Investor Archetype Frame Specification

## 1. OVERVIEW

### Core Functionality
- Analyzes user's Farcaster casts through semantic patterns and investment-related keywords
- Classifies users into 3 investor archetypes: Spray & Pray, Friends, or Concentrated
- Provides shareable personality assessment results within Farcaster ecosystem
- Requires no persistent user accounts or blockchain transactions

### UX Flow
1. Entry Frame: Welcome screen with "Analyze My Casts" CTA
2. Processing State: Animated loading screen during cast analysis
3. Result Frame: 
   - Archetype visualization (dominant type + secondary traits)
   - Personality description card
   - Share button with pre-generated cast text
4. Deep Dive: Optional swipeable cards explaining each archetype

## 2. TECHNICAL REQUIREMENTS

### Responsive Design
- Mobile-first flexbox layout (320px min width support)
- Dynamic font scaling: 16px base with clamp() for readability
- Aspect-ratio maintained visuals (1:1 for graphics, 16:9 for text cards)
- CSS grid for archetype comparison charts

### API Integration
- Neynar Cast Search API for historical cast retrieval
  - Query: `author_fid` + investment-related keywords
  - Time filter: Last 12 months of activity
  - Priority mode: false (include all casts)
- Local browser storage for temporary session data

## 3. FRAMES v2 IMPLEMENTATION

### Interactive Elements
- Canvas-based radar chart showing archetype scores
- Swipeable card deck interface for archetype explanations
- Dynamic progress bar during analysis phase
- Copy-to-clipboard functionality for sharing results

### Input Handling
- Touch-based swipe gestures for card navigation
- Text input for optional email results (Web3-native alternatives considered)
- Long-press interactions on key data points
- Accelerometer-based animations (mobile-only)

### Social Features
- Frame SDK share method with OG image generation
- Cast embed template for result sharing
- Follow button integration for app maintainer
- Verified address badge display via WalletConnect

## 4. MOBILE CONSIDERATIONS

### Layout Strategies
- Viewport meta tag with interactive=optimizeLegibility
- Safe area padding for notch devices
- Conditional hover states detection
- Hardware-accelerated animations

### Touch Optimization
- 48px minimum touch target sizes
- Prevent vertical bounce on scroll containers
- Momentum-based scrolling for results list
- Reduced motion preferences support

## 5. CONSTRAINTS COMPLIANCE

### Storage Strategy
- LocalStorage session keys (TTL: 24hrs)
- Ephemeral result caching (max 1 previous result)
- No cross-device sync requirements

### Infrastructure Limits
- All data processing client-side
- Neynar API as sole external service
- Static site hosting only
- No user-generated content storage

### Scope Management
- MVP feature set (analysis + share)
- No A/B testing or analytics
- Basic error handling (fail silent design)
- Placeholder content for empty states
```
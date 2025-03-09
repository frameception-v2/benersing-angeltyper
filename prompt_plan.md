Here's the optimized prompt sequence for incremental implementation:

```markdown
# Prompt 1: Base Frame Setup
**Context**: Initialize core Next.js structure with mobile-first layout
**Task**:
1. Create `/app/layout.tsx` with viewport settings
2. Add CSS reset with `clamp()` font scaling
3. Create basic frame template component
4. Configure Neynar API key environment variable

```text
Create a Next.js layout component with viewport meta tags optimized for mobile interactions. Include a CSS reset that establishes 16px base font size with clamp() scaling between 320px and 768px viewports. Set up a basic frame container component using flexbox that maintains 1:1 aspect ratio for graphical elements. Add environment variable configuration for NEYNAR_API_KEY.
```

# Prompt 2: Entry Frame Implementation
**Context**: Create initial welcome screen with CTA
**Task**:
1. Build entry frame component with responsive flex layout
2. Add animated "Analyze My Casts" button
3. Implement session ID generation for LocalStorage
4. Set up frame state management

```text
Create a EntryFrame component with mobile-first flexbox layout containing: 
- Title using the existing template's <Heading> component
- Animated button component (48px min touch target) 
- Session ID generation stored in LocalStorage with 24h TTL
- Frame state transition logic using URL search params
Use the template's color scheme but customize the title to "Angel Investor Archetype Analysis".
```

# Prompt 3: Cast Analysis Service
**Context**: Implement Neynar API integration
**Task**:
1. Create cast search service
2. Add investment keyword filter
3. Process temporal patterns
4. Store results in session storage

```text
Create a CastAnalysisService that uses Neynar's Cast Search API to fetch casts by author_fid. Filter results using investment-related keywords (seed, round, valuation, cap, equity) from last 12 months. Calculate basic frequency metrics and store raw results in sessionStorage. Add TypeScript interfaces for processed results.
```

# Prompt 4: Processing Frame
**Context**: Animated loading state
**Task**:
1. Create loading spinner component
2. Implement progress simulation
3. Add API error fallback
4. Connect to analysis service

```text
Build a ProcessingFrame component with: 
- Canvas-based circular progress indicator
- Simulated progress animation (0-100% over 8s)
- Error boundary for API failures
- Polling mechanism for analysis completion
Use hardware-accelerated animations and respect prefers-reduced-motion.
```

# Prompt 5: Result Frame Layout
**Context**: Primary results display
**Task**:
1. Create grid layout for results
2. Add personality card component
3. Implement share button stub
4. Connect to session data

```text
Create a ResultFrame component with CSS grid layout (1:1 graphic, 16:9 text card). Add a PersonalityCard component displaying archetype title and description. Include a share button that copies pre-generated text to clipboard. Style using template's card component but with investment-themed colors.
```

# Prompt 6: Radar Chart Visualization 
**Context**: Archetype scoring display
**Task**:
1. Build canvas-based radar chart
2. Add score calculation logic
3. Implement responsive scaling
4. Connect to analysis data

```text
Create a RadarChart component using Canvas 2D that visualizes three archetype scores. Add scoring logic based on cast frequency patterns. Make responsive using aspect-ratio: 1/1. Animate chart drawing over 1s duration. Use gradient fills from template's theme colors.
```

# Prompt 7: Share Functionality
**Context**: Social integration
**Task**:
1. Implement Frame SDK share
2. Generate OG image
3. Add follow button
4. Handle clipboard fallback

```text
Add share functionality using Farcaster Frame SDK. Create dynamic OG image using Canvas with archetype name and score. Include verified address badge using WalletConnect. Implement follow button for maintainer fid. Add clipboard fallback for non-Farcaster environments.
```

# Prompt 8: Archetype Cards
**Context**: Swipeable explanations
**Task**:
1. Create card deck component
2. Add touch/swipe handlers
3. Implement parallax effect
4. Connect content to results

```text
Build a swipeable CardDeck component with touch gesture handling. Create three ArchetypeCard components using CSS grid and transform animations. Add momentum-based scrolling and safe area padding. Connect card content to analysis results with dynamic text insertion.
```

# Prompt 9: Touch Optimization
**Context**: Mobile interactions
**Task**:
1. Add touch target sizing
2. Prevent scroll bounce
3. Implement press-and-hold
4. Add accelerometer effects

```text
Optimize touch interactions: 
- Ensure all buttons have 48px min size
- Add CSS touch-action: pan-y to containers
- Implement long-press handlers on radar chart data points
- Add mobile-only tilt effect using DeviceOrientation API
Include conditional hover states for desktop.
```

# Prompt 10: Final Integration
**Context**: Wire up all components
**Task**:
1. Connect frame states
2. Add error boundaries
3. Set cache headers
4. Implement session TTL

```text
Integrate all components into page.tsx flow: EntryFrame → ProcessingFrame → ResultFrame. Add error boundaries and loading skeletons. Configure Cache-Control headers for static assets. Implement session expiration check using localStorage timestamps. Add placeholder content for empty analysis states.
```

Each prompt builds on previous components while maintaining independent functionality. The sequence progresses from infrastructure → core features → polish → integration, with mobile considerations at each stage. All code references existing template components and follows specified constraints.
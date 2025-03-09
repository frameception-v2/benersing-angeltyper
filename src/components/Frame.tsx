"use client";

import { useEffect, useCallback, useState, useRef, Suspense, useMemo } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
  type FrameContext,
} from "@farcaster/frame-sdk";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";

import { useAccount } from "wagmi";
import { config } from "~/components/providers/WagmiProvider";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, optimism } from "wagmi/chains";
import { createStore } from "@walletconnect/mipd";
import { Label } from "~/components/ui/label";
import { PROJECT_TITLE } from "~/lib/constants";
import { Button } from "~/components/ui/button";
import { FormMessage } from "~/components/ui/form";
import { CheckIcon } from "lucide-react";

function ProcessingFrame() {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const simulateAnalysis = async () => {
      try {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const startTime = performance.now();
        
        // Simulate API call with possible error
        await new Promise((resolve, reject) => setTimeout(() => {
          // 30% chance of simulated error
          if (Math.random() < 0.3) {
            reject(new Error('Analysis failed: Unable to process casts'));
          } else {
            resolve(true);
          }
        }, 4000));

        const animate = (startTime: number) => {
          const duration = 4000; // Reduced to 4s since we already waited 4s
          const animateFrame = (timestamp: number) => {
            const elapsed = timestamp - startTime;
            const newProgress = Math.min(elapsed / duration, 1);
            setProgress(newProgress);

            if (newProgress < 1) {
              animationRef.current = requestAnimationFrame(() => animateFrame(timestamp));
            }
          };
          
          animationRef.current = requestAnimationFrame(animateFrame);
        };

        if (!prefersReducedMotion) {
          animate(startTime);
        } else {
          setProgress(1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze casts');
      }
    };

    simulateAnalysis();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const drawProgress = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;
    const lineWidth = 8;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Progress arc
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * progress);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = '#c026d3';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }, [progress]);

  useEffect(() => {
    drawProgress();
  }, [drawProgress, progress]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6">
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="w-[100px] h-[100px] sm:w-[150px] sm:h-[150px]"
      />
      {error ? (
        <Card className="text-center space-y-4 p-4 max-w-[300px]">
          <CardHeader>
            <CardTitle className="text-red-600">Analysis Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                setError(null);
                setProgress(0);
              }}
              variant="destructive"
            >
              Retry Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Analyzing your casts</p>
          <p className="text-sm text-neutral-500">
            {Math.floor(progress * 100)}% complete
          </p>
        </div>
      )}
    </div>
  );
}

function RadarChart({ scores }: { scores: { sprayAndPray: number; friends: number; concentrated: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [currentScores, setCurrentScores] = useState([0, 0, 0]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check session expiration on load
    const session = localStorage.getItem('fcSession');
    if (session) {
      const { expiresAt } = JSON.parse(session);
      if (expiresAt < Date.now()) {
        localStorage.removeItem('fcSession');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    const animate = (startTime: number) => {
      const duration = 1000;
      const animateFrame = (timestamp: number) => {
        const progress = Math.min((timestamp - startTime) / duration, 1);
        setCurrentScores([
          progress * scores.sprayAndPray,
          progress * scores.friends,
          progress * scores.concentrated
        ]);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateFrame);
        }
      };
      animationRef.current = requestAnimationFrame(animateFrame);
    };

    const startTime = performance.now();
    animate(startTime);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scores]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;
    const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0.25; i <= 1; i += 0.25) {
      ctx.beginPath();
      for (const angle of angles) {
        const x = centerX + Math.cos(angle) * radius * i;
        const y = centerY + Math.sin(angle) * radius * i;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw data polygon
    ctx.beginPath();
    currentScores.forEach((score, i) => {
      const scaledScore = score * radius;
      const x = centerX + Math.cos(angles[i]) * scaledScore;
      const y = centerY + Math.sin(angles[i]) * scaledScore;
      ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(192, 38, 211, 0.2)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.2)');

    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#c026d3';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [currentScores]);

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full aspect-square max-w-[300px] mx-auto"
      width={300}
      height={300}
      onTouchStart={(e) => {
        if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
          e.preventDefault();
          // Show hidden details on long press
          const timeout = setTimeout(() => {
            // TODO: Implement detail view
          }, 1000);
          e.currentTarget.addEventListener('touchend', () => clearTimeout(timeout), {once: true});
        }
      }}
    />
  );
}

function ArchetypeCard({ title, description, isActive }: { title: string; description: string; isActive?: boolean }) {
  return (
    <Card className={`w-full aspect-video transition-transform duration-300 ${isActive ? 'scale-100 shadow-lg' : 'scale-90 opacity-75'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-purple-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-neutral-600">
        {description}
      </CardContent>
    </Card>
  );
}

function CardDeck({ archetypes }: { archetypes: Array<{ title: string; description: string }> }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX;
    setOffsetX(deltaX);
  }, [touchStartX]);

  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50;
    if (Math.abs(offsetX) > swipeThreshold) {
      if (offsetX > 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (offsetX < 0 && currentIndex < archetypes.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }
    setOffsetX(0);
  }, [offsetX, currentIndex, archetypes.length]);

  return (
    <div 
      className="relative w-full h-full overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {archetypes.map((archetype, index) => (
        <div
          key={archetype.title}
          className="absolute w-full h-full transition-transform duration-300"
          style={{
            transform: `translateX(${(index - currentIndex) * 100 + offsetX}%)`,
            zIndex: index === currentIndex ? 10 : 0
          }}
        >
          <ArchetypeCard
            {...archetype}
            isActive={index === currentIndex}
          />
        </div>
      ))}
    </div>
  );
}

function PersonalityCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="w-full aspect-video">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {description}
      </CardContent>
    </Card>
  );
}

function ResultFrame() {
  const { address } = useAccount();
  const [isCopied, setIsCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const sdk = useMemo(() => typeof window !== 'undefined' ? require("@farcaster/frame-sdk") : null, []);
  const [isClient, setIsClient] = useState(false);

  const generateOgImage = useCallback(async (archetype: string) => {
    const analysisResults = JSON.parse(sessionStorage.getItem('analysisResults') || '{}');
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      title: `${archetype} Investor`,
      description: `My investment style breakdown - ${PROJECT_DESCRIPTION}`,
      spray: Math.round(analysisResults.sprayAndPray * 100),
      concentrated: Math.round(analysisResults.concentrated * 100),
      friends: Math.round(analysisResults.friends * 100),
    });
    
    if (address) {
      params.set('address', address);
    }
    
    return `${baseUrl}/opengraph-image?${params.toString()}`;
  }, [address]);

  const handleShare = useCallback(async () => {
    const archetypeTitle = "Concentrated Investor"; // TODO: Replace with dynamic value
    const imageDataUrl = await generateOgImage(archetypeTitle);
    const castText = `${PROJECT_TITLE}\nArchetype: ${archetypeTitle}\n${window.location.href}`;

    try {
      await sdk.actions.share({
        text: castText,
        imageUrl: imageDataUrl,
        postUrl: window.location.href
      });
      setIsCopied(true);
      setCopyError(null);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      setCopyError('Failed to copy to clipboard - please try again');
      console.error('Share failed:', err);
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4" style={{ gridTemplateRows: '1fr auto' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RadarChart scores={{ sprayAndPray: 0.8, friends: 0.4, concentrated: 0.6 }} />
          <PersonalityCard
            title={sessionStorage.getItem('archetype') || "Concentrated Investor"}
            description={sessionStorage.getItem('archetypeDescription') || "Deep focus on few deals with significant commitment. Typically leads rounds and takes board seats."}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleShare}
              className="w-full bg-green-600 hover:bg-green-700 min-h-[48px]"
              disabled={isCopied}
            >
            {isCopied ? (
              <span className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4" />
                Copied!
              </span>
            ) : (
              "Share My Archetype"
            )}
          </Button>
          <Button
            onClick={() => sdk?.actions?.follow('hellno')}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            variant="secondary"
          >
            Follow @hellno for updates
          </Button>
        </div>
        {address && (
            <div className="text-xs text-neutral-500 text-center">
              Verified: {truncateAddress(address)}
            </div>
          )}
          {copyError && (
            <FormMessage className="text-center text-sm">
              {copyError}
            </FormMessage>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryFrame() {
  // Session management with TTL validation
  useEffect(() => {
    const currentTime = Date.now();
    const existingSession = localStorage.getItem('fcSession');
    let sessionData = existingSession ? JSON.parse(existingSession) : null;

    // Generate new session if expired or missing
    if (!sessionData || sessionData.expiresAt < currentTime) {
      sessionData = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2), // Simple client-side ID
        createdAt: new Date().toISOString(),
        expiresAt: currentTime + 86400000 // 24 hours
      };
      localStorage.setItem('fcSession', JSON.stringify(sessionData));
    }
  }, []);

  const handleAnalyze = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('state', 'processing');
    window.history.pushState({}, '', url.toString());
  }, []);

  return (
    <div 
      className="h-full w-full flex flex-col items-center justify-center p-6 transition-transform duration-300"
      style={{ 
        transform: typeof window !== 'undefined' && window.DeviceOrientationEvent 
          ? "rotateZ(var(--tz)) rotateX(var(--tx))" 
          : undefined 
      }}
    >
      <div className="flex flex-col items-center gap-6 max-w-[300px]">
        <h1 className="text-3xl font-bold text-center text-primary">
          {PROJECT_TITLE}
        </h1>
        
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={handleAnalyze}
            className="w-full h-12 py-4 px-8 bg-purple-600 hover:bg-purple-700 text-white rounded-xl 
                     transition-all duration-500 ease-in-out hover:scale-105 active:scale-95
                     animate-pulse hover:animate-none focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2
                     focus-visible:ring-offset-purple-600"
            style={{ minHeight: 48 }}
          >
            Analyze My Casts
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      setHasError(true);
      console.error(error);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="text-center p-4 space-y-4">
        <h2 className="text-red-600 text-lg font-semibold">Something went wrong</h2>
        <Button 
          onClick={() => window.location.reload()}
          variant="destructive"
        >
          Reload Frame
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 w-full max-w-[300px] mx-auto">
      <div className="h-8 bg-neutral-200 rounded-full w-3/4 mx-auto"></div>
      <div className="h-4 bg-neutral-200 rounded-full w-1/2 mx-auto"></div>
      <div className="h-12 bg-neutral-200 rounded-xl mt-8"></div>
    </div>
  );
}

export default function Frame() {
  const [isClient, setIsClient] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<sdk.FrameContext | undefined>();
  const [isSessionValid, setIsSessionValid] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [added, setAdded] = useState(false);

  const [addFrameResult, setAddFrameResult] = useState("");

  const addFrame = useCallback(async () => {
    try {
      await sdk.actions.addFrame();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          setAddFrameResult('User rejected frame addition');
        } else if (error.message.includes('Invalid domain manifest')) {
          setAddFrameResult('Invalid domain configuration');
        } else {
          setAddFrameResult(`Error: ${error.message}`);
        }
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  useEffect(() => {
    // Check session validity
    const session = localStorage.getItem('fcSession');
    if (session) {
      const { expiresAt } = JSON.parse(session);
      setIsSessionValid(expiresAt > Date.now());
    }

    const load = async () => {
      const context = await sdk.context;
      if (!context) {
        return;
      }

      setContext(context);
      setAdded(context.client.added);

      // If frame isn't already added, prompt user to add it
      if (!context.client.added) {
        addFrame();
      }

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setAdded(true);
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        console.log("frameAddRejected", reason);
      });

      sdk.on("frameRemoved", () => {
        console.log("frameRemoved");
        setAdded(false);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        console.log("notificationsEnabled", notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        console.log("notificationsDisabled");
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready();

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded, addFrame]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={context?.client?.safeAreaInsets ? {
        paddingTop: context.client.safeAreaInsets.top,
        paddingBottom: context.client.safeAreaInsets.bottom,
        paddingLeft: context.client.safeAreaInsets.left,
        paddingRight: context.client.safeAreaInsets.right
      } : {}}
    >
      <div className="w-full max-w-[400px] aspect-square mx-auto p-4">
        <div className="w-full h-full flex flex-col">
          <ErrorBoundary>
            {!isClient ? (
              <LoadingSkeleton />
            ) : !window.location.search.includes('state=') ? (
              <Suspense fallback={<LoadingSkeleton />}>
                <EntryFrame />
              </Suspense>
            ) : window.location.search.includes('state=processing') ? (
              <Suspense fallback={<LoadingSkeleton />}>
                <ProcessingFrame />
              </Suspense>
            ) : (
              <Suspense fallback={<LoadingSkeleton />}>
                <ResultFrame />
              </Suspense>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

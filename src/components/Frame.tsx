"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";

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

function PersonalityCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="w-full aspect-video bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-green-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-neutral-600">
        {description}
      </CardContent>
    </Card>
  );
}

function ResultFrame() {
  const [isCopied, setIsCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `Just discovered my Angel Investor Archetype via @hellno's frame!\n\n${window.location.href}`
      );
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
          <div className="aspect-square bg-purple-50 rounded-xl p-4 flex items-center justify-center">
            <span className="text-lg font-semibold text-purple-600">Radar Chart</span>
          </div>
          <PersonalityCard
            title="Concentrated Investor"
            description="Deep focus on few deals with significant commitment. Typically leads rounds and takes board seats."
          />
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={handleShare}
            className="w-full bg-green-600 hover:bg-green-700 h-12"
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
    <div className="h-full w-full flex flex-col items-center justify-center p-6">
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

export default function Frame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<sdk.FrameContext>();

  const [added, setAdded] = useState(false);

  const [addFrameResult, setAddFrameResult] = useState("");

  const addFrame = useCallback(async () => {
    try {
      await sdk.actions.addFrame();
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  useEffect(() => {
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
          {!(typeof window !== 'undefined' && window.location.search.includes('state=')) ? (
            <EntryFrame />
          ) : window.location.search.includes('state=processing') ? (
            <ProcessingFrame />
          ) : (
            <ResultFrame />
          )}
        </div>
      </div>
    </div>
  );
}

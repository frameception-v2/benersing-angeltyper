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
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { PROJECT_TITLE } from "~/lib/constants";

function ProcessingFrame() {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const animate = (startTime: number) => {
      const duration = 8000; // 8 seconds
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

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startTime = performance.now();
    
    if (!prefersReducedMotion) {
      animate(startTime);
    } else {
      setProgress(1);
    }

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
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">Analyzing your casts</p>
        <p className="text-sm text-neutral-500">
          {Math.floor(progress * 100)}% complete
        </p>
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
  const [context, setContext] = useState<Context.FrameContext>();

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
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-full max-w-[400px] aspect-square mx-auto p-4">
        <div className="w-full h-full flex flex-col">
          {!(typeof window !== 'undefined' && window.location.search.includes('state=processing')) ? (
            <EntryFrame />
          ) : (
            <ProcessingFrame />
          )}
        </div>
      </div>
    </div>
  );
}

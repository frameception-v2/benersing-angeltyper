import { NEYNAR_API_KEY } from "~/lib/constants";

const INVESTMENT_KEYWORDS = ['seed', 'round', 'valuation', 'cap', 'equity'];
const MAX_CAST_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

export interface ProcessedCastResult {
  totalCasts: number;
  investmentCastCount: number;
  firstInvestmentCastDate: string;
  lastInvestmentCastDate: string;
  score: number;
  rawCasts: any[];
  keywordDistribution: Record<string, number>;
  monthlyActivity: Array<{ month: string; count: number }>;
}

export interface NeynarCastResponse {
  result: {
    casts: Array<{
      hash: string;
      text: string;
      timestamp: string;
      author: {
        fid: number;
      };
    }>;
  };
}

export async function fetchCastsByFid(fid: string): Promise<ProcessedCastResult | null> {
  if (!NEYNAR_API_KEY) {
    throw new Error('Neynar API key not configured');
  }

  try {
    const params = new URLSearchParams({
      fid,
      limit: '100',
      keyword: INVESTMENT_KEYWORDS.join(','),
    });

    const response = await fetch(`https://api.neynar.com/v2/farcaster/cast/search?${params}`, {
      headers: { api_key: NEYNAR_API_KEY }
    });

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data: NeynarCastResponse = await response.json();
    return filterInvestmentCasts(data);
  } catch (error) {
    console.error('Cast analysis failed:', error);
    return null;
  }
}

function filterInvestmentCasts(response: NeynarCastResponse): ProcessedCastResult {
  const now = Date.now();
  const twelveMonthsAgo = now - MAX_CAST_AGE_MS;
  
  // Enhanced keyword counting and temporal filtering
  const keywordDistribution: Record<string, number> = {};
  const monthlyActivity: Record<string, number> = {};

  const investmentCasts = response.result.casts.filter(cast => {
    const castDate = new Date(cast.timestamp).getTime();
    const isRecent = castDate >= twelveMonthsAgo;
    const hasKeyword = INVESTMENT_KEYWORDS.some(keyword => {
      const hasKey = cast.text.toLowerCase().includes(keyword);
      if (hasKey) keywordDistribution[keyword] = (keywordDistribution[keyword] || 0) + 1;
      return hasKey;
    });
    
    // Track monthly activity
    if (isRecent) {
      const monthKey = new Date(castDate).toISOString().slice(0, 7);
      monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
    }

    return isRecent && hasKeyword;
  });

  const sortedCasts = investmentCasts.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Convert monthly activity to sorted array
  const monthlyActivityArray = Object.entries(monthlyActivity)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalCasts: response.result.casts.length,
    investmentCastCount: investmentCasts.length,
    firstInvestmentCastDate: sortedCasts[0]?.timestamp || '',
    lastInvestmentCastDate: sortedCasts[sortedCasts.length - 1]?.timestamp || '',
    score: Math.floor((investmentCasts.length / response.result.casts.length) * 100) || 0,
    rawCasts: sortedCasts,
    keywordDistribution,
    monthlyActivity: monthlyActivityArray
  };
}

export async function storeAnalysisResults(results: ProcessedCastResult) {
  try {
    const sessionData = {
      ...results,
      storedAt: new Date().toISOString(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours TTL
    };
    sessionStorage.setItem('castAnalysis', JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to store analysis results:', error);
  }
}

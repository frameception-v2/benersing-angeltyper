import { NEYNAR_API_KEY } from '~/lib/constants';

export interface Cast {
  hash: string;
  text: string;
  timestamp: string;
  likes: number;
  recasts: number;
  replies: number;
}

export interface ProcessedResults {
  totalCasts: number;
  keywordFrequency: Record<string, number>;
  earliestCast: string;
  latestCast: string;
  monthlyAverages: Array<{ month: string; count: number }>;
  archetypeScores: {
    sprayAndPray: number;
    friends: number;
    concentrated: number;
  };
}

const INVESTMENT_KEYWORDS = ['seed', 'round', 'valuation', 'cap', 'equity'];

export class CastAnalysisService {
  static async fetchCastsByFid(fid: number): Promise<ProcessedResults> {
    const endpoint = 'https://api.neynar.com/v2/farcaster/casts';
    const headers = { 'api_key': NEYNAR_API_KEY };
    
    try {
      const response = await fetch(`${endpoint}?author_fid=${fid}&keywords=${INVESTMENT_KEYWORDS.join(',')}&time_window=12months`, { headers });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return this.processCasts(data.casts);
    } catch (error) {
      console.error('Cast analysis failed:', error);
      throw error;
    }
  }

  private static processCasts(casts: any[]): ProcessedResults {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.setMonth(now.getMonth() - 12));
    
    // Filter casts to last 12 months and keyword matches
    const filteredCasts = casts.filter(cast => 
      new Date(cast.timestamp) > twelveMonthsAgo &&
      INVESTMENT_KEYWORDS.some(keyword => cast.text.toLowerCase().includes(keyword))
    );

    // Calculate keyword frequencies
    const keywordFrequency = INVESTMENT_KEYWORDS.reduce((acc, keyword) => {
      acc[keyword] = filteredCasts.filter(cast => 
        cast.text.toLowerCase().includes(keyword)
      ).length;
      return acc;
    }, {} as Record<string, number>);

    // Temporal analysis
    const timestamps = filteredCasts.map(cast => new Date(cast.timestamp).getTime());
    const monthlyCounts = this.calculateMonthlyAverages(timestamps);

    return {
      totalCasts: filteredCasts.length,
      keywordFrequency,
      earliestCast: new Date(Math.min(...timestamps)).toISOString(),
      latestCast: new Date(Math.max(...timestamps)).toISOString(),
      monthlyAverages: monthlyCounts,
      archetypeScores: this.calculateArchetypeScores(filteredCasts)
    };
  }

  private static calculateMonthlyAverages(timestamps: number[]) {
    const monthCounts = timestamps.reduce((acc, timestamp) => {
      const month = new Date(timestamp).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthCounts).map(([month, count]) => ({
      month,
      count: Math.round(count / 4) // Approximate weekly average
    }));
  }

  private static calculateArchetypeScores(casts: Cast[]) {
    // Placeholder scoring logic - will be refined in task 16
    const engagement = casts.reduce((sum, cast) => sum + cast.likes + cast.recasts, 0);
    const diversity = new Set(casts.map(cast => cast.hash)).size;
    
    return {
      sprayAndPray: casts.length / 100,
      friends: engagement / 1000,
      concentrated: diversity / 50
    };
  }

  static saveToSession(results: ProcessedResults) {
    sessionStorage.setItem('castAnalysis', JSON.stringify(results));
  }

  static loadFromSession(): ProcessedResults | null {
    const data = sessionStorage.getItem('castAnalysis');
    return data ? JSON.parse(data) : null;
  }
}

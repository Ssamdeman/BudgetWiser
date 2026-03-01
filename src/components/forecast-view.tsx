'use client';

import { useEffect, useState, startTransition } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Target, TrendingUp, TrendingDown, Clock, Activity, DollarSign, BrainCircuit, Grip } from 'lucide-react';

// Server Actions & Types
import { fetchForecastMetrics, type ForecastMetrics } from '@/app/actions';

export function ForecastView() {
    const [data, setData] = useState<ForecastMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        startTransition(async () => {
            try {
                const metrics = await fetchForecastMetrics();
                if (metrics && metrics.success) {
                    setData(metrics);
                } else {
                    setError("Failed to parse the forecasting model.");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load predictive data');
            } finally {
                setLoading(false);
            }
        });
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
                <Target className="w-8 h-8" />
                <p className="text-sm font-medium">{error}</p>
                <p className="text-xs opacity-80 text-center max-w-sm">
                    The prediction engine encountered an error parsing the dataset.
                </p>
            </div>
        );
    }

    if (loading || !data) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Running predictive models on history...</p>
            </div>
        );
    }

    // Graceful handling of a brand new user with no history
    if (data.historical_monthly_average === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <BrainCircuit className="w-8 h-8" />
                <p className="text-sm">Not enough history yet.</p>
                <p className="text-xs">The forecasting engine needs at least 1 past month of data to make predictions.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pt-2">
            {/* Hero Header: Expected vs Projected */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* End of Month Estimate */}
                <Card className="border-primary/20 bg-card/60 relative overflow-hidden group hover:border-primary/40 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold tracking-tight text-muted-foreground flex items-center gap-2 uppercase">
                                    <Target className="w-4 h-4 text-primary" /> End-Of-Month Estimate
                                </p>
                                <p className="text-[11px] text-muted-foreground">If you continue at your exact current pace</p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-3xl font-bold tracking-tighter text-foreground block">
                                ${data.end_of_month_estimate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Historical Average Baseline */}
                <Card className="border-border/50 bg-card/60">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold tracking-tight text-muted-foreground flex items-center gap-2 uppercase">
                                    <History className="w-4 h-4" /> Historical Average Baseline
                                </p>
                                <p className="text-[11px] text-muted-foreground">What you typically spend in a whole month</p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-3xl font-semibold tracking-tighter text-muted-foreground block opacity-80">
                                ${data.historical_monthly_average.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Stack: 3 Rows for Secondary Metrics */}
            <div className="flex flex-col gap-4">

                {/* Pace Check Node */}
                <Card className="border-border/50 hover:border-primary/20 transition-colors bg-card/60">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-6">

                            <div className="flex-shrink-0">
                                <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-4 flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5" /> Pace Check
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-start gap-6 mt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">To Date</span>
                                        <span className="text-3xl font-bold text-foreground">
                                            ${data.current_spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="hidden sm:block w-px h-12 bg-border/40"></div>

                                    <div className="flex flex-col">
                                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Expected By Now</span>
                                        <span className="text-2xl font-medium text-muted-foreground opacity-70">
                                            ${data.expected_spend_by_now.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-start items-center">
                                {data.is_overspending ? (
                                    <Badge variant="destructive" className="flex gap-2 py-2 px-4 shadow-sm text-sm">
                                        <TrendingUp className="w-4 h-4" />
                                        ${Math.abs(data.pace_difference).toLocaleString('en-US', { minimumFractionDigits: 0 })} ahead of pace
                                    </Badge>
                                ) : (
                                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 flex gap-2 py-2 px-4 shadow-sm border-emerald-500/20 text-sm">
                                        <TrendingDown className="w-4 h-4" />
                                        ${Math.abs(data.pace_difference).toLocaleString('en-US', { minimumFractionDigits: 0 })} under pace
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Averages */}
                <Card className="border-border/50 hover:border-primary/20 transition-colors bg-card/60">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-5">
                            <div>
                                <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-1 flex items-center gap-2">
                                    <Grip className="w-3.5 h-3.5" /> Top Baselines
                                </p>
                                <p className="text-xs text-muted-foreground">Highest historically repeating expenses</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                {data.category_forecasts.length > 0 ? data.category_forecasts.map((cat, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-background/40 px-5 py-4 rounded-xl border border-border/30">
                                        <span className="text-sm font-semibold text-foreground truncate">{cat.category}</span>
                                        <span className="text-xl font-bold text-muted-foreground mt-1">~${cat.average.toLocaleString('en-US', { minimumFractionDigits: 0 })}<span className="text-[10px] font-normal tracking-wide ml-1">/mo</span></span>
                                    </div>
                                )) : (
                                    <p className="text-[11px] text-muted-foreground italic text-left">No category history.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Mood Dominance */}
                <Card className="border-border/50 hover:border-primary/20 transition-colors bg-card/60">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-6">
                            <div>
                                <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-2 flex items-center gap-2">
                                    <BrainCircuit className="w-3.5 h-3.5" /> Behavioral Tendency
                                </p>
                                <p className="text-sm text-foreground/80 leading-relaxed max-w-sm">
                                    Historically, you spend money due to this mood the most. Awareness is key to behavior change.
                                </p>
                            </div>

                            <div className="flex justify-start">
                                <div className="bg-primary/5 border border-primary/20 py-5 px-10 rounded-2xl text-center inline-block">
                                    <p className="text-5xl font-black text-primary tracking-tight mb-1">{data.top_mood.percentage}%</p>
                                    <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">{data.top_mood.mood}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

// Stub a quick lucide history icon natively missing from the auto-import above
function History(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    );
}

import { Info, X } from 'lucide-react';
import { cn } from '../lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";

const AboutModal = ({ open, onOpenChange, isDarkTheme, dynamicStats }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "max-w-[600px] border",
                isDarkTheme ? "bg-zinc-900 border-white/10 text-foreground" : "bg-white border-black/10"
            )}>
                <DialogHeader className="flex flex-row items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-400 shadow-[0_4px_12px_#3b82f64d]">
                        <Info className="w-6 h-6 text-white" />
                    </div>
                    <DialogTitle className="m-0 text-2xl font-bold flex-1 text-left">
                        About COASTS
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    <div className="leading-relaxed space-y-5">
                        <p className="text-sm">
                            <strong>COASTS</strong> is a research platform that transforms GPS tracking data and fisheries surveys into actionable insights for coastal communities, researchers, and policymakers across the Western Indian Ocean region.
                        </p>

                        <div className={cn(
                            "rounded-xl p-5 border",
                            isDarkTheme ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"
                        )}>
                            <h3 className="text-base font-semibold m-0 mb-3.5 flex items-center gap-2 text-blue-500">
                                <span className="text-xl">🎯</span> What You Can Discover
                            </h3>
                            <ul className="m-0 pl-5 text-[13px] space-y-2">
                                <li><strong>Fishing Hotspots:</strong> Identify where fishers spend the most time and effort using GPS heat maps</li>
                                <li><strong>Catch Efficiency:</strong> Compare CPUE (Catch Per Unit Effort) across different coastal regions</li>
                                <li><strong>Economic Patterns:</strong> Analyze fish prices and revenue trends over time</li>
                                <li><strong>Regional Comparisons:</strong> Benchmark fishing performance between Western Indian Ocean districts</li>
                            </ul>
                        </div>

                        <div className={cn(
                            "rounded-xl p-5 border",
                            isDarkTheme ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"
                        )}>
                            <h3 className="text-base font-semibold m-0 mb-3.5 flex items-center gap-2 text-green-500">
                                <span className="text-xl">🛠️</span> Interactive Analysis Tools
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-[13px]">
                                <div>
                                    <strong>3D Fishing Effort Visualization</strong><br />
                                    <span className="text-muted-foreground">Column heights show time spent fishing in 1km² grid cells</span>
                                </div>
                                <div>
                                    <strong>Time-based Filtering</strong><br />
                                    <span className="text-muted-foreground">Filter by fishing duration (0.5h to 8+ hours)</span>
                                </div>
                                <div>
                                    <strong>Metric Comparison</strong><br />
                                    <span className="text-muted-foreground">Switch between CPUE, CPUA, RPUE, and price data</span>
                                </div>
                                <div>
                                    <strong>Regional Selection</strong><br />
                                    <span className="text-muted-foreground">Click districts to view detailed statistics</span>
                                </div>
                            </div>
                        </div>

                        <div className={cn(
                            "rounded-xl p-5 border",
                            isDarkTheme ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-50 border-purple-200"
                        )}>
                            <h3 className="text-base font-semibold m-0 mb-3.5 flex items-center gap-2 text-purple-500">
                                <span className="text-xl">📈</span> Real-Time Data Sources
                            </h3>
                            <p className="text-[13px] mb-3">
                                Our platform integrates multiple data streams updated every 2 days:
                            </p>
                            <ul className="m-0 pl-5 text-[13px] space-y-2">
                                <li><strong>GPS Tracking Data:</strong> {dynamicStats?.totalH3Cells?.toLocaleString() || 0} vessel movement patterns aggregated into H3 Hexagon cells</li>
                                <li><strong>Fisheries Surveys:</strong> Catch, effort, and economic data from {dynamicStats?.totalRegions || 0} coastal communities</li>
                                <li><strong>Administrative Boundaries:</strong> Official district boundaries for {dynamicStats?.totalCountries || 0} countries</li>
                                <li><strong>Market Data:</strong> Fish price trends and revenue calculations across all regions</li>
                            </ul>
                        </div>

                        <div className={cn(
                            "rounded-xl p-5 border",
                            isDarkTheme ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
                        )}>
                            <h3 className="text-base font-semibold m-0 mb-3.5 flex items-center gap-2 text-amber-500">
                                <span className="text-xl">🎓</span> Who Uses This Tool
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-[13px]">
                                <div>
                                    <strong>Marine Researchers</strong><br />
                                    <span className="text-muted-foreground">Study fishing patterns and ecosystem impacts</span>
                                </div>
                                <div>
                                    <strong>Policy Makers</strong><br />
                                    <span className="text-muted-foreground">Design evidence-based fisheries management</span>
                                </div>
                                <div>
                                    <strong>Conservation Groups</strong><br />
                                    <span className="text-muted-foreground">Monitor fishing pressure in protected areas</span>
                                </div>
                                <div>
                                    <strong>Fishing Communities</strong><br />
                                    <span className="text-muted-foreground">Understand local fishing dynamics</span>
                                </div>
                            </div>
                        </div>

                        <div className={cn(
                            "rounded-xl p-5 border",
                            isDarkTheme ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
                        )}>
                            <h3 className="text-base font-semibold m-0 mb-3.5 flex items-center gap-2">
                                <span className="text-xl">🚀</span> Quick Start Guide
                            </h3>
                            <ol className="m-0 pl-5 text-[13px] space-y-2">
                                <li>Click any district on the map to view detailed fisheries data</li>
                                <li>Toggle between satellite and street view using the map style button</li>
                                <li>Switch visualization modes between 3D columns and heat maps</li>
                                <li>Use the legend panel to filter fishing effort by time ranges</li>
                                <li>Compare different metrics (CPUE, prices) using the dropdown selector</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "pt-4 flex justify-between items-center flex-wrap gap-2 border-t mt-4",
                    isDarkTheme ? "border-white/10" : "border-black/10"
                )}>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground tracking-wide font-medium">
                            PESKAS | COASTS v0.3.0
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            Data updated every 2 days • Last sync: {dynamicStats?.lastSyncDate || 'Loading...'}
                        </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground text-right">
                        Covering {dynamicStats?.totalCountries || 0} countries<br />
                        {dynamicStats?.totalRegions || 0} regions • {dynamicStats?.totalH3Cells?.toLocaleString() || 0} GPS H3 cells
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AboutModal;

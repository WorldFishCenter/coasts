import { PeskasMark } from './PeskasLogo';
import { H3_EFFORT_GRID } from '../utils/metricMetadata';
import { version } from '../../package.json';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";

const Section = ({ title, children }) => (
    <section className="border-t border-border pt-4">
        <h3 className="m-0 mb-2 text-base font-semibold">{title}</h3>
        {children}
    </section>
);

// Term + description pairs, set two to a row on wider screens.
const Pairs = ({ items }) => (
    <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {items.map(([term, description]) => (
            <div key={term}>
                <dt className="font-semibold">{term}</dt>
                <dd className="m-0 text-muted-foreground">{description}</dd>
            </div>
        ))}
    </dl>
);

// Counts read "N thing" only where the current page has loaded them; elsewhere the sentence stands without a number.
const count = (value, unit) => (value ? `${value.toLocaleString()} ${unit}` : unit);

const AboutModal = ({ open, onOpenChange, dynamicStats }) => {
    const totals = [
        dynamicStats?.totalCountries && `${dynamicStats.totalCountries} countries`,
        dynamicStats?.totalRegions && `${dynamicStats.totalRegions} regions`,
        dynamicStats?.totalH3Cells && `${dynamicStats.totalH3Cells.toLocaleString()} effort cells`
    ].filter(Boolean);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[640px]">
                <DialogHeader className="mb-1 flex flex-row items-center gap-3 space-y-0">
                    {/* The title already names Peskas, so the mark is decorative here. */}
                    <PeskasMark aria-hidden="true" className="h-8 w-auto shrink-0" />
                    <DialogTitle className="m-0 flex-1 text-left text-2xl">
                        About Peskas Coasts
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[62vh] space-y-5 overflow-y-auto pr-2 leading-relaxed">
                    <p className="m-0 max-w-[65ch] text-[15px]">
                        Peskas Coasts is a research platform that brings GPS tracking data and fisheries
                        surveys together for coastal communities, researchers and policy makers, across the
                        coastal districts of Kenya, Zanzibar (Tanzania), Mozambique and Timor-Leste.
                    </p>

                    <Section title="What you can see">
                        <Pairs items={[
                            ['Fishing hotspots', 'Where fishers spend the most time and effort, from GPS tracks.'],
                            ['Catch rates', 'Catch per unit effort (CPUE) compared across coastal regions.'],
                            ['Prices and revenue', 'Fish prices and revenue over time.'],
                            ['Regional comparisons', 'Districts set side by side across countries.']
                        ]} />
                    </Section>

                    <Section title="Tools on the map">
                        <Pairs items={[
                            ['Fishing effort in 3D', `Column heights show fishing time in hexagonal cells of ${H3_EFFORT_GRID.areaLabel}.`],
                            ['Year filter', 'One year at a time, or the whole record pooled together.'],
                            ['Metric choice', 'Catch, revenue, price, fishers and boats.'],
                            ['District selection', 'Click a district to see its figures.']
                        ]} />
                    </Section>

                    <Section title="Where the data comes from">
                        <p className="m-0 mb-2 text-sm">Updated every day:</p>
                        <ul className="m-0 space-y-1.5 pl-5 text-sm">
                            <li><span className="font-semibold">GPS tracking:</span> {dynamicStats?.totalH3Cells ? `${dynamicStats.totalH3Cells.toLocaleString()} hexagonal cells of fishing time` : 'fishing time in hexagonal cells'}, counting only positions classified as fishing.</li>
                            <li><span className="font-semibold">Fisheries surveys:</span> catch, effort and economic data from {count(dynamicStats?.totalRegions, 'coastal regions')}.</li>
                            <li><span className="font-semibold">Administrative boundaries:</span> official district boundaries for {dynamicStats?.totalCountries ? count(dynamicStats.totalCountries, 'countries') : 'each country'}.</li>
                            <li><span className="font-semibold">Market data:</span> fish prices and revenue across all regions.</li>
                        </ul>
                    </Section>

                    <Section title="Who uses it">
                        <Pairs items={[
                            ['Marine researchers', 'Study fishing patterns and ecosystem impacts.'],
                            ['Policy makers', 'Design evidence-based fisheries management.'],
                            ['Conservation groups', 'Monitor fishing pressure in protected areas.'],
                            ['Fishing communities', 'Understand local fishing dynamics.']
                        ]} />
                    </Section>

                    <Section title="Getting started">
                        <ol className="m-0 space-y-1.5 pl-5 text-sm">
                            <li>Click any district on the map to see its fisheries data.</li>
                            <li>Switch between the map and satellite view with the map style button.</li>
                            <li>Switch the effort grid between 3D columns and a flat view.</li>
                            <li>Hover a cell or ground to see its figures and units.</li>
                            <li>Open <span className="font-semibold">Layer details</span> on the map, or the Methods page, for how each number is produced.</li>
                        </ol>
                    </Section>
                </div>

                <div className="mt-1 flex flex-wrap items-end justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">Peskas Coasts v{version}</span>
                        <span>Data updated every day{dynamicStats?.lastSyncDate && dynamicStats.lastSyncDate !== 'Loading...' ? ` · latest data: ${dynamicStats.lastSyncDate}` : ''}</span>
                    </div>
                    {totals.length > 0 && <div className="text-right">{totals.join(' · ')}</div>}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AboutModal;

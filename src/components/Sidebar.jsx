import { memo, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { SHARED_STYLES } from '../utils/gridLayerConfig';

const METRICS = [
  { id: 'mean_cpue', label: 'CPUE (kg/hour)', unit: 'kg/hour' },
  { id: 'mean_rpue', label: 'RPUE ($/hour)', unit: '$/hour' },
  { id: 'mean_price_kg', label: 'Price ($/kg)', unit: '$/kg' }
];

const Sidebar = memo(({
  isDarkTheme,
  isMobile,
  isOpen,
  activeTab,
  onTabChange,
  // Analysis props
  totalValue,
  opacity,
  onOpacityChange,
  // Selection props
  selectedDistricts,
  onClearSelection,
  selectedTotal,
  onRemoveDistrict,
  onExportSelection,
  // Charts props
  boundaries,
  // New props
  selectedMetric,
  onMetricChange,
  timeRange,
  onTimeRangeChange,
  minDate,
  maxDate
}) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  /* -----------------------------
   * Dynamic styles
   * ---------------------------*/
  const containerStyle = {
    width: isOpen ? (isMobile ? '100%' : '450px') : '0',
    height: '100%',
    minHeight: 0,
    transform: isOpen ? 'translateX(0)' : `translateX(${isMobile ? '-100%' : '-380px'})`,
    ...SHARED_STYLES.glassPanel(isDarkTheme),
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 1000,
    overflow: 'hidden'
  };

  const tabButtonBase = {
    flex: 1,
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  };

  const iconStyle = (active) => ({
    width: 16,
    height: 16,
    stroke: active ? '#fff' : isDarkTheme ? '#a0aec0' : '#4a5568',
  });

  const metricButtonBase = {
    flex: 1,
    padding: '8px 10px',
    fontSize: '12px',
    borderRadius: '8px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  };

  /* ----------------------------- */

  // Memoized region values for charts
  const regionValues = useMemo(() => {
    if (!boundaries || !boundaries.features) return [];
    return boundaries.features.map(f => ({
      name: f.properties.region || 'Unknown',
      value: f.properties[selectedMetric] || 0
    }));
  }, [boundaries, selectedMetric]);

  return (
    <div style={containerStyle}>
      {/* Sidebar Header (Tabs + Controls) */}
      <div style={{
        padding: '18px 20px 16px 20px',
        borderBottom: isDarkTheme ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        flexShrink: 0
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {['analysis', 'charts', 'selection'].map(tabId => {
            const active = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => onTabChange(tabId)}
                style={{
                  ...SHARED_STYLES.button.primary(isDarkTheme, active),
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  textTransform: 'capitalize'
                }}
              >
                {/* Simple inline svg icons for visual cue */}
                {tabId === 'analysis' && (
                  <svg style={iconStyle(active)} viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor"/>
                  </svg>
                )}
                {tabId === 'charts' && (
                  <svg style={iconStyle(active)} viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor"/>
                  </svg>
                )}
                {tabId === 'selection' && (
                  <svg style={iconStyle(active)} viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" stroke="currentColor"/>
                  </svg>
                )}
                <span style={{ lineHeight: 1 }}>{tabId.charAt(0).toUpperCase() + tabId.slice(1)}</span>
              </button>
            );
          })}
        </div>

        {/* Metric Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={SHARED_STYLES.text.label(isDarkTheme)}>METRIC</span>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {METRICS.map(metric => {
              const active = selectedMetric === metric.id;
              return (
                <button
                  key={metric.id}
                  onClick={() => onMetricChange(metric.id)}
                  style={{
                    ...SHARED_STYLES.button.primary(isDarkTheme, active),
                    flex: 1,
                    minWidth: 'fit-content',
                    fontSize: '12px',
                    padding: '6px 12px'
                  }}
                >
                  {metric.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Range Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={SHARED_STYLES.text.label(isDarkTheme)}>TIME RANGE</span>
            <span style={SHARED_STYLES.text.muted(isDarkTheme)}>{formatDate(timeRange[0])} - {formatDate(timeRange[1])}</span>
          </div>
          <div style={{ position: 'relative', height: '6px', backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)', borderRadius: '3px' }}>
            <div style={{ position: 'absolute', left: `${((timeRange[0] - minDate) / (maxDate - minDate)) * 100}%`, right: `${100 - ((timeRange[1] - minDate) / (maxDate - minDate)) * 100}%`, background: isDarkTheme ? '#3498db' : '#3182ce', height: '100%', borderRadius: '3px' }} />
            {/* Left Handle */}
            <input type="range" min={minDate} max={maxDate} value={timeRange[0]} onChange={(e)=>onTimeRangeChange([Number(e.target.value), timeRange[1]])} style={{ position: 'absolute', width: '100%', height: '14px', top: '-4px', opacity: 0, cursor: 'pointer' }} />
            {/* Right Handle */}
            <input type="range" min={minDate} max={maxDate} value={timeRange[1]} onChange={(e)=>onTimeRangeChange([timeRange[0], Number(e.target.value)])} style={{ position: 'absolute', width: '100%', height: '14px', top: '-4px', opacity: 0, cursor: 'pointer' }} />
          </div>
        </div>
      </div>

      {/* Sidebar Scrollable Content with SimpleBar */}
      <SimpleBar style={{ flex: 1, minHeight: 0, height: 0, padding: '20px 20px 40px 20px' }}>
        {/* Panels rendered as before */}
        {activeTab === 'analysis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Total value card */}
            <div style={{ background: isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff', borderRadius: '12px', padding: '18px 20px', boxShadow: isDarkTheme ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: isDarkTheme ? '#fff' : '#2d3748', lineHeight: 1 }}>{totalValue.toLocaleString()}</div>
              <div style={{ fontSize: '13px', color: isDarkTheme ? '#a0aec0' : '#4a5568', marginTop: 6 }}>Total District Value</div>
            </div>

            {/* Opacity slider */}
            <div style={{ background: isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff', borderRadius: '12px', padding: '18px 20px', boxShadow: isDarkTheme ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: isDarkTheme ? '#e2e8f0' : '#2d3748' }}>Map Opacity: {(opacity * 100).toFixed(0)}%</label>
              <input type="range" min={0} max={100} value={opacity * 100} onChange={(e)=>onOpacityChange(Number(e.target.value)/100)} style={{ width: '100%', accentColor: isDarkTheme ? '#3498db' : '#3182ce', cursor: 'pointer' }} />
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          (() => {
            if (!boundaries || !boundaries.features) {
              return <div style={{ padding: '20px', textAlign: 'center', color: isDarkTheme ? '#a0aec0' : '#4a5568' }}>Loading data…</div>;
            }

            const barOptions = {
              chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
              plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
              colors: ['#3498db'],
              dataLabels: { enabled: true, formatter: (val)=>val.toFixed(2), style: { colors: [isDarkTheme ? '#fff' : '#2d3748'] } },
              xaxis: { categories: regionValues.map(d=>d.name), labels: { style: { colors: isDarkTheme ? '#fff' : '#2d3748' } } },
              yaxis: { labels: { style: { colors: isDarkTheme ? '#fff' : '#2d3748' } } },
              theme: { mode: isDarkTheme ? 'dark' : 'light' }
            };

            const pieOptions = {
              chart: { type: 'donut', background: 'transparent' },
              labels: regionValues.map(d=>d.name),
              colors: ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'],
              legend: { position: 'bottom', labels: { colors: isDarkTheme ? '#fff' : '#2d3748' } },
              dataLabels: { enabled: true, formatter: (val)=>val.toFixed(1)+'%' },
              tooltip: { y: { formatter: (val)=>val.toFixed(2) } },
              theme: { mode: isDarkTheme ? 'dark' : 'light' }
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff', borderRadius: '12px', padding: '18px 20px', boxShadow: isDarkTheme ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ margin: 0, marginBottom: 12, fontSize: '15px', color: isDarkTheme ? '#e2e8f0' : '#2d3748' }}>Distribution by Region</h3>
                  <ReactApexChart options={barOptions} series={[{ name: selectedMetric, data: regionValues.map(d=>d.value) }]} type="bar" height={Math.max(200, regionValues.length * 38)} />
                </div>

                <div style={{ background: isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff', borderRadius: '12px', padding: '18px 20px', boxShadow: isDarkTheme ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ margin: 0, marginBottom: 12, fontSize: '15px', color: isDarkTheme ? '#e2e8f0' : '#2d3748' }}>Percentage Breakdown</h3>
                  <ReactApexChart options={pieOptions} series={regionValues.map(d=>d.value)} type="donut" height={300} />
                </div>
              </div>
            );
          })()
        )}

        {activeTab === 'selection' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Summary card */}
            <div style={{ background: isDarkTheme ? 'rgba(255,255,255,0.05)' : '#ffffff', borderRadius: '12px', padding: '18px 20px', boxShadow: isDarkTheme ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '14px', color: isDarkTheme ? '#a0aec0' : '#4a5568', marginBottom: 6 }}>Selected Total</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: isDarkTheme ? '#fff' : '#2d3748', lineHeight: 1 }}>{selectedTotal.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: isDarkTheme ? '#a0aec0' : '#4a5568', marginTop: 4 }}>{totalValue ? ((selectedTotal/totalValue)*100).toFixed(1) : 0}% of total</div>
            </div>

            {/* List of districts */}
            <div style={{ maxHeight: '40vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedDistricts.length === 0 ? (
                <div style={{ textAlign: 'center', color: isDarkTheme ? '#a0aec0' : '#4a5568', fontSize: '14px' }}>Click on districts to select them</div>
              ) : (
                selectedDistricts.map((d, idx) => (
                  <div key={d.properties.ADM2_PCODE} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: idx % 2 === 0 ? (isDarkTheme ? 'rgba(255,255,255,0.04)' : '#f7fafc') : 'transparent', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: isDarkTheme ? '#e2e8f0' : '#2d3748' }}>{d.properties.ADM2_PT || d.properties.ADM2_EN}</span>
                      <span style={{ fontSize: '12px', color: isDarkTheme ? '#a0aec0' : '#4a5568' }}>Value: {d.properties.value?.toLocaleString() || 0}</span>
                    </div>
                    <button onClick={()=>onRemoveDistrict(d.properties.ADM2_PCODE)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                  </div>
                ))
              )}
            </div>

            {/* Actions */}
            {selectedDistricts.length > 0 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={onClearSelection} style={{ flex: 1, padding: '10px', background: isDarkTheme ? 'rgba(255,255,255,0.08)' : '#edf2f7', color: isDarkTheme ? '#e2e8f0' : '#2d3748', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
                <button onClick={onExportSelection} style={{ flex: 2, padding: '10px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>Export</button>
              </div>
            )}
          </div>
        )}
      </SimpleBar>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar; 
// Process and filter H3 Effort data.
//
// Source rows are one per (h3_index, year). Selecting a single year yields at most
// one row per cell, but "all years" must be collapsed to one row per cell —
// otherwise a cell fished in several years is drawn once per year, stacked, and
// only the last-drawn year is visible.

const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

/**
 * Length in days of the slice of each year that falls inside the study period.
 *
 * `constancy` is `n_active_days ÷ (days of that row's year inside the study
 * period)`, so the denominator can be recovered from any row. Rows with few
 * active days are unreliable because `constancy` is stored rounded, so the
 * estimate is taken from the highest-activity rows of each year.
 *
 * @returns {{ perYear: Record<string, number>, total: number }}
 */
export const deriveStudyWindowDays = (h3Data) => {
  if (!Array.isArray(h3Data) || h3Data.length === 0) {
    return { perYear: {}, total: 0 };
  }

  const rowsByYear = new Map();
  for (const row of h3Data) {
    const activeDays = Number(row?.n_active_days);
    const constancy = Number(row?.constancy);
    if (!Number.isFinite(activeDays) || activeDays <= 0) continue;
    if (!Number.isFinite(constancy) || constancy <= 0) continue;
    const year = String(row.year);
    if (!rowsByYear.has(year)) rowsByYear.set(year, []);
    rowsByYear.get(year).push({ activeDays, constancy });
  }

  const perYear = {};
  let total = 0;
  for (const [year, rows] of rowsByYear) {
    const ranked = [...rows].sort((a, b) => b.activeDays - a.activeDays);
    const sampleSize = Math.max(1, Math.floor(ranked.length * 0.1));
    const estimates = ranked
      .slice(0, sampleSize)
      .map(({ activeDays, constancy }) => activeDays / constancy)
      .sort((a, b) => a - b);
    const days = Math.round(estimates[Math.floor(estimates.length / 2)]);
    if (days > 0) {
      perYear[year] = days;
      total += days;
    }
  }

  return { perYear, total };
};

/**
 * Collapse per-year rows into one row per cell.
 *
 * Counts are summed; every ratio is recomputed from the summed totals because
 * ratios are not additive. `avg_fidelity` is a per-trip mean, so it is combined
 * as a trip-weighted mean of the yearly means.
 */
export const aggregateH3EffortAcrossYears = (h3Data, studyWindowDays) => {
  if (!Array.isArray(h3Data) || h3Data.length === 0) return [];

  const totalStudyDays = Number.isFinite(studyWindowDays) && studyWindowDays > 0
    ? studyWindowDays
    : deriveStudyWindowDays(h3Data).total;

  const cells = new Map();
  for (const row of h3Data) {
    const key = row?.h3_index;
    if (!key) continue;

    const fishingHours = toFiniteNumber(row.fishing_hours);
    const uniqueTrips = toFiniteNumber(row.unique_trips);
    const activeDays = toFiniteNumber(row.n_active_days);

    const existing = cells.get(key);
    if (existing) {
      existing.fishing_hours += fishingHours;
      existing.unique_trips += uniqueTrips;
      existing.n_active_days += activeDays;
      existing.fidelityWeightSum += toFiniteNumber(row.avg_fidelity) * uniqueTrips;
      existing.tripWeight += uniqueTrips;
      existing.years.push(row.year);
    } else {
      cells.set(key, {
        h3_index: key,
        fishing_hours: fishingHours,
        unique_trips: uniqueTrips,
        n_active_days: activeDays,
        fidelityWeightSum: toFiniteNumber(row.avg_fidelity) * uniqueTrips,
        tripWeight: uniqueTrips,
        years: [row.year]
      });
    }
  }

  return Array.from(cells.values()).map((cell) => {
    const { fidelityWeightSum, tripWeight, years, ...totals } = cell;
    const { fishing_hours: hours, unique_trips: trips, n_active_days: days } = totals;
    return {
      ...totals,
      year: 'all',
      years_covered: years.length,
      avg_fidelity: tripWeight > 0 ? fidelityWeightSum / tripWeight : 0,
      avg_hours_per_day: days > 0 ? hours / days : 0,
      avg_visits_per_day: days > 0 ? trips / days : 0,
      hours_per_trip: trips > 0 ? hours / trips : 0,
      constancy: totalStudyDays > 0 ? days / totalStudyDays : 0
    };
  });
};

export const processH3EffortData = (h3Data, selectedYear) => {
  if (!h3Data || !Array.isArray(h3Data)) {
    return [];
  }

  const targetYear = parseInt(selectedYear, 10);
  if (!selectedYear || selectedYear === 'all' || Number.isNaN(targetYear)) {
    return aggregateH3EffortAcrossYears(h3Data);
  }

  return h3Data.filter(d => parseInt(d.year, 10) === targetYear);
};

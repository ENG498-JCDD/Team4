---
theme: dashboard
title: Mortgage Discrimination in North Carolina
toc: false
---

# Mapping Mortgage Inequality in North Carolina

<div class="note" label="Why This Data Exists">

**The Home Mortgage Disclosure Act (HMDA) exists because discrimination was exposed.** This dashboard reveals patterns of systemic inequality in lending, positioning Black and Latino borrowers differently than white borrowers, even at similar income levels.

</div>

```js
import * as d3 from "npm:d3";
```

```js
// Load the pre-calculated summary data from analysis
const denialByRace = FileAttachment("../analysis/hmda_denial_rates_by_race (1).csv").csv({typed: true});
const incomeGaps = FileAttachment("../analysis/hmda_income_controlled_gaps (1).csv").csv({typed: true});
const countyGaps = FileAttachment("../analysis/hmda_all_county_disparities.csv").csv({typed: true});
const yearTrends = FileAttachment("../analysis/hmda_year_trends.csv").csv({typed: true});
```

```js
// Extract key metrics for hero cards
const whiteRate = denialByRace.find(d => d.race_ethnicity === "White (non-Hispanic)")?.denial_rate_pct || 0;
const blackRate = denialByRace.find(d => d.race_ethnicity === "Black or African American")?.denial_rate_pct || 0;
const hispanicRate = denialByRace.find(d => d.race_ethnicity === "Hispanic/Latino")?.denial_rate_pct || 0;
const gap = blackRate - whiteRate;
const hispanicGap = hispanicRate - whiteRate;  // ADD THIS LINE
```

```js
// Define consistent color palette
const raceColors = {
  "White (non-Hispanic)": "#94a3b8",
  "Black or African American": "#ef4444",
  "Hispanic/Latino": "#f59e0b"
};
```

---

<!-- Hero Metrics -->
<div class="grid grid-cols-5">
  <div class="card">
    <h2>White Borrowers</h2>
    <span class="big">${whiteRate.toFixed(1)}%</span>
    <span class="muted">Denial Rate</span>
  </div>
  <div class="card">
    <h2>Black Borrowers</h2>
    <span class="big">${blackRate.toFixed(1)}%</span>
    <span class="muted">Denial Rate</span>
  </div>
  <div class="card">
    <h2>Hispanic/Latino Borrowers</h2>
    <span class="big">${hispanicRate.toFixed(1)}%</span>
    <span class="muted">Denial Rate</span>
  </div>
  <div class="card">
    <h2>Black-White Gap</h2>
    <span class="big">${gap.toFixed(1)}</span>
    <span class="muted">Percentage Points</span>
  </div>
  <div class="card">
    <h2>Hispanic-White Gap</h2>
    <span class="big">${hispanicGap.toFixed(1)}</span>
    <span class="muted">Percentage Points</span>
  </div>
</div>

---

## What Disparity Looks Like

<div class="note" label="What Statistics Reveal">

 Black borrowers get denied at nearly 3x the rate of white borrowers, and Hispanic/Latino borrowers also face significantly higher denial rates. The lending system treats people differently based on race.

</div>

```js
function denialRatesChart(data, {width}) {
  return Plot.plot({
    title: "Denial Rates by Race/Ethnicity in North Carolina (2020-2024)",
    width,
    height: 300,
    marginLeft: 200,
    x: {
      grid: true, 
      label: "Denial Rate (%)",
      domain: [0, Math.max(...data.map(d => parseFloat(d.denial_rate_pct))) * 1.1]
    },
    y: {label: null},
    color: {
      domain: Object.keys(raceColors),
      range: Object.values(raceColors)
    },
    marks: [
      Plot.barX(data, {
        y: "race_ethnicity",
        x: d => parseFloat(d.denial_rate_pct),
        fill: "race_ethnicity",
        sort: {y: "-x"},
        tip: {
          format: {
            y: true,
            x: d => `${d.toFixed(1)}%`,
            total_applications: d => `${d.toLocaleString()} applications`
          }
        }
      }),
      Plot.ruleX([0])
    ]
  });
}
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => denialRatesChart(denialByRace, {width}))}
  </div>
</div>

---

## Making More Money Doesn't Fix the Problem

<div class="note" label="Income Doesn't Explain the Gap">

Even among people earning over $100K, both Black and Hispanic/Latino borrowers face higher denial rates than white borrowers. The gaps show up at every income level—among low-earners and high-earners alike. Income doesn't explain these disparities. Discrimination does.

</div>

```js
// Prepare data for multi-line chart
const incomeLineData = incomeGaps.flatMap(d => [
  {
    income_bracket: d.income_bracket,
    rate: parseFloat(d.white_denial_pct),
    race: "White (non-Hispanic)"
  },
  {
    income_bracket: d.income_bracket,
    rate: parseFloat(d.black_denial_pct),
    race: "Black or African American"
  },
  {
    income_bracket: d.income_bracket,
    rate: parseFloat(d.hispanic_denial_pct),
    race: "Hispanic/Latino"
  }
]);

// Define income bracket order
const incomeBracketOrder = ["Under $50K", "$50-75K", "$75-100K", "$100-150K", "$150K+"];
```

```js
function incomeMultiLineChart(data, {width}) {
  return Plot.plot({
    title: "Denial Rates by Income Level and Race",
    width,
    height: 400,
    marginBottom: 80,
    x: {
      label: "Income Bracket",
      domain: incomeBracketOrder,
      tickRotate: -45
    },
    y: {
      grid: true,
      label: "Denial Rate (%)",
      domain: [0, Math.max(...data.map(d => d.rate)) * 1.1]
    },
    color: {
      domain: Object.keys(raceColors),
      range: Object.values(raceColors),
      legend: true
    },
    marks: [
      Plot.line(data, {
        x: "income_bracket",
        y: "rate",
        stroke: "race",
        strokeWidth: 3,
        marker: "circle",
        markerSize: 6,
        tip: true
      }),
      Plot.ruleY([0])
    ]
  });
}
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => incomeMultiLineChart(incomeLineData, {width}))}
  </div>
</div>

```js
// ADD: Show gaps for BOTH Black-White AND Hispanic-White
const gapData = incomeGaps.flatMap(d => [
  {
    income_bracket: d.income_bracket,
    gap: parseFloat(d.black_white_gap_pct),
    comparison: "Black-White Gap"
  },
  {
    income_bracket: d.income_bracket,
    gap: parseFloat(d.hispanic_white_gap_pct),
    comparison: "Hispanic-White Gap"
  }
]);
```

```js
function incomeGapBarChart(data, {width}) {
  return Plot.plot({
    title: "Racial Gaps Persist Across All Income Levels",
    width,
    height: 400,
    marginBottom: 80,
    marginLeft: 60,
    x: {
      label: "Income Bracket",
      domain: incomeBracketOrder,
      tickRotate: -45
    },
    y: {
      grid: true,
      label: "Denial Rate Gap (percentage points)",
      domain: [0, 30]
    },
    color: {
      domain: ["Black-White Gap", "Hispanic-White Gap"],
      range: ["#ef4444", "#f59e0b"],
      legend: true
    },
    marks: [
      // Large dots for each gap
      Plot.dot(data, {
        x: "income_bracket",
        y: "gap",
        fill: "comparison",
        r: 10,
        tip: {
          format: {
            x: true,
            y: d => `${d.toFixed(1)} percentage points`,
            comparison: true
          }
        }
      }),
      // Connecting lines to show trend
      Plot.line(data.filter(d => d.comparison === "Black-White Gap"), {
        x: "income_bracket",
        y: "gap",
        stroke: "#ef4444",
        strokeWidth: 2
      }),
      Plot.line(data.filter(d => d.comparison === "Hispanic-White Gap"), {
        x: "income_bracket",
        y: "gap",
        stroke: "#f59e0b",
        strokeWidth: 2
      }),
      Plot.ruleY([0])
    ]
  });
}
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => incomeGapBarChart(gapData, {width}))}
  </div>
</div>

---

## Geographic Patterns of Discrimination

<div class="note" label="Where Are Disparities Worst?">

Some counties have much bigger racial gaps than others. Below shows counties with the largest Black-White gaps (we're focusing on Black-White because there are enough applications to make reliable comparisons).

</div>

```js
// Filter counties with sufficient Black applications for reliable comparisons
const reliableCounties = countyGaps.filter(d => d.black_app_count >= 20);
const top20Counties = reliableCounties
  .sort((a, b) => parseFloat(b.black_white_gap_pct) - parseFloat(a.black_white_gap_pct))
  .slice(0, 20);
```

```js
function countyGapChart(data, {width}) {
  return Plot.plot({
    title: "Counties with Largest Black-White Denial Gaps (Top 20, min. 20 Black applications)",
    width,
    height: 600,
    marginLeft: 130,
    x: {
      grid: true,
      label: "Black-White Denial Gap (percentage points)"
    },
    y: {
      label: null
    },
    marks: [
      Plot.barX(data, {
        y: "county_name",
        x: d => parseFloat(d.black_white_gap_pct),
        fill: "#ef4444",
        sort: {y: "-x"},
        tip: {
          format: {
            y: true,
            x: d => `${d.toFixed(1)} pp gap`,
            black_denial_pct: d => `Black: ${d}%`,
            white_denial_pct: d => `White: ${d}%`,
            black_app_count: d => `${d} Black applications`
          }
        }
      }),
      Plot.ruleX([0])
    ]
  });
}
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => countyGapChart(top20Counties, {width}))}
  </div>
</div>

```js
const reliableHispanicCounties = countyGaps.filter(d => d.hispanic_app_count >= 20);
const top20HispanicCounties = reliableHispanicCounties
  .sort((a, b) => parseFloat(b.hispanic_white_gap_pct) - parseFloat(a.hispanic_white_gap_pct))
  .slice(0, 20);
```

```js
function hispanicCountyGapChart(data, {width}) {
  return Plot.plot({
    title: "Counties with Largest Hispanic-White Denial Gaps (Top 20, min. 20 Hispanic applications)",
    width,
    height: 600,
    marginLeft: 130,
    x: {
      grid: true,
      label: "Hispanic-White Denial Gap (percentage points)"
    },
    y: {
      label: null
    },
    marks: [
      Plot.barX(data, {
        y: "county_name",
        x: d => parseFloat(d.hispanic_white_gap_pct),
        fill: "#f59e0b",
        sort: {y: "-x"},
        tip: {
          format: {
            y: true,
            x: d => `${d.toFixed(1)} pp gap`,
            hispanic_denial_pct: d => `Hispanic: ${d}%`,
            white_denial_pct: d => `White: ${d}%`,
            hispanic_app_count: d => `${d} Hispanic applications`
          }
        }
      }),
      Plot.ruleX([0])
    ]
  });
}
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => hispanicCountyGapChart(top20HispanicCounties, {width}))}
  </div>
</div>

---

## Overlap of Black-White and Hispanic-White Disparities

<div class="note" label="Counties Affected by Both Gaps">

Some counties appear in the top 20 for both Black-White and Hispanic-White gaps. These counties have been disproportionately affected by racial disparities in mortgage denial rates.

</div>

```js
// Find counties that appear in BOTH top 20 lists
const blackTop20Names = new Set(top20Counties.map(d => d.county_name));
const hispanicTop20Names = new Set(top20HispanicCounties.map(d => d.county_name));

// Counties that appear in both
const intersectionCounties = countyGaps.filter(d => 
  blackTop20Names.has(d.county_name) && hispanicTop20Names.has(d.county_name)
);

// Calculate combined disparity score (average of both gaps)
const combinedDisparityCounties = intersectionCounties.map(d => ({
  county_name: d.county_name,
  black_white_gap: parseFloat(d.black_white_gap_pct),
  hispanic_white_gap: parseFloat(d.hispanic_white_gap_pct),
  combined_gap: (parseFloat(d.black_white_gap_pct) + parseFloat(d.hispanic_white_gap_pct)) / 2,
  black_apps: d.black_app_count,
  hispanic_apps: d.hispanic_app_count
})).sort((a, b) => b.combined_gap - a.combined_gap);
```

```js
function combinedCountyGapChart(data, {width}) {
  return Plot.plot({
    title: "Counties with Largest Combined Racial Disparities (Top 20, min. 20 applications each)",
    width,
    height: 600,
    marginLeft: 130,
    x: {
      grid: true,
      label: "Combined Denial Gap (percentage points)"
    },
    y: {
      label: null
    },
    marks: [
      Plot.barX(data, {
        y: "county_name",
        x: d => parseFloat(d.combined_gap),
        fill: "#a855f7",
        sort: {y: "-x"},
        tip: {
          format: {
            y: true,
            x: d => `${d.toFixed(1)} pp gap`,
            black_denial_pct: d => `Black: ${d}%`,
            white_denial_pct: d => `White: ${d}%`,
            hispanic_denial_pct: d => `Hispanic: ${d}%`,
            black_app_count: d => `${d} Black applications`,
            hispanic_app_count: d => `${d} Hispanic applications`
          }
        }
      }),
      Plot.ruleX([0])
    ]
  });
}
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => combinedCountyGapChart(combinedDisparityCounties, {width}))}
  </div>
</div>

---

## What Happened Over Time (2020-2024)

<div class="note" label="Are Things Getting Better?">

Did the pandemic make racial gaps worse? Are they narrowing over time? This chart tracks denial rates for white, Black, and Hispanic/Latino borrowers from 2020 to 2024 to see if these disparities are temporary or built into the system.

</div>

```js
function yearTrendsChart(data, {width}) {
  return Plot.plot({
    title: "Denial Rate Trends by Race (2020-2024)",
    width,
    height: 400,
    x: {
      label: "Year",
      tickFormat: d => String(d),
      ticks: [2020, 2021, 2022, 2023, 2024]  // Add this line to specify exact tick values
    },
    y: {
      grid: true,
      label: "Denial Rate (%)",
      domain: [0, Math.max(...data.map(d => parseFloat(d.denial_rate_pct))) * 1.1]
    },
    color: {
      domain: Object.keys(raceColors),
      range: Object.values(raceColors),
      legend: true
    },
    marks: [
      Plot.line(data, {
        x: "year",
        y: d => parseFloat(d.denial_rate_pct),
        stroke: "race_ethnicity",
        strokeWidth: 3,
        marker: "circle",
        markerSize: 6,
        tip: {
          format: {
            x: true,
            y: d => `${d.toFixed(1)}%`,
            total_applications: d => `${d.toLocaleString()} applications`
          }
        }
      }),
      Plot.ruleY([0])
    ]
  });
}
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => yearTrendsChart(yearTrends, {width}))}
  </div>
</div>

---

<div class="tip">

**Data Source:** Home Mortgage Disclosure Act (HMDA), 2020-2024  
**Geography:** North Carolina  
**Analysis Period:** ${[...new Set(yearTrends.map(d => d.year))].sort().join(", ")}

</div>
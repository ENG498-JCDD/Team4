---
theme: dashboard
title: Eviction Dashboard (SQ1)
toc: false
---

# Where in North Carolina are eviction filings and grants most concentrated, and who is most affected?

---

```js
import * as d3 from "npm:d3";
import * as topojson from "npm:topojson-client";
```

## Where are evictions concentrated?

This map shows the average eviction filing rate for each county in North Carolina from 2020 to 2023. The darker the red color, the higher the eviction rate in that county.

```js
// Load the dataset
const evictions = FileAttachment("../data/SQ1/clean_nc_evictions_demographics_2020_2023.csv").csv({typed: true});
const barData = FileAttachment("../analysis/eviction_rates_by_county_category.csv").csv({typed: true});

// Calculate average eviction rate per county (2020-2023)
const evictionMap = new Map(
  d3.rollups(
    await evictions, 
    v => d3.mean(v, d => d.evictions_per_1000), 
    d => d.jurisdiction
  )
);

// Load US Atlas and prepare NC counties
const us = await fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json").then((r) => r.json());

const us_counties = topojson.feature(us, us.objects.counties);
const ncFeatures = us_counties.features.filter((d) => d.id.startsWith("37"));
const ncOver = topojson.merge(us, us.objects.counties.geometries.filter(d => d.id.startsWith("37")));

const nc_map_data = {
    counties: {type: "FeatureCollection", features: ncFeatures},
    state: ncOver,
    domain: {type: "FeatureCollection", features: ncFeatures}
};
```

```js
// Map Visualization
Plot.plot({
    title: "Where are evictions concentrated?",
    subtitle: "Average Eviction Filing Rate per 1,000 Residents (2020-2023)",
    width: 2000,
    height: 1000,
    projection: {
        type: "conic-conformal",
        rotate: [80],
        domain: nc_map_data.domain
    },
    color: {
        scheme: "Reds",
        label: "Evictions per 1,000",
        legend: true
    },
    marks: [
        Plot.geo(nc_map_data.counties, {fill: "e0e0e0", stroke: "white", strokeWidth: 0.5}),
        Plot.geo(nc_map_data.counties, {
            stroke: "white",
            strokeWidth: 0.5,
            fill: d => {
                const rate = evictionMap.get(d.properties.name) || evictionMap.get(d.properties.name + " County");
                return rate;
            },
            title: d => {
                const rate = evictionMap.get(d.properties.name) || evictionMap.get(d.properties.name + " County");
                return rate 
                    ? `${d.properties.name} County\nRate: ${rate.toFixed(1)} per 1,000`
                    : `${d.properties.name} County\nNo Data`;
            },
            tip: true
        }),
        Plot.geo(nc_map_data.state, {stroke: "black", strokeWidth: 1.5, fill: "none"})
    ]
})
```

---

## Who is most affected

This chart shows how eviction rates differ based on the racial makeup of North Carolina counties. We grouped counties into categories based on whether a single racial group makes up more than 50% of the population:

- **Majority Black**: Counties where Black residents make up more than 50% of the population
- **Majority White**: Counties where White residents make up more than 50% of the population  
- **Diverse (No Single Majority)**: Counties where no single racial group makes up more than 50%

**Note:** You'll notice there's no "Majority Hispanic" category in the chart. That's because **no county in North Carolina has a Hispanic population exceeding 50%**. 

**What the numbers tell us:**

The chart reveals a troubling pattern. Counties with diverse populations face eviction rates nearly **3 times higher** (14.6 per 1,000 residents) than majority-white counties (5.0 per 1,000). Majority-Black counties fall in the middle at 10.4 per 1,000.

This means that in diverse communities, roughly **1 in 70 residents** faces an eviction filing each year, compared to just **1 in 200** in majority-white counties.

```js
// Categorize counties by racial composition
const getCategory = (data) => {
  const avgBlack = d3.mean(data, d => d.percent_black);
  const avgHisp = d3.mean(data, d => d.percent_hispanic);
  const avgWhite = d3.mean(data, d => d.percent_white);
  if (avgBlack > 50) return "Majority Black";
  if (avgHisp > 50) return "Majority Hispanic";
  if (avgWhite > 50) return "Majority White";
  return "Diverse (No Single Majority)";
};

// Calculate average rate per county and categorize
const countyCategories = d3.rollups(
  await evictions, 
  v => ({
    rate: d3.mean(v, d => d.evictions_per_1000),
    category: getCategory(v)
  }),
  d => d.jurisdiction
).map(([county, stats]) => stats);

// Aggregate by category
const barChartData = d3.rollups(
  countyCategories, 
  v => d3.mean(v, d => d.rate), 
  d => d.category
)
.map(([category, rate]) => ({category, rate}))
.sort((a, b) => b.rate - a.rate);
```

```js
// Vertical Bar Chart Visualization
Plot.plot({
  title: "Eviction Rate by County Racial Composition",
  width: 800,
  height: 500,
  marginBottom: 80,
  x: {label: null, tickRotate: -45},
  y: {label: "Avg Evictions per 1,000", grid: true},
  color: {scheme: "Tableau10", legend: false},
  marks: [
    Plot.barY(barChartData, {
      x: "category", 
      y: "rate", 
      fill: "category",
      tip: true
    }),
    Plot.text(barChartData, {
      x: "category", 
      y: "rate", 
      text: d => d.rate.toFixed(1), 
      dy: -8, 
      fill: "black"
    }),
    Plot.ruleY([0])
  ]
})
```

---

## Breaking Down Diverse Counties

In the "Diverse (No Single Majority)" counties that show the highest eviction rates, multiple racial groups live together. But what is the typical racial makeup of these high-eviction communities? The chart below shows the average demographic breakdown.

```js
// Filter for diverse counties only
const diverseCounties = countyCategories.filter(d => d.category === "Diverse (No Single Majority)");

// Get the underlying county data for diverse counties
const diverseCountyNames = new Set(
  d3.rollups(
    await evictions,
    v => getCategory(v),
    d => d.jurisdiction
  )
  .filter(([county, cat]) => cat === "Diverse (No Single Majority)")
  .map(([county]) => county)
);

const diverseData = (await evictions).filter(d => diverseCountyNames.has(d.jurisdiction));

// Calculate average demographics and eviction rate for diverse counties
const diverseDemographics = [
  {
    group: "Black Residents",
    percentage: d3.mean(diverseData, d => d.percent_black),
    eviction_rate: d3.mean(diverseData.filter(d => d.percent_black > 0), d => d.evictions_per_1000)
  },
  {
    group: "Hispanic Residents",
    percentage: d3.mean(diverseData, d => d.percent_hispanic),
    eviction_rate: d3.mean(diverseData.filter(d => d.percent_hispanic > 0), d => d.evictions_per_1000)
  },
  {
    group: "White Residents",
    percentage: d3.mean(diverseData, d => d.percent_white),
    eviction_rate: d3.mean(diverseData.filter(d => d.percent_white > 0), d => d.evictions_per_1000)
  }
];
```

```js
// Side-by-side comparison: Demographics vs Eviction Rates in Diverse Counties
Plot.plot({
  title: "Racial Composition in Diverse (High-Eviction) Counties",
  subtitle: "Average demographic breakdown and eviction rates",
  width: 900,
  height: 400,
  marginBottom: 60,
  x: {label: null},
  y: {label: "Percentage / Rate", grid: true},
  color: {scheme: "Tableau10", legend: true},
  marks: [
    Plot.barY(diverseDemographics, {
      x: "group",
      y: "percentage",
      fill: "group",
      tip: {format: {y: d => `${d.toFixed(1)}%`}}
    }),
    Plot.text(diverseDemographics, {
      x: "group",
      y: "percentage",
      text: d => `${d.percentage.toFixed(1)}%`,
      dy: -8,
      fill: "black"
    }),
    Plot.ruleY([0])
  ]
})
```

---

## How have eviction rates changed over time?

North Carolina, like most states, had an eviction moratorium during the COVID-19 pandemic that expired in 2021. This chart shows how eviction filing rates changed year by year across the entire state.

```js
// Load the pre-calculated trend data
const trendData = await FileAttachment("../analysis/eviction_trends_by_year.csv").csv({typed: true});

// Convert year to Date object for proper plotting
const trendDataFormatted = trendData.map(d => ({
  year: new Date(d.year, 0, 1),
  avg_eviction_rate: d.avg_eviction_rate
}));
```

```js
// Trend Line Visualization
Plot.plot({
  title: "Statewide Eviction Trends",
  subtitle: "Average Eviction Filing Rate Across North Carolina (2020-2023)",
  width: 900,
  height: 500,
  x: {
    label: "Year",
    tickFormat: "%Y"
  },
  y: {
    label: "Avg Evictions per 1,000 Residents",
    grid: true,
    domain: [0, d3.max(trendDataFormatted, d => d.avg_eviction_rate) * 1.1]
  },
  marks: [
    Plot.lineY(trendDataFormatted, {
      x: "year",
      y: "avg_eviction_rate",
      stroke: "steelblue",
      strokeWidth: 3,
      marker: "circle",
      markerSize: 100
    }),
    Plot.text(trendDataFormatted, {
      x: "year",
      y: "avg_eviction_rate",
      text: d => d.avg_eviction_rate.toFixed(1),
      dy: -15,
      fontSize: 14,
      fontWeight: "bold"
    }),
    Plot.ruleY([0])
  ]
})
```


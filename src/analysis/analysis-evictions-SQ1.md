---
toc: false
---

# Analysis: Eviction Filings and Demographics (SQ1)

```js
import {downloadAsCSV} from "../utils/utils.js";
```

This page analyzes the relationship between eviction filings and county demographics in North Carolina (2020-2023).

*Research Question:* Where in North Carolina are eviction filings most concentrated, and who is most affected?

*Analytical Approach:* We examine geographic patterns and demographic correlations at the county level to identify where eviction filings are concentrated and which communities bear the greatest burden. Our analysis is grounded in critical race theory and structural inequality frameworks, recognizing that evictions are not random events but reflect systemic patterns of power and oppression.

```js
const cleanData = FileAttachment("../data/SQ1/clean_nc_evictions_demographics_2020_2023.csv").csv({typed: true}); 
```

```js
cleanData
```

## Which counties have the highest eviction rates?

We calculate the average eviction rate for every county over the entire 2020-2023 period. This helps us identify counties with persistently high eviction levels, rather than just those with a single bad year. We rank them to find the "hotspots" for housing instability.

```js
// Top 15 counties by eviction rate (averaged across all years)
const avgEvictionsByCounty = d3.rollups(
  cleanData,
  v => ({
    avg_evictions_per_1000: d3.mean(v, d => d.evictions_per_1000),
    total_evictions: d3.sum(v, d => d.total_evictions),
    avg_population: d3.mean(v, d => d.total_population),
    years_reported: v.length
  }),
  d => d.jurisdiction
).map(([jurisdiction, stats]) => ({
  jurisdiction,
  ...stats
})).sort((a, b) => b.avg_evictions_per_1000 - a.avg_evictions_per_1000);

const topCounties = avgEvictionsByCounty.slice(0, 15);
```

```js
Inputs.table(topCounties, {
  columns: [
    "jurisdiction",
    "avg_evictions_per_1000",
    "total_evictions",
    "avg_population"
  ],
  format: {
    avg_evictions_per_1000: d => d.toFixed(2),
    total_evictions: d => d.toLocaleString(),
    avg_population: d => d.toLocaleString()
  },
  header: {
    jurisdiction: "County",
    avg_evictions_per_1000: "Avg Evictions per 1,000",
    total_evictions: "Total Evictions (2020-2023)",
    avg_population: "Avg Population"
  }
})
```
---

## How geographically concentrated are evictions?

We sum up the total evictions in the top 10 and top 20 counties and compare that to the state total. This tells us if the eviction crisis is widespread or if it is highly concentrated in just a few specific areas. High concentration suggests that resources should be targeted to specific jurisdictions.

```js
const totalEvictionsAllCounties = d3.sum(cleanData, d => d.total_evictions);
const evictionsTop10 = d3.sum(avgEvictionsByCounty.slice(0, 10), d => d.total_evictions);
const evictionsTop20 = d3.sum(avgEvictionsByCounty.slice(0, 20), d => d.total_evictions);

const concentrationStats = {
  total_evictions: totalEvictionsAllCounties,
  total_counties: avgEvictionsByCounty.length,
  top_10_evictions: evictionsTop10,
  top_10_percent: (evictionsTop10 / totalEvictionsAllCounties * 100).toFixed(1),
  top_20_evictions: evictionsTop20,
  top_20_percent: (evictionsTop20 / totalEvictionsAllCounties * 100).toFixed(1)
};
```
```js
display(html`<div style="padding: 20px; background: #f0f0f0; border-radius: 8px;">
  <h3>Geographic Concentration of Evictions (2020-2023)</h3>
  <p><strong>Total Evictions:</strong> ${concentrationStats.total_evictions.toLocaleString()}</p>
  <p><strong>Total Counties:</strong> ${concentrationStats.total_counties}</p>
  <p><strong>Top 10 Counties:</strong> ${concentrationStats.top_10_evictions.toLocaleString()} evictions (${concentrationStats.top_10_percent}% of all evictions)</p>
  <p><strong>Top 20 Counties:</strong> ${concentrationStats.top_20_evictions.toLocaleString()} evictions (${concentrationStats.top_20_percent}% of all evictions)</p>
</div>`)
```

---

## Do majority-Black or majority-Hispanic counties have higher eviction rates?

We group counties into categories based on their racial demographics (e.g., "Majority Black" means >50% Black population). Then we calculate the average eviction rate for each group. This allows us to directly compare outcomes across different types of communities. It helps answer whether counties with larger minority populations face higher rates of housing instability compared to majority-white counties.

```js
// Categorize counties by racial majority (using average across years)
const countyCategorization = avgEvictionsByCounty.map(county => {
  // Get demographic data for this county (use most recent year or average)
  const countyData = cleanData.filter(d => d.jurisdiction === county.jurisdiction);
  const avgPercentBlack = d3.mean(countyData, d => d.percent_black);
  const avgPercentHispanic = d3.mean(countyData, d => d.percent_hispanic);
  const avgPercentWhite = d3.mean(countyData, d => d.percent_white);
  
  let category;
  if (avgPercentBlack > 50) category = "Majority Black";
  else if (avgPercentHispanic > 50) category = "Majority Hispanic";
  else if (avgPercentWhite > 50) category = "Majority White";
  else category = "Diverse (No Single Majority)";
  
  return {
    jurisdiction: county.jurisdiction,
    category: category,
    avg_evictions_per_1000: county.avg_evictions_per_1000,
    avg_percent_black: avgPercentBlack,
    avg_percent_hispanic: avgPercentHispanic,
    avg_percent_white: avgPercentWhite
  };
});

// Calculate summary stats by category
const byCategory = d3.rollups(
  countyCategorization,
  v => ({
    count: v.length,
    avg_eviction_rate: d3.mean(v, d => d.avg_evictions_per_1000),
    median_eviction_rate: d3.median(v, d => d.avg_evictions_per_1000),
    min_eviction_rate: d3.min(v, d => d.avg_evictions_per_1000),
    max_eviction_rate: d3.max(v, d => d.avg_evictions_per_1000)
  }),
  d => d.category
).map(([category, stats]) => ({
  category,
  ...stats
}));
```

```js
Inputs.table(byCategory, {
  columns: [
    "category",
    "count",
    "avg_eviction_rate",
    "median_eviction_rate",
    "min_eviction_rate",
    "max_eviction_rate"
  ],
  format: {
    avg_eviction_rate: d => d.toFixed(2),
    median_eviction_rate: d => d.toFixed(2),
    min_eviction_rate: d => d.toFixed(2),
    max_eviction_rate: d => d.toFixed(2)
  },
  header: {
    category: "County Category",
    count: "# Counties",
    avg_eviction_rate: "Avg Rate per 1,000",
    median_eviction_rate: "Median Rate",
    min_eviction_rate: "Min Rate",
    max_eviction_rate: "Max Rate"
  }
})
```

---

## Did eviction rates increase or decrease over time?

We calculate the statewide eviction rate for each year from 2020 to 2023. This period covers the COVID-19 pandemic, eviction moratoriums (2020-2021), and the return to "normal" (2022-2023). Tracking these trends helps us understand how policy interventions impacted eviction filings and whether rates are currently rising or falling.

```js
// Calculate statewide average eviction rate by year
const byYear = d3.rollups(
  cleanData,
  v => ({
    avg_eviction_rate: d3.mean(v, d => d.evictions_per_1000),
    total_evictions: d3.sum(v, d => d.total_evictions),
    total_population: d3.sum(v, d => d.total_population),
    counties_reported: v.length
  }),
  d => d.year
).map(([year, stats]) => ({
  year,
  ...stats,
  statewide_rate: (stats.total_evictions / stats.total_population * 1000).toFixed(2)
})).sort((a, b) => a.year - b.year);
```
```js
Inputs.table(byYear, {
  columns: [
    "year",
    "avg_eviction_rate",
    "statewide_rate",
    "total_evictions",
    "counties_reported"
  ],
  format: {
    year: d => d.toString(),
    avg_eviction_rate: d => d.toFixed(2),
    total_evictions: d => d.toLocaleString()
  },
  header: {
    year: "Year",
    avg_eviction_rate: "Avg County Rate per 1,000",
    statewide_rate: "Statewide Rate per 1,000",
    total_evictions: "Total Evictions",
    counties_reported: "Counties"
  }
})
```

---

## Did disparities between high-Black and low-Black counties change over time?

We compare the eviction rates of the "Highest 25% Black" counties against the "Lowest 25% Black" counties for each year. We want to know if the disparity between Black and White communities is getting better, getting worse, or staying the same over time.

```js
// Categorize counties into quartiles by % Black population
const blackQuartiles = avgEvictionsByCounty.map(county => {
  const countyData = cleanData.filter(d => d.jurisdiction === county.jurisdiction);
  const avgPercentBlack = d3.mean(countyData, d => d.percent_black);
  return { jurisdiction: county.jurisdiction, avgPercentBlack };
}).sort((a, b) => a.avgPercentBlack - b.avgPercentBlack);

const quartileSize = Math.floor(blackQuartiles.length / 4);
const q1Counties = new Set(blackQuartiles.slice(0, quartileSize).map(d => d.jurisdiction));
const q4Counties = new Set(blackQuartiles.slice(-quartileSize).map(d => d.jurisdiction));

// Calculate trends for lowest vs highest quartile
const trendsByQuartile = d3.rollups(
  cleanData.filter(d => q1Counties.has(d.jurisdiction) || q4Counties.has(d.jurisdiction)),
  v => ({
    avg_eviction_rate: d3.mean(v, d => d.evictions_per_1000),
    quartile: q1Counties.has(v[0].jurisdiction) ? "Lowest 25% Black" : "Highest 25% Black"
  }),
  d => q1Counties.has(d.jurisdiction) ? "Q1" : "Q4",
  d => d.year
).flatMap(([quartile, yearData]) => 
  yearData.map(([year, stats]) => ({
    quartile: stats.quartile,
    year,
    avg_eviction_rate: stats.avg_eviction_rate
  }))
).sort((a, b) => a.year - b.year);
```
```js
Inputs.table(trendsByQuartile, {
  columns: ["quartile", "year", "avg_eviction_rate"],
  format: {
    year: d => d.toString(),
    avg_eviction_rate: d => d.toFixed(2)
  },
  header: {
    quartile: "County Group",
    year: "Year",
    avg_eviction_rate: "Avg Eviction Rate per 1,000"
  }
})
```
---

## Download Analysis Results

```js
view(
  downloadAsCSV(
    async () => {
      const csv = d3.csvFormat(topCounties);
      return new Blob([csv], { type: "text/csv" });
    },
    "top_counties_eviction_rates.csv",
    "Download Top Counties Data"
  )
);
```

```js
view(
  downloadAsCSV(
    async () => {
      const csv = d3.csvFormat(byCategory);
      return new Blob([csv], { type: "text/csv" });
    },
    "eviction_rates_by_county_category.csv",
    "Download County Category Comparison"
  )
);
```

```js
view(
  downloadAsCSV(
    async () => {
      const csv = d3.csvFormat(byYear);
      return new Blob([csv], { type: "text/csv" });
    },
    "eviction_trends_by_year.csv",
    "Download Yearly Trends"
  )
);
```

```js
view(
  downloadAsCSV(
    async () => {
      const csv = d3.csvFormat(trendsByQuartile);
      return new Blob([csv], { type: "text/csv" });
    },
    "eviction_disparities_trends.csv",
    "Download Quartile Trends"
  )
);
```










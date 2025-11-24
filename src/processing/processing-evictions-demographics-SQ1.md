---
toc: false
---

# Processing Eviction + Demographics Data for SQ1

```js
import {downloadAsCSV} from "../utils/utils.js";
```

This page loads and merges eviction filing data with county demographics (2020-2023) to prepare for our SQ1 analysis.

**Research Question:** Where in North Carolina are eviction filings and grants most concentrated, and who is most affected?

**Processing Steps:**
1. Load eviction filing data (2020-2023)
2. Load demographic data for each year (2020-2023)
3. Aggregate evictions by county and year
4. Merge with demographics
5. Calculate eviction rates per capita
6. Export clean combined dataset


## Load Eviction Data

```js
const evictions = FileAttachment("../data/SQ1/SQ1_eviction_filing_data.csv").csv({typed: true});
```

```js
evictions
```


## Load Demographics Data (2020-2023)

```js
const demo2020 = FileAttachment("../data/SQ1/SQ1_demographic_data_2020 - 2020.csv").csv({typed: true});
const demo2021 = FileAttachment("../data/SQ1/SQ1_demographic_data_2021 - 2021.csv").csv({typed: true});
const demo2022 = FileAttachment("../data/SQ1/SQ1_demographic_data_2022 - 2022.csv").csv({typed: true});
const demo2023 = FileAttachment("../data/SQ1/SQ1_demographic_data_2023 - 2023.csv").csv({typed: true});
```

**2020**
```js
demo2020
```
**2021**
```js
demo2021
```
**2022**
```js
demo2022
```
**2023**
```js
demo2023
```

## Filter 1: Parse Eviction Dates and Extract Year

```js
const evictionsWithYear = evictions.map(d => {
  // Parse date string (format: "1/1/2020")
  const dateParts = d.month_start_date.split('/');
  const year = parseInt(dateParts[2]);
  
  return {
    ...d,
    year: year,
    month: parseInt(dateParts[0])
  };
});
```

```js
evictionsWithYear
```

## Filter 2: Remove Invalid/Missing Data

```js
const cleanEvictions = evictionsWithYear.filter(d => 
  d.jurisdiction != null && 
  d.jurisdiction !== "" &&
  d.filings_count != null &&
  d.filings_count > 0 &&
  d.year >= 2020 &&
  d.year <= 2023
);
```

```js
cleanEvictions
```

## Aggregate Evictions by County and Year

Group eviction filings by jurisdiction and year to get annual totals.

```js
const evictionsByCountyYear = d3.rollups(
  cleanEvictions,
  v => ({
    total_filings: d3.sum(v, d => d.filings_count),
    months_reported: v.length
  }),
  d => d.jurisdiction,
  d => d.year
);

// Flatten to array of objects
const evictionTotals = evictionsByCountyYear.flatMap(([jurisdiction, yearData]) => {
  return yearData.map(([year, stats]) => ({
    jurisdiction,
    year,
    total_evictions: stats.total_filings,
    months_reported: stats.months_reported
  }));
});
```

```js
evictionTotals
```

## Clean Demographics Data

Remove % signs and convert to numbers for easier analysis.

```js
function cleanDemographics(data, year) {
  return data.map(d => {
    // Get the count value - remove commas and convert to number
    const countBlack = d.count_Black ? parseInt(d.count_Black.toString().replace(/,/g, '')) : 0;
    const countHispanic = d.count_Hispanic ? parseInt(d.count_Hispanic.toString().replace(/,/g, '')) : 0;
    const countWhite = d.count_White ? parseInt(d.count_White.toString().replace(/,/g, '')) : 0;
    const countAsian = d.count_Asian ? parseInt(d.count_Asian.toString().replace(/,/g, '')) : 0;
    const countNative = d.count_Native ? parseInt(d.count_Native.toString().replace(/,/g, '')) : 0;
    const countPacific = d.count_Pacific ? parseInt(d.count_Pacific.toString().replace(/,/g, '')) : 0;
    const countOther = d.count_Other ? parseInt(d.count_Other.toString().replace(/,/g, '')) : 0;
    const countMultiracial = d.count_Multiracial ? parseInt(d.count_Multiracial.toString().replace(/,/g, '')) : 0;
    
    // Get the percentage value - remove % sign and convert to number
    const percentBlack = d.percent_Black ? parseFloat(d.percent_Black.toString().replace('%', '')) : 0;
    const percentHispanic = d.percent_Hispanic ? parseFloat(d.percent_Hispanic.toString().replace('%', '')) : 0;
    const percentWhite = d.percent_White ? parseFloat(d.percent_White.toString().replace('%', '')) : 0;
    const percentAsian = d.percent_Asian ? parseFloat(d.percent_Asian.toString().replace('%', '')) : 0;
    const percentNative = d.percent_Native ? parseFloat(d.percent_Native.toString().replace('%', '')) : 0;
    const percentPacific = d.percent_Pacific ? parseFloat(d.percent_Pacific.toString().replace('%', '')) : 0;
    const percentOther = d.percent_Other ? parseFloat(d.percent_Other.toString().replace('%', '')) : 0;
    const percentMultiracial = d.percent_Multiracial ? parseFloat(d.percent_Multiracial.toString().replace('%', '')) : 0;
    
    return {
      jurisdiction: d.jurisdiction,
      year: year,
      count_black: countBlack,
      count_hispanic: countHispanic,
      count_white: countWhite,
      count_asian: countAsian,
      count_native: countNative,
      count_pacific: countPacific,
      count_other: countOther,
      count_multiracial: countMultiracial,
      percent_black: percentBlack,
      percent_hispanic: percentHispanic,
      percent_white: percentWhite,
      percent_asian: percentAsian,
      percent_native: percentNative,
      percent_pacific: percentPacific,
      percent_other: percentOther,
      percent_multiracial: percentMultiracial
    };
  });
}

const cleanDemo2020 = cleanDemographics(demo2020, 2020);
const cleanDemo2021 = cleanDemographics(demo2021, 2021);
const cleanDemo2022 = cleanDemographics(demo2022, 2022);
const cleanDemo2023 = cleanDemographics(demo2023, 2023);

// Combine all years
const allDemographics = [...cleanDemo2020, ...cleanDemo2021, ...cleanDemo2022, ...cleanDemo2023];
```

```js
allDemographics
```

## Merge Evictions with Demographics

Match each county-year eviction record with its demographic data.

```js
const merged = evictionTotals.map(eviction => {
  // Find matching demographic record for same county and year
  const demo = allDemographics.find(d => 
    d.jurisdiction === eviction.jurisdiction && 
    d.year === eviction.year
  );
  
  if (!demo) {
    console.warn(`No demographic data for ${eviction.jurisdiction} in ${eviction.year}`);
    return null;
  }
  
  // Calculate total population
  const total_population = demo.count_black + demo.count_hispanic + demo.count_white + 
                          demo.count_asian + demo.count_native + demo.count_pacific + 
                          demo.count_other + demo.count_multiracial;
  
  // Calculate eviction rate per 1,000 residents
  const evictions_per_1000 = total_population > 0 ? 
    (eviction.total_evictions / total_population) * 1000 : 0;
  
  return {
    jurisdiction: eviction.jurisdiction,
    year: eviction.year,
    total_evictions: eviction.total_evictions,
    months_reported: eviction.months_reported,
    total_population: total_population,
    evictions_per_1000: evictions_per_1000,
    // Demographics
    count_black: demo.count_black,
    count_hispanic: demo.count_hispanic,
    count_white: demo.count_white,
    count_asian: demo.count_asian,
    count_native: demo.count_native,
    count_pacific: demo.count_pacific,
    count_other: demo.count_other,
    count_multiracial: demo.count_multiracial,
    percent_black: demo.percent_black,
    percent_hispanic: demo.percent_hispanic,
    percent_white: demo.percent_white,
    percent_asian: demo.percent_asian,
    percent_native: demo.percent_native,
    percent_pacific: demo.percent_pacific,
    percent_other: demo.percent_other,
    percent_multiracial: demo.percent_multiracial
  };
}).filter(d => d !== null);
```

```js
display(`Successfully merged ${merged.length} county-year records`)
display(`Failed to merge ${evictionTotals.length - merged.length} records (missing demographic data)`)
```

## Filter 3: Keep Only Complete Years

Some counties may have partial data (not all 12 months). Flag these for transparency.

```js
const cleanData = merged.map(d => ({
  ...d,
  is_complete_year: d.months_reported === 12,
  data_completeness: ((d.months_reported / 12) * 100).toFixed(1) + "%"
}));
```

```js
const completeYears = cleanData.filter(d => d.is_complete_year);
const incompleteYears = cleanData.filter(d => !d.is_complete_year);

display(`${completeYears.length} county-years with complete data (12 months)`)
display(`${incompleteYears.length} county-years with incomplete data`)
```

## Preview Clean Data

```js
Inputs.table(cleanData.slice(0, 20), {
  columns: [
    "jurisdiction",
    "year",
    "total_evictions",
    "evictions_per_1000",
    "data_completeness",
    "percent_black",
    "percent_hispanic",
    "percent_white"
  ],
  format: {
    year: d => d.toString(),
    total_evictions: d => d.toLocaleString(),
    evictions_per_1000: d => d.toFixed(2),
    percent_black: d => d.toFixed(1) + "%",
    percent_hispanic: d => d.toFixed(1) + "%",
    percent_white: d => d.toFixed(1) + "%"
  },
  width: {
    jurisdiction: 150
  }
})
```

**jurisdiction**: County name in North Carolina 
**year**: Year of the data (2020, 2021, 2022, or 2023) 
**total_evictions**: Total number of eviction filings in that county-year 
**evictions_per_1000**: Eviction rate per 1,000 residents (adjusted for population size) 
**data_completeness**: Percentage of months with data (100% = all 12 months) 
**percent_black**: % of population that is Black/African American 
**percent_hispanic**: % of population that is Hispanic/Latino 
**percent_white**: % of population that is White 

## Download Clean Dataset

```js
view(
  downloadAsCSV(
    async () => {
      const csvString = d3.csvFormat(cleanData);
      return new Blob([csvString], { type: "text/csv" });
    },
    "nc_evictions_demographics_clean_2020_2023.csv",
    "Download Clean Data"
  )
);
```

**Ready for analysis:**

Based on the above, we can use the clean data to analyse the following: 

- Geographic patterns (which counties have highest eviction rates)
- Relationship between race/ethnicity and evictions
- Temporal trends (how evictions changed 2020-2023)
- Evictions per 1,000 residents
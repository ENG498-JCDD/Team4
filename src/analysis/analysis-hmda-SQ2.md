---
toc: true
---

# SQ2 Analysis: Mortgage Discrimination in North Carolina

```js
import {downloadAsCSV} from "../utils/utils.js";
```

This analysis looks at whether Black and Latino borrowers face higher mortgage denial rates and interest rates compared to white borrowers at similar income levels in North Carolina. We're checking three things: overall gaps, gaps when income is the same, and where these gaps show up geographically.

---

## Load Clean HMDA Data

```js
// Load data and convert year and county_code to strings to prevent comma formatting
const rawData = await FileAttachment("../data/SQ2-Data/clean_hmda_2020_2024.csv").csv({typed: true});
const data = rawData.map(d => ({
  ...d,
  year: String(d.year),
  county_code: String(d.county_code)
}));
```

```js
// Preview of the raw data before any transformations
Inputs.table(data.slice(0, 10))
```

**What We're Loading:** This is the cleaned HMDA dataset with mortgage applications from North Carolina, 2020-2024. Each row is one mortgage application with info about whether it was approved or denied, the applicant's race, income, the loan amount, interest rate, and location.

**What Each Column Means:**
- **year**: The year the application was submitted
- **action_taken**: The numeric code for what happened to the application (1 = approved, 3 = denied, etc.)
- **action**: Plain English version of action_taken (Approved, Denied, etc.)
- **denied**: Binary flag (1 if denied, 0 if approved)
- **race_ethnicity**: The applicant's racial/ethnic identity
- **income_1000s**: The applicant's annual income in thousands of dollars (so 100 means $100,000)
- **loan_amount_1000s**: How much money they're trying to borrow, in thousands
- **interest_rate**: The interest rate on the loan (for approved loans)
- **county_code**: The FIPS code identifying which NC county
- **county_name**: The actual county name
- **census_tract**: Smaller geographic area within the county
- **loan_term**: How many months to pay back the loan (360 = 30 years)
- **property_value**: How much the house is worth
- **loan_to_value_ratio**: What percentage of the home's value they're borrowing

---

## Map County Codes to Names

```js
// North Carolina county FIPS codes mapped to county names
// HMDA data only includes numeric codes, so we need this lookup table
const countyMapping = new Map([
  ["37001", "Alamance"],
  ["37003", "Alexander"],
  ["37005", "Alleghany"],
  ["37007", "Anson"],
  ["37009", "Ashe"],
  ["37011", "Avery"],
  ["37013", "Beaufort"],
  ["37015", "Bertie"],
  ["37017", "Bladen"],
  ["37019", "Brunswick"],
  ["37021", "Buncombe"],
  ["37023", "Burke"],
  ["37025", "Cabarrus"],
  ["37027", "Caldwell"],
  ["37029", "Camden"],
  ["37031", "Carteret"],
  ["37033", "Caswell"],
  ["37035", "Catawba"],
  ["37037", "Chatham"],
  ["37039", "Cherokee"],
  ["37041", "Chowan"],
  ["37043", "Clay"],
  ["37045", "Cleveland"],
  ["37047", "Columbus"],
  ["37049", "Craven"],
  ["37051", "Cumberland"],
  ["37053", "Currituck"],
  ["37055", "Dare"],
  ["37057", "Davidson"],
  ["37059", "Davie"],
  ["37061", "Duplin"],
  ["37063", "Durham"],
  ["37065", "Edgecombe"],
  ["37067", "Forsyth"],
  ["37069", "Franklin"],
  ["37071", "Gaston"],
  ["37073", "Gates"],
  ["37075", "Graham"],
  ["37077", "Granville"],
  ["37079", "Greene"],
  ["37081", "Guilford"],
  ["37083", "Halifax"],
  ["37085", "Harnett"],
  ["37087", "Haywood"],
  ["37089", "Henderson"],
  ["37091", "Hertford"],
  ["37093", "Hoke"],
  ["37095", "Hyde"],
  ["37097", "Iredell"],
  ["37099", "Jackson"],
  ["37101", "Johnston"],
  ["37103", "Jones"],
  ["37105", "Lee"],
  ["37107", "Lenoir"],
  ["37109", "Lincoln"],
  ["37111", "McDowell"],
  ["37113", "Macon"],
  ["37115", "Madison"],
  ["37117", "Martin"],
  ["37119", "Mecklenburg"],
  ["37121", "Mitchell"],
  ["37123", "Montgomery"],
  ["37125", "Moore"],
  ["37127", "Nash"],
  ["37129", "New Hanover"],
  ["37131", "Northampton"],
  ["37133", "Onslow"],
  ["37135", "Orange"],
  ["37137", "Pamlico"],
  ["37139", "Pasquotank"],
  ["37141", "Pender"],
  ["37143", "Perquimans"],
  ["37145", "Person"],
  ["37147", "Pitt"],
  ["37149", "Polk"],
  ["37151", "Randolph"],
  ["37153", "Richmond"],
  ["37155", "Robeson"],
  ["37157", "Rockingham"],
  ["37159", "Rowan"],
  ["37161", "Rutherford"],
  ["37163", "Sampson"],
  ["37165", "Scotland"],
  ["37167", "Stanly"],
  ["37169", "Stokes"],
  ["37171", "Surry"],
  ["37173", "Swain"],
  ["37175", "Transylvania"],
  ["37177", "Tyrrell"],
  ["37179", "Union"],
  ["37181", "Vance"],
  ["37183", "Wake"],
  ["37185", "Warren"],
  ["37187", "Washington"],
  ["37189", "Watauga"],
  ["37191", "Wayne"],
  ["37193", "Wilkes"],
  ["37195", "Wilson"],
  ["37197", "Yadkin"],
  ["37199", "Yancey"]
]);

// Apply the mapping to add readable county names to each record
const dataWithCountyNames = data.map(d => ({
  ...d,
  county_name: countyMapping.get(d.county_code) || "Unknown"
}));
```

```js
// Preview with county names now included
Inputs.table(dataWithCountyNames.slice(0, 10))
```

**Why We're Doing This:** The raw HMDA data only includes county codes (like "37119"), not actual county names. We're mapping those codes to real names (like "Mecklenburg") so our analysis is readable.

---

```js
// Dataset summary statistics
const uniqueYears = [...new Set(dataWithCountyNames.map(d => d.year))].sort();
({
  total_applications: dataWithCountyNames.length.toLocaleString(),
  years_covered: uniqueYears.join(", "),
  racial_groups: [...new Set(dataWithCountyNames.map(d => d.race_ethnicity))],
  overall_denial_rate: (d3.mean(dataWithCountyNames, d => d.denied) * 100).toFixed(1) + "%",
  unique_counties: [...new Set(dataWithCountyNames.map(d => d.county_name))].filter(c => c !== "Unknown").length
})
```

**Decision Note:** We're starting with the clean data that's already been filtered to North Carolina, 2020-2024. This includes applications from three racial/ethnic groups, and we can see right away what the overall denial rate looks like across everyone. We've mapped all county codes to their actual names.

---

## Layer 1: Overall Denial and Pricing Gaps by Race

### Denial Rates by Race/Ethnicity

```js
// Group applications by race/ethnicity and calculate denial statistics
const denialByRace = d3.rollup(
  dataWithCountyNames,
  v => ({
    total: v.length,
    denied: d3.sum(v, d => d.denied),
    denial_rate: d3.mean(v, d => d.denied)
  }),
  d => d.race_ethnicity
);

// Convert to table format with counts and percentages
const denialSummary = Array.from(denialByRace.entries())
  .map(([race, stats]) => ({
    race_ethnicity: race,
    total_applications: stats.total,
    denied_count: stats.denied,
    approved_count: stats.total - stats.denied,
    denial_rate_pct: (stats.denial_rate * 100).toFixed(2),
    denial_rate_numeric: stats.denial_rate
  }))
  .sort((a, b) => b.denial_rate_numeric - a.denial_rate_numeric);
```

```js
Inputs.table(denialSummary)
```

**What This Shows:** These are the baseline denial rates. If one group has a way higher rate than another, that's our first red flag that something's off.

---

### Calculate Disparity Gaps

```js
// Extract denial rates for comparison
const whiteRate = denialSummary.find(d => d.race_ethnicity === "White (non-Hispanic)")?.denial_rate_numeric ?? 0;
const blackRate = denialSummary.find(d => d.race_ethnicity === "Black or African American")?.denial_rate_numeric ?? 0;
const hispanicRate = denialSummary.find(d => d.race_ethnicity === "Hispanic/Latino")?.denial_rate_numeric ?? 0;
```

```js
// Calculate absolute gaps between groups
({
  white_denial_rate: (whiteRate * 100).toFixed(2) + "%",
  black_denial_rate: (blackRate * 100).toFixed(2) + "%",
  hispanic_denial_rate: (hispanicRate * 100).toFixed(2) + "%",
  black_white_gap: ((blackRate - whiteRate) * 100).toFixed(2) + " percentage points",
  hispanic_white_gap: ((hispanicRate - whiteRate) * 100).toFixed(2) + " percentage points"
})
```

**What This Shows:** This is the headline number. The gap is measured in **percentage points**, which is different from percent. If white borrowers are denied at 10% and Black borrowers at 34%, the gap is 24 percentage points (34% minus 10%). That's not a 24% increase—it's an absolute difference of 24 points. In other words, a Black applicant faces 24 additional denials for every 100 applications compared to a white applicant. That's huge.

---

### Interest Rates for Approved Loans

```js
// Filter to approved applications with recorded interest rates
const approvedLoans = dataWithCountyNames.filter(d => d.action === "Approved" && d.interest_rate != null);

// Calculate interest rate statistics by race
const interestByRace = d3.rollup(
  approvedLoans,
  v => ({
    median_rate: d3.median(v, d => d.interest_rate),
    mean_rate: d3.mean(v, d => d.interest_rate),
    count: v.length,
    min_rate: d3.min(v, d => d.interest_rate),
    max_rate: d3.max(v, d => d.interest_rate)
  }),
  d => d.race_ethnicity
);

// Format as comparison table
const interestSummary = Array.from(interestByRace.entries())
  .map(([race, stats]) => ({
    race_ethnicity: race,
    median_interest_rate: stats.median_rate.toFixed(3),
    mean_interest_rate: stats.mean_rate.toFixed(3),
    approved_count: stats.count,
    rate_range: stats.min_rate.toFixed(3) + "% - " + stats.max_rate.toFixed(3) + "%"
  }))
  .sort((a, b) => parseFloat(b.median_interest_rate) - parseFloat(a.median_interest_rate));
```

```js
Inputs.table(interestSummary)
```

**What This Shows:** Even if you get approved, are some groups paying more? A higher interest rate means bigger monthly payments and way more money paid over 30 years. That's another way the system can lock people out of wealth building.

---

## Layer 2: Gaps When Controlling for Income

This is where we test whether the gaps are because of income differences or because the lending system itself treats people differently based on race.

### Create Income Brackets

```js
// Categorize each application into an income bracket
function addIncomeBracket(record) {
  const income = record.income_1000s;
  let bracket;
  
  if (income < 50) bracket = "Under $50K";
  else if (income < 75) bracket = "$50-75K";
  else if (income < 100) bracket = "$75-100K";
  else if (income < 150) bracket = "$100-150K";
  else bracket = "$150K+";
  
  return { ...record, income_bracket: bracket };
}

const dataWithBrackets = dataWithCountyNames.map(addIncomeBracket);
```

**Decision Note:** Now we can ask: among people making $75-100K, do Black applicants get denied more than white applicants? If yes, that's not about income—that's about race.

### Denial Rates by Race AND Income

```js
// Cross-tabulate denial rates by both race and income bracket
const denialByRaceIncome = d3.rollup(
  dataWithBrackets,
  v => ({
    total: v.length,
    denied: d3.sum(v, d => d.denied),
    denial_rate: d3.mean(v, d => d.denied)
  }),
  d => d.race_ethnicity,
  d => d.income_bracket
);

// Flatten nested data into rows for easier comparison
const intersectionalData = [];
for (const [race, incomes] of denialByRaceIncome) {
  for (const [bracket, stats] of incomes) {
    intersectionalData.push({
      race_ethnicity: race,
      income_bracket: bracket,
      total_applications: stats.total,
      denied_count: stats.denied,
      denial_rate_pct: (stats.denial_rate * 100).toFixed(2),
      denial_rate_numeric: stats.denial_rate
    });
  }
}

// Sort by income level, then denial rate within each bracket
const incomeBracketOrder = ["Under $50K", "$50-75K", "$75-100K", "$100-150K", "$150K+"];
intersectionalData.sort((a, b) => {
  const aIndex = incomeBracketOrder.indexOf(a.income_bracket);
  const bIndex = incomeBracketOrder.indexOf(b.income_bracket);
  if (aIndex !== bIndex) return aIndex - bIndex;
  return b.denial_rate_numeric - a.denial_rate_numeric;
});
```

```js
Inputs.table(intersectionalData)
```

**What This Shows:** Now we can see denial rates broken down by both race and income. If gaps show up in every income bracket, that means the problem isn't just economic—it's baked into how lending decisions get made.

---

### Visualize Income-Controlled Gaps

```js
// Calculate racial gaps within each income bracket
const gapsByIncome = {};

for (const bracket of incomeBracketOrder) {
  const bracketData = intersectionalData.filter(d => d.income_bracket === bracket);
  
  const whiteData = bracketData.find(d => d.race_ethnicity === "White (non-Hispanic)");
  const blackData = bracketData.find(d => d.race_ethnicity === "Black or African American");
  const hispanicData = bracketData.find(d => d.race_ethnicity === "Hispanic/Latino");
  
  const whiteRate = whiteData?.denial_rate_numeric ?? 0;
  const blackRate = blackData?.denial_rate_numeric ?? 0;
  const hispanicRate = hispanicData?.denial_rate_numeric ?? 0;
  
  gapsByIncome[bracket] = {
    income_bracket: bracket,
    white_denial_pct: (whiteRate * 100).toFixed(2),
    black_denial_pct: (blackRate * 100).toFixed(2),
    hispanic_denial_pct: (hispanicRate * 100).toFixed(2),
    black_white_gap_pct: ((blackRate - whiteRate) * 100).toFixed(2),
    hispanic_white_gap_pct: ((hispanicRate - whiteRate) * 100).toFixed(2)
  };
}
```

```js
Inputs.table(Object.values(gapsByIncome))
```

**What This Shows:** If gaps appear in most or all brackets, the system is treating people differently based on race. If gaps disappear, it means structural factors (like wealth or credit access) explain the baseline disparities.

---

## Layer 3: Geographic and Temporal Variation

### All Counties by Loan Volume

```js
// Aggregate loan counts by county
const countiesByVolume = d3.rollup(
  dataWithBrackets,
  v => ({
    total: v.length,
    denied: d3.sum(v, d => d.denied),
    denial_rate: d3.mean(v, d => d.denied)
  }),
  d => d.county_name
);

// Convert to array and sort by volume
const allCounties = Array.from(countiesByVolume.entries())
  .filter(([county]) => county !== "Unknown")
  .sort((a, b) => b[1].total - a[1].total)
  .map(([county, stats]) => ({
    county_name: county,
    total_loans: stats.total,
    denied_count: stats.denied,
    overall_denial_rate_pct: (stats.denial_rate * 100).toFixed(2)
  }));
```

```js
Inputs.table(allCounties)
```

**Decision Note:** This shows all NC counties ranked by loan volume. The bigger counties (like Mecklenburg and Wake) have way more applications, which makes their numbers more reliable. Smaller counties might have rates that jump around year to year just because they don't have many applications.

---

### Racial Disparities Across All Counties

```js
// Calculate denial rates by county and race for all counties
const allCountyRaceDisparities = d3.rollup(
  dataWithBrackets.filter(d => d.county_name !== "Unknown"),
  v => ({
    total: v.length,
    denied: d3.sum(v, d => d.denied),
    denial_rate: d3.mean(v, d => d.denied)
  }),
  d => d.county_name,
  d => d.race_ethnicity
);

// Compute gaps for each county
const allCountyGaps = [];
for (const [county, races] of allCountyRaceDisparities) {
  const white_rate = races.get("White (non-Hispanic)")?.denial_rate ?? 0;
  const black_rate = races.get("Black or African American")?.denial_rate ?? 0;
  const hispanic_rate = races.get("Hispanic/Latino")?.denial_rate ?? 0;
  
  const white_count = races.get("White (non-Hispanic)")?.total ?? 0;
  const black_count = races.get("Black or African American")?.total ?? 0;
  const hispanic_count = races.get("Hispanic/Latino")?.total ?? 0;
  
  allCountyGaps.push({
    county_name: county,
    white_denial_pct: (white_rate * 100).toFixed(1),
    black_denial_pct: (black_rate * 100).toFixed(1),
    hispanic_denial_pct: (hispanic_rate * 100).toFixed(1),
    black_white_gap_pct: ((black_rate - white_rate) * 100).toFixed(1),
    hispanic_white_gap_pct: ((hispanic_rate - white_rate) * 100).toFixed(1),
    white_app_count: white_count,
    black_app_count: black_count,
    hispanic_app_count: hispanic_count
  });
}

// Sort by biggest Black-white gap
allCountyGaps.sort((a, b) => parseFloat(b.black_white_gap_pct) - parseFloat(a.black_white_gap_pct));
```

```js
Inputs.table(allCountyGaps)
```

**What This Shows:** Which counties have the worst disparities? Are gaps concentrated in specific places, or is this a statewide pattern? We're including application counts so you can see which counties have enough data to trust the numbers.

---

### Trends Over Time

```js
// Track denial rates by year and race
const denialByYearRace = d3.rollup(
  dataWithBrackets,
  v => ({
    total: v.length,
    denied: d3.sum(v, d => d.denied),
    denial_rate: d3.mean(v, d => d.denied)
  }),
  d => d.year,
  d => d.race_ethnicity
);

// Convert to flat array for time series analysis
const yearTrends = [];
for (const [year, races] of denialByYearRace) {
  for (const [race, stats] of races) {
    yearTrends.push({
      year: year,  
      race_ethnicity: race,
      denial_rate_pct: (stats.denial_rate * 100).toFixed(2),
      denial_rate_numeric: stats.denial_rate,
      total_applications: stats.total
    });
  }
}

yearTrends.sort((a, b) => parseInt(a.year) - parseInt(b.year));
```

```js
Inputs.table(yearTrends)
```

**What This Shows:** Are things getting better or worse? Did the pandemic change anything? This table tracks how denial rates shifted from 2020 to 2024.

---

## Data Quality Notes

```js
// Assess completeness of key fields
({
  records_with_interest_rate: dataWithCountyNames.filter(d => d.interest_rate != null).length,
  records_missing_interest_rate: dataWithCountyNames.filter(d => d.interest_rate == null).length,
  records_with_unknown_county: dataWithCountyNames.filter(d => d.county_name === "Unknown").length,
  records_with_unknown_race: dataWithCountyNames.filter(d => d.race_ethnicity === "Unknown").length
})
```

**Decision Note:** We're tracking where we have missing info. If a bunch of records don't have interest rates or county names, that limits what we can say confidently.

---

## Export Summary Tables for Reports

### Table 1: Denial Rate Disparities

```js
view(
  downloadAsCSV(
    async () => {
      const csv = d3.csvFormat(denialSummary);
      return new Blob([csv], { type: "text/csv" });
    },
    "hmda_denial_rates_by_race.csv",
    "Download: Denial Rates by Race"
  )
);
```

### Table 2: Income-Controlled Analysis

```js
view(
  downloadAsCSV(
    async () => {
      const csv = d3.csvFormat(Object.values(gapsByIncome));
      return new Blob([csv], { type: "text/csv" });
    },
    "hmda_income_controlled_gaps.csv",
    "Download: Gaps When Controlling for Income"
  )
);
```

### Table 3: All County-Level Disparities

```js
view(
  downloadAsCSV(
    async () => {
      const csv = d3.csvFormat(allCountyGaps);
      return new Blob([csv], { type: "text/csv" });
    },
    "hmda_all_county_disparities.csv",
    "Download: All County-Level Gaps"
  )
);
```

### Table 4: Year Trends

```js
view(
  downloadAsCSV(
    async () => {
      const csv = d3.csvFormat(yearTrends);
      return new Blob([csv], { type: "text/csv" });
    },
    "hmda_year_trends.csv",
    "Download: Denial Trends Over Time"
  )
);
```

---

## We've now calculated:

1. **Overall disparities:** Do denial rates and interest rates vary by race?
2. **Income-controlled disparities:** Do gaps still exist even when people make the same amount?
3. **Geographic variation:** Where are disparities worst?
4. **Temporal trends:** Is this getting better or worse over the years?

These tables will feed into the report pages where we tell the story of what this data means for housing access and wealth building in North Carolina.
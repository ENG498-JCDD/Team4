
# Processing HMDA Mortgage Data (2020-2024)

```js
import {downloadAsCSV} from "../utils/utils.js";
```

This page loads and filters all 5 years of NC mortgage data according to our research criteria.

**Filters applied:**
- Action taken: Approved (1) or Denied (3)
- Lien status: First lien only
- Occupancy: Principal residence 
- Loan type: Conventional
- Race: White (non-Hispanic), Black, Hispanic/Latino
- Income: Valid income data only
- County: Valid county code only

### Load All Years

```js
const hmda2020 = FileAttachment("../data/SQ2-Data/state_NC_loan_types_1_loan_purposes_2020.csv").csv({typed: true});
const hmda2021 = FileAttachment("../data/SQ2-Data/state_NC_loan_types_1_loan_purposes_2021.csv").csv({typed: true});
const hmda2022 = FileAttachment("../data/SQ2-Data/loan_purposes_1_loan_types_1_state_NC_2022.csv").csv({typed: true});
const hmda2023 = FileAttachment("../data/SQ2-Data/state_NC_loan_types_1_loan_purposes_1_2023.csv").csv({typed: true});
const hmda2024 = FileAttachment("../data/SQ2-Data/state_NC_loan_types_1_loan_purposes_2024.csv").csv({typed: true});
```

**Why we're loading all 5 years:** We need to look at trends over time to see if mortgage discrimination patterns are getting better, worse, or staying the same. The pandemic happened in 2020, and housing markets went crazy after that, so tracking 2020-2024 lets us see the full picture.

```js
// Combine all years into one dataset
const allYears = [
  ...hmda2020.map(d => ({...d, year: 2020})),
  ...hmda2021.map(d => ({...d, year: 2021})),
  ...hmda2022.map(d => ({...d, year: 2022})),
  ...hmda2023.map(d => ({...d, year: 2023})),
  ...hmda2024.map(d => ({...d, year: 2024}))
];
```

```js
display(`Total records loaded: ${allYears.length.toLocaleString()}`)
```
**Note on why we use `display()` instead of just printing the variable:** We're using `display()` with a formatted message because `allYears` contains hundreds of thousands of rows. If we just wrote `allYears` here, Observable would try to render the entire dataset as a giant table, which would freeze your browser. The `display()` function lets us show just the count with context ("Total records loaded: 245,873") instead of overwhelming you with raw data. We'll show previews of the actual data in controlled ways (like the first 100 rows) later in the page.

### Apply Filters

**Why we're filtering:** The raw HMDA data includes all kinds of loans - refinances, second mortgages, vacation homes, etc. We only want home purchase loans for people's main residence, and we're focusing on the three racial/ethnic groups where we see the biggest gaps in North Carolina.

```js
const filteredLoans = allYears.filter(d => {
  
  // 1. OUTCOMES: Approved (1) or Denied (3) only
  const isRelevantOutcome = d.action_taken === 1 || d.action_taken === 3;
  
  // 2. LIEN STATUS: First lien only
  const isFirstLien = d.lien_status === 1;
  
  // 3. OCCUPANCY: Principal residence only
  const isPrincipalResidence = d.occupancy_type === 1;
  
  // 4. RATE TYPE: Already filtered (loan_type === 1 in filename)
  const isFixedRate = true;
  
  // 5. RACE: White (non-Hispanic), Black, or Hispanic/Latino
  const isRelevantRace = (
    (d.derived_ethnicity === "Hispanic or Latino") ||
    (d.derived_ethnicity === "Not Hispanic or Latino" && d.derived_race === "White") ||
    (d.derived_race === "Black or African American")
  );
  
  // 6. INCOME: Must have valid income data
  const hasIncome = d.income !== null && 
                    d.income !== "NA" && 
                    d.income !== "" && 
                    d.income !== "Exempt" &&
                    +d.income > 0;
  
  // 7. COUNTY CODE: Must have county information
  const hasCounty = d.county_code !== null && 
                    d.county_code !== "" && 
                    d.county_code !== "NA";
  
  return isRelevantOutcome && isFirstLien && isPrincipalResidence && 
         isFixedRate && isRelevantRace && hasIncome && hasCounty;
});
```

```js
display(`Filtered to ${filteredLoans.length.toLocaleString()} loans (${((filteredLoans.length / allYears.length) * 100).toFixed(1)}% of total)`)
```

### Create Clean Dataset

**What we're doing here:** The raw HMDA data has like 100 columns with confusing names. We're picking out just the variables we need for our analysis and giving them clearer names.

```js
const cleanData = filteredLoans.map(d => {
  
  // Standardize race/ethnicity into 3 categories
  let raceEthnicity;
  if (d.derived_ethnicity === "Hispanic or Latino") {
    raceEthnicity = "Hispanic/Latino";
  } else if (d.derived_race === "White") {
    raceEthnicity = "White (non-Hispanic)";
  } else {
    raceEthnicity = "Black or African American";
  }
  
  return {
    // Year
    year: String(d.year),
    
    // Outcome
    action_taken: d.action_taken,
    action: d.action_taken === 1 ? "Approved" : "Denied",
    denied: d.action_taken === 3 ? 1 : 0,
    
    // Demographics
    race_ethnicity: raceEthnicity,
    
    // Financial
    income_1000s: +d.income,
    loan_amount_1000s: +d.loan_amount,
    interest_rate: +d.interest_rate || null,
    
    // Location
    county_code: String(d.county_code),
    county_name: d.county_name || "Unknown",
    census_tract: String(d.census_tract),
    
    // Loan characteristics
    loan_term: +d.loan_term || null,
    property_value: +d.property_value || null,
    loan_to_value_ratio: d.loan_amount && d.property_value ? 
      (+d.loan_amount / +d.property_value * 100).toFixed(1) : null
  };
});
```

### Data Preview

**Note:** The table below shows only the first 100 rows to avoid crashing your browser. The full dataset has hundreds of thousands of loans - you can see the exact count above and download the complete file below. 

**Why it's all 2020 data in the preview:** The data is sorted by year, so the first 100 rows happen to all be from 2020. But all 5 years are in the full dataset - see the year breakdown below to confirm.

```js
// Preview clean data
Inputs.table(cleanData.slice(0, 100))
```

```js
display(`Clean dataset ready: ${cleanData.length.toLocaleString()} loans`)
```

### Verify All Years Are Included

**Making sure we didn't lose any years:** Since the preview only shows 2020, let's count how many loans we have from each year to confirm everything loaded correctly.

```js
const yearCounts = d3.rollup(
  cleanData,
  v => v.length,
  d => d.year
);

display("Records per year:");
display(Array.from(yearCounts, ([year, count]) => ({
  year,
  count: count.toLocaleString()
})))
```

### Download Processed Data

```js
view(
  downloadAsCSV(
    async () => {
      const csvString = d3.csvFormat(cleanData);
      return new Blob([csvString], { type: "text/csv" });
    },
    "nc_hmda_clean_2020_2024.csv",
    "Download Clean HMDA Data"
  )
);
```


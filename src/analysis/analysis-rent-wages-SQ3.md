# Analyzing Rent and Wage Data 

```js
import {downloadAsCSV} from "../utils/utils.js"
import * as d3 from "npm:d3";
import * as Plot from "npm:@observablehq/plot";
import * as topojson from "npm:topojson-client";
```

```js
// Import the joined data from SQ3-Data
const joinedData = FileAttachment("../data/SQ3-Data/nc_wages_and_rent_2020_2025.csv").csv({typed: true})

```

**This Analysis looks at the affordability gap in North Carolina from 2020 to 2025. We are comparing the rate of increase for rent against the rate of wage growth**
```js
// Process the data
const data = joinedData.map(d => {

const rent = +d.avg_monthly_rent
// Remove the commas from currency strings
const pay = String(d.avg_annual_pay).replace(/,/g, "")
// Calculate annualized rent and monthly pay for comparison
const annualRent = rent > 0 ? rent * 12 : null

const monthlyPay = pay > 0 ? pay / 12 : null

return {
    year: String(d.year),
    county_fips: d.county_fips,
    county_name: d.county_name,
    avg_annual_pay: pay,
    avg_monthly_rent: rent,
    avg_monthly_wage: monthlyPay,
    annual_rent: annualRent
}
})
```
**We Calculate annual rent to compare directly against the average annual pay provided by the BLS**

```js
Inputs.table(data.slice(0, 10))
```
**We aggregate data to the state level to see the macro trend. We use 2020 as our base year to calculate growth**
```js
// Group data by year to get statewide averages
const yearlyGroups = d3.groups(data, d => d.year).sort((a,b) => a[0] - b[0])

const averages = yearlyGroups.map(([year, rows]) => {
    const valid = rows.filter(d => {
        if (d.avg_annual_pay > 0) {
            if (d.annual_rent > 0) {
                return true
            }
        }
        return false
    })
return {
    year: year,
    avg_wage: d3.mean(valid, d => d.avg_annual_pay),
    avg_rent: d3.mean(valid, d => d.annual_rent)
}
})
// Calculate the growth percentage relative to 2020
const base = averages[0]

const growthAnalysis = averages.map(d => {
    const wageDiff = d.avg_wage - base.avg_wage
    const wageGrowth = (wageDiff / base.avg_wage) * 100

    const rentDiff = d.avg_rent - base.avg_rent
    const rentGrowth = (rentDiff / base.avg_rent) * 100

    const gap = rentGrowth - wageGrowth

    return {
        year: d.year,
        "Avg. Yearly Wage": d.avg_wage.toFixed(0),
        "Avg. Yearly Rent": d.avg_rent.toFixed(0),
        "Wage Growth": wageGrowth.toFixed(1),
        "Rent Growth": rentGrowth.toFixed(1),
        "Gap": gap.toFixed(1)
    }
})


```
**This establishes the affordability gap. If the gap is positive, rent inflation is outpacing wage growth statewide**
```js
Inputs.table(growthAnalysis)
```
**State averages don't account for local specificity. Here, we calculate the specific growth gap for every individual county we have data for between 2020 and 2024**
```js
// Group by county name to isolate specific locations
const countyGroups = d3.rollup(data, v => v, d => d.county_name)
const countyAnalysis = []

for (const [county, rows] of countyGroups) {
// Find the start and end points for this specific dataset
    const data2020 = rows.find(d => d.year === "2020")
    const data2024 = rows.find(d => d.year === "2024")

    if (data2020 && data2024 && data2020.avg_monthly_rent > 0 &&data2020.avg_annual_pay > 0) {
        // Calculate % Growth
        const wageGrowth = ((data2024.avg_annual_pay - data2020.avg_annual_pay) / data2020.avg_annual_pay) * 100
        const rentGrowth = ((data2024.avg_monthly_rent - data2020.avg_monthly_rent) / data2020.avg_monthly_rent) * 100


        countyAnalysis.push({
            county_name: county,
            start_wage: data2020.avg_annual_pay,
            end_wage: data2024.avg_annual_pay,
            wage_growth_pct: wageGrowth,
            rent_growth_pct: rentGrowth,
            gap_pts: rentGrowth - wageGrowth
        })

 }

}
// Sort counties by the largest Gap
countyAnalysis.sort((a, b) => b.gap_pts - a.gap_pts)
```

```js
Inputs.table(countyAnalysis, {
  header: {
    gap_pts: "Gap (Rent - Wage)",
    rent_growth_pct: "Rent Growth %",
    wage_growth_pct: "Wage Growth %"
  },
  format: {
    wage_growth_pct: x => x.toFixed(1) + "%",
    rent_growth_pct: x => x.toFixed(1) + "%",
    gap_pts: x => x.toFixed(1) + "%",
    start_wage: x => d3.format("$,.0f")(x),
    end_wage: x => d3.format("$,.0f")(x)
  }
})
```
**What this shows: this ranks counties by severity. The top counties are where the housing market has most aggressively outpaced wages**

```js
view(
    downloadAsCSV(
 async() => {
    const csv = d3.csvFormat(countyAnalysis)
    return new Blob([csv], {type: "text/csv"})
 },
 "sq3_county_affordability_gap.csv",
 "Download: County Gap Analysis"
))
```

```js
view(
    downloadAsCSV(
        async() => {
            const csv = d3.csvFormat(growthAnalysis)
            return new Blob([csv], {type: "text/csv"})
        },
        "sq3_statewide_rent_wage_trends.csv",
        "Download: Statewide Trends"
    )
)
```



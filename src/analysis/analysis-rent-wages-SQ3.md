# Analyzing Rent and Wage Data 

```js
import {downloadAsCSV} from "../utils/utils.js"
<<<<<<< Updated upstream
=======
import * as d3 from "npm:d3";
import * as Plot from "npm:@observablehq/plot";
import * as topojson from "npm:topojson-client";
>>>>>>> Stashed changes
```

```js
const joinedData = FileAttachment("../data/SQ3-Data/nc_wages_and_rent_2020_2025.csv").csv({typed: true})

```


```js
const data = joinedData.map(d => {

const rent = +d.avg_monthly_rent

const pay = String(d.avg_annual_pay).replace(/,/g, "")

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

```js
Inputs.table(data.slice(0, 10))
```

```js
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
<<<<<<< Updated upstream
        "Avg Yearly Rent": d.avg_rent.toFixed(0),
=======
        "Avg. Yearly Rent": d.avg_rent.toFixed(0),
>>>>>>> Stashed changes
        "Wage Growth": wageGrowth.toFixed(1),
        "Rent Growth": rentGrowth.toFixed(1),
        "Gap": gap.toFixed(1)
    }
})


```

```js
Inputs.table(growthAnalysis)
```
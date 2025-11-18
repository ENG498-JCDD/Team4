# Updated processing for SQ3

```js
// Load the CSV's
const wages2020 = FileAttachment("data/2020wages.csv").csv({typed: true})
const wages2021 = FileAttachment("data/2021wages.csv").csv({typed: true})
const wages2022 = FileAttachment("data/2022wages.csv").csv({typed: true})
const wages2023 = FileAttachment("data/2023wages.csv").csv({typed: true})
const wages2024 = FileAttachment("data/2024wages.csv").csv({typed: true})

```

```js
// Create an array for all of the wage years
const allWages = [
  ...wages2020.map(d => ({...d, year: 2020})),
  ...wages2021.map(d => ({...d, year: 2021})),
  ...wages2022.map(d => ({...d, year: 2022})),
  ...wages2023.map(d => ({...d, year: 2023})),
  ...wages2024.map(d => ({...d, year: 2024}))
]
```

```js
// Create a new array by filtering the data for only NC Counties
const cleanWages = allWages
.filter(d => {
  const isNC = d.St === 37
  const isCounty = d["Area Type"] === "County"
  const isTotalOwn = d.Ownership === "Total Covered"
  const isTotalIndustry = d.Industry === "10 Total, all industries"
  
  
 // NC is #37

return isNC && isCounty && isTotalOwn && isTotalIndustry 
})

// Add the State Fips code to the 3 digit county code
.map(d => {
 const countyCode = ("00" + String(parseInt(d.Cnty, 10))).slice(-3);
 const countyFIPS = "37" + countyCode;
    
    // Return the new data classified about 
    return {
      year: String(d.Year),
      county_fips: countyFIPS,
      county_name: d.Area,
      avg_annual_pay: d["Annual Average Pay"],
      avg_annual_weekly_wage: d["Annual Average Weekly Wage"]

}
})

display(`Filtered to ${cleanWages.length.toLocaleString()} NC county-year wage records.`)

```

```js
// Show the cleanWages table
Inputs.table(cleanWages)
```



```js
const zillowRent = FileAttachment("data/County_zori_uc_sfrcondomfr_sm_sa_month (1).csv").csv({typed: true})
```

```js
const ncZillow = zillowRent.filter( d => d.StateName === "NC")



const specificRent = ncZillow.flatMap(county => {
  return Object.entries(county)
    .filter(([key, value]) => key.startsWith("202") && value)
    .map(([key, value]) => {
      const countyCode = ("00" + String(parseInt(county.MunicipalCodeFIPS, 10))).slice(-3);
      return {
        county_fips: "37" + countyCode,
        year: key.slice(0, 4),
        rent: value
      };
    });
});


```

```js
Inputs.table(specificRent)
```

```js
const rentMap = d3.rollup(
  specificRent,
  v => d3.mean(v, d => d.rent),
  d => d.year,
  d => d.county_fips
)

const annualRent = []
  for (const [year, counties] of rentMap) {
    for (const [fips, avgRent] of counties) {
      annualRent.push({
        year: year,
        county_fips: fips,
        avg_monthly_rent: avgRent
  
      })
    }
  }

display (`Processed ${annualRent.length.toLocaleString()} annual rent records`)

```

```js
const combinedData = []

for (const wageRow of cleanWages) {

  let matchingRentRow = null 
  
  for (const rentRow of annualRent) {
    if (rentRow.year === wageRow.year && rentRow.county_fips === wageRow.county_fips) {
      matchingRentRow = rentRow
    }
  }
  const rent = matchingRentRow ? matchingRentRow.avg_monthly_rent : null

  combinedData.push({
    year: wageRow.year,
    county_fips: wageRow.county_fips,
    county_name: wageRow.county_name,
    avg_annual_pay: wageRow.avg_annual_pay,
    avg_annual_weekly_wage: wageRow.avg_annual_weekly_wage,
    avg_monthly_rent: rent,
  })


}
display (`Combined dataset ready: ${combinedData.length.toLocaleString()} records`)

```

```js
Inputs.table(combinedData)
```
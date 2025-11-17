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
// Load the CSV's
const rent2020 = FileAttachment("data/acs/NC_ACS_RENTAL_2020.csv").csv({typed: true})
const rent2021 = FileAttachment("data/acs/NC_ACS_RENTAL_2021.csv").csv({typed: true})
const rent2022 = FileAttachment("data/acs/NC_ACS_Rental_2022.csv").csv({typed: true})
const rent2023 = FileAttachment("data/acs/NC_ACS_Rental_2023.csv").csv({typed: true})
```

```js 
// Combine all the ACS year's we are looking at
const allRental = [
  ...rent2020.map(d => ({...d, year: 2020})),
  ...rent2021.map(d => ({...d, year: 2021})),
  ...rent2022.map(d => ({...d, year: 2022})),
  ...rent2023.map(d => ({...d, year: 2023}))
];

display (`Total rental records loaded: ${allRental.length.toLocaleString()}`)
// Filter the rows by RENTGRS and COUNTYFIP
const filteredRental = allRental.filter( d => {
  const isRenter = d.RENTGRS > 0
  const hasCounty = d.COUNTYFIP > 0
  return isRenter && hasCounty


})
display(`Filtered to ${filteredRental.length.toLocaleString()} individual renter records.`)
```


```js
// Use d3.group to summarize all of the data, taking all the individual renters and grouping them.
const rentGrouped = d3.group(
  filteredRental,
  d => String(d.YEAR),

// Create and match the countyfip codes
  d => {
    const countyCode = ("00" + String(parseInt(d.COUNTYFIP, 10))).slice(-3)
  return "37" + countyCode


  }

)
// Convert the data into an array, looping through each year and county
const aggregatedRent = []
for (const[year, counties] of rentGrouped) {
  for (const [fips, people] of counties) {
    aggregatedRent.push({
      year: year,
      county_fips: fips,
      median_gross_rent: d3.median(people, d => d.RENTGRS)


    })
  }
}
display (`Aggregated to ${aggregatedRent.length.toLocaleString()} NC county-year rent records`)
```

```js
Inputs.table(aggregatedRent)
```

```js
//  Create an array to hold the combined data from rent and wages
const combinedData = []

for (const wageRow of cleanWages) {

let matchingRent = null
// Loop over the rows to find matches
for (const rentRow of aggregatedRent) {
  if (rentRow.year === wageRow.year && rentRow.county_fips === wageRow.county_fips) {
  matchingRent = rentRow.median_gross_rent
}
}

// Push the new data into the final array
  combinedData.push({
    year: wageRow.year,
    county_fips: wageRow.county_fips,
    county_name: wageRow.county_name,
    avg_annual_pay: wageRow.avg_annual_pay,
    avg_annual_weekly_wage: wageRow.avg_annual_weekly_wage,
    median_gross_rent: matchingRent
  })
}

```

```js
display(`Combined dataset ready: ${combinedData.length.toLocaleString()} records. `)
```

```js
Inputs.table(combinedData)
```
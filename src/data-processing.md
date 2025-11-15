# Updated processing for SQ3

```js
const wages2020 = FileAttachment("data/2020wages.csv").csv({typed: true})
const wages2021 = FileAttachment("data/2021wages.csv").csv({typed: true})
const wages2022 = FileAttachment("data/2022wages.csv").csv({typed: true})
const wages2023 = FileAttachment("data/2023wages.csv").csv({typed: true})
const wages2024 = FileAttachment("data/2024wages.csv").csv({typed: true})

```

```js
const allWages = [
  ...wages2020.map(d => ({...d, year: 2020})),
  ...wages2021.map(d => ({...d, year: 2021})),
  ...wages2022.map(d => ({...d, year: 2022})),
  ...wages2023.map(d => ({...d, year: 2023})),
  ...wages2024.map(d => ({...d, year: 2024}))
]
```

```js
const cleanWages = allWages
.filter(d => {
  const isNC = d.St === 37
  const isCounty = d["Area Type"] === "County"
  const isTotalOwn = d.Ownership === "Total Covered"
  const isTotalIndustry = d.Industry === "10 Total, all industries"
  
  
 

return isNC && isCounty && isTotalOwn && isTotalIndustry 
})

.map(d => {
  const countyFIPS = "37" + String(parseInt(d.Cnty, 10)).padStart(3, '0');
    
    
    return {
      year: String(d.Year),
      county_fips: countyFIPS,
      
      county_name: d.Area.replace(", NC", ""),
      avg_annual_pay: d["Annual Average Pay"],
      avg_annual_weekly_wage: d["Annual Average Weekly Wage"]

}
})

display(`Filtered to ${cleanWages.length.toLocaleString()} NC county-year wage records.`)




```

```js
Inputs.table(cleanWages)
```







```js
const rent2020 = FileAttachment("data/acs/NC_ACS_RENTAL_2020.csv").csv({typed: true})
const rent2021 = FileAttachment("data/acs/NC_ACS_RENTAL_2021.csv").csv({typed: true})
const rent2022 = FileAttachment("data/acs/NC_ACS_Rental_2022.csv").csv({typed: true})
const rent2023 = FileAttachment("data/acs/NC_ACS_Rental_2023.csv").csv({typed: true})
```

```js 
const allRental = [
  ...rent2020.map(d => ({...d, year: 2020})),
  ...rent2021.map(d => ({...d, year: 2021})),
  ...rent2022.map(d => ({...d, year: 2022})),
  ...rent2023.map(d => ({...d, year: 2023}))
];

display (`Total rental records loaded: ${allRental.length.toLocaleString()}`)
```


```js
const filteredRental = allRental.filter(d => {
const isRenter = d.RENTGRS > 0
const hasCounty = d.COUNTYFIP > 0
return isRenter && hasCounty
})
display(`Filtered to ${filteredRental.length.toLocaleString()} individual renter records.`);


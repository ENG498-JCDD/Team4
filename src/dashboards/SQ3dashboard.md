---
theme: dashboard
title: Rent vs Wages Dashboard
toc: false
---


# Mapping the Rent vs. Wage gap in North Carolina

**This dashboard shows trends relating to rent and wages for the State of North Carolina.** 

SQ3: Since 2020, by how much have rents outpaced wages in NC?

```js


const gapData = FileAttachment("../data/SQ3-Data/sq3_county_affordability_gap.csv").csv({typed: true})

```


```js
const us = await fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json").then((r) => r.json())

const us_counties = topojson.feature(us, us.objects.counties)
const ncFeatures = us_counties.features.filter((d) => d.id.startsWith("37"))
const ncOver = topojson.merge(us, us.objects.counties.geometries.filter(d => d.id.startsWith("37")))

const nc_map_data = {
    counties: {type: "FeatureCollection", features: ncFeatures},
    state: ncOver,
    domain: {type: "FeatureCollection", features: ncFeatures}
}

const nameLookup = new Map()

gapData.forEach(row => {
    if (row.county_name) {
    const shortName = row.county_name.replace(" County, North Carolina", "").trim()
    nameLookup.set(shortName, row)
    }
})



```
```js


Plot.plot({
    title: "Rent vs. Wage Growth Gap (2020-2024)",
    subtitle: "Red = Rent grew faster. Blue = Wages grew faster.",
    height: 1000,
    width: 2000,
    projection: {
        type: "conic-conformal",
        rotate: [80],
        domain: nc_map_data.domain
    },
    color: {
        type: "diverging",
        scheme: "RdBu",
        reverse: true,
        pivot: 0,
        label: "Gap (Percentage Points)",
        legend: true
    },
    marks: [
        Plot.geo(nc_map_data.counties, {fill: "e0e0e0", stroke: "white", strokeWidth: 0.5}),
        Plot.geo(nc_map_data.counties, {
            stroke: "white",
            strokeWidth: 0.5,
            fill: d => {
                const entry = nameLookup.get(d.properties.name)
                return entry ? entry.gap_pts : null
        },
        title: d => {
            const entry = nameLookup.get(d.properties.name)
            if(!entry) return `${d.properties.name}\NNo Data`
            return `${entry.county_name}
    Gap: ${entry.gap_pts.toFixed(1)} pts
    Rent: ${entry.rent_growth_pct.toFixed(1)} pts 
    Wages: ${entry.wage_growth_pct.toFixed(1)} pts`
        },
        tip: true
        }),
        Plot.geo(nc_map_data.state, {stroke: "black", strokeWidth: 1.5, fill: "none"})
    ]
})


```


```js


Plot.plot({
    title: "Rent v Wage since 2020 Scatter Plot",
    grid: true,
    aspectRatio: 1,
    x: {label: "Wage Growth (%)", domain: [-10, 50]},
    y: {label: "Rent Growth (%)", domain: [-10, 50]},
    marks: [
        Plot.line([{x: -10, y: -10}, {x: 80, y: 80}], {stroke: "black", strokeOpacity: 0.5}),
        Plot.dot(gapData,{
            x: "wage_growth_pct",
            y: "rent_growth_pct",
            fill: d => d.gap_pts > 0,
            title: "county_name",
            tip: {
                format: {
                    x: d => `${d.toFixed(1)}%`,
                    y: d => `${d.toFixed(1)}%`
                }
            }

        }),
        Plot.text([{x: 10, y: 60}, {text: ["Rent > Wages"]}]),
        Plot.text([{x: 40, y: 10}, {text: ["Wages > Rent"]}])
    ]

})



```

```js
const finalData = await FileAttachment("../data/SQ3-Data/nc_wages_and_rent_2020_2025.csv").csv({typed: true})

const yearlyTrends = d3.rollups(
    finalData,
    v => {
        const avgPay = d3.mean(v, d => {
            const cleanString = String(d.avg_annual_pay).replace(/,/g, "")
            return cleanString
        })
        const validRents = v.filter(d => d.avg_monthly_rent > 0)
        const avgRent = d3.mean(validRents, d => d.avg_monthly_rent)
        const annualRent = avgRent * 12
        const burden = (annualRent / avgPay) * 100

        return {avgPay, avgRent, burden}
    },
    d => d.year
).map(([year, stats]) => ({
    year: year,
    ...stats
})).sort((a, b) => a.year - b.year)

```

```js
Plot.plot({
    title:  "Trend: Average Annual Pay",
    subtitle: "Wages have generally risen in the counties we have data for, but they aren't keeping up with rent.",
    
    marginTop: 50,
    y: {grid: true, label: "Annual Pay ($)", domain: [35000, 60000],},
    x: {label: null, },
    marks: [
        Plot.lineY(yearlyTrends, {x: "year", y: "avgPay", strokeWidth: 4}),
        Plot.dot(yearlyTrends, {x: "year", y: "avgPay", tip: true}),
        Plot.text(yearlyTrends, {
            x: "year",
            y: "avgPay",
        })
    ]
})



```

```js

Plot.plot({
    title: "Trend: Average Monthly Rent (2020-2024)",
    subtitle: "Rents exploded in 2021 and has outpaced wages. NC Average.",
    marginTop: 40,
    y: {grid: true, label: "Monthly Rent ($)", domain: [1100, 1700]},
    x: {label: null},
    marks: [
        Plot.lineY(yearlyTrends, {x: "year", y: "avgRent", strokeWidth: 4}),
        Plot.dot(yearlyTrends, {x: "year", y: "avgRent", tip:true}),
        Plot.text(yearlyTrends, {
            x: "year",
            y: "avgRent"
     })
    ]
})

```


```js
Plot.plot({
    title: "Trend: Rent Burden (% of Income)",
    subtitle: "Percentage of the average paycheck spent on rent. NC Average.",
    marginTop: 60,
    y: {
        grid: true,
        label: "% of income",
        domain: [24,40]
    },
    x: {label: null},
    marks: [
        Plot.ruleY([30], {stroke: "red"}),
        Plot.text([{year: yearlyTrends[0].year, val: 30}],{
            x: "year", y: "val", text: ["30% Danger Zone"],
            fill: "red"
        }),
        Plot.lineY(yearlyTrends, {x: "year", y: "burden", stroke: "purple"}),
        Plot.text(yearlyTrends, {
            x: "year",
            y: "burden",
        })
    ]
})




```
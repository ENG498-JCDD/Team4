---
theme: dashboard
title: Eviction Dashboard (SQ1)
toc: false
---

# Eviction Dashboard: Geographic Concentration

```js
import * as d3 from "npm:d3";
import * as topojson from "npm:topojson-client";

// 1. Load the full eviction data
const evictions = FileAttachment("../data/SQ1/clean_nc_evictions_demographics_2020_2023.csv").csv({typed: true});

// 2. Load US Atlas for county shapes
const us = fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json").then((d) => d.json());

// 3. Process Data: Calculate Average Rate per County (2020-2023)
const evictionMap = new Map(
  d3.rollups(
    await evictions,
    v => d3.mean(v, d => d.evictions_per_1000), // Calculate average rate
    d => d.jurisdiction // Group by county name
  )
);

// 4. Prepare GeoJSON for NC
const counties = await us.then(us => {
  // Filter for North Carolina (State FIPS 37)
  const ncCounties = topojson.feature(us, us.objects.counties).features.filter(d => d.id.startsWith("37"));
  
  // Add the eviction rate to each county feature's properties
  ncCounties.forEach(feature => {
    const name = feature.properties.name; 
    // Try to match CSV 'jurisdiction' with GeoJSON 'name'
    // Checks for "Wake" and "Wake County" variations
    feature.properties.eviction_rate = evictionMap.get(name) || evictionMap.get(name + " County");
  });
  
  return ncCounties;
});
```
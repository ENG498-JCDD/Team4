---
theme: dashboard
title: SQ3 Data
toc: false
---



```js
const data = FileAttachment("data/2025-County-Profile-Data-for-website (1).csv").csv({typed: true});
```

```js
const counties = data.filter(d => d.County !== "NC - Statewide")

const minBurden = d3.min(counties, d => d["% Renters Cost Burdened"])



```

```js 
({
    min_burden: minBurden,
})
```

```js

const counties = data.filter(d => d.County !== "NC - Statewide")

const minBurdenCounty = d3.least(counties, d => d["% Renters Cost Burdened"])

```


```js
minBurdenCounty
```
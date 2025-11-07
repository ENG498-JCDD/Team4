# Processing Data per Year

- Due to size issues, there are CSV files per year 2012-2023.
- See the `./data/acs/CODEBOOK.md` file to understand the values per column.

```js
const data = FileAttachment("./data/acs/NC_ACS_RENTAL_2012.csv").csv({typed: true})
```

## Group by Race & Compute EDA on Gross Monthly Rent

<p class="note">
  See the <strong>./data/acs/CODEBOOK.md</strong> file to understand the values per column.
</p>

```js
// Group by Race & Compute EDA on Gross Monthly Rent
d3.rollup(
  data,
  leaf => {
    if (leaf.length > 0) {
      const leaf_CTs = {
        RENTGRS_MEAN: d3.mean(leaf, l => l.RENTGRS),
        RENTGRS_MEDIAN: d3.median(leaf, l => l.RENTGRS),
        RENTGRS_MODE: d3.mode(leaf, l => l.RENTGRS),
        RENTGRS_VARIANCE: d3.variance(leaf, l => l.RENTGRS),
        RENTGRS_DEVIATION: d3.deviation(leaf, l => l.RENTGRS),
      }
      return leaf_CTs
    }
  },
  d => d.RACE,
)
```

## Group by County (FIP) > Race > Education-Level Attainment (General) & Compute EDA on Gross Monthly Rent

<p class="note">
  See the <strong>./data/acs/CODEBOOK.md</strong> file to understand the values per column.
</p>

```js
d3.rollup(
  data,
  leaf => {
    if (leaf.length > 0) {
      const leaf_CTs = {
        RENTGRS_MEAN: d3.mean(leaf, l => l.RENTGRS),
        RENTGRS_MEDIAN: d3.median(leaf, l => l.RENTGRS),
        RENTGRS_MODE: d3.mode(leaf, l => l.RENTGRS),
        RENTGRS_VARIANCE: d3.variance(leaf, l => l.RENTGRS),
        RENTGRS_DEVIATION: d3.deviation(leaf, l => l.RENTGRS),
      }
      return leaf_CTs
    }
  },
  d => d.COUNTYFIP,
    d => d.RACE,
      d => d.EDUC,
)
```
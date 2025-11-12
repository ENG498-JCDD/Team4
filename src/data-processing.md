# Updated processing for SQ3

```js
const rent2020 = FileAttachment("../data/acs/NC_ACS_RENTAL_2020.csv").csv({typed: true})
const rent2021 = FileAttachment("../data/acs/NC_ACS_RENTAL_2021.csv").csv({typed: true})
const rent2022 = FileAttachment("../data/acs/NC_ACS_Rental_2022.csv").csv({typed: true})
const rent2023 = FileAttachment("../data/acs/NC_ACS_Rental_2023.csv").csv({typed: true})
const rent2020q4 = FileAttachment("..").csv({typed: true})
const rent2021q4 = FileAttachment("..").csv({typed: true})
const rent2022q4 = FileAttachment("..").csv({typed: true})
const rent2023q4 = FileAttachment("").csv({typed: true})



```


```js 
const allYears = [
  ...rent2020.map(d => ({...d, year: 2020})),
  ...rent2021.map(d => ({...d, year: 2021})),
  ...rent2022.map(d => ({...d, year: 2022})),
  ...rent2023.map(d => ({...d, year: 2023}))
];
```


```js


```
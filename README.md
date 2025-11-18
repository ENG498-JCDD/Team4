# Housing Affordability and Equity in North Carolina (2019-2024)


**NOTE FOR NEW PROJECT**: Don't forget to update the `observablehq.config.js` file. Delete this paragraph, when completed.

- Ademola Adepoju
- Justin Watson
- Madison Greenstein

This project examines housing affordability and equity issues in North Carolina from 2019-2024, focusing on three key research questions: eviction patterns and their demographic impacts, mortgage discrimination across racial/ethnic groups, and the gap between rent increases and wage growth in the post-pandemic era.

- [Project Tracker](https://docs.google.com/spreadsheets/d/1m0LLibRoDsCXmBZQWE7vGhLynBER3gg9/edit?gid=746129657#gid=746129657)

## Specifying Questions

### SQ1: Eviction Patterns and Demographics
**Question:** Where in North Carolina are eviction filings and grants most concentrated, and who is most affected?
- **Data Sources:** 
  - LSC Civil Court Data (eviction filings by county)
  - County Health Rankings (demographic and health data)
  - NCWorks labor market data (employment by sector and metro area)
- **Geographic Scope:** North Carolina counties and metro statistical areas
- **Approach:** Map eviction concentrations, correlate with demographic and economic indicators to identify most vulnerable populations

### SQ2: Mortgage Discrimination
**Question:** Are mortgage denial and pricing gaps higher for Black/Latino borrowers than for white borrowers at similar incomes in NC?
- **Data Sources:** HMDA (Home Mortgage Disclosure Act) data 2020-2024
- **Geographic Scope:** North Carolina statewide and county-level
- **Approach:** Compare denial rates and interest rates across racial/ethnic groups, controlling for income levels

### SQ3: Rent vs. Wage Growth
**Question:** Since 2019, by how much did rents outpace wages in NC?
- **Data Sources:** Zillow rent data, BLS county employment and wages
- **Time Period:** 2019-2024
- **Approach:** Calculate rent growth vs. wage growth to quantify the affordability gap

## About the Data

**`src/data/path/to/dataset.csv`**
- **Topic**: Enter broader topic of dataset.
- **Overview**: Enter brief description for each dataset.
- **Source**: [Enter link to source]()
- **Sample Row**:
  ```csv
  enter,sample,row,here
  1,2,3,"Hello world!"
  ```

See the README for the dataset for more information.

## About the Data App

This is an [Observable Framework](https://observablehq.com/framework/) app. To install the required dependencies, run:

```
yarn install
```

Then, to start the local preview server, run:

```
yarn dev
```

Then visit <http://localhost:3000> to preview your app.

For more, see <https://observablehq.com/framework/getting-started>.

## Project structure

A typical Framework project looks like this:

```ini
.
├─ src
│  ├─ components
│  │  └─ timeline.js           # an importable module
│  ├─ data
│  │  ├─ launches.csv.js       # a data loader
│  │  └─ events.json           # a static data file
│  ├─ example-dashboard.md     # a page
│  ├─ example-report.md        # another page
│  └─ index.md                 # the home page
├─ .gitignore
├─ observablehq.config.js      # the app config file
├─ package.json
└─ README.md
```

**`src`** - This is the “source root” — where your source files live. Pages go here. Each page is a Markdown file. Observable Framework uses [file-based routing](https://observablehq.com/framework/project-structure#routing), which means that the name of the file controls where the page is served. You can create as many pages as you like. Use folders to organize your pages.

**`src/index.md`** - This is the home page for your app. You can have as many additional pages as you’d like, but you should always have a home page, too.

**`src/data`** - You can put [data loaders](https://observablehq.com/framework/data-loaders) or static data files anywhere in your source root, but we recommend putting them here.

**`src/components`** - You can put shared [JavaScript modules](https://observablehq.com/framework/imports) anywhere in your source root, but we recommend putting them here. This helps you pull code out of Markdown files and into JavaScript modules, making it easier to reuse code across pages, write tests and run linters, and even share code with vanilla web applications.

**`observablehq.config.js`** - This is the [app configuration](https://observablehq.com/framework/config) file, such as the pages and sections in the sidebar navigation, and the app’s title.

## Command reference

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `yarn install`            | Install or reinstall dependencies                        |
| `yarn dev`        | Start local preview server                               |
| `yarn build`      | Build your static site, generating `./dist`              |
| `yarn deploy`     | Deploy your app to Observable                            |
| `yarn clean`      | Clear the local data loader cache                        |
| `yarn observable` | Run commands like `observable help`                      |

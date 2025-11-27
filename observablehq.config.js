// See https://observablehq.com/framework/config for documentation.
export default {
  // The app's title; used in the sidebar and webpage titles.
  title: "Housing Affordability and Equity in NC",

  // The pages and sections in the sidebar. If you don't specify this option,
  // all pages will be listed in alphabetical order. Listing pages explicitly
  // lets you organize them into sections and have unlisted pages.
  pages: [
    {
      name: "Examples",
      pages: [
        {name: "Dashboard", path: "/example-dashboard"},
        {name: "Report", path: "/example-report"}
      ]
    },
    {
      name: "Data Processing",
      pages: [
        {name: "SQ1: Evictions + Demographics", path: "/processing/processing-evictions-demographics-SQ1"},
        {name: "SQ2: HMDA Mortgage Data", path: "/processing/processing-hmda-SQ2"},
        {name: "Example Processing", path: "/processing-example"},
        {name: "HMDA Processing (2020-2024)", path: "/processing/processing-hmda-SQ2"}
      ]
    },
    {
      name: "Data Analysis",
      pages: [
        {name: "SQ2: Mortgage Discrimination Analysis", path: "/analysis/analysis-hmda-SQ2"}
      ]
    },
    // Add your SQ2 dashboard
    {
      name: "Mortgage Discrimination Dashboard",
      path: "/dashboard-hmda-sq2",
      pane: "dashboard-hmda-SQ2"
    }
  ],


  // Content to add to the head of the page, e.g. for a favicon:
  head: '<link rel="icon" href="observable.png" type="image/png" sizes="32x32">',

  // The path to the source root.
  root: "src",

  // Some additional configuration options and their defaults:
  // theme: "default", // try "light", "dark", "slate", etc.
  // header: "", // what to show in the header (HTML)
  // footer: "Built with Observable.", // what to show in the footer (HTML)
  // sidebar: true, // whether to show the sidebar
  // toc: true, // whether to show the table of contents
  // pager: true, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // preserveExtension: false, // drop .html from URLs
  // preserveIndex: false, // drop /index from URLs
};

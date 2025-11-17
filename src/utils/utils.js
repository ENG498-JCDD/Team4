import * as d3 from "npm:d3";

/**
 * REUSABLE ROLLUP FUNCTIONS
 */

export const oneLevelRollUpFlatMap = (data, level1Key, countKey) => {
  const colTotals = d3.rollups(
    data,
    (v) => v.length,
    (d) => d[level1Key]
  );

  const flatTotals = colTotals.flatMap((e) => {
    return {
      [level1Key]: e[0],
      [countKey]: e[1]
    };
  });

  return flatTotals;
};

export const twoLevelRollUpFlatMap = (data, level1Key, level2Key, countKey) => {
  const colTotals = d3.rollups(
    data,
    (v) => v.length,
    (d) => d[level1Key],
    (d) => d[level2Key]
  );

  const flatTotals = colTotals.flatMap((l1Elem) => {
    let l1KeyValue = l1Elem[0];

    const flatLevels = l1Elem[1].flatMap((l2Elem) => {
      let l2KeyValue = l2Elem[0];

      return {
        [level1Key]: l1KeyValue,
        [level2Key]: l2KeyValue,
        [countKey]: l2Elem[1]
      };
    });

    return flatLevels;
  });

  return flatTotals;
};

export const threeLevelRollUpFlatMap = (data, level1Key, level2Key, level3Key, countKey) => {
  const colTotals = d3.rollups(
    data,
    (v) => v.length,
    (d) => d[level1Key],
    (d) => d[level2Key],
    (d) => d[level3Key]
  );

  const flatTotals = colTotals.flatMap((l1Elem) => {
    let l1KeyValue = l1Elem[0];

    const flatLevels = l1Elem[1].flatMap((l2Elem) => {
      let l2KeyValue = l2Elem[0];

      const flatLevel3 = l2Elem[1].map((l3Elem) => {
        let l3KeyValue = l3Elem[0];

        return {
          [level1Key]: l1KeyValue,
          [level2Key]: l2KeyValue,
          [level3Key]: l3KeyValue,
          [countKey]: l3Elem[1]
        };
      });

      return flatLevel3;
    });

    return flatLevels;
  });

  return flatTotals;
};

/**
 * DOWNLOAD FUNCTION
 * (Keep from old utils.js - works perfectly)
 */

export const downloadAsCSV = (value, name = "data", label = "Save") => {
  const a = document.createElement("a");
  const b = a.appendChild(document.createElement("button"));
  b.textContent = label;
  a.download = name;

  async function reset() {
    await new Promise(requestAnimationFrame);
    URL.revokeObjectURL(a.href);
    a.removeAttribute("href");
    b.textContent = label;
    b.disabled = false;
  }

  a.onclick = async (event) => {
    b.disabled = true;
    if (a.href) return reset();
    b.textContent = "Saving…";
    try {
      const object = await (typeof value === "function" ? value() : value);
      const blob = new Blob([object], { type: "application/octet-stream" });
      b.textContent = "Download";
      a.href = URL.createObjectURL(blob);
      if (event.eventPhase) return reset();
      a.click();
    } catch (error) {
      console.error("Download error:", error);
      b.textContent = label;
    }
    b.disabled = false;
  };

  return a;
};

/**
 * NEW HOUSING-SPECIFIC FUNCTIONS
 */

export function calculateDenialRate(data, filterKey, filterValue) {
  const filtered = data.filter(d => d[filterKey] === filterValue);
  return d3.mean(filtered, d => d.denied);
}

export function formatPercent(value, decimals = 1) {
  if (value == null) return "N/A";
  return (value * 100).toFixed(decimals) + "%";
}

export function formatCurrency(value) {
  if (value == null) return "N/A";
  return "$" + value.toLocaleString();
}

export function getIncomeBracket(income) {
  if (income < 50) return "<$50K";
  if (income < 75) return "$50-75K";
  if (income < 100) return "$75-100K";
  if (income < 150) return "$100-150K";
  return "$150K+";
}

export function addIncomeBrackets(data) {
  return data.map(d => ({
    ...d,
    income_bracket: getIncomeBracket(d.income_1000s)
  }));
}

export function calculateRiskRatio(rate1, rate2) {
  if (rate2 === 0) return "N/A";
  return (rate1 / rate2).toFixed(2);
}

export function denialRatesByRace(data) {
  return d3.rollup(
    data,
    v => ({
      total: v.length,
      denied: d3.sum(v, d => d.denied),
      denial_rate: d3.mean(v, d => d.denied)
    }),
    d => d.race_ethnicity
  );
}

export function denialRatesByRaceAndIncome(data) {
  const withBrackets = addIncomeBrackets(data);
  return d3.rollup(
    withBrackets,
    v => ({
      total: v.length,
      denied: d3.sum(v, d => d.denied),
      denial_rate: d3.mean(v, d => d.denied)
    }),
    d => d.race_ethnicity,
    d => d.income_bracket
  );
}
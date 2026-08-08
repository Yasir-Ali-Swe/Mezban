/**
 * Aggregate 30 daily records into 15 two-day periods
 */
export const aggregateIntoTwoDayPeriods = (
  data,
  dateKey = "date",
  valueKeys = [],
) => {
  if (!data || data.length === 0) return [];

  const result = [];
  const dates = [];

  // Get the full date objects from the data
  data.forEach((item) => {
    if (item.fullDate) {
      dates.push(item.fullDate);
    }
  });

  // If no fullDate, use the date string to create dates
  if (dates.length === 0) {
    data.forEach((item) => {
      const parts = item[dateKey]?.split(" ");
      if (parts && parts.length === 2) {
        const month = parts[0];
        const day = parseInt(parts[1]);
        const date = new Date();
        date.setMonth(
          [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ].indexOf(month),
        );
        date.setDate(day);
        dates.push(date);
      }
    });
  }

  // Group into pairs
  for (let i = 0; i < data.length; i += 2) {
    if (i + 1 < data.length) {
      const item1 = data[i];
      const item2 = data[i + 1];

      const date1 = dates[i] || new Date();
      const date2 = dates[i + 1] || new Date();

      const startMonth = date1.toLocaleDateString("en-US", { month: "short" });
      const startDay = date1.getDate();
      const endDay = date2.getDate();

      const aggregated = {
        date: `${startMonth} ${startDay}-${endDay}`,
        fullDate: date1,
      };

      // Aggregate all value keys
      valueKeys.forEach((key) => {
        if (item1[key] !== undefined && item2[key] !== undefined) {
          aggregated[key] = Math.round(item1[key] + item2[key]);
        }
      });

      // If no specific keys provided, aggregate all numeric fields except date
      if (valueKeys.length === 0) {
        Object.keys(item1).forEach((key) => {
          if (
            key !== dateKey &&
            key !== "fullDate" &&
            typeof item1[key] === "number"
          ) {
            if (item2[key] !== undefined && typeof item2[key] === "number") {
              aggregated[key] = Math.round(item1[key] + item2[key]);
            }
          }
        });
      }

      result.push(aggregated);
    } else {
      // If odd number of items, include the last one as is
      result.push(data[i]);
    }
  }

  return result;
};

/**
 * Get appropriate data for time-series charts based on range
 */
export const getTimeSeriesData = (
  data,
  timeRange,
  valueKeys = [],
  dateKey = "date",
) => {
  if (!data || data.length === 0) return data;

  if (timeRange === "weekly") {
    // Return last 7 days
    return data.slice(-7);
  }

  if (timeRange === "monthly") {
    // Aggregate 30 days into 15 two-day periods
    const monthlyData = data.slice(-30);
    return aggregateIntoTwoDayPeriods(monthlyData, dateKey, valueKeys);
  }

  if (timeRange === "yearly") {
    // Return 12 monthly records
    return data.slice(-12);
  }

  return data;
};

/**
 * Get responsive bar size based on number of bars and screen width
 */
export const getResponsiveBarSize = (numBars, screenWidth) => {
  if (screenWidth < 640) {
    // Mobile
    if (numBars <= 5) return 28;
    if (numBars <= 10) return 20;
    if (numBars <= 15) return 14;
    return 10;
  }

  if (screenWidth < 1024) {
    // Tablet
    if (numBars <= 5) return 36;
    if (numBars <= 10) return 28;
    if (numBars <= 15) return 20;
    return 14;
  }

  // Desktop
  if (numBars <= 5) return 48;
  if (numBars <= 10) return 36;
  if (numBars <= 15) return 26;
  return 18;
};

/**
 * Get responsive margins based on screen width
 */
export const getResponsiveMargins = (screenWidth) => {
  if (screenWidth < 640) {
    return {
      top: 5,
      right: 5,
      left: 0,
      bottom: 5,
    };
  }

  if (screenWidth < 1024) {
    return {
      top: 5,
      right: 10,
      left: 0,
      bottom: 5,
    };
  }

  return {
    top: 5,
    right: 10,
    left: 0,
    bottom: 5,
  };
};
/**
 * Get responsive bar category gap based on number of bars and screen width
 */
export const getResponsiveGap = (numBars, screenWidth) => {
  if (screenWidth < 640) {
    if (numBars <= 5) return "12%";
    if (numBars <= 10) return "10%";
    return "8%";
  }

  if (screenWidth < 1024) {
    if (numBars <= 5) return "10%";
    if (numBars <= 10) return "8%";
    return "6%";
  }

  if (numBars <= 5) return "8%";
  if (numBars <= 10) return "6%";
  return "4%";
};

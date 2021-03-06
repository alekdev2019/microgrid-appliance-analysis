import _ from 'lodash'
import {
  countGreaterThanZero,
  percentOfYear,
  mergeArraysOfObjects,
  sumGreaterThanZero,
  createGreaterThanZeroHistogram,
} from './helpers'

export function getSummaryStats(calculatedColumns, modelInputs) {
  // Unmet Loads: Original without new appliance
  const originalUnmetLoadCount = countGreaterThanZero(calculatedColumns, 'originalUnmetLoad')
  const originalUnmetLoadCountPercent = percentOfYear(originalUnmetLoadCount)
  const originalUnmetLoadSum = sumGreaterThanZero(calculatedColumns, 'originalUnmetLoad')
  const originalUnmetLoadHist = createGreaterThanZeroHistogram(
    calculatedColumns,
    'hour_of_day',
    'originalUnmetLoad'
  )

  // Unmet Loads: Additional Appliance
  const additionalUnmetLoadCount = countGreaterThanZero(calculatedColumns, 'additionalUnmetLoad')
  const additionalUnmetLoadCountPercent = percentOfYear(additionalUnmetLoadCount)
  const additionalUnmetLoadSum = sumGreaterThanZero(calculatedColumns, 'additionalUnmetLoad')
  const additionalUnmetLoadHist = createGreaterThanZeroHistogram(
    calculatedColumns,
    'hour_of_day',
    'additionalUnmetLoad'
  )

  // Unmet Loads: Total with new appliance
  const newTotalUnmetLoadCount = countGreaterThanZero(calculatedColumns, 'newTotalUnmetLoad')
  const newTotalUnmetLoadCountPercent = percentOfYear(newTotalUnmetLoadCount)
  const newTotalUnmetLoadSum = sumGreaterThanZero(calculatedColumns, 'newTotalUnmetLoad')
  const newTotalUnmetLoadHist = createGreaterThanZeroHistogram(
    calculatedColumns,
    'hour_of_day',
    'newTotalUnmetLoad'
  )

  const allUnmetLoadHist = mergeArraysOfObjects(
    'hour_of_day',
    originalUnmetLoadHist,
    additionalUnmetLoadHist,
    newTotalUnmetLoadHist
  )

  // Yearly kWh and Financial Calculations
  // New Appliance kWh for the year
  const newApplianceYearlyKwh = sumGreaterThanZero(calculatedColumns, 'newApplianceLoad')

  // New Appliance kWh revenue for grid operator (cost for appliance owner)
  const newApplianceElectricityRevenue =
    newApplianceYearlyKwh * modelInputs['retailElectricityPrice']

  // Electricity cost to grid operator
  const newApplianceElectricityCost =
    newApplianceYearlyKwh * modelInputs['wholesaleElectricityCost']

  // Cost to grid operator of new appliance's unmet load
  const newApplianceUnmetLoadCost = additionalUnmetLoadSum * modelInputs['unmetLoadCostPerKwh']

  const newApplianceNetRevenue =
    newApplianceElectricityRevenue - newApplianceElectricityCost - newApplianceUnmetLoadCost

  // Calculate production of new appliance based on
  const yearlyProductionUnits = newApplianceYearlyKwh * modelInputs['productionUnitsPerKwh']
  const yearlyProductionUnitsRevenue =
    yearlyProductionUnits * modelInputs['revenuePerProductionUnits']
  const netApplianceOwnerRevenue = yearlyProductionUnitsRevenue - newApplianceElectricityRevenue

  return {
    originalUnmetLoadCount,
    originalUnmetLoadCountPercent,
    originalUnmetLoadSum: _.round(originalUnmetLoadSum),
    originalUnmetLoadHist,

    additionalUnmetLoadCount,
    additionalUnmetLoadCountPercent,
    additionalUnmetLoadSum: _.round(additionalUnmetLoadSum),
    additionalUnmetLoadHist,

    newTotalUnmetLoadCount,
    newTotalUnmetLoadCountPercent,
    newTotalUnmetLoadSum: _.round(newTotalUnmetLoadSum),
    newTotalUnmetLoadHist,

    allUnmetLoadHist,

    newApplianceYearlyKwh: _.round(newApplianceYearlyKwh),
    newApplianceElectricityRevenue: _.round(newApplianceElectricityRevenue),
    newApplianceElectricityCost: _.round(newApplianceElectricityCost),
    newApplianceUnmetLoadCost: _.round(newApplianceUnmetLoadCost),
    newApplianceNetRevenue: _.round(newApplianceNetRevenue),

    yearlyProductionUnits: yearlyProductionUnits,
    yearlyProductionUnitsRevenue: _.round(yearlyProductionUnitsRevenue),
    netApplianceOwnerRevenue: _.round(netApplianceOwnerRevenue),
  }
}

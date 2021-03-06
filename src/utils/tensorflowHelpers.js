import _ from 'lodash'
import * as tf from '@tensorflow/tfjs'

// Return an array of training features for every target value
// Split them into a training and testing dataset
export function convertTableToTrainingData(
  table,
  targetColumn,
  trainingColumns,
  trainingSplitPercent = 0.65
) {
  if (_.isEmpty(table)) {
    return null
  }
  const rawTargets = _.map(table, row => [row[targetColumn]])
  const rawFeatures = _.map(table, row => _.map(trainingColumns, col => row[col]))
  const shuffledTable = _.shuffle(table)

  // Array of target variables. The index of each target should line up with the
  // index of each feature set in the next dataset (so shuffle them first).
  // We can have multiple target variables. If only one, return an array with 1 value.
  // I could potentially target SoC and Energy Content...
  const targets = _.map(shuffledTable, row => [row[targetColumn]])

  // Order of the training features don't matter, as long as they are consistent
  // with training targets
  const features = _.map(shuffledTable, row => _.map(trainingColumns, col => row[col]))
  const splitCount = _.round(targets.length * trainingSplitPercent)
  const [trainFeatures, testFeatures] = _.chunk(features, splitCount)
  const [trainTarget, testTarget] = _.chunk(targets, splitCount)
  return { trainFeatures, testFeatures, rawFeatures, trainTarget, testTarget, rawTargets }
}

/**
 * Convert loaded data into normalized tensors
 * @param {*} data
 */
export function arraysToTensors(trainingData) {
  if (_.isEmpty(trainingData)) {
    return null
  }
  const rawTrainFeatures = tf.tensor2d(trainingData.trainFeatures)
  const trainTarget = tf.tensor2d(trainingData.trainTarget)
  const rawTestFeatures = tf.tensor2d(trainingData.testFeatures)
  const testTarget = tf.tensor2d(trainingData.testTarget)

  // Normalize mean and standard deviation of data.
  const { dataMean, dataStd } = determineMeanAndStddev(rawTrainFeatures)
  return {
    trainFeatures: normalizeTensor(rawTrainFeatures, dataMean, dataStd),
    trainTarget,
    testFeatures: normalizeTensor(rawTestFeatures, dataMean, dataStd),
    testTarget,
  }
}

/**
 * Given expected mean and standard deviation, normalizes a dataset by
 * subtracting the mean and dividing by the standard deviation.
 *
 * @param {Tensor2d} data: Data to normalize. Shape: [batch, featureCount].
 * @param {Tensor1d} dataMean: Expected mean of the data. Shape [featureCount].
 * @param {Tensor1d} dataStd: Expected std of the data. Shape [featureCount]
 *
 * @returns {Tensor2d}: Tensor the same shape as data, but each column
 * normalized to have zero mean and unit standard deviation.
 */
export function normalizeTensor(data, dataMean, dataStd) {
  return data.sub(dataMean).div(dataStd)
}

export function computeBaselineLoss(tensors) {
  if (_.isEmpty(tensors)) {
    return null
  }
  const averageTargetValue = tf.mean(tensors.trainTarget)
  const baseline = tf.mean(tf.pow(tf.sub(tensors.testTarget, averageTargetValue), 2))
  return _.round(baseline.dataSync()[0])
}

/**
 * Calculates the mean and standard deviation of each column of a data array.
 *
 * @param {Tensor2d} data Dataset from which to calculate the mean and
 *                        std of each column independently.
 *
 * @returns {Object} Contains the mean and standard deviation of each vector
 *                   column as 1d tensors.
 */
export function determineMeanAndStddev(data) {
  const dataMean = data.mean(0)
  const diffFromMean = data.sub(dataMean)
  const squaredDiffFromMean = diffFromMean.square()
  const variance = squaredDiffFromMean.mean(0)
  const dataStd = variance.sqrt()
  return { dataMean, dataStd }
}

/**
 * Builds and returns Multi Layer Perceptron Regression Model
 * with 1 hidden layers, each with 10 units activated by sigmoid.
 *
 * Suggestions on model parameters:
 * - Layers: We may want to add more layers the more features we have to capture
 *           more interactions. Right now  we only have 2 features.
 * - Units:  Nodes in hidden layer. Tensorflow.js had 50 nodes for 12 features.
 *           We can use that as a guideline, testing loss as we experiment
 * @returns {tf.Sequential} The multi layer perceptron regression model.
 */
export function neuralNet1Hidden(featureCount, learningRate) {
  const model = tf.sequential()
  model.add(
    tf.layers.dense({
      inputShape: [featureCount],
      units: 9,
      activation: 'sigmoid',
      kernelInitializer: 'leCunNormal',
    })
  )
  model.add(tf.layers.dense({ units: 1 }))
  model.compile({
    optimizer: tf.train.sgd(learningRate),
    loss: 'meanSquaredError',
  })
  model.summary()
  return model
}

export function calculateTestSetLoss(model, tensors, batchSize) {
  const testSetLoss = model.evaluate(tensors.testFeatures, tensors.testTarget, {
    batchSize: batchSize,
  })
  return _.round(testSetLoss.dataSync()[0])
}

export function calculateFinalLoss(trainLogs) {
  const finalTrainSetLoss = trainLogs[trainLogs.length - 1].loss
  const finalValidationSetLoss = trainLogs[trainLogs.length - 1].val_loss
  return {
    finalTrainSetLoss: _.round(finalTrainSetLoss, 2),
    finalValidationSetLoss: _.round(finalValidationSetLoss, 2),
  }
}

/**
 * Convert training and predicted values into plottable values for the
 * Actual vs Predicted chart
 */
export function calculatePlottablePredictedVsActualData(trainingData, model) {
  if (_.isEmpty(model)) {
    return []
  }
  const batteryMaxEnergyContent = 56.98233
  const batteryMinEnergyContent = 29.08037
  const { trainFeatures, testFeatures, testTarget, rawFeatures, rawTargets } = trainingData  
  const t0 = performance.now()
  const rawTrainFeatures = tf.tensor2d(trainFeatures)
  const { dataMean, dataStd } = determineMeanAndStddev(rawTrainFeatures)
  const predictions = [];
  const chargePredictions = []
  const chargeActuals = []
  const dischargePredictions = []
  const dischargeActuals = []
  rawFeatures.forEach( (testElement, n) => {  
    let tensor_data
    if (n == 0) {
      tensor_data = testElement          
    } else {      
      tensor_data = new Float32Array(2)
      tensor_data[0] = testElement[0]
      tensor_data[1] = predictions[n-1]
    }
    const newTensor = tf.tensor2d([testElement])  
    const normalized_tensor = normalizeTensor(newTensor, dataMean, dataStd)
    const prediction = model.predict(normalized_tensor).dataSync()
    const clampedPrediction = _.clamp(prediction, batteryMinEnergyContent, batteryMaxEnergyContent)
    predictions.push(clampedPrediction)
    const hours = n % 24
    if (hours >=6 && hours < 18) {
      chargePredictions.push([tensor_data[0], clampedPrediction])
      chargeActuals.push([tensor_data[0], tensor_data[1]])
    } else {
      dischargePredictions.push([tensor_data[0], clampedPrediction])
      dischargeActuals.push([tensor_data[0], tensor_data[1]])
    }
  })  
  const t1 = performance.now()
  console.log('predict time: ', t1 - t0)
  const chargePredictionsTensor = tf.tensor2d(chargePredictions)
  const chargeActualsTensor = tf.tensor2d(chargeActuals)
  const dischargePredictionsTensor = tf.tensor2d(dischargePredictions)
  const dischargeAcutalsTensor = tf.tensor2d(dischargeActuals)
  const chargeMSE = tf.losses.meanSquaredError(chargeActualsTensor, chargePredictionsTensor)
  const dischargeMSE = tf.losses.meanSquaredError(dischargeAcutalsTensor, dischargePredictionsTensor)
  console.log('Charge Mean Square Error:', chargeMSE.dataSync())
  console.log('Discharge Mean Square Error:', dischargeMSE.dataSync())  
  return _.map(rawTargets, (target, targetIndex) => {
    return { actual: target[0], predicted: predictions[targetIndex]}
  })  
}

export function calculatePlottableReferenceLine(trainingData) {
  if (_.isEmpty(trainingData)) {
    return []
  }
  const { trainTarget, testTarget } = trainingData
  const allTargets = _.map(trainTarget.concat(testTarget), target => target[0])
  const range = _.range(_.round(_.min(allTargets)), _.round(_.max(allTargets)))
  return _.map(range, val => {
    return { actual: val, predicted: val }
  })
}

export function formatTrainingTimeDisplay(batteryTrainingTime, batteryMaxEpochCount) {
  return `${_.round(batteryTrainingTime / 1000)} sec (~${_.round(
    batteryTrainingTime / 1000 / batteryMaxEpochCount
  )} sec/epoch)`
}

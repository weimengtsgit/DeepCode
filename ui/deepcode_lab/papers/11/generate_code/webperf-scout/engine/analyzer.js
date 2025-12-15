// WebPerf Scout - Performance Analyzer
const fs = require('fs');
const path = require('path');

class PerformanceAnalyzer {
  constructor(config = {}) {
    // Default scoring weights if not provided in config
    this.scoringConfig = {
      lcp: { weight: 0.25, threshold: 2500 },
      fcp: { weight: 0.15, threshold: 1800 },
      cls: { weight: 0.15, threshold: 0.1 },
      tti: { weight: 0.25, threshold: 3500 },
      tbt: { weight: 0.20, threshold: 300 },
      ...config.scoring
    };
  }

  /**
   * Analyze performance metrics and generate a comprehensive score
   * @param {Object} metrics - Performance metrics from PlaywrightRunner
   * @returns {Object} Performance analysis result
   */
  analyze(metrics) {
    if (!metrics) {
      throw new Error('No performance metrics provided for analysis');
    }

    const scores = this._calculateMetricScores(metrics);
    const overallScore = this._calculateOverallScore(scores);

    return {
      metrics,
      scores,
      overallScore,
      performanceGrade: this._getPerformanceGrade(overallScore)
    };
  }

  /**
   * Calculate individual metric scores based on thresholds
   * @param {Object} metrics - Performance metrics
   * @returns {Object} Metric-specific scores
   */
  _calculateMetricScores(metrics) {
    const scores = {};

    // Largest Contentful Paint (LCP) Score
    scores.lcp = this._calculateMetricScore(
      metrics.lcp, 
      this.scoringConfig.lcp.threshold, 
      this.scoringConfig.lcp.weight
    );

    // First Contentful Paint (FCP) Score
    scores.fcp = this._calculateMetricScore(
      metrics.fcp, 
      this.scoringConfig.fcp.threshold, 
      this.scoringConfig.fcp.weight
    );

    // Cumulative Layout Shift (CLS) Score
    scores.cls = this._calculateMetricScore(
      metrics.cls, 
      this.scoringConfig.cls.threshold, 
      this.scoringConfig.cls.weight,
      true  // Inverse scoring for CLS (lower is better)
    );

    // Time to Interactive (TTI) Score
    scores.tti = this._calculateMetricScore(
      metrics.tti, 
      this.scoringConfig.tti.threshold, 
      this.scoringConfig.tti.weight
    );

    // Total Blocking Time (TBT) Score
    scores.tbt = this._calculateMetricScore(
      metrics.tbt, 
      this.scoringConfig.tbt.threshold, 
      this.scoringConfig.tbt.weight
    );

    return scores;
  }

  /**
   * Calculate score for a specific metric
   * @param {number} value - Metric value
   * @param {number} threshold - Performance threshold
   * @param {number} weight - Metric weight
   * @param {boolean} [inverseScore=false] - Whether lower values are better
   * @returns {number} Metric score
   */
  _calculateMetricScore(value, threshold, weight, inverseScore = false) {
    let score;
    
    if (inverseScore) {
      // For metrics like CLS where lower is better
      score = value <= threshold ? 100 : Math.max(0, 100 - ((value - threshold) * 10));
    } else {
      // For metrics like LCP, FCP, TTI, TBT where lower is better
      score = value <= threshold ? 100 : Math.max(0, 100 - ((value - threshold) / 100));
    }

    return Math.min(100, Math.max(0, score)) * weight;
  }

  /**
   * Calculate overall performance score
   * @param {Object} scores - Individual metric scores
   * @returns {number} Overall performance score
   */
  _calculateOverallScore(scores) {
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return Math.round(totalScore);
  }

  /**
   * Determine performance grade based on overall score
   * @param {number} overallScore - Calculated overall score
   * @returns {string} Performance grade
   */
  _getPerformanceGrade(overallScore) {
    if (overallScore >= 90) return 'A';
    if (overallScore >= 80) return 'B';
    if (overallScore >= 70) return 'C';
    if (overallScore >= 60) return 'D';
    return 'F';
  }

  /**
   * Batch analyze multiple performance metrics
   * @param {Array} metricsArray - Array of performance metrics
   * @returns {Array} Array of performance analysis results
   */
  batchAnalyze(metricsArray) {
    return metricsArray.map(metrics => this.analyze(metrics));
  }
}

module.exports = PerformanceAnalyzer;
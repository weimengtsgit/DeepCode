// Performance Metric Analyzer for WebPerf Scout
// Responsible for calculating performance scores and analyzing web performance metrics

class PerformanceAnalyzer {
  /**
   * Calculate a comprehensive performance score based on Web Vitals metrics
   * @param {Object} metrics - Web performance metrics collected during testing
   * @returns {Object} Performance score and detailed breakdown
   */
  static calculatePerformanceScore(metrics) {
    // Validate input metrics
    this._validateMetrics(metrics);

    // Base performance score starts at 100
    let baseScore = 100;

    // Scoring deductions based on Web Vitals
    // Largest Contentful Paint (LCP) penalty
    baseScore -= Math.max(0, (metrics.lcp - 2500) * 0.03);

    // First Contentful Paint (FCP) penalty
    baseScore -= Math.max(0, (metrics.fcp - 1800) * 0.055);

    // Time to Interactive (TTI) penalty
    baseScore -= Math.max(0, (metrics.tti - 3500) * 0.028);

    // Total Blocking Time (TBT) penalty
    baseScore -= metrics.totalBlockingTime * 0.1;

    // Cumulative Layout Shift (CLS) penalty
    baseScore -= metrics.cls * 1000 * 0.15;

    // Ensure score is between 0 and 100
    const finalScore = Math.max(0, Math.min(Math.round(baseScore), 100));

    return {
      score: finalScore,
      metrics: {
        lcp: metrics.lcp,
        fcp: metrics.fcp,
        tti: metrics.tti,
        totalBlockingTime: metrics.totalBlockingTime,
        cls: metrics.cls
      },
      recommendations: this._generateRecommendations(finalScore)
    };
  }

  /**
   * Validate input metrics to ensure all required fields are present
   * @param {Object} metrics - Metrics to validate
   * @throws {Error} If metrics are invalid
   */
  static _validateMetrics(metrics) {
    const requiredMetrics = [
      'lcp', 'fcp', 'tti', 
      'totalBlockingTime', 'cls'
    ];

    for (const metric of requiredMetrics) {
      if (metrics[metric] === undefined || metrics[metric] === null) {
        throw new Error(`Missing required performance metric: ${metric}`);
      }
    }
  }

  /**
   * Generate performance improvement recommendations
   * @param {number} score - Performance score
   * @returns {string[]} Array of recommendations
   */
  static _generateRecommendations(score) {
    const recommendations = [];

    if (score < 50) {
      recommendations.push(
        "Major performance improvements needed",
        "Consider optimizing critical rendering path",
        "Minimize render-blocking resources"
      );
    } else if (score < 70) {
      recommendations.push(
        "Moderate performance improvements recommended",
        "Optimize images and assets",
        "Implement lazy loading"
      );
    } else if (score < 90) {
      recommendations.push(
        "Minor performance enhancements possible",
        "Review and minimize third-party scripts",
        "Implement browser caching"
      );
    } else {
      recommendations.push(
        "Excellent performance",
        "Continue monitoring and maintaining current optimizations"
      );
    }

    return recommendations;
  }

  /**
   * Compare performance metrics across multiple test runs
   * @param {Array} testRuns - Array of performance metric objects
   * @returns {Object} Comparative performance analysis
   */
  static comparePerformance(testRuns) {
    if (!testRuns || testRuns.length === 0) {
      throw new Error('No test runs provided for comparison');
    }

    const scores = testRuns.map(run => this.calculatePerformanceScore(run));

    return {
      averageScore: Math.round(scores.reduce((sum, score) => sum + score.score, 0) / scores.length),
      individualScores: scores,
      trend: this._analyzeTrend(scores.map(s => s.score))
    };
  }

  /**
   * Analyze performance score trend
   * @param {number[]} scores - Array of performance scores
   * @returns {string} Performance trend description
   */
  static _analyzeTrend(scores) {
    if (scores.length < 2) return 'Insufficient data';

    const trend = scores[scores.length - 1] - scores[0];
    
    if (trend > 10) return 'Significant Performance Improvement';
    if (trend > 5) return 'Moderate Performance Improvement';
    if (trend > 0) return 'Slight Performance Improvement';
    if (trend === 0) return 'Performance Consistent';
    if (trend > -5) return 'Slight Performance Degradation';
    if (trend > -10) return 'Moderate Performance Degradation';
    return 'Significant Performance Degradation';
  }
}

module.exports = PerformanceAnalyzer;
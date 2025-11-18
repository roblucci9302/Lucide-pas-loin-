/**
 * HR Specialist Template: HR Report
 * Comprehensive HR report with analysis, metrics, and recommendations
 */

module.exports = {
    id: 'hr_report',
    name: 'HR Report',
    description: 'Comprehensive HR report with workforce analytics, trends, and strategic recommendations',

    content: `# HR Report: {{title}}

## Report Information

**Period**: {{period}}
**Prepared by**: {{preparedBy}}
**Date**: {{date}}
**Classification**: {{classification}}

---

## Executive Summary

{{executiveSummary}}

### Key Highlights

{{keyHighlights}}

### Critical Issues

{{criticalIssues}}

---

## 1. Workforce Overview

{{workforceOverview}}

### Headcount Summary

| Department | Headcount | Change vs Last Period | % of Total |
|------------|-----------|------------------------|------------|
{{headcountTable}}

### Demographics

{{demographics}}

---

## 2. Recruitment & Hiring

{{recruitmentHiring}}

### Hiring Metrics

| Metric | Current Period | Previous Period | Trend |
|--------|----------------|-----------------|-------|
| Positions Opened | {{positionsOpened}} | {{positionsOpenedPrev}} | {{trendOpened}} |
| Hires Completed | {{hiresCompleted}} | {{hiresCompletedPrev}} | {{trendCompleted}} |
| Time to Fill (days) | {{timeToFill}} | {{timeToFillPrev}} | {{trendTimeToFill}} |
| Offer Acceptance Rate | {{offerAcceptance}} | {{offerAcceptancePrev}} | {{trendAcceptance}} |

### Open Positions

{{openPositions}}

### Recruitment Challenges

{{recruitmentChallenges}}

---

## 3. Employee Retention & Turnover

{{retentionTurnover}}

### Turnover Analysis

| Category | Turnover Rate | Voluntary | Involuntary |
|----------|---------------|-----------|-------------|
{{turnoverTable}}

### Retention Metrics

{{retentionMetrics}}

### Exit Interview Insights

{{exitInterviewInsights}}

---

## 4. Performance Management

{{performanceManagement}}

### Performance Distribution

{{performanceDistribution}}

### High Performers

{{highPerformers}}

### Performance Improvement Plans (PIPs)

{{performanceImprovementPlans}}

---

## 5. Employee Engagement

{{employeeEngagement}}

### Engagement Survey Results

{{engagementSurveyResults}}

### Engagement Score Trends

{{engagementTrends}}

### Key Engagement Drivers

{{engagementDrivers}}

---

## 6. Learning & Development

{{learningDevelopment}}

### Training Programs

{{trainingPrograms}}

### Skills Development

{{skillsDevelopment}}

### Training ROI

{{trainingROI}}

---

## 7. Compensation & Benefits

{{compensationBenefits}}

### Compensation Analysis

{{compensationAnalysis}}

### Benefits Utilization

{{benefitsUtilization}}

### Market Benchmarking

{{marketBenchmarking}}

---

## 8. Diversity, Equity & Inclusion (DEI)

{{dei}}

### Diversity Metrics

| Category | Percentage | Target | Progress |
|----------|------------|--------|----------|
{{diversityTable}}

### DEI Initiatives

{{deiInitiatives}}

---

## 9. Employee Relations

{{employeeRelations}}

### Issues & Grievances

{{issuesGrievances}}

### Resolution Metrics

{{resolutionMetrics}}

---

## 10. Compliance & Risk

{{complianceRisk}}

### Compliance Status

{{complianceStatus}}

### Risk Areas

{{riskAreas}}

### Audit Findings

{{auditFindings}}

---

## 11. HR Operations

{{hrOperations}}

### HR Service Metrics

{{hrServiceMetrics}}

### HR Technology

{{hrTechnology}}

---

## 12. Talent Pipeline

{{talentPipeline}}

### Succession Planning

{{successionPlanning}}

### High Potential Employees

{{highPotentialEmployees}}

---

## 13. Key Findings & Insights

{{keyFindings}}

---

## 14. Recommendations

{{recommendations}}

### Priority 1: Critical Actions

{{priority1}}

### Priority 2: Important Actions

{{priority2}}

### Priority 3: Long-term Initiatives

{{priority3}}

---

## 15. Action Plan

{{actionPlan}}

### Next Steps

| Action | Owner | Timeline | Status |
|--------|-------|----------|--------|
{{actionPlanTable}}

---

## 16. Budget Impact

{{budgetImpact}}

---

## Appendix

### Detailed Data Tables

{{detailedDataTables}}

### Survey Results

{{surveyResults}}

### References

{{references}}

---

**CONFIDENTIAL** - This document contains sensitive employee information and should be handled in accordance with company privacy policies.
`
};

/**
 * IT Expert Template: Technical Report
 * Professional technical documentation for IT solutions
 */

module.exports = {
    id: 'technical_report',
    name: 'Technical Report',
    description: 'Comprehensive technical documentation with problem analysis, solution, and deployment plan',

    content: `# Technical Report: {{title}}

## Executive Summary

{{executiveSummary}}

---

## 1. Problem Statement

{{problemStatement}}

### Impact Analysis

- **Severity**: {{severity}}
- **Affected Systems**: {{affectedSystems}}
- **Users Impacted**: {{usersImpacted}}

---

## 2. Root Cause Analysis

{{rootCause}}

### Technical Investigation

{{technicalInvestigation}}

---

## 3. Proposed Solution

### Overview

{{solution.description}}

### Implementation Steps

{{solution.steps}}

### Code Examples

{{solution.codeExamples}}

### Architecture Changes

{{architectureChanges}}

---

## 4. Testing Strategy

{{testing}}

### Test Cases

{{testCases}}

### Validation Criteria

{{validationCriteria}}

---

## 5. Deployment Plan

{{deployment}}

### Rollout Strategy

{{rolloutStrategy}}

### Rollback Plan

{{rollbackPlan}}

---

## 6. Monitoring & Observability

{{monitoring}}

### Key Metrics

{{keyMetrics}}

### Alerting

{{alerting}}

---

## 7. Documentation & Knowledge Transfer

{{documentation}}

### Team Training

{{teamTraining}}

---

## 8. Timeline

{{timeline}}

---

## 9. Risk Assessment

{{risks}}

### Mitigation Strategies

{{mitigationStrategies}}

---

## 10. Recommendations

{{recommendations}}

---

## Appendix

### References

{{references}}

### Technical Specifications

{{technicalSpecs}}
`
};

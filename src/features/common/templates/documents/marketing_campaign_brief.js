/**
 * Marketing Expert Template: Campaign Brief
 * Professional marketing campaign brief with strategy, creative, and execution plan
 */

module.exports = {
    id: 'campaign_brief',
    name: 'Campaign Brief',
    description: 'Comprehensive marketing campaign brief with objectives, strategy, and execution plan',

    content: `# Campaign Brief: {{campaignName}}

## Campaign Overview

{{overview}}

**Campaign Period**: {{campaignPeriod}}
**Total Budget**: {{budget}}

---

## 1. Executive Summary

{{executiveSummary}}

---

## 2. Campaign Objectives

{{objectives}}

### Success Metrics

| Metric | Target | Baseline | Measurement |
|--------|--------|----------|-------------|
{{metricsTable}}

### Key Performance Indicators (KPIs)

{{kpis}}

---

## 3. Target Audience

{{targetAudience.demographics}}

### Customer Personas

{{customerPersonas}}

### Pain Points & Motivations

{{targetAudience.painPoints}}

### Preferred Channels

{{targetAudience.channels}}

---

## 4. Key Message & Positioning

{{keyMessage}}

### Value Proposition

{{valueProposition}}

### Messaging Framework

{{messagingFramework}}

### Tone of Voice

{{toneOfVoice}}

---

## 5. Creative Strategy

{{creativeStrategy}}

### Creative Concept

{{creativeConcept}}

### Visual Direction

{{visualDirection}}

### Copy Guidelines

{{copyGuidelines}}

---

## 6. Channel Strategy

{{channelStrategy}}

### Channel Mix

| Channel | Budget | Expected Reach | KPIs |
|---------|--------|----------------|------|
{{channelMixTable}}

### Channel-Specific Tactics

{{channelTactics}}

---

## 7. Content Plan

{{contentPlan}}

### Content Calendar

{{contentCalendar}}

### Asset List

{{assetList}}

---

## 8. Media Plan

{{mediaPlan}}

### Paid Media Strategy

{{paidMediaStrategy}}

### Media Budget Allocation

{{mediaBudgetAllocation}}

---

## 9. Timeline & Milestones

{{timeline}}

### Campaign Phases

| Phase | Start | End | Deliverables |
|-------|-------|-----|--------------|
{{phasesTable}}

### Key Milestones

{{milestones}}

---

## 10. Budget Breakdown

{{budgetBreakdown}}

### Cost Allocation

| Category | Amount | % of Total |
|----------|--------|------------|
{{budgetTable}}

---

## 11. Team & Responsibilities

{{teamResponsibilities}}

### Stakeholders

{{stakeholders}}

---

## 12. Competitive Analysis

{{competitiveAnalysis}}

### Market Positioning

{{marketPositioning}}

---

## 13. Risk Assessment

{{riskAssessment}}

### Contingency Plans

{{contingencyPlans}}

---

## 14. Measurement & Reporting

{{measurementPlan}}

### Reporting Cadence

{{reportingCadence}}

### Success Criteria

{{successCriteria}}

---

## 15. Post-Campaign Analysis

{{postCampaignAnalysis}}

### Learnings & Optimization

{{learningsOptimization}}

---

## Appendix

### Creative Briefs

{{creativeBriefs}}

### Research & Insights

{{researchInsights}}

### References

{{references}}
`
};

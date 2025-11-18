/**
 * CEO Advisor Template: Investor Update
 * Investor update report with company progress, metrics, and key developments
 */

module.exports = {
    id: 'investor_update',
    name: 'Investor Update',
    description: 'Regular investor update with company progress, financial metrics, and strategic developments',

    content: `# Investor Update: {{title}}

## Update Information

**Period**: {{period}}
**Date**: {{date}}
**Prepared by**: {{preparedBy}}

---

## Executive Summary

{{executiveSummary}}

### Key Highlights This Period

{{keyHighlights}}

---

## 1. Company Snapshot

{{companySnapshot}}

### Quick Stats

| Metric | Value | Change |
|--------|-------|--------|
| **Total Customers** | {{totalCustomers}} | {{totalCustomersChange}} |
| **MRR/ARR** | {{mrr}} | {{mrrChange}} |
| **Team Size** | {{teamSize}} | {{teamSizeChange}} |
| **Cash Balance** | {{cashBalance}} | {{cashBalanceChange}} |
| **Runway** | {{runway}} | {{runwayChange}} |

---

## 2. Financial Performance

{{financialPerformance}}

### Revenue Performance

| Metric | This Period | Last Period | YoY | Variance to Plan |
|--------|-------------|-------------|-----|------------------|
| Revenue | {{revenue}} | {{revenuePrev}} | {{revenueYoY}} | {{revenueVariance}} |
| Gross Profit | {{grossProfit}} | {{grossProfitPrev}} | {{grossProfitYoY}} | {{grossProfitVariance}} |
| Gross Margin | {{grossMargin}} | {{grossMarginPrev}} | - | {{grossMarginVariance}} |

### Cash Flow & Burn

{{cashFlowBurn}}

### Revenue Breakdown

{{revenueBreakdown}}

---

## 3. Growth Metrics

{{growthMetrics}}

### Customer Growth

{{customerGrowth}}

### Customer Cohort Analysis

{{cohortAnalysis}}

### Unit Economics

| Metric | Value | Target | Benchmark |
|--------|-------|--------|-----------|
| CAC | {{cac}} | {{cacTarget}} | {{cacBenchmark}} |
| LTV | {{ltv}} | {{ltvTarget}} | {{ltvBenchmark}} |
| LTV:CAC | {{ltvCac}} | {{ltvCacTarget}} | {{ltvCacBenchmark}} |
| Payback Period | {{paybackPeriod}} | {{paybackPeriodTarget}} | {{paybackPeriodBenchmark}} |

---

## 4. Product & Technology

{{productTechnology}}

### Product Milestones

{{productMilestones}}

### Feature Launches

{{featureLaunches}}

### Technology Achievements

{{technologyAchievements}}

### Product Roadmap Ahead

{{productRoadmapAhead}}

---

## 5. Sales & Marketing

{{salesMarketing}}

### Sales Performance

{{salesPerformance}}

### Marketing Performance

{{marketingPerformance}}

### Pipeline & Funnel

{{pipelineFunnel}}

### Win Rate & Deal Velocity

{{winRateDealVelocity}}

---

## 6. Strategic Initiatives Update

{{strategicInitiativesUpdate}}

### Completed This Period

{{completedInitiatives}}

### In Progress

{{inProgressInitiatives}}

### Upcoming

{{upcomingInitiatives}}

---

## 7. Key Wins & Achievements

{{keyWins}}

### Customer Wins

{{customerWins}}

### Product Wins

{{productWins}}

### Partnership Wins

{{partnershipWins}}

### Team Wins

{{teamWins}}

---

## 8. Challenges & Learnings

{{challengesLearnings}}

### Key Challenges

{{keyChallenges}}

### How We're Addressing Them

{{addressingChallenges}}

### Lessons Learned

{{lessonsLearned}}

---

## 9. Market & Competitive Update

{{marketCompetitiveUpdate}}

### Market Developments

{{marketDevelopments}}

### Competitive Landscape

{{competitiveLandscape}}

### Our Position

{{ourPosition}}

---

## 10. Team & Organization

{{teamOrganization}}

### Headcount Growth

{{headcountGrowth}}

### Key Hires

{{keyHires}}

### Team Developments

{{teamDevelopments}}

---

## 11. Partnerships & Ecosystem

{{partnershipsEcosystem}}

### New Partnerships

{{newPartnerships}}

### Strategic Relationships

{{strategicRelationships}}

---

## 12. Customer Spotlight

{{customerSpotlight}}

### Customer Success Stories

{{customerSuccessStories}}

### Customer Feedback

{{customerFeedback}}

---

## 13. Press & Media

{{pressMedia}}

### Media Coverage

{{mediaCoverage}}

### Industry Recognition

{{industryRecognition}}

---

## 14. Use of Funds Update

{{useOfFundsUpdate}}

### Capital Deployment

{{capitalDeployment}}

### Burn vs. Plan

{{burnVsPlan}}

---

## 15. Looking Ahead

{{lookingAhead}}

### Next Quarter Priorities

{{nextQuarterPriorities}}

### Key Milestones Ahead

{{keyMilestonesAhead}}

### Risks & Mitigations

{{risksAheadMitigations}}

---

## 16. Ask from Investors

{{askFromInvestors}}

### Introductions Needed

{{introductionsNeeded}}

### Advice & Guidance Sought

{{adviceGuidance}}

### Support Requested

{{supportRequested}}

---

## 17. Upcoming Events

{{upcomingEvents}}

### Board Meetings

{{boardMeetings}}

### Company Events

{{companyEvents}}

### Industry Events

{{industryEvents}}

---

## Appendix

### Detailed Metrics

{{detailedMetrics}}

### Customer Testimonials

{{customerTestimonials}}

### Press Clips

{{pressClips}}

---

Thank you for your continued support and partnership!

{{closingMessage}}

---

**CONFIDENTIAL** - This investor update contains proprietary and confidential information intended solely for investors.
`
};

/**
 * CEO Advisor Template: Board Report
 * Executive board report with financial performance, strategic initiatives, and business metrics
 */

module.exports = {
    id: 'board_report',
    name: 'Board Report',
    description: 'Executive board report with company performance, strategic initiatives, and key decisions',

    content: `# Board Report: {{title}}

## Report Information

**Period**: {{period}}
**Board Meeting Date**: {{boardMeetingDate}}
**Prepared by**: {{preparedBy}}
**Classification**: Confidential - Board Members Only

---

## Executive Summary

{{executiveSummary}}

### Key Highlights

{{keyHighlights}}

### Key Challenges

{{keyChallenges}}

### Board Action Items

{{boardActionItems}}

---

## 1. Financial Performance

{{financialPerformance}}

### Revenue & Growth

| Metric | Actual | Budget | Variance | YoY Growth |
|--------|--------|--------|----------|------------|
| **Revenue** | {{revenue}} | {{revenueBudget}} | {{revenueVariance}} | {{revenueGrowth}} |
| **Gross Profit** | {{grossProfit}} | {{grossProfitBudget}} | {{grossProfitVariance}} | {{grossProfitGrowth}} |
| **EBITDA** | {{ebitda}} | {{ebitdaBudget}} | {{ebitdaVariance}} | {{ebitdaGrowth}} |
| **Net Income** | {{netIncome}} | {{netIncomeBudget}} | {{netIncomeVariance}} | {{netIncomeGrowth}} |

### Key Financial Metrics

| Metric | Current | Previous | Change |
|--------|---------|----------|--------|
| Gross Margin | {{grossMargin}} | {{grossMarginPrev}} | {{grossMarginChange}} |
| Operating Margin | {{operatingMargin}} | {{operatingMarginPrev}} | {{operatingMarginChange}} |
| Cash Balance | {{cashBalance}} | {{cashBalancePrev}} | {{cashBalanceChange}} |
| Burn Rate | {{burnRate}} | {{burnRatePrev}} | {{burnRateChange}} |
| Runway | {{runway}} | {{runwayPrev}} | {{runwayChange}} |

### Financial Commentary

{{financialCommentary}}

---

## 2. Business Metrics & KPIs

{{businessMetrics}}

### Customer Metrics

| Metric | Current | Target | Previous | Trend |
|--------|---------|--------|----------|-------|
| Total Customers | {{totalCustomers}} | {{totalCustomersTarget}} | {{totalCustomersPrev}} | {{totalCustomersTrend}} |
| New Customers | {{newCustomers}} | {{newCustomersTarget}} | {{newCustomersPrev}} | {{newCustomersTrend}} |
| Churn Rate | {{churnRate}} | {{churnRateTarget}} | {{churnRatePrev}} | {{churnRateTrend}} |
| Customer LTV | {{customerLTV}} | {{customerLTVTarget}} | {{customerLTVPrev}} | {{customerLTVTrend}} |
| CAC | {{cac}} | {{cacTarget}} | {{cacPrev}} | {{cacTrend}} |
| LTV:CAC Ratio | {{ltvCacRatio}} | {{ltvCacRatioTarget}} | {{ltvCacRatioPrev}} | {{ltvCacRatioTrend}} |

### Operational Metrics

{{operationalMetrics}}

---

## 3. Strategic Initiatives

{{strategicInitiatives}}

### Initiative Status

| Initiative | Owner | Status | Progress | Impact | Next Steps |
|------------|-------|--------|----------|--------|------------|
{{initiativesTable}}

### Completed Initiatives

{{completedInitiatives}}

### Upcoming Initiatives

{{upcomingInitiatives}}

---

## 4. Market & Competitive Landscape

{{marketCompetitive}}

### Market Trends

{{marketTrends}}

### Competitive Activity

{{competitiveActivity}}

### Market Position

{{marketPosition}}

---

## 5. Product & Technology

{{productTechnology}}

### Product Roadmap

{{productRoadmap}}

### Technology Infrastructure

{{technologyInfrastructure}}

### Innovation Pipeline

{{innovationPipeline}}

---

## 6. Sales & Marketing

{{salesMarketing}}

### Sales Performance

{{salesPerformance}}

### Marketing Performance

{{marketingPerformance}}

### Pipeline Health

{{pipelineHealth}}

---

## 7. Operations

{{operations}}

### Operational Efficiency

{{operationalEfficiency}}

### Process Improvements

{{processImprovements}}

---

## 8. People & Organization

{{peopleOrganization}}

### Headcount & Hiring

| Department | Current | Target | Open Positions |
|------------|---------|--------|----------------|
{{headcountTable}}

### Talent & Culture

{{talentCulture}}

### Key Hires & Departures

{{keyHiresDepartures}}

---

## 9. Risk Management

{{riskManagement}}

### Key Risks

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
{{risksTable}}

### Compliance & Legal

{{complianceLegal}}

---

## 10. Strategic Opportunities

{{strategicOpportunities}}

### Growth Opportunities

{{growthOpportunities}}

### Partnership Opportunities

{{partnershipOpportunities}}

### M&A Opportunities

{{maOpportunities}}

---

## 11. Capital & Fundraising

{{capitalFundraising}}

### Fundraising Status

{{fundraisingStatus}}

### Use of Funds

{{useOfFunds}}

### Investor Relations

{{investorRelations}}

---

## 12. Board Matters

{{boardMatters}}

### Decisions Required

{{decisionsRequired}}

### Items for Board Approval

{{itemsForApproval}}

### Committee Updates

{{committeeUpdates}}

---

## 13. Ask from the Board

{{askFromBoard}}

### Strategic Guidance Needed

{{strategicGuidance}}

### Connections & Introductions

{{connectionsIntroductions}}

### Expertise & Advice

{{expertiseAdvice}}

---

## 14. Outlook & Forecast

{{outlookForecast}}

### Next Quarter Forecast

{{nextQuarterForecast}}

### Annual Outlook

{{annualOutlook}}

---

## Appendix

### Detailed Financial Statements

{{detailedFinancials}}

### Supporting Data

{{supportingData}}

### Previous Board Meeting Action Items

{{previousActionItems}}

---

**CONFIDENTIAL** - This board report contains proprietary and confidential information intended solely for board members.
`
};

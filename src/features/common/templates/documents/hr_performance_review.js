/**
 * HR Specialist Template: Performance Review
 * Comprehensive employee performance review with goals, achievements, and development plan
 */

module.exports = {
    id: 'performance_review',
    name: 'Performance Review',
    description: 'Comprehensive employee performance review with ratings, feedback, and development plan',

    content: `# Performance Review

## Employee Information

**Name**: {{employeeName}}
**Position**: {{position}}
**Department**: {{department}}
**Manager**: {{managerName}}
**Review Period**: {{reviewPeriod}}
**Review Date**: {{reviewDate}}

---

## Review Summary

{{reviewSummary}}

### Overall Rating

**Overall Performance**: {{overallRating}} / 5

---

## 1. Goal Achievement

{{goalAchievement}}

### Goals from Previous Period

| Goal | Target | Achievement | Rating | Comments |
|------|--------|-------------|--------|----------|
{{goalsTable}}

### Key Accomplishments

{{keyAccomplishments}}

---

## 2. Performance Evaluation

{{performanceEvaluation}}

### Core Competencies

| Competency | Rating | Comments |
|------------|--------|----------|
| **Job Knowledge** | {{jobKnowledgeRating}} | {{jobKnowledgeComments}} |
| **Quality of Work** | {{qualityRating}} | {{qualityComments}} |
| **Productivity** | {{productivityRating}} | {{productivityComments}} |
| **Communication** | {{communicationRating}} | {{communicationComments}} |
| **Teamwork** | {{teamworkRating}} | {{teamworkComments}} |
| **Problem Solving** | {{problemSolvingRating}} | {{problemSolvingComments}} |
| **Initiative** | {{initiativeRating}} | {{initiativeComments}} |
| **Adaptability** | {{adaptabilityRating}} | {{adaptabilityComments}} |

**Rating Scale**: 1 = Needs Improvement, 2 = Below Expectations, 3 = Meets Expectations, 4 = Exceeds Expectations, 5 = Outstanding

---

## 3. Role-Specific Performance

{{roleSpecificPerformance}}

### Key Performance Indicators (KPIs)

{{kpis}}

---

## 4. Strengths

{{strengths}}

---

## 5. Areas for Development

{{areasForDevelopment}}

---

## 6. Behavioral Observations

{{behavioralObservations}}

### Positive Behaviors

{{positiveBehaviors}}

### Behaviors to Address

{{behaviorsToAddress}}

---

## 7. Feedback from Others

{{feedback}}

### Peer Feedback

{{peerFeedback}}

### Stakeholder Feedback

{{stakeholderFeedback}}

---

## 8. Development Plan

{{developmentPlan}}

### Training & Development Opportunities

{{trainingOpportunities}}

### Skill Development Goals

{{skillDevelopmentGoals}}

### Mentorship & Coaching

{{mentorshipCoaching}}

---

## 9. Goals for Next Period

{{goalsNextPeriod}}

### Professional Goals

| Goal | Success Criteria | Timeline | Support Needed |
|------|------------------|----------|----------------|
{{professionalGoalsTable}}

### Personal Development Goals

{{personalDevelopmentGoals}}

---

## 10. Career Aspirations

{{careerAspirations}}

### Career Path Discussion

{{careerPathDiscussion}}

### Promotion Readiness

{{promotionReadiness}}

---

## 11. Compensation Discussion

{{compensationDiscussion}}

### Salary Review

{{salaryReview}}

### Bonus/Incentives

{{bonusIncentives}}

---

## 12. Manager Comments

{{managerComments}}

---

## 13. Employee Comments

{{employeeComments}}

---

## 14. Action Items

{{actionItems}}

### Manager Actions

| Action | Timeline | Status |
|--------|----------|--------|
{{managerActionsTable}}

### Employee Actions

| Action | Timeline | Status |
|--------|----------|--------|
{{employeeActionsTable}}

---

## 15. Next Review

**Next Review Date**: {{nextReviewDate}}
**Mid-Year Check-in**: {{midYearCheckin}}

---

## Signatures

**Employee Signature**: _________________________ Date: _________

**Manager Signature**: _________________________ Date: _________

**HR Review**: _________________________ Date: _________

---

**CONFIDENTIAL** - This performance review is confidential and should be stored securely in accordance with company privacy policies.
`
};

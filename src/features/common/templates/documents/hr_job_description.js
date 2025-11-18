/**
 * HR Specialist Template: Job Description
 * Professional job description with responsibilities, qualifications, and benefits
 */

module.exports = {
    id: 'job_description',
    name: 'Job Description',
    description: 'Professional job description with role overview, responsibilities, and requirements',

    content: `# Job Description: {{jobTitle}}

## Position Information

**Department**: {{department}}
**Reports to**: {{reportsTo}}
**Location**: {{location}}
**Employment Type**: {{employmentType}}
**Salary Range**: {{salaryRange}}

---

## About Us

{{aboutCompany}}

---

## Position Overview

{{positionOverview}}

---

## Key Responsibilities

{{keyResponsibilities}}

### Primary Duties

{{primaryDuties}}

### Additional Responsibilities

{{additionalResponsibilities}}

---

## Required Qualifications

{{requiredQualifications}}

### Education

{{education}}

### Experience

{{experience}}

### Technical Skills

{{technicalSkills}}

### Soft Skills

{{softSkills}}

---

## Preferred Qualifications

{{preferredQualifications}}

---

## What Success Looks Like

{{successMetrics}}

### 30 Days

{{success30Days}}

### 60 Days

{{success60Days}}

### 90 Days

{{success90Days}}

---

## Working Conditions

{{workingConditions}}

### Work Environment

{{workEnvironment}}

### Physical Requirements

{{physicalRequirements}}

### Travel Requirements

{{travelRequirements}}

---

## Compensation & Benefits

{{compensationBenefits}}

### Salary

{{salary}}

### Benefits Package

{{benefitsPackage}}

### Perks

{{perks}}

---

## Career Development

{{careerDevelopment}}

### Growth Opportunities

{{growthOpportunities}}

### Learning & Development

{{learningDevelopment}}

---

## Our Culture & Values

{{cultureValues}}

---

## Equal Opportunity Statement

{{equalOpportunityStatement}}

---

## How to Apply

{{howToApply}}

---

**Posted**: {{postedDate}}
**Application Deadline**: {{applicationDeadline}}
**Requisition ID**: {{requisitionId}}
`
};

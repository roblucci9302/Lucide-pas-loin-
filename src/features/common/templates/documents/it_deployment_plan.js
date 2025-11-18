/**
 * IT Expert Template: Deployment Plan
 * Detailed deployment plan with steps, timeline, and rollback procedures
 */

module.exports = {
    id: 'deployment_plan',
    name: 'Deployment Plan',
    description: 'Comprehensive deployment plan with steps, validation, and rollback procedures',

    content: `# Deployment Plan: {{title}}

## Deployment Information

- **Release Version**: {{releaseVersion}}
- **Deployment Date**: {{deploymentDate}}
- **Environment**: {{environment}}
- **Deploy Manager**: {{deployManager}}

---

## 1. Executive Summary

{{executiveSummary}}

---

## 2. Scope

{{scope}}

### Features Included

{{featuresIncluded}}

### Out of Scope

{{outOfScope}}

---

## 3. Pre-Deployment Checklist

{{preDeploymentChecklist}}

### Environment Preparation

- [ ] {{envPrep1}}
- [ ] {{envPrep2}}
- [ ] {{envPrep3}}

### Code & Build

- [ ] {{codeBuild1}}
- [ ] {{codeBuild2}}
- [ ] {{codeBuild3}}

### Testing Validation

- [ ] {{testValidation1}}
- [ ] {{testValidation2}}
- [ ] {{testValidation3}}

---

## 4. Deployment Steps

{{deploymentSteps}}

### Step-by-Step Procedure

{{stepByStepProcedure}}

### Commands

\`\`\`bash
{{deploymentCommands}}
\`\`\`

---

## 5. Validation & Smoke Tests

{{validation}}

### Health Checks

{{healthChecks}}

### Smoke Test Cases

{{smokeTests}}

---

## 6. Rollback Plan

{{rollbackPlan}}

### Rollback Triggers

{{rollbackTriggers}}

### Rollback Procedure

{{rollbackProcedure}}

### Rollback Commands

\`\`\`bash
{{rollbackCommands}}
\`\`\`

---

## 7. Database Migrations

{{databaseMigrations}}

### Migration Scripts

\`\`\`sql
{{migrationScripts}}
\`\`\`

### Data Backup

{{dataBackup}}

---

## 8. Configuration Changes

{{configChanges}}

### Environment Variables

{{envVars}}

### Feature Flags

{{featureFlags}}

---

## 9. Monitoring & Alerting

{{monitoring}}

### Metrics to Watch

{{metricsToWatch}}

### Alert Configuration

{{alertConfig}}

---

## 10. Communication Plan

{{communicationPlan}}

### Stakeholder Notifications

{{stakeholderNotifications}}

### Status Updates

{{statusUpdates}}

---

## 11. Post-Deployment Tasks

{{postDeploymentTasks}}

### Verification

- [ ] {{verification1}}
- [ ] {{verification2}}
- [ ] {{verification3}}

### Documentation Updates

{{documentationUpdates}}

---

## 12. Timeline

{{timeline}}

---

## 13. Risk Assessment

{{riskAssessment}}

### Known Risks

{{knownRisks}}

### Mitigation Strategies

{{mitigationStrategies}}

---

## 14. Team Contacts

{{teamContacts}}

### On-Call Rotation

{{onCallRotation}}

---

## Appendix

### Related Documents

{{relatedDocuments}}

### Deployment History

{{deploymentHistory}}
`
};

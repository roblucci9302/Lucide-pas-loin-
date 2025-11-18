/**
 * Phone Call Summary Template
 * Professional phone call summary with key points and follow-up
 * Phase 6.2: Transcription Center - Additional Templates
 */

module.exports = {
    id: 'phone_call_summary',
    name: 'Phone Call Summary',
    description: 'Concise phone call summary with key points, decisions, and follow-up actions',
    category: 'transcription',

    content: `# Phone Call Summary: {{title}}

## Call Information

**Date**: {{callDate}}
**Time**: {{callTime}}
**Duration**: {{duration}}
**Type**: {{callType}}

**Participants**:
{{participants}}

**Caller**: {{caller}}
**Recipient**: {{recipient}}

---

## Call Purpose

{{purpose}}

---

## Executive Summary

{{executiveSummary}}

---

## Key Discussion Points

{{keyPoints}}

---

## Decisions & Agreements

{{decisions}}

---

## Action Items

{{actionItems}}

### Action Item Tracker

| Action | Owner | Deadline | Priority |
|--------|-------|----------|----------|
{{actionItemTable}}

---

## Follow-Up Required

{{followUp}}

### Next Steps

{{nextSteps}}

---

## Important Notes

{{notes}}

---

## Next Contact

**Scheduled**: {{nextContactDate}}
**Method**: {{nextContactMethod}}
**Purpose**: {{nextContactPurpose}}

---

## Call Recording

**Available**: {{recordingAvailable}}
**Location**: {{recordingLocation}}

---

## Appendix

### Full Transcription

{{fullTranscription}}

---

**Summary prepared by**: {{preparedBy}}
**Date prepared**: {{dateGenerated}}
`
};

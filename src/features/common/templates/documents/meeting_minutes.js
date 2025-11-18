/**
 * Meeting Minutes Template
 * Professional meeting minutes/compte-rendu generation from transcriptions
 * Phase 6: Transcription Center
 */

module.exports = {
    id: 'meeting_minutes',
    name: 'Meeting Minutes / Compte-Rendu',
    description: 'Professional meeting minutes with summary, decisions, action items, and next steps',
    category: 'transcription', // New category for transcription-based templates

    content: `# Meeting Minutes: {{title}}

## Meeting Information

**Date**: {{meetingDate}}
**Time**: {{meetingTime}}
**Duration**: {{duration}}
**Location**: {{location}}

**Participants**:
{{participants}}

**Meeting Type**: {{meetingType}}
**Led by**: {{facilitator}}

---

## 1. Meeting Objective

{{objective}}

---

## 2. Executive Summary

{{executiveSummary}}

**Key Takeaways**:
{{keyTakeaways}}

---

## 3. Agenda & Discussion

### Topics Covered

{{topicsCovered}}

### Detailed Discussion

{{discussion}}

---

## 4. Decisions Made

{{decisions}}

### Decision Log

| Decision | Owner | Rationale | Impact |
|----------|-------|-----------|--------|
{{decisionTable}}

---

## 5. Action Items

{{actionItems}}

### Action Item Tracker

| # | Action | Assigned To | Deadline | Priority | Status |
|---|--------|-------------|----------|----------|--------|
{{actionItemTable}}

---

## 6. Key Questions & Answers

{{questionsAndAnswers}}

---

## 7. Open Issues / Parking Lot

{{openIssues}}

---

## 8. Next Steps

{{nextSteps}}

### Follow-up Items

{{followUpItems}}

---

## 9. Next Meeting

**Date**: {{nextMeetingDate}}
**Proposed Agenda**:
{{nextMeetingAgenda}}

---

## Appendix

### Full Transcription

{{fullTranscription}}

### Additional Notes

{{additionalNotes}}

### Attachments

{{attachments}}

---

**Minutes prepared by**: {{preparedBy}}
**Date prepared**: {{dateGenerated}}
**Review status**: {{reviewStatus}}
`
};

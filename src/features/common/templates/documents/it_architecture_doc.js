/**
 * IT Expert Template: Architecture Documentation
 * System architecture and design documentation
 */

module.exports = {
    id: 'architecture_doc',
    name: 'Architecture Documentation',
    description: 'Comprehensive system architecture documentation with diagrams and technical specifications',

    content: `# System Architecture: {{title}}

## Document Information

- **Version**: {{version}}
- **Last Updated**: {{lastUpdated}}
- **Architect**: {{architect}}

---

## 1. Architecture Overview

{{overview}}

### System Context

{{systemContext}}

---

## 2. High-Level Architecture

{{highLevelArchitecture}}

### Architecture Diagram

\`\`\`
{{architectureDiagram}}
\`\`\`

---

## 3. Components

{{components}}

### Component Responsibilities

{{componentResponsibilities}}

---

## 4. Data Architecture

{{dataArchitecture}}

### Data Models

{{dataModels}}

### Database Schema

\`\`\`sql
{{databaseSchema}}
\`\`\`

---

## 5. API Specifications

{{apiSpecs}}

### Endpoints

{{endpoints}}

### Authentication & Authorization

{{authSpecs}}

---

## 6. Integration Points

{{integrations}}

### External Services

{{externalServices}}

### Internal Services

{{internalServices}}

---

## 7. Infrastructure

{{infrastructure}}

### Deployment Architecture

{{deploymentArchitecture}}

### Scalability Strategy

{{scalability}}

---

## 8. Security Architecture

{{security}}

### Security Controls

{{securityControls}}

### Compliance

{{compliance}}

---

## 9. Performance & Reliability

{{performance}}

### Performance Targets

{{performanceTargets}}

### High Availability

{{highAvailability}}

---

## 10. Technology Stack

{{techStack}}

### Frontend

{{frontend}}

### Backend

{{backend}}

### Infrastructure & DevOps

{{infraDevOps}}

---

## 11. Design Decisions

{{designDecisions}}

### Trade-offs

{{tradeoffs}}

---

## 12. Future Roadmap

{{roadmap}}

---

## Appendix

### Glossary

{{glossary}}

### References

{{references}}
`
};

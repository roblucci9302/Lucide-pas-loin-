/**
 * Phase 3: Specialized Workflows - Templates and Quick Actions
 *
 * Defines pre-configured workflow templates for each agent profile.
 * These workflows provide structured prompts and forms for common tasks.
 */

const WORKFLOW_TEMPLATES = {
    // ============================================================
    // HR SPECIALIST WORKFLOWS
    // ============================================================
    hr_specialist: {
        create_job_posting: {
            id: 'create_job_posting',
            title: 'Créer une offre d\'emploi',
            icon: '📝',
            description: 'Générer une offre d\'emploi professionnelle et attractive',
            prompt: `Je souhaite créer une offre d'emploi professionnelle.

Informations nécessaires :
- Titre du poste
- Département/Équipe
- Niveau d'expérience requis
- Compétences techniques clés
- Compétences interpersonnelles recherchées
- Responsabilités principales
- Avantages et culture d'entreprise

Peux-tu m'aider à structurer une offre d'emploi complète et attractive ?`,
            category: 'recruitment',
            estimatedTime: '5-10 min',
            hasForm: true,
            formFields: [
                { name: 'jobTitle', label: 'Titre du poste', type: 'text', required: true },
                { name: 'department', label: 'Département', type: 'text', required: true },
                { name: 'experience', label: 'Expérience requise', type: 'select', options: ['Junior (0-2 ans)', 'Intermédiaire (2-5 ans)', 'Senior (5+ ans)', 'Expert (10+ ans)'], required: true },
                { name: 'location', label: 'Localisation', type: 'text', required: false },
                { name: 'remotePolicy', label: 'Politique télétravail', type: 'select', options: ['100% présentiel', 'Hybride', '100% remote'], required: false }
            ]
        },
        analyze_cv: {
            id: 'analyze_cv',
            title: 'Analyser un CV',
            icon: '🔍',
            description: 'Évaluer un CV par rapport à un poste',
            prompt: `Je souhaite analyser un CV de candidat.

Merci de fournir :
1. Le CV du candidat (copier-coller le texte)
2. Le titre du poste visé
3. Les critères d'évaluation prioritaires

Je vais effectuer une analyse détaillée incluant :
- Adéquation profil/poste
- Points forts du candidat
- Points à clarifier en entretien
- Recommandation d'embauche`,
            category: 'recruitment',
            estimatedTime: '3-5 min',
            hasForm: false
        },
        onboarding_plan: {
            id: 'onboarding_plan',
            title: 'Plan d\'onboarding',
            icon: '🎯',
            description: 'Créer un plan d\'intégration structuré',
            prompt: `Je souhaite créer un plan d'onboarding pour un nouveau collaborateur.

Informations nécessaires :
- Poste du nouveau collaborateur
- Département
- Durée de la période d'essai
- Équipe et manager

Je vais créer un plan d'intégration structuré sur 30-60-90 jours incluant :
- Objectifs par période
- Formations nécessaires
- Rencontres clés
- Jalons de validation`,
            category: 'onboarding',
            estimatedTime: '10-15 min',
            hasForm: true,
            formFields: [
                { name: 'position', label: 'Poste', type: 'text', required: true },
                { name: 'department', label: 'Département', type: 'text', required: true },
                { name: 'probationPeriod', label: 'Période d\'essai', type: 'select', options: ['1 mois', '2 mois', '3 mois', '6 mois'], required: true }
            ]
        },
        salary_grid: {
            id: 'salary_grid',
            title: 'Grille salariale',
            icon: '💰',
            description: 'Établir une grille de rémunération équitable',
            prompt: `Je souhaite établir une grille salariale pour mon organisation.

Informations nécessaires :
- Secteur d'activité
- Localisation géographique
- Taille de l'entreprise
- Postes concernés
- Budget global disponible

Je vais proposer une grille salariale équitable basée sur :
- Benchmarks du marché
- Équité interne
- Fourchettes par niveau d'expérience
- Packages de rémunération globale`,
            category: 'compensation',
            estimatedTime: '15-20 min',
            hasForm: false
        },
        conflict_resolution: {
            id: 'conflict_resolution',
            title: 'Résoudre un conflit',
            icon: '🤝',
            description: 'Guide de médiation et résolution de conflits',
            prompt: `Je souhaite résoudre un conflit au sein de mon équipe.

Pour vous aider efficacement, merci de décrire :
- La nature du conflit
- Les parties impliquées
- Le contexte et l'historique
- L'impact sur l'équipe

Je vais proposer :
- Une stratégie de médiation adaptée
- Des scripts de conversation
- Des techniques de désamorçage
- Un plan d'action étape par étape`,
            category: 'employee_relations',
            estimatedTime: '10-15 min',
            hasForm: false
        },
        performance_review: {
            id: 'performance_review',
            title: 'Performance review annuelle',
            icon: '📊',
            description: 'Préparer et structurer une évaluation de performance',
            prompt: `Je prépare une évaluation de performance annuelle.

Informations nécessaires :
- Nom et poste de la personne évaluée
- Objectifs fixés en début d'année
- Réalisations et projets majeurs
- Compétences techniques et comportementales
- Feedback des collègues/clients (si disponible)
- Contexte (promotion envisagée, difficultés rencontrées)

Je vais structurer :
- Bilan de l'année (accomplishments, impact)
- Évaluation des objectifs (SMART)
- Feedback constructif (SBI framework)
- Points forts et axes d'amélioration
- Plan de développement pour l'année suivante
- Objectifs pour l'année à venir
- Discussion sur aspirations carrière
- Scripts de conversation pour l'entretien`,
            category: 'performance',
            estimatedTime: '20-25 min',
            hasForm: true,
            formFields: [
                { name: 'employeeName', label: 'Nom du collaborateur', type: 'text', required: true },
                { name: 'reviewPeriod', label: 'Période évaluée', type: 'select', options: ['6 mois', '1 an', '18 mois'], required: true },
                { name: 'overallRating', label: 'Évaluation globale', type: 'select', options: ['Dépasse les attentes', 'Atteint les attentes', 'En développement', 'Ne répond pas aux attentes'], required: false }
            ]
        }
    },

    // ============================================================
    // IT EXPERT WORKFLOWS
    // ============================================================
    it_expert: {
        code_review: {
            id: 'code_review',
            title: 'Review de code',
            icon: '🔍',
            description: 'Analyser du code avec best practices',
            prompt: `Je souhaite faire reviewer du code.

Merci de fournir :
1. Le code source (langage et framework)
2. Le contexte fonctionnel
3. Les points d'attention spécifiques

Je vais effectuer une revue complète incluant :
- Qualité et lisibilité du code
- Sécurité et vulnérabilités potentielles
- Performance et optimisations
- Best practices et patterns
- Suggestions d'amélioration avec exemples`,
            category: 'development',
            estimatedTime: '5-10 min',
            hasForm: false
        },
        debug_error: {
            id: 'debug_error',
            title: 'Débugger une erreur',
            icon: '🐛',
            description: 'Identifier et résoudre un bug',
            prompt: `Je rencontre un bug que je souhaite résoudre.

Informations nécessaires :
1. Message d'erreur complet
2. Stack trace si disponible
3. Code concerné
4. Contexte d'exécution (environnement, inputs)
5. Comportement attendu vs réel

Je vais :
- Analyser la cause racine (root cause analysis)
- Proposer des solutions avec code
- Suggérer des tests pour éviter la régression
- Recommander des améliorations générales`,
            category: 'debugging',
            estimatedTime: '5-10 min',
            hasForm: false
        },
        system_architecture: {
            id: 'system_architecture',
            title: 'Architecture système',
            icon: '🏗️',
            description: 'Concevoir une architecture technique',
            prompt: `Je souhaite concevoir l'architecture d'un système.

Informations nécessaires :
- Objectif du système
- Contraintes techniques (scale, latence, etc.)
- Technologies envisagées
- Contraintes budgétaires/temporelles

Je vais proposer :
- Une architecture détaillée avec diagrammes
- Choix technologiques justifiés
- Patterns architecturaux adaptés (microservices, monolithe, etc.)
- Stratégie de scalabilité
- Considérations sécurité et résilience`,
            category: 'architecture',
            estimatedTime: '15-20 min',
            hasForm: true,
            formFields: [
                { name: 'systemType', label: 'Type de système', type: 'select', options: ['Web application', 'Mobile app', 'API backend', 'Data pipeline', 'Microservices'], required: true },
                { name: 'expectedUsers', label: 'Utilisateurs attendus', type: 'select', options: ['< 1K', '1K - 10K', '10K - 100K', '100K+'], required: true },
                { name: 'criticalRequirements', label: 'Exigences critiques', type: 'textarea', required: false }
            ]
        },
        performance_optimization: {
            id: 'performance_optimization',
            title: 'Optimiser la performance',
            icon: '⚡',
            description: 'Analyser et améliorer les performances',
            prompt: `Je souhaite optimiser les performances de mon application.

Informations nécessaires :
- Type d'application (web, mobile, backend)
- Métriques actuelles (temps de réponse, throughput, etc.)
- Goulots d'étranglement identifiés
- Profiling data si disponible

Je vais proposer :
- Analyse des performances actuelles
- Optimisations prioritaires avec impact estimé
- Code optimisé avec exemples
- Stratégies de caching et indexation
- Monitoring et métriques à suivre`,
            category: 'performance',
            estimatedTime: '10-15 min',
            hasForm: false
        },
        security_audit: {
            id: 'security_audit',
            title: 'Audit sécurité',
            icon: '🔒',
            description: 'Évaluer la sécurité d\'une application',
            prompt: `Je souhaite effectuer un audit de sécurité.

Merci de fournir :
- Architecture de l'application
- Stack technique
- Données sensibles manipulées
- Mécanismes de sécurité actuels

Je vais effectuer :
- Analyse des vulnérabilités OWASP Top 10
- Revue de l'authentification/autorisation
- Évaluation de la protection des données
- Recommandations de sécurisation
- Checklist de mise en conformité (RGPD, etc.)`,
            category: 'security',
            estimatedTime: '15-20 min',
            hasForm: false
        },
        refactoring_legacy: {
            id: 'refactoring_legacy',
            title: 'Refactoring code legacy',
            icon: '♻️',
            description: 'Moderniser et améliorer du code existant',
            prompt: `Je souhaite refactorer du code legacy.

Informations nécessaires :
- Code actuel (langage, framework, version)
- Problèmes identifiés (technical debt, bugs, performance)
- Contraintes (backward compatibility, budget, timeline)
- Tests existants (coverage actuel)
- Objectifs de refactoring (maintenabilité, performance, scalabilité)

Je vais proposer :
- Analyse de la qualité actuelle (SOLID, DRY, KISS)
- Stratégie de refactoring progressive (étapes sans tout casser)
- Code refactoré avec design patterns appropriés
- Tests unitaires pour éviter les régressions
- Documentation des changements
- Plan de migration (si changement de framework/architecture)
- Metrics d'amélioration (complexity, coverage, performance)`,
            category: 'refactoring',
            estimatedTime: '20-30 min',
            hasForm: true,
            formFields: [
                { name: 'codeLanguage', label: 'Langage', type: 'select', options: ['JavaScript/TypeScript', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Autre'], required: true },
                { name: 'refactoringGoal', label: 'Objectif principal', type: 'select', options: ['Maintenabilité', 'Performance', 'Scalabilité', 'Migration framework', 'Réduction technical debt'], required: true }
            ]
        }
    },

    // ============================================================
    // MARKETING EXPERT WORKFLOWS
    // ============================================================
    marketing_expert: {
        create_campaign: {
            id: 'create_campaign',
            title: 'Créer une campagne',
            icon: '🎯',
            description: 'Concevoir une campagne marketing complète',
            prompt: `Je souhaite créer une campagne marketing.

Informations nécessaires :
- Objectif de la campagne (awareness, conversion, rétention)
- Cible (persona, démographie)
- Budget disponible
- Canaux envisagés (social, email, display, etc.)
- Durée de la campagne

Je vais proposer :
- Stratégie de campagne multi-canaux
- Calendrier éditorial
- Messages clés par audience
- KPIs et objectifs mesurables
- Budget allocation par canal`,
            category: 'campaigns',
            estimatedTime: '15-20 min',
            hasForm: true,
            formFields: [
                { name: 'campaignGoal', label: 'Objectif principal', type: 'select', options: ['Awareness', 'Lead generation', 'Conversion', 'Rétention'], required: true },
                { name: 'budget', label: 'Budget', type: 'select', options: ['< 5K€', '5K - 20K€', '20K - 50K€', '50K+€'], required: true },
                { name: 'duration', label: 'Durée', type: 'select', options: ['1 semaine', '1 mois', '3 mois', '6 mois+'], required: true }
            ]
        },
        linkedin_post: {
            id: 'linkedin_post',
            title: 'Post LinkedIn',
            icon: '💼',
            description: 'Rédiger un post LinkedIn engageant',
            prompt: `Je souhaite créer un post LinkedIn impactant.

Informations nécessaires :
- Sujet/message principal
- Objectif (engagement, partage, génération de leads)
- Ton souhaité (professionnel, inspirant, éducatif)
- Call-to-action

Je vais créer :
- 3 variations de post optimisées
- Structure avec hook accrocheur
- Hashtags pertinents
- Suggestions de visuels
- Meilleur timing de publication`,
            category: 'content',
            estimatedTime: '5-7 min',
            hasForm: false
        },
        competitive_analysis: {
            id: 'competitive_analysis',
            title: 'Analyse concurrentielle',
            icon: '📊',
            description: 'Analyser la concurrence et le marché',
            prompt: `Je souhaite effectuer une analyse concurrentielle.

Informations nécessaires :
- Votre produit/service
- Concurrents identifiés (3-5 principaux)
- Marché cible
- Différenciation actuelle

Je vais fournir :
- Matrice concurrentielle (fonctionnalités, prix, positionnement)
- Analyse SWOT de chaque concurrent
- Opportunités de différenciation
- Recommandations stratégiques
- Veille concurrentielle à mettre en place`,
            category: 'strategy',
            estimatedTime: '20-30 min',
            hasForm: true,
            formFields: [
                { name: 'productName', label: 'Votre produit/service', type: 'text', required: true },
                { name: 'competitors', label: 'Concurrents (séparés par des virgules)', type: 'textarea', required: true },
                { name: 'market', label: 'Marché cible', type: 'text', required: true }
            ]
        },
        content_strategy: {
            id: 'content_strategy',
            title: 'Stratégie de contenu',
            icon: '📝',
            description: 'Élaborer un plan de contenu éditorial',
            prompt: `Je souhaite créer une stratégie de contenu.

Informations nécessaires :
- Objectifs marketing (SEO, engagement, expertise)
- Audience cible
- Canaux de diffusion
- Ressources disponibles (équipe, budget)
- Fréquence de publication souhaitée

Je vais créer :
- Piliers de contenu alignés avec vos objectifs
- Calendrier éditorial sur 3 mois
- Mix de formats (blog, vidéo, infographie, etc.)
- Thématiques et angles
- Process de production et validation`,
            category: 'content',
            estimatedTime: '20-25 min',
            hasForm: false
        },
        email_marketing: {
            id: 'email_marketing',
            title: 'Email marketing',
            icon: '📧',
            description: 'Créer une campagne email persuasive',
            prompt: `Je souhaite créer une campagne email marketing.

Informations nécessaires :
- Objectif de l'email (promotion, nurturing, re-engagement)
- Audience ciblée
- Offre ou message principal
- Call-to-action souhaité

Je vais créer :
- Objet d'email accrocheur (3 variations)
- Structure de l'email optimisée
- Copywriting persuasif
- Design et placement des CTA
- Stratégie de test A/B
- Métriques à suivre (open rate, CTR, conversion)`,
            category: 'email',
            estimatedTime: '10-12 min',
            hasForm: true,
            formFields: [
                { name: 'emailGoal', label: 'Objectif', type: 'select', options: ['Promotion', 'Newsletter', 'Nurturing', 'Re-engagement', 'Invitation événement'], required: true },
                { name: 'audience', label: 'Audience', type: 'text', required: true }
            ]
        },
        landing_page_copy: {
            id: 'landing_page_copy',
            title: 'Landing page conversion',
            icon: '🎯',
            description: 'Rédiger une landing page haute conversion',
            prompt: `Je souhaite créer le copy d'une landing page qui convertit.

Informations nécessaires :
- Offre ou produit à promouvoir
- Audience cible et leurs pain points
- Bénéfice principal (value proposition)
- Concurrents et alternatives
- Call-to-action souhaité (achat, inscription, démo, téléchargement)

Je vais structurer :
- Hero section (headline + subheadline + CTA above fold)
- Problem statement (pain points de l'audience)
- Solution et bénéfices (features → benefits)
- Social proof (témoignages, logos clients, statistiques)
- How it works (3-5 étapes simples)
- Pricing ou offre (si applicable)
- FAQ pour gérer objections
- CTA final avec urgence/scarcité
- Stratégie de test A/B (headline, CTA, design)`,
            category: 'conversion',
            estimatedTime: '25-30 min',
            hasForm: true,
            formFields: [
                { name: 'productType', label: 'Type de produit/service', type: 'select', options: ['SaaS', 'Produit physique', 'Service/Consulting', 'Formation/Cours', 'Lead magnet/eBook'], required: true },
                { name: 'conversionGoal', label: 'Objectif de conversion', type: 'select', options: ['Achat direct', 'Essai gratuit', 'Démo', 'Téléchargement', 'Inscription'], required: true }
            ]
        }
    },

    // ============================================================
    // CEO ADVISOR WORKFLOWS
    // ============================================================
    ceo_advisor: {
        strategic_okrs: {
            id: 'strategic_okrs',
            title: 'Définir les OKRs stratégiques',
            icon: '🎯',
            description: 'Créer des Objectives & Key Results ambitieux et mesurables',
            prompt: `Je souhaite définir les OKRs stratégiques pour mon organisation.

Informations nécessaires :
- Vision et mission de l'entreprise
- Horizon temporel (trimestre, année)
- Priorités stratégiques actuelles
- Contraintes et ressources
- Métriques de succès actuelles

Je vais créer :
- 3-5 Objectives clairs et inspirants
- 3-4 Key Results par Objective (mesurables, ambitieux)
- Alignement avec vision long-terme
- KPIs de suivi et cadence de review
- Plan de communication aux équipes`,
            category: 'strategy',
            estimatedTime: '20-25 min',
            hasForm: true,
            formFields: [
                { name: 'timeHorizon', label: 'Période', type: 'select', options: ['Trimestre', 'Semestre', 'Année'], required: true },
                { name: 'companyStage', label: 'Stade entreprise', type: 'select', options: ['Pré-seed', 'Seed', 'Série A-B', 'Croissance', 'Mature'], required: true },
                { name: 'topPriorities', label: 'Priorités (3 max)', type: 'textarea', required: true }
            ]
        },
        board_presentation: {
            id: 'board_presentation',
            title: 'Préparer un board meeting',
            icon: '📊',
            description: 'Structurer une présentation exécutive percutante',
            prompt: `Je souhaite préparer une présentation pour le conseil d'administration.

Informations nécessaires :
- Objectif de la présentation (update, approbation, stratégie)
- Métriques clés du trimestre
- Décisions à faire valider
- Challenges et risques
- Demandes au board (financement, recrutement, etc.)

Je vais structurer :
- Executive summary (slides 1-2)
- Performance vs plan (métriques, highlights, lowlights)
- Deep dive sur 1-2 sujets stratégiques
- Roadmap et prochaines étapes
- Asks clairs au board
- Annexes avec données détaillées`,
            category: 'governance',
            estimatedTime: '30-40 min',
            hasForm: true,
            formFields: [
                { name: 'meetingType', label: 'Type de meeting', type: 'select', options: ['Quarterly review', 'Strategic planning', 'Fundraising', 'Special topic'], required: true },
                { name: 'keyDecision', label: 'Décision principale à valider', type: 'text', required: false }
            ]
        },
        fundraising_strategy: {
            id: 'fundraising_strategy',
            title: 'Stratégie de levée de fonds',
            icon: '💰',
            description: 'Planifier une levée de fonds réussie',
            prompt: `Je souhaite préparer une levée de fonds.

Informations nécessaires :
- Montant visé et use of funds
- Stage actuel et metrics (ARR, growth, etc.)
- Runway actuel
- Investisseurs existants
- Timing souhaité

Je vais proposer :
- Sizing de la levée (montant, dilution, valorisation)
- Story et narrative pour investors
- Matériaux nécessaires (deck, data room, financials)
- Liste d'investisseurs cibles par tier
- Timeline et process de fundraising
- Stratégie de négociation et term sheet`,
            category: 'fundraising',
            estimatedTime: '40-50 min',
            hasForm: true,
            formFields: [
                { name: 'fundingStage', label: 'Stage de levée', type: 'select', options: ['Seed', 'Série A', 'Série B', 'Série C+'], required: true },
                { name: 'targetAmount', label: 'Montant visé', type: 'select', options: ['< 1M€', '1-3M€', '3-10M€', '10-30M€', '30M+€'], required: true },
                { name: 'currentRunway', label: 'Runway actuel (mois)', type: 'select', options: ['< 6 mois', '6-12 mois', '12-18 mois', '18+ mois'], required: true }
            ]
        },
        market_analysis: {
            id: 'market_analysis',
            title: 'Analyse de marché stratégique',
            icon: '🔍',
            description: 'Évaluer le marché et la position concurrentielle',
            prompt: `Je souhaite effectuer une analyse de marché approfondie.

Informations nécessaires :
- Marché cible (TAM, SAM, SOM)
- Concurrents directs et indirects
- Tendances macro (réglementaire, tech, consumer)
- Votre différenciation actuelle
- Ambitions de parts de marché

Je vais fournir :
- Sizing de marché et opportunité
- Analyse Porter's 5 Forces
- Positionnement compétitif (matrice)
- Barrières à l'entrée et moats
- Opportunités de M&A ou partenariats
- Recommandations stratégiques`,
            category: 'strategy',
            estimatedTime: '35-45 min',
            hasForm: false
        },
        crisis_management: {
            id: 'crisis_management',
            title: 'Gestion de crise',
            icon: '🚨',
            description: 'Naviguer une situation de crise avec un plan clair',
            prompt: `Je fais face à une situation de crise et besoin d'un plan d'action.

Informations nécessaires :
- Nature de la crise (financière, PR, produit, légale)
- Impact actuel et potentiel
- Parties prenantes affectées
- Ressources disponibles
- Contraintes de temps

Je vais créer :
- Évaluation de la gravité et des risques
- Plan de communication (interne + externe)
- Actions immédiates et plan 30-60-90 jours
- Équipe de gestion de crise et rôles
- Métriques de suivi et critères de sortie de crise
- Learnings et mesures préventives futures`,
            category: 'operations',
            estimatedTime: '30-35 min',
            hasForm: false
        },
        organizational_design: {
            id: 'organizational_design',
            title: 'Restructuration organisationnelle',
            icon: '🏢',
            description: 'Concevoir une structure org adaptée à la croissance',
            prompt: `Je souhaite repenser la structure organisationnelle de mon entreprise.

Informations nécessaires :
- Taille actuelle (headcount)
- Croissance prévue (12-24 mois)
- Structure actuelle et pain points
- Stade de l'entreprise et stratégie
- Budget et contraintes

Je vais proposer :
- Org chart optimisé par fonction
- Ratios d'encadrement et reporting lines
- Nouveaux rôles clés à créer
- Plan de transition (timing, communication)
- Profils à recruter en priorité
- Impacts culture et processus`,
            category: 'organization',
            estimatedTime: '40-50 min',
            hasForm: true,
            formFields: [
                { name: 'currentHeadcount', label: 'Effectif actuel', type: 'select', options: ['< 20', '20-50', '50-150', '150-500', '500+'], required: true },
                { name: 'targetHeadcount', label: 'Effectif cible (12 mois)', type: 'select', options: ['< 20', '20-50', '50-150', '150-500', '500+'], required: true }
            ]
        }
    },

    // ============================================================
    // SALES EXPERT WORKFLOWS
    // ============================================================
    sales_expert: {
        cold_outreach: {
            id: 'cold_outreach',
            title: 'Email de prospection',
            icon: '📧',
            description: 'Rédiger un email de prospection personnalisé et percutant',
            prompt: `Je souhaite créer un email de prospection efficace.

Informations nécessaires :
- Entreprise cible et persona (rôle, seniority)
- Pain point principal que vous résolvez
- Social proof (clients similaires, métriques)
- Call-to-action souhaité (démo, call, téléchargement)
- Contexte ou trigger event (levée de fonds, recrutement, actualité)

Je vais créer :
- 3 variations d'email avec hooks différents
- Objet accrocheur (personnalisé)
- Personnalisation basée sur recherche
- Value proposition claire
- CTA simple et non-pushy
- Stratégie de follow-up (2-3 touches)`,
            category: 'prospecting',
            estimatedTime: '10-12 min',
            hasForm: true,
            formFields: [
                { name: 'targetRole', label: 'Rôle cible', type: 'text', required: true },
                { name: 'companyInfo', label: 'Info sur l\'entreprise', type: 'textarea', required: false },
                { name: 'ctaType', label: 'CTA souhaité', type: 'select', options: ['Démo', 'Call discovery', 'Partage ressource', 'Invitation événement'], required: true }
            ]
        },
        discovery_framework: {
            id: 'discovery_framework',
            title: 'Framework de découverte',
            icon: '🔍',
            description: 'Préparer un call de découverte MEDDIC/BANT',
            prompt: `Je prépare un call de découverte avec un prospect.

Informations nécessaires :
- Informations connues sur le prospect (rôle, entreprise, contexte)
- Solution que vous vendez
- Framework préféré (BANT, MEDDIC, SPICED)
- Durée du call
- Objectif du call (qualifier, avancer dans le funnel)

Je vais créer :
- 15-20 questions de découverte structurées
- Questions de qualification (Budget, Authority, Need, Timeline)
- Questions de diagnostic (pain points, impact business)
- Questions de vision (solution idéale, critères de décision)
- Gestion des objections potentielles
- Next steps possibles selon les réponses`,
            category: 'discovery',
            estimatedTime: '15-18 min',
            hasForm: true,
            formFields: [
                { name: 'framework', label: 'Framework', type: 'select', options: ['BANT', 'MEDDIC', 'SPICED', 'Autre'], required: true },
                { name: 'callDuration', label: 'Durée du call', type: 'select', options: ['30 min', '45 min', '60 min'], required: true }
            ]
        },
        proposal_creation: {
            id: 'proposal_creation',
            title: 'Créer une proposition commerciale',
            icon: '📄',
            description: 'Structurer une proposition gagnante et personnalisée',
            prompt: `Je souhaite créer une proposition commerciale convaincante.

Informations nécessaires :
- Contexte du deal (découverte effectuée, pain points identifiés)
- Solution proposée (package, pricing)
- ROI et business case
- Stakeholders et decision-makers
- Objections anticipées

Je vais structurer :
- Executive summary personnalisé
- Situation actuelle et challenges
- Solution recommandée (scope, deliverables, timeline)
- Pricing et options (Good/Better/Best)
- ROI et business case quantifié
- Témoignages et social proof
- Next steps et conditions`,
            category: 'closing',
            estimatedTime: '25-30 min',
            hasForm: false
        },
        objection_handling: {
            id: 'objection_handling',
            title: 'Gérer les objections',
            icon: '🛡️',
            description: 'Répondre aux objections courantes avec confiance',
            prompt: `Je rencontre des objections de la part de prospects.

Informations nécessaires :
- Objections courantes que vous rencontrez
- Votre produit/service et positionnement
- Concurrents et alternatives
- Preuve de valeur (case studies, metrics)

Je vais fournir :
- Scripts de réponse aux objections courantes :
  * "C'est trop cher" → Value justification
  * "On utilise déjà X" → Competitive differentiation
  * "Pas le bon timing" → Création d'urgence
  * "Je dois réfléchir" → Trial close
- Techniques de reframing
- Questions pour creuser l'objection réelle
- Stories et social proof pertinents`,
            category: 'closing',
            estimatedTime: '15-20 min',
            hasForm: false
        },
        pipeline_review: {
            id: 'pipeline_review',
            title: 'Analyser le pipeline',
            icon: '📊',
            description: 'Optimiser la gestion et conversion du pipeline',
            prompt: `Je souhaite analyser et optimiser mon pipeline de ventes.

Informations nécessaires :
- Étapes de votre cycle de vente
- Deals en cours par stage
- Taux de conversion actuels par stage
- Cycle de vente moyen
- Objectifs de chiffre d'affaires

Je vais fournir :
- Analyse de santé du pipeline (coverage ratio)
- Deals à risque vs high-intent
- Actions prioritaires par opportunité
- Forecast de closing (best case, commit, worst case)
- Bottlenecks et optimisations de process
- Activités à augmenter pour atteindre quota`,
            category: 'pipeline',
            estimatedTime: '20-25 min',
            hasForm: true,
            formFields: [
                { name: 'quota', label: 'Quota (mensuel ou trimestriel)', type: 'text', required: true },
                { name: 'avgDealSize', label: 'Deal size moyen', type: 'text', required: false }
            ]
        },
        negotiation_strategy: {
            id: 'negotiation_strategy',
            title: 'Stratégie de négociation',
            icon: '🤝',
            description: 'Préparer une négociation gagnant-gagnant',
            prompt: `Je prépare une négociation commerciale importante.

Informations nécessaires :
- Contexte du deal (montant, durée, stakeholders)
- Votre walk-away price et marges
- Points de négociation probables (prix, délais, scope)
- Alternatives du client (BATNA - Best Alternative)
- Votre valeur ajoutée différenciante

Je vais créer :
- Stratégie de négociation (anchoring, concessions)
- Variables d'ajustement (prix, paiement, durée, scope)
- Matrice de trade-offs (if they ask X, we give Y if they accept Z)
- Gestion des demandes de discount
- Closing techniques et timeline
- Communication interne (legal, finance)`,
            category: 'negotiation',
            estimatedTime: '20-25 min',
            hasForm: false
        }
    },

    // ============================================================
    // MANAGER COACH WORKFLOWS
    // ============================================================
    manager_coach: {
        one_on_one_template: {
            id: 'one_on_one_template',
            title: 'Préparer un 1:1',
            icon: '👥',
            description: 'Structurer un one-on-one efficace et engageant',
            prompt: `Je prépare un one-on-one avec un membre de mon équipe.

Informations nécessaires :
- Nom et rôle de la personne
- Derniers sujets discutés
- Performance récente et contexte
- Objectifs de ce 1:1 (career, feedback, tactical)
- Durée du meeting

Je vais créer :
- Agenda structuré (30/45/60 min)
- Questions d'ouverture ("What's top of mind?")
- Topics à aborder (70% eux / 30% vous)
- Feedback à donner (SBI framework)
- Questions de développement carrière
- Action items et next steps
- Template de notes à compléter`,
            category: 'development',
            estimatedTime: '10-12 min',
            hasForm: true,
            formFields: [
                { name: 'employeeName', label: 'Nom du collaborateur', type: 'text', required: true },
                { name: 'meetingDuration', label: 'Durée', type: 'select', options: ['30 min', '45 min', '60 min'], required: true },
                { name: 'focus', label: 'Focus principal', type: 'select', options: ['Performance', 'Développement carrière', 'Bien-être', 'Tactique/Projets'], required: true }
            ]
        },
        performance_feedback: {
            id: 'performance_feedback',
            title: 'Donner du feedback',
            icon: '💬',
            description: 'Structurer un feedback constructif et actionable',
            prompt: `Je dois donner du feedback à un membre de mon équipe.

Informations nécessaires :
- Type de feedback (positif, constructif, mixte)
- Situation concrète observée
- Comportement spécifique (pas de généralités)
- Impact de ce comportement
- Contexte et historique

Je vais structurer selon SBI (Situation-Behavior-Impact) :
- Préparation du feedback
- Script de conversation
- Questions pour faciliter la prise de conscience
- Plan d'amélioration si feedback constructif
- Reconnaissance si feedback positif
- Follow-up et accountability
- Gestion des réactions défensives`,
            category: 'feedback',
            estimatedTime: '12-15 min',
            hasForm: true,
            formFields: [
                { name: 'feedbackType', label: 'Type de feedback', type: 'select', options: ['Positif/Renforcement', 'Constructif/Amélioration', 'Mixte'], required: true },
                { name: 'urgency', label: 'Urgence', type: 'select', options: ['Immédiat (24h)', 'Cette semaine', 'Prochain 1:1'], required: true }
            ]
        },
        conflict_mediation: {
            id: 'conflict_mediation',
            title: 'Médiation de conflit',
            icon: '⚖️',
            description: 'Résoudre un conflit entre membres de l\'équipe',
            prompt: `Je dois résoudre un conflit au sein de mon équipe.

Informations nécessaires :
- Parties impliquées et leurs rôles
- Nature du conflit (désaccord, communication, valeurs)
- Historique et déclencheurs
- Impact sur l'équipe et les projets
- Tentatives de résolution précédentes

Je vais proposer :
- Approche de médiation en 5 étapes :
  1. Conversations individuelles (écoute active)
  2. Diagnostic des besoins sous-jacents
  3. Facilitation de dialogue entre les parties
  4. Recherche de terrain d'entente
  5. Accord et suivi
- Scripts de conversation pour chaque étape
- Techniques de désamorçage
- Règles d'engagement pour la médiation
- Plan de suivi post-résolution`,
            category: 'team',
            estimatedTime: '20-25 min',
            hasForm: false
        },
        delegation_framework: {
            id: 'delegation_framework',
            title: 'Déléguer efficacement',
            icon: '🎯',
            description: 'Déléguer une tâche ou projet avec clarté',
            prompt: `Je souhaite déléguer une tâche ou projet important.

Informations nécessaires :
- Tâche/projet à déléguer
- Personne pressentie (skills, charge actuelle)
- Niveau d'autonomie souhaité
- Enjeux et risques
- Deadline et ressources

Je vais structurer :
- Briefing de délégation (contexte, why it matters)
- Définition du scope et success criteria
- Niveau de décision (RACI - Responsible, Accountable, Consulted, Informed)
- Ressources et support disponibles
- Check-points et milestones
- Communication du reste de l'équipe
- Balance autonomie vs oversight`,
            category: 'delegation',
            estimatedTime: '15-18 min',
            hasForm: true,
            formFields: [
                { name: 'taskComplexity', label: 'Complexité', type: 'select', options: ['Simple/Routine', 'Moyenne', 'Complexe/Stratégique'], required: true },
                { name: 'timeline', label: 'Timeline', type: 'select', options: ['< 1 semaine', '1-4 semaines', '1-3 mois', '3+ mois'], required: true }
            ]
        },
        performance_plan: {
            id: 'performance_plan',
            title: 'Plan d\'amélioration de performance',
            icon: '📈',
            description: 'Créer un PIP (Performance Improvement Plan)',
            prompt: `Je dois créer un plan d'amélioration de performance.

Informations nécessaires :
- Collaborateur concerné et rôle
- Écarts de performance observés (spécifiques, mesurables)
- Causes identifiées (skills, motivation, fit)
- Tentatives de coaching précédentes
- Attentes claires pour le maintien du poste

Je vais créer :
- Diagnostic de la situation
- Objectifs SMART sur 30-60-90 jours
- Support et ressources (formation, coaching, outils)
- Métriques de suivi et check-ins hebdo/bi-hebdo
- Conséquences si amélioration insuffisante
- Script de conversation pour annoncer le PIP
- Documentation RH nécessaire
- Balance between firmness et support`,
            category: 'performance',
            estimatedTime: '25-30 min',
            hasForm: false
        },
        team_motivation: {
            id: 'team_motivation',
            title: 'Booster la motivation d\'équipe',
            icon: '🚀',
            description: 'Stratégies pour engager et motiver votre équipe',
            prompt: `Je souhaite améliorer la motivation et l'engagement de mon équipe.

Informations nécessaires :
- Taille et composition de l'équipe
- Signes de désengagement observés
- Contexte (réorg, charge de travail, résultats)
- Culture et valeurs de l'équipe
- Contraintes (budget, temps, process)

Je vais proposer :
- Diagnostic des facteurs de motivation (autonomy, mastery, purpose)
- Quick wins pour redynamiser (reconnaissance, célébrations)
- Initiatives moyen-terme (développement, projets stretch)
- Amélioration de la communication et transparence
- Rituels d'équipe et team building
- Mesure de l'engagement (pulse surveys, 1:1s)
- Plan d'action sur 90 jours`,
            category: 'culture',
            estimatedTime: '20-25 min',
            hasForm: true,
            formFields: [
                { name: 'teamSize', label: 'Taille de l\'équipe', type: 'select', options: ['< 5', '5-10', '10-20', '20+'], required: true },
                { name: 'mainIssue', label: 'Problème principal', type: 'select', options: ['Charge de travail', 'Manque de reconnaissance', 'Manque de clarté/direction', 'Conflits', 'Autre'], required: false }
            ]
        }
    },

    // ============================================================
    // GENERAL ASSISTANT (No specific workflows - free usage)
    // ============================================================
    lucide_assistant: {}
};

/**
 * Get all workflows for a specific agent profile
 * @param {string} profileId - Agent profile ID
 * @returns {Object} Workflows for the profile
 */
function getWorkflowsForProfile(profileId) {
    return WORKFLOW_TEMPLATES[profileId] || {};
}

/**
 * Get a specific workflow by profile and workflow ID
 * @param {string} profileId - Agent profile ID
 * @param {string} workflowId - Workflow ID
 * @returns {Object|null} Workflow object or null if not found
 */
function getWorkflow(profileId, workflowId) {
    const profileWorkflows = WORKFLOW_TEMPLATES[profileId] || {};
    return profileWorkflows[workflowId] || null;
}

/**
 * Get all workflow IDs for a profile (for quick access)
 * @param {string} profileId - Agent profile ID
 * @returns {Array<string>} Array of workflow IDs
 */
function getWorkflowIds(profileId) {
    const profileWorkflows = WORKFLOW_TEMPLATES[profileId] || {};
    return Object.keys(profileWorkflows);
}

/**
 * Build a complete prompt from a workflow template with form data
 * @param {string} profileId - Agent profile ID
 * @param {string} workflowId - Workflow ID
 * @param {Object} formData - Form data if workflow has a form
 * @returns {string} Complete prompt ready to send to LLM
 */
function buildWorkflowPrompt(profileId, workflowId, formData = {}) {
    const workflow = getWorkflow(profileId, workflowId);
    if (!workflow) return '';

    let prompt = workflow.prompt;

    // If workflow has a form and form data is provided, enrich the prompt
    if (workflow.hasForm && workflow.formFields && Object.keys(formData).length > 0) {
        prompt += '\n\nInformations fournies :\n';
        workflow.formFields.forEach(field => {
            const value = formData[field.name];
            if (value) {
                prompt += `- ${field.label} : ${value}\n`;
            }
        });
    }

    return prompt;
}

module.exports = {
    WORKFLOW_TEMPLATES,
    getWorkflowsForProfile,
    getWorkflow,
    getWorkflowIds,
    buildWorkflowPrompt
};

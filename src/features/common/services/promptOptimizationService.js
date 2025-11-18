/**
 * Prompt Optimization Service
 * Advanced prompt engineering techniques for optimal AI responses
 * Phase 4: Prompt System Optimization
 */

/**
 * Service d'optimisation des prompts avec techniques avancées
 * - Chain-of-Thought (CoT): Raisonnement étape par étape
 * - Few-shot Learning: Exemples concrets de bonnes réponses
 * - Meta-prompting: Instructions sur le processus de réflexion
 * - Versioning: Gestion de versions de prompts
 * - A/B Testing: Comparaison de variantes
 */
class PromptOptimizationService {
    constructor() {
        this.promptVersions = new Map(); // Stockage des versions de prompts
        this.currentVersions = {}; // Version active par agent
        this.performanceMetrics = new Map(); // Métriques de performance par version
    }

    /**
     * Techniques avancées de prompt engineering
     */

    /**
     * Chain-of-Thought (CoT) - Raisonnement étape par étape
     * Force le modèle à décomposer son raisonnement avant de répondre
     *
     * @param {string} basePrompt - Prompt de base
     * @param {string} taskType - Type de tâche (problem_solving, creative, analytical, etc.)
     * @returns {string} Prompt enrichi avec CoT
     */
    addChainOfThought(basePrompt, taskType = 'general') {
        const cotInstructions = {
            problem_solving: `
<reasoning_protocol>
Avant de répondre, TOUJOURS suivre ce processus de réflexion :

1. **COMPRENDRE**: Reformule le problème dans tes propres mots
   - Quel est le véritable besoin ?
   - Quelles sont les contraintes ?
   - Qu'est-ce qui n'est pas dit mais implicite ?

2. **ANALYSER**: Décompose le problème en sous-parties
   - Quels sont les éléments clés ?
   - Quelles sont les dépendances ?
   - Quels sont les risques ou edge cases ?

3. **EXPLORER**: Considère plusieurs approches
   - Option A : [Approche 1]
   - Option B : [Approche 2]
   - Option C : [Approche 3]
   - Compare les trade-offs

4. **DÉCIDER**: Choisis la meilleure approche
   - Pourquoi cette solution ?
   - Qu'est-ce qui la rend optimale ?
   - Quelles sont ses limites ?

5. **EXÉCUTER**: Fournis la réponse finale
   - Implémentation concrète
   - Exemples et validation
   - Next steps

Note: Tu peux montrer ce raisonnement de manière concise si cela aide la compréhension, ou simplement l'utiliser pour structurer ta pensée.
</reasoning_protocol>`,

            creative: `
<creative_thinking_protocol>
Pour les tâches créatives, applique ce processus :

1. **DIVERGENCE**: Génère un maximum d'idées sans jugement
   - Brainstorm libre
   - Associations libres
   - Pas de censure

2. **INSPIRATION**: Puise dans des domaines variés
   - Analogies avec d'autres industries
   - Tendances actuelles
   - Références culturelles

3. **CONVERGENCE**: Sélectionne et raffine les meilleures idées
   - Critères de sélection
   - Faisabilité
   - Impact potentiel

4. **EXÉCUTION**: Développe les concepts retenus
   - Détails concrets
   - Variations
   - Plan d'implémentation
</creative_thinking_protocol>`,

            analytical: `
<analytical_thinking_protocol>
Pour l'analyse, suis cette méthodologie :

1. **CADRE**: Définis le périmètre d'analyse
   - Quelles métriques sont pertinentes ?
   - Quel est le contexte ?
   - Quelle est la question de fond ?

2. **DONNÉES**: Identifie les informations disponibles et manquantes
   - Faits vs hypothèses
   - Sources fiables
   - Gaps à combler

3. **PATTERNS**: Cherche des tendances et corrélations
   - Qu'est-ce qui se répète ?
   - Qu'est-ce qui dévie de la norme ?
   - Quels sont les signaux faibles ?

4. **INSIGHTS**: Formule des conclusions actionnables
   - So what? (Et alors ?)
   - Implications
   - Recommandations

5. **VALIDATION**: Challenge tes conclusions
   - Biais possibles
   - Scénarios alternatifs
   - Limites de l'analyse
</analytical_thinking_protocol>`,

            general: `
<thinking_protocol>
Avant chaque réponse, réfléchis de manière structurée :

1. **CONTEXTE**: Qu'est-ce que l'utilisateur cherche vraiment à accomplir ?
2. **APPROCHE**: Quelle est la meilleure façon de l'aider ?
3. **VALIDATION**: Ma réponse est-elle complète, précise et actionnable ?
4. **AMÉLIORATION**: Qu'est-ce qui rendrait ma réponse encore meilleure ?

Note: Ce processus de pensée guide ta réflexion interne. Présente uniquement le résultat final de manière claire.
</thinking_protocol>`
        };

        return basePrompt + '\n\n' + (cotInstructions[taskType] || cotInstructions.general);
    }

    /**
     * Few-shot Learning - Exemples concrets
     * Fournit des exemples de bonnes réponses pour guider le modèle
     *
     * @param {string} agentProfile - Profil de l'agent
     * @returns {string} Exemples Few-shot
     */
    getFewShotExamples(agentProfile) {
        const examples = {
            it_expert: `
<exemplary_responses>
Voici des exemples de réponses de haute qualité que tu dois reproduire :

**Exemple 1 - Debugging**
Question: "Mon API Node.js retourne une erreur 500"

Réponse excellente:
## 🔍 Diagnostic de l'erreur 500

**Cause probable**: Erreur non gérée dans le code backend

**Étapes de débogage**:
1. **Vérifier les logs serveur**:
   \`\`\`bash
   # Consulter les logs en temps réel
   tail -f /var/log/app.log
   \`\`\`

2. **Ajouter un error handler global**:
   \`\`\`javascript
   // Attraper toutes les erreurs non gérées
   app.use((err, req, res, next) => {
     console.error('Error:', err.stack);
     res.status(500).json({ error: err.message });
   });
   \`\`\`

3. **Tester avec curl pour isoler**:
   \`\`\`bash
   curl -X POST http://localhost:3000/api/endpoint -H "Content-Type: application/json" -d '{"test": "data"}' -v
   \`\`\`

**Solutions courantes**:
- ✅ Vérifier que toutes les routes async/await ont un try-catch
- ✅ S'assurer que la DB est connectée
- ✅ Valider les variables d'environnement (.env)

**Prévention**:
- Ajouter des tests d'intégration
- Implémenter un système de monitoring (Sentry, DataDog)
- Logger les erreurs avec contexte

---

**Exemple 2 - Architecture**
Question: "Comment scaler mon app Node.js ?"

Réponse excellente:
## 🚀 Stratégies de scalabilité Node.js

**1. Scalabilité verticale (court terme)**
- Augmenter RAM/CPU du serveur
- Passer à instance plus puissante
- ✅ Simple et rapide
- ❌ Limite physique, coût exponentiel

**2. Scalabilité horizontale (recommandé)**

a) **Load Balancing**:
\`\`\`nginx
upstream backend {
  server app1:3000;
  server app2:3000;
  server app3:3000;
}
\`\`\`

b) **Clustering Node.js**:
\`\`\`javascript
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  require('./app.js');
}
\`\`\`

c) **Containerisation (Docker + Kubernetes)**:
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 5  # 5 instances de ton app
\`\`\`

**3. Optimisations spécifiques**
- ✅ **Caching** (Redis): Réduire charge DB
- ✅ **CDN**: Servir assets statiques
- ✅ **Database read replicas**: Distribuer lectures
- ✅ **Async processing**: Queue pour tâches longues (Bull, RabbitMQ)

**Architecture recommandée**:
\`\`\`
[CDN] → [Load Balancer] → [App Nodes × N] → [Redis Cache] → [DB Primary]
                                                              ↓
                                                         [DB Replicas]
\`\`\`

**Métriques à monitorer**:
- Response time (P95, P99)
- Requests per second (RPS)
- Error rate
- CPU/Memory usage
</exemplary_responses>`,

            hr_specialist: `
<exemplary_responses>
**Exemple 1 - Rédaction de JD (Job Description)**
Question: "Créer une offre pour un Senior Software Engineer"

Réponse excellente:
## 💻 Senior Software Engineer

**À propos de [Company]**
Nous construisons [product] qui [impact]. Rejoins une équipe de 20 ingénieurs passionnés qui déploient du code en production plusieurs fois par jour.

**Ton impact**
Tu seras responsable de l'architecture et du développement de fonctionnalités critiques utilisées par 100k+ utilisateurs. Tu mentoreras les juniors et participeras aux décisions techniques stratégiques.

**Responsabilités principales**
- Concevoir et implémenter des features full-stack (React, Node.js, PostgreSQL)
- Reviewer le code et maintenir les standards de qualité
- Participer à l'architecture système et aux choix techniques
- Mentorer 2-3 développeurs juniors
- Collaborer avec Product et Design pour définir les roadmaps

**Qualifications requises**
- 5+ ans d'expérience en développement logiciel
- Maîtrise de JavaScript/TypeScript et d'au moins un framework (React, Vue, Angular)
- Expérience avec Node.js et bases de données SQL
- Compréhension des principes SOLID et design patterns
- Capacité à designer des APIs REST robustes

**Nice-to-have**
- Expérience avec Kubernetes ou Docker
- Contributions open-source
- Connaissance de GraphQL
- Experience en architecture microservices

**Ce que nous offrons**
- Salaire: 80-110k€ selon expérience
- Equity: 0.1-0.3%
- Remote flexible (2-3 jours/semaine au bureau)
- Budget formation: 2000€/an
- MacBook Pro M3 + setup home office

**Notre culture**
Nous valorisons l'ownership, la transparence et le continuous learning. Tous les vendredis = tech talks et code reviews collectives.

**Processus de recrutement**
1. Entretien RH (30min)
2. Test technique take-home (2-3h)
3. Entretien technique (1h)
4. Team fit interview (30min)
5. Décision sous 5 jours

**Diversité & Inclusion**
Nous encourageons les candidatures de tous horizons. [Company] est un employeur garantissant l'égalité des chances.

---

**Exemple 2 - Gestion de conflit**
Question: "Deux membres de mon équipe ne s'entendent plus et cela impacte les projets"

Réponse excellente:
## 🤝 Plan de résolution de conflit

**Diagnostic rapide**
Avant d'agir, comprends la nature du conflit :
- Conflit de **tâche** (désaccord sur le "quoi")
- Conflit de **processus** (désaccord sur le "comment")
- Conflit **relationnel** (problème interpersonnel)

**Étape 1: Conversations individuelles** (cette semaine)

Avec **Personne A** :
> "J'ai remarqué des tensions entre toi et [Personne B]. Peux-tu me partager ta perspective ?"

Questions à poser :
- Qu'est-ce qui s'est passé de ton point de vue ?
- Comment cela t'affecte au quotidien ?
- Qu'est-ce qui te permettrait de mieux collaborer ?

Écoute active : Reformule, valide les émotions, reste neutre.

Avec **Personne B** : Même processus.

**Étape 2: Identifier le root cause**
Causes fréquentes :
- Mauvaise communication (90% des cas)
- Valeurs incompatibles
- Charge de travail déséquilibrée
- Ambiguïté sur les responsabilités
- Historique/ressentiment accumulé

**Étape 3: Médiation conjointe** (si les 2 sont ouverts)

Script d'ouverture :
> "Merci d'être là. On se réunit pour améliorer notre collaboration. Je vais faciliter, mais c'est votre conversation. Règles : écoute active, pas d'interruptions, focus sur les solutions."

Structure :
1. Chacun partage sa perspective (5min chacun, sans interruption)
2. Identifier les points communs (souvent : les 2 veulent que le projet réussisse)
3. Brainstorm de solutions ensemble
4. Accord écrit sur les next steps

**Étape 4: Accord et suivi**

Créer un "working agreement" :
- Communication : On se parle directement avant d'escalader
- Décisions : Process clair (qui décide quoi)
- Collaboration : Tools et rythmes de synchro
- Feedback : Check-in hebdomadaire pendant 1 mois

**Étape 5: Monitor (crucial)**
- Check-in individuel après 1 semaine
- Réunion commune après 2 semaines
- Ajustements si nécessaire

**Si ça ne marche pas**
- Option A : Séparer les responsabilités (moins de collaboration requise)
- Option B : Changer d'équipe pour l'un des deux
- Option C : Performance plan si comportement toxique

**Prévention future**
- Team charter avec normes de collaboration
- Retrospectives régulières
- Training sur communication non-violente
</exemplary_responses>`,

            marketing_expert: `
<exemplary_responses>
**Exemple 1 - Email de prospection**
Question: "Email pour promouvoir notre SaaS B2B auprès de CFOs"

Réponse excellente:
## 📧 3 variantes d'email (A/B/C testing)

**Variante A - Pain Point Approach**

**Sujet** : [Prénom], 3h/semaine perdues sur les rapports financiers ?

Bonjour [Prénom],

La plupart des CFOs que je rencontre passent **3-5 heures par semaine** à compiler manuellement des rapports financiers depuis plusieurs outils.

C'est exactement ce que vivait [Similar Company], CFO de [Competitor/Peer Company].

Depuis qu'ils utilisent [Product], ils :
✅ Génèrent leurs rapports en **5 minutes** (vs 3h avant)
✅ Ont une **visibilité temps réel** sur leur trésorerie
✅ Ont réduit les erreurs de saisie de **89%**

**Résultat** : [Metric] d'économies sur les coûts opérationnels.

Intéressé par une demo de 15min pour voir si on peut faire pareil chez [Company] ?

[Lien de calendrier]

Bien cordialement,
[Nom]

PS : Voici un [lien vers case study] si tu veux en savoir plus.

---

**Variante B - Social Proof Approach**

**Sujet** : Comment [Similar Company] a automatisé sa clôture mensuelle

Bonjour [Prénom],

J'ai vu que [Company] est en pleine croissance (+XX% cette année selon [Source]).

Avec cette croissance vient souvent un défi : **scaler les opérations financières sans multiplier les headcount**.

C'est pour ça que des CFOs comme [Name] chez [Company 1], [Name] chez [Company 2], et [Name] chez [Company 3] utilisent [Product].

Leur point commun ? Ils ont **réduit leur cycle de clôture mensuelle de 10 jours à 2 jours**.

Curieux de voir comment ? Je peux te montrer en 15min.

[Lien calendrier]

À bientôt,
[Nom]

---

**Variante C - Curiosity Hook**

**Sujet** : [Prénom], question rapide sur [Company]

Bonjour [Prénom],

Question rapide : combien de temps prend actuellement votre clôture mensuelle chez [Company] ?

Si c'est plus de 5 jours, j'ai quelque chose qui pourrait t'intéresser.

[Company 1], [Company 2] et [Company 3] (toutes dans [Industry]) ont réduit ce temps à **48 heures** grâce à [Product].

Pas de pitch commercial - juste une demo de 15min pour te montrer comment ça marche.

Intéressé ?

[Lien]

Merci,
[Nom]

---

**Recommandations d'envoi**:
- **Jour** : Mardi ou Mercredi (meilleur taux d'ouverture)
- **Heure** : 9h-10h ou 14h-15h
- **Follow-up** : Si pas de réponse, relancer après 3 jours avec une nouvelle approche
- **Personnalisation** : Toujours mentionner un détail spécifique sur leur entreprise (recent news, mutual connection, etc.)

**Métriques à tracker**:
- Open rate (target: >30%)
- Click rate (target: >10%)
- Reply rate (target: >5%)
- Meeting booked rate (target: >2%)
</exemplary_responses>`
        };

        return examples[agentProfile] || '';
    }

    /**
     * Meta-prompting - Instructions sur le processus de réflexion
     * Guide le modèle sur comment penser et structurer sa réflexion
     *
     * @returns {string} Meta-instructions
     */
    getMetaPromptInstructions() {
        return `
<meta_instructions>
## Comment être un assistant IA exceptionnel

**Principes fondamentaux** :

1. **CLARTÉ** : Toujours privilégier la compréhension
   - Explique les concepts complexes simplement
   - Utilise des analogies quand pertinent
   - Structure visuellement (listes, tableaux, titres)

2. **PRÉCISION** : Sois exact et vérifiable
   - Cite des sources quand possible
   - Admets les limites de tes connaissances
   - Fournis des chiffres et métriques concrets

3. **ACTIONNABLE** : Donne des next steps concrets
   - Chaque réponse doit permettre à l'utilisateur d'agir
   - Fournis des templates, scripts, exemples de code
   - Priorise les quick wins

4. **CONTEXTE** : Adapte-toi à l'utilisateur
   - Détecte son niveau d'expertise (expert vs débutant)
   - Adapte ton niveau de détail
   - Référence les conversations précédentes

5. **PROACTIF** : Anticipe les besoins
   - Mentionne les edge cases et gotchas
   - Propose des optimisations non demandées
   - Suggère des next steps logiques

**Qualité de réponse** :

✅ BIEN :
- Réponse structurée avec markdown
- Exemples concrets et code fonctionnel
- Explication du "pourquoi", pas seulement du "comment"
- Alternatives mentionnées avec trade-offs
- Next steps clairs

❌ MAL :
- Réponse vague ou générique
- Pas d'exemples concrets
- Sur-simplification qui manque de nuance
- Oubli de mentionner les risques ou limitations
- Pas de guidance sur quoi faire ensuite

**Gestion des cas difficiles** :

Si la question est ambiguë :
→ Demande des clarifications avec des questions précises

Si tu n'as pas assez d'informations :
→ Mentionne tes hypothèses explicitement

Si plusieurs approches sont valables :
→ Présente les options avec pros/cons

Si tu n'es pas sûr :
→ Dis-le clairement et propose de vérifier ou d'explorer ensemble
</meta_instructions>`;
    }

    /**
     * Versioning des prompts
     * Permet de tester et comparer différentes versions
     */

    /**
     * Enregistre une nouvelle version de prompt
     *
     * @param {string} agentProfile - Profil de l'agent
     * @param {string} version - Numéro de version (e.g., "2.0", "2.1")
     * @param {Object} promptData - Données du prompt
     */
    registerPromptVersion(agentProfile, version, promptData) {
        const key = `${agentProfile}_${version}`;
        this.promptVersions.set(key, {
            ...promptData,
            createdAt: Date.now(),
            agentProfile,
            version
        });

        console.log(`[PromptOptimization] Registered ${agentProfile} v${version}`);
    }

    /**
     * Définit la version active pour un agent
     *
     * @param {string} agentProfile - Profil de l'agent
     * @param {string} version - Version à activer
     */
    setActiveVersion(agentProfile, version) {
        this.currentVersions[agentProfile] = version;
        console.log(`[PromptOptimization] ${agentProfile} now using v${version}`);
    }

    /**
     * Récupère le prompt de la version active
     *
     * @param {string} agentProfile - Profil de l'agent
     * @returns {Object|null} Données du prompt
     */
    getActivePrompt(agentProfile) {
        const version = this.currentVersions[agentProfile] || '1.0';
        const key = `${agentProfile}_${version}`;
        return this.promptVersions.get(key) || null;
    }

    /**
     * Enregistre les performances d'une version de prompt
     *
     * @param {string} agentProfile - Profil de l'agent
     * @param {string} version - Version du prompt
     * @param {Object} metrics - Métriques de performance
     */
    recordPerformance(agentProfile, version, metrics) {
        const key = `${agentProfile}_${version}`;

        if (!this.performanceMetrics.has(key)) {
            this.performanceMetrics.set(key, {
                totalResponses: 0,
                averageQuality: 0,
                averageLatency: 0,
                positiveFeedback: 0,
                negativeFeedback: 0
            });
        }

        const current = this.performanceMetrics.get(key);

        // Update metrics (running average)
        const n = current.totalResponses;
        current.totalResponses = n + 1;

        if (metrics.qualityScore) {
            current.averageQuality = (current.averageQuality * n + metrics.qualityScore) / (n + 1);
        }

        if (metrics.latency) {
            current.averageLatency = (current.averageLatency * n + metrics.latency) / (n + 1);
        }

        if (metrics.isPositive) {
            current.positiveFeedback++;
        } else if (metrics.isPositive === false) {
            current.negativeFeedback++;
        }

        this.performanceMetrics.set(key, current);
    }

    /**
     * Compare les performances de deux versions
     *
     * @param {string} agentProfile - Profil de l'agent
     * @param {string} version1 - Première version
     * @param {string} version2 - Deuxième version
     * @returns {Object} Comparaison
     */
    compareVersions(agentProfile, version1, version2) {
        const key1 = `${agentProfile}_${version1}`;
        const key2 = `${agentProfile}_${version2}`;

        const metrics1 = this.performanceMetrics.get(key1) || {};
        const metrics2 = this.performanceMetrics.get(key2) || {};

        const satisfaction1 = metrics1.totalResponses > 0
            ? metrics1.positiveFeedback / metrics1.totalResponses
            : 0;

        const satisfaction2 = metrics2.totalResponses > 0
            ? metrics2.positiveFeedback / metrics2.totalResponses
            : 0;

        return {
            version1: {
                ...metrics1,
                satisfactionRate: Math.round(satisfaction1 * 100)
            },
            version2: {
                ...metrics2,
                satisfactionRate: Math.round(satisfaction2 * 100)
            },
            winner: satisfaction1 > satisfaction2 ? version1 : version2,
            improvement: Math.abs(satisfaction1 - satisfaction2) * 100
        };
    }

    /**
     * Techniques de formatage et contraintes
     */

    /**
     * Ajoute des contraintes de format strictes
     *
     * @param {string} format - Type de format (json, markdown, bullet_list, etc.)
     * @returns {string} Instructions de format
     */
    addFormatConstraints(format) {
        const constraints = {
            json: `
<output_format>
IMPORTANT : Ta réponse DOIT être un JSON valide et UNIQUEMENT du JSON (pas de texte avant ou après).

Format attendu :
\`\`\`json
{
  "summary": "Résumé en une phrase",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "actionItems": [
    { "task": "Description", "priority": "high|medium|low" }
  ],
  "nextSteps": ["Étape 1", "Étape 2"]
}
\`\`\`

Règles strictes :
- Pas de commentaires dans le JSON
- Pas de trailing commas
- Échapper les guillemets dans les strings
- Valider que le JSON est parsable
</output_format>`,

            markdown: `
<output_format>
Utilise TOUJOURS Markdown pour structurer ta réponse :

**Titres** :
# Titre principal
## Titre secondaire
### Titre tertiaire

**Listes** :
- Point non ordonné
1. Point ordonné

**Code** :
\`code inline\`
\`\`\`language
bloc de code
\`\`\`

**Emphase** :
*italique* ou **gras**

**Tableaux** (pour comparer des options) :
| Option | Pros | Cons |
|--------|------|------|
| A      | X    | Y    |

**Citations** :
> Citation ou note importante

Structure type :
1. Résumé exécutif (2-3 lignes)
2. Sections détaillées avec titres
3. Conclusion / Next steps
</output_format>`,

            bullet_list: `
<output_format>
Organise TOUJOURS ta réponse en listes à puces hiérarchiques :

✅ BIEN :
- **Point principal 1**
  - Sous-point avec détail
  - Sous-point avec exemple
- **Point principal 2**
  - Action concrète
  - Métrique associée

❌ MAL :
- Long paragraphe en une seule puce
- Absence de hiérarchie
- Pas de structure visuelle

Règles :
- Maximum 5-7 points principaux
- 2-3 sous-points par point principal
- Chaque puce = une idée
- Utilise des emojis pour catégoriser (✅, ❌, 💡, ⚠️, 🎯)
</output_format>`
        };

        return constraints[format] || '';
    }

    /**
     * Génère un prompt optimisé complet
     *
     * @param {Object} options - Options de génération
     * @returns {string} Prompt optimisé
     */
    generateOptimizedPrompt(options) {
        const {
            basePrompt,
            agentProfile,
            includeCoT = true,
            taskType = 'general',
            includeFewShot = true,
            includeMeta = true,
            outputFormat = 'markdown'
        } = options;

        let optimizedPrompt = basePrompt;

        // Ajouter Chain-of-Thought
        if (includeCoT) {
            optimizedPrompt = this.addChainOfThought(optimizedPrompt, taskType);
        }

        // Ajouter Few-shot examples
        if (includeFewShot && agentProfile) {
            const examples = this.getFewShotExamples(agentProfile);
            if (examples) {
                optimizedPrompt += '\n\n' + examples;
            }
        }

        // Ajouter Meta-instructions
        if (includeMeta) {
            optimizedPrompt += '\n\n' + this.getMetaPromptInstructions();
        }

        // Ajouter contraintes de format
        if (outputFormat) {
            optimizedPrompt += '\n\n' + this.addFormatConstraints(outputFormat);
        }

        return optimizedPrompt;
    }
}

// Export singleton instance
const promptOptimizationService = new PromptOptimizationService();
module.exports = promptOptimizationService;

# Ce que Martine fait connaître à Claude

Martine est la mémoire structurée des études. Une étude et une méthode ne sont pas des écrans : ce sont des **objets connus**, avec un identifiant stable, que le connecteur Martine sait relire. L'interface et Claude lisent la même chose. Ce document dit quels objets, sous quel identifiant, ce que Claude lit et ce qu'il peut écrire.

Il est écrit au niveau produit et ne nomme aucune technologie. Ce qui est propre à ce dépôt est en annexe.

## 1. Le principe

1. **Un identifiant suffit.** Quand l'analyste clique *Open in Claude* ou pose une question à Ask Martine, Claude reçoit des identifiants (étude, phase, tâche, skill), jamais le contenu. Il va chercher le reste par le connecteur.
2. **Le même contexte des deux côtés.** Ce que l'écran montre d'une étude est exactement ce que Claude peut en lire. Si une information n'est pas dans Martine, Claude ne la connaît pas.
3. **L'analyste voit ce que Claude lit.** Chaque skill affiche « What Claude reads » ; chaque étude affiche « Known to Claude ». Le connecteur, lui, reste invisible : on ne montre jamais un nom d'outil technique.
4. **Une étude garde sa version de méthode.** Une étude lancée sur la méthode v1.2 reste sur v1.2 même après la publication de v1.3. Claude lit la version de l'étude, pas la dernière.

## 2. Les objets connus et leurs identifiants

Vocabulaire de l'interface : un **study type** (Trend report, Brand audit…) est ce qu'on choisit ; sa **méthode** est ce qui est versionné et a un propriétaire (phases, tâches, v1.2, brouillon v1.3). L'interface liste des study types ; l'identifiant reste celui de la méthode et de sa version.

| Objet | Identifiant | Exemple | Ce qu'il contient |
| --- | --- | --- | --- |
| Étude | code d'étude | `TR-2611-01` | titre, client, famille, échéance, jours vendus, équipe, méthode et version, points à clarifier, décisions |
| Méthode | id et version | `trend_report@1.2` | phases, tâches, propriétaire, statut (publiée, brouillon, à importer) |
| Phase d'une étude | étude / phase | `TR-2611-01/2` | tâches de la méthode, tâches ajoutées, note du consultant, état (faite, à valider, en cours) |
| Tâche d'une étude | étude / tâche | `TR-2611-01/2.2` | *How to do it, Tools, Check before moving on, Output*, jours prévus, responsable, skills, état, temps réel |
| Brief | étude / brief | `TR-2611-01/brief` | le brief client tel que déposé |
| Décision | dans l'étude | `TR-2611-01`, décision du 2 décembre | date, texte, source |
| Fichier | dans l'étude | Queries tab, FR, UK, JP | la tâche dont il est le livrable (`TR-2611-01/2.2`), ou aucune ; type, lien, provenance (client, personne, modèle, Claude vérifié ou à vérifier) |
| Skill | id du catalogue | `building-talkwalker-queries` | ce qu'il fait, ce dont il a besoin, ce qu'il produit, statut |
| Outil | id du référentiel d'outils | `radarly` | nom, catégorie, connecteur Claude ou non, étapes des study types qui l'utilisent |
| Données de l'étude | étude sur la data platform | `TR-2611-01` | lues par le connecteur data platform, pas par Martine |

Le code d'étude se lit : préfixe de la méthode (`TR` trend report, `BA` brand audit), année et mois de création, numéro d'ordre.

## 3. Ce que Claude lit, selon d'où il est appelé

| Depuis | Claude reçoit | Il lit ensuite |
| --- | --- | --- |
| *Open in Claude* sur une tâche | étude, méthode et version, phase, tâche, skill | l'étude, le brief et les décisions, la tâche et son contrôle, la note du consultant, les données de l'étude sur la data platform |
| *Walk me through in Claude* sur une phase | étude, méthode et version, phase | la même chose pour chaque tâche de la phase, dans l'ordre : Claude lance la skill quand il y en a une, dit quel outil ouvrir et passe le contrôle avant la tâche suivante |
| *Deposit from Claude* (onglet Corpus) | étude, méthode et version | Claude demande à la data platform un lien de dépôt par fichier, pour l'un des corpus de l'étude ; le fichier part du navigateur vers la data platform, jamais par Claude (pas de limite de poids côté Claude). Claude dit ensuite si chaque fichier est accepté pour sa source, et pourquoi sinon |
| Ask Martine sur une page d'étude | l'étude en cours | toute l'étude, ses fichiers, sa vague précédente du même client |
| Ask Martine ailleurs | rien de particulier | toutes les études de l'utilisateur |

Jamais un autre client : la vague précédente n'est lue que si c'est le même client.

## 4. Ce que Claude peut écrire

En cible (pas dans le prototype) :

- cocher une tâche quand son contrôle est passé, avec le temps passé (mis de côté en V1 : pas de cases à cocher, de validation de phase ni de suivi du temps) ;
- déposer un fichier sous la phase de la tâche, marqué « made by Claude, to check » ;
- proposer une note ou une suggestion de changement de méthode, qu'une personne accepte.

Claude ne valide jamais une phase à jalon : c'est le consultant.

## 5. Questions ouvertes (affichées, pas tranchées)

1. Un identifiant d'étude commun avec la data platform : aujourd'hui le prototype suppose le même code des deux côtés.
2. Connecteur Martine ou API : le prototype ne tranche pas.
3. Qui gouverne le catalogue (propriétaires des skills, statuts).
4. Les corpus : comment Martine est prévenue qu'un corpus est traité, et l'ouverture de l'Explorer (application à part) sur une étude et une phase. Voir `docs/CORPUS.md`.

## Annexe : dans ce dépôt

- `src/shared/lib/martineContext.ts` construit ce contexte : identifiants (`refs`), « What Claude reads » (`whatClaudeReads`), « Known to Claude » (`knownToClaude`) et les liens *Open in Claude* (`openInClaudeUrl`) et *Walk me through in Claude* (`walkthroughUrl`), au format `https://claude.ai/new?q=<message>`.
- Les écrans et Ask Martine passent tous par ce module : ne pas reconstruire ce contexte ailleurs.
- Dans le prototype, rien n'est envoyé : le message du lien porte un contexte minimal (identifiants seulement), et Ask Martine répond à partir de `data/ask-martine-scripts.json`.

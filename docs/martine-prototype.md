# Prototype Martine : cahier des charges (v3)

À lire en entier avant de coder. Il accompagne le canvas Claude Design « Martine, wireframes », à importer avec `/design` : le canvas donne la mise en page, ce document donne les règles et les comportements. En cas d'écart, le canvas fait foi pour le visuel, ce document pour le fonctionnement. Pour comprendre le métier, lire aussi `docs/reference/parcours-etude.html`.

## 1. L'idée

**Martine, c'est le fichier méthodo, vivant.** Chaque ligne du fichier méthodo d'un type d'étude devient une tâche : *How to do it*, *Tools*, *Check before moving on*, *Output*, *Days*, *Owner* viennent du fichier. Martine ajoute quatre choses :

1. cocher la tâche quand son contrôle est passé ;
2. ouvrir dans Claude le skill de la tâche, avec le contexte de l'étude ;
3. les notes et les tâches ajoutées par le consultant pour cette étude ;
4. le temps réel, comparé aux jours prévus et vendus.

La vision : Martine est **la mémoire structurée des études** de Semantiweb. Elle accompagne l'analyste dans l'interface et dans Claude, avec le même contexte des deux côtés (Ask Martine).

## 2. Contraintes

1. **Dépôt dédié** `martine-prototype`, séparé du prototype R&R.
2. **Reprendre la stack et le design du prototype R&R**, fourni en lecture seule dans `reference/rr/` (ne jamais le modifier) : même stack (Next.js App Router, Tailwind v4, versions du `package.json` de référence), `src/styles/tokens.css` (fond crème, cartes blanches, indigo #473b97, Newsreader et Source Sans 3), la structure du rail (`FilterRail` : bande logo de 88 px puis contenu), la barre d'onglets en pastilles (`FeatureTabs`), le bouton flottant `GlobalAiBar` et le `ChatDrawer` pour Ask Martine. Aucune nouvelle librairie UI.
3. **Interface en anglais.** Apostrophes typographiques (’).
4. **Données fictives** (client d'exemple : Maison Arlette). La méthodo trend report est réelle mais anonymisée : aucun nom de client réel.
5. **Persistance** comme le prototype R&R (stockage local).
6. **Avant d'écrire du code** : lire `reference/rr/`, lister les composants à porter dans ce dépôt (tokens, rail, onglets, bouton flottant, drawer de chat), proposer un plan des routes. Attendre la validation. Copier et adapter ces composants, ne pas les réinventer.

## 3. Navigation

- **Sidebar** sur tous les écrans : logo Martine ; *New study* ; recherche ; **My studies, Methods, Oversight** ; puis *Recent studies*, chacune avec une pastille de couleur par famille (Trends vert #2d6a4f, Monitoring bleu #3d6b9b, SML prune #8b5a7a). L'élément courant est surligné.
- **Ask Martine** : bouton flottant en bas à droite sur tous les écrans (pastille indigo, icône bulle, « Ask Martine », ⌘K), comme Ask AI dans R&R.
- Pas de menu en haut. Pas d'écran « Study journeys ».

## 4. Les écrans

| Écran | Contenu |
| --- | --- |
| **My studies** | « Good morning, Marie », puis une carte par étude : titre, client, famille, phase en cours, barre d'avancement, alerte éventuelle (jalon à valider). Bouton *New study*. |
| **New study** | Zone de dépôt du brief. Résultat en une phrase (type, client, échéance), budget en jours, points à clarifier. *Create the study*. |
| **Study, en-tête** | Titre, sous-titre (type, client, échéance), compte. Onglets en pastilles : **Overview, Steps, Team, Files**. |
| **Overview** | Résumé écrit (« where the study stands »), puis trois tuiles : phase en cours avec *Continue*, jours consommés sur vendus, points à clarifier. |
| **Steps** | Les phases de la méthodo : nombre de tâches faites, jours prévus, *Continue* sur la phase en cours, lien vers la méthode (version). *Add a step for this study* (consultant). |
| **Phase ouverte (drawer)** | Note du consultant, puis une carte par tâche : *How to do it, Tools, Check before moving on, Output*, jours, responsable. Quand la tâche a un skill : ce qu'il fait, ce que Claude reçoit (l'étude, le brief, la tâche, la note, les données de la data platform) et *Open in Claude*. Tâches ajoutées par le consultant en groupe à part. *Suggest a change* vers la référente. *Complete the phase*. |
| **Team** | Consultant, analystes, référente méthodo, et Claude avec ses sorties vérifiées. |
| **Files** | En tête, ce qui a été créé avec l'étude : étude sur la data platform, canal Slack, dossier Drive, topic Talkwalker. Puis les fichiers rangés par phase, avec leur provenance (« made by Claude, checked by Marie », « made by Claude, to check »), et ceux de la vague précédente du même client. |
| **Ask Martine (drawer)** | Comme le `ChatDrawer` R&R : 460 px, fond crème, en-tête (nouvelle conversation, plein écran, fermer), réponses avec sources cliquables, suggestions, zone de saisie avec le contexte (« This study: … »), mention « AI-generated and can be wrong. Check the cited sources. » Centré sur l'étude depuis une page d'étude ; sur toutes les études ailleurs. |
| **Methods, liste** | Une ligne par méthode : famille, propriétaire, phases, tâches, skills, statut (version, « To import »). Recherche, filtre par famille, *New method*. Les 0 skills sont mis en évidence. |
| **Une méthode** | Repères (propriétaire, version, études qui l'utilisent, jours prévus), suggestion en attente, puis la liste des phases, **comme l'onglet Steps d'une étude** (tâches, jours, skills). *Add a phase*. |
| **Phase de méthode (drawer)** | Le même drawer que dans une étude, en mode édition : suggestion à accepter ou refuser, *Edit* par tâche, *+ Add* pour les skills et outils, *Add a task*, *Save to draft v1.3*. |
| **Catalogue (drawer)** | Ouvert depuis *+ Add* : onglets Skills, Tools, Documents, Guides ; recherche ; « Suggested by Martine for this task » avec la raison ; le reste du catalogue avec statut (validated, experimental, deprecated) ; *Request a skill*. |
| **Oversight** | Résumé écrit, jours vendus, prévus et réels par étude, où part le temps par phase. Les chiffres non encore mesurés restent entre crochets. |

## 5. Comportements

- **Tâches** : se cochent quand le contrôle est passé ; une phase se termine quand toutes ses tâches le sont ; le consultant valide les phases à jalon.
- **Open in Claude** : lien `https://claude.ai/new?q=<message>` (ou `claude://claude.ai/new?q=`). Message court avec l'identifiant de l'étude, la phase, la tâche et le skill. En cible, Claude lit le contexte via un connecteur Martine et les données via le connecteur data platform ; dans le prototype, le message porte un contexte minimal. Ne jamais mettre le texte du brief dans le lien.
- **Méthodo** : sa source est le fichier méthodo (simulé par `data/methodo-trend-report.json`). Les changements passent par un brouillon puis une version publiée ; les études en cours gardent leur version.
- **Suggestions** : un analyste suggère depuis une tâche ; la référente accepte ou refuse dans la méthode.
- **Catalogue** : une seule source pour les skills, outils, documents et guides (`data/catalog.json`). Les suggestions de Martine rapprochent la description de la tâche de celle des skills.
- **Créations automatiques** à la création d'une étude (simulées) : canal Slack, étude sur la data platform, dossier Drive.
- **Ask Martine** : réponses scriptées, toujours avec leurs sources.
- **Temps** : mesuré par tâche, cumulé par phase et par étude.

## 6. Définitions à respecter

| Type | Définition |
| --- | --- |
| Outil | Une application où un humain travaille (Talkwalker, Spate, Excel). Martine affiche un lien. |
| Skill | Un savoir-faire écrit que Claude exécute pour une tâche. Martine affiche *Open in Claude*. |
| Connecteur | Le tuyau qui permet à Claude de lire ou écrire dans un outil. Invisible pour l'analyste. |
| Document | Un fichier que la méthodo demande de remplir ou produire (Queries tab, sample sheet, deck). Il vit dans Files. |
| Guide | Un texte à lire pour savoir comment faire. Il apparaît dans les références d'une tâche. |

## 7. Données fournies

| Fichier | Contenu |
| --- | --- |
| `data/methodo-trend-report.json` | Méthodo trend report anonymisée : 11 phases (dont « 2 bis » optionnelle), 39 tâches avec tous leurs champs. |
| `data/methods-index.json` | La liste des méthodes avec leurs comptes (phases, tâches, skills). |
| `data/catalog.json` | Le catalogue : skills (statuts indicatifs), outils (avec ou sans connecteur Claude), documents, guides. |
| `data/briefs-exemples.json` | Deux briefs fictifs en anglais. |
| `docs/reference/parcours-etude.html` | Le parcours d'étude des analystes (en français) : 11 types d'étude, leurs phases, outils, skills et 154 difficultés typées (méthodo, outillage, donnée). **Contexte, pas un écran** : il explique pourquoi Martine existe. S'en servir pour comprendre le métier et écrire des textes réalistes ; ne pas construire d'écran « Study journeys ». |
| `data/parcours-etudes.json` | Les mêmes données en JSON, pour y puiser des exemples (difficultés, durées, outils par phase). |
| `docs/reference/martine-poc.html` | Ancien POC : référence fonctionnelle seulement, pas de design. |

## 8. Scénario de démo (critères d'acceptation)

1. My studies, puis New study : déposer le brief trend report ; créer l'étude ; voir les liens créés dans Files.
2. Steps : les 10 phases et leurs jours prévus ; ouvrir la phase 2 ; *Open in Claude* sur une tâche à skill.
3. Passer en consultant : ajouter une note et une tâche ; valider la phase.
4. Ask Martine depuis l'étude : « What did the client decide on the period? » ; la réponse cite ses sources.
5. Methods : ouvrir le trend report ; la phase 2 s'affiche comme dans l'étude ; accepter la suggestion ; ajouter un skill depuis le catalogue ; enregistrer le brouillon v1.3.
6. Oversight : jours vendus, prévus et réels.

## 9. Hors périmètre et questions ouvertes

Hors périmètre : le vrai connecteur Martine, l'app Slack, la synchronisation avec le fichier méthodo, Explorer, les droits par client.

Questions ouvertes (à afficher, pas à trancher) : un identifiant d'étude commun avec la data platform ; le connecteur Martine ou l'API ; qui gouverne le catalogue (propriétaires, statuts).

# Le corpus d'une étude : de Martine à l'Explorer

Ce document décrit le parcours tel que le prototype le montre. Il est écrit au niveau produit ; ce qui est propre à ce dépôt est en annexe. Les chiffres et les verbatims du prototype sont fictifs.

## 1. Le principe

Un outil externe (Talkwalker, Radarly…) est un lien : Martine ne sait pas ce qui s'y passe. La chaîne interne (data platform, Explorer) remplace Files Tools, le Corpus Manager et l'ICC, et Martine sait où elle en est. Une étape interne n'est donc pas un bouton « Open tool » : c'est un état et une action.

Toute étude peut avoir un corpus, quel que soit son type. La méthode dit quelle phase le construit et quelles phases le lisent.

## 2. Le parcours

| Moment | Dans Martine | Derrière |
| --- | --- | --- |
| Périmètre | L'analyste confirme le périmètre de l'étude et ce qu'il exclut (onglet Corpus). | La cible du filtre hors sujet. Rien n'est filtré comme hors sujet sans périmètre confirmé. |
| Dépôt | Il dépose les exports, en disant de quel outil ils viennent. Chaque fichier est « accepté » ou « format non accepté », avec la raison. | Chaque source a un contrat de format ; l'IA lit le fichier selon ce contrat. Le fichier va directement à la data platform. |
| Traitement | Il lance le traitement après avoir vu le coût et la durée estimés. Le traitement prend du temps (des heures) : les phases qui n'ont pas besoin du corpus continuent. Il est prévenu dans Martine et sur Slack. | Langue, traduction, doublons, hors sujet, détections IA (sentiment, sujets de l'étude). |
| Vérification | Il voit des exemples de ce qui a été retiré comme hors sujet et de ce que l'IA a détecté ; il remet ce qui a été retiré à tort et signale une détection qui lit mal. | Les filtres IA se trompent parfois : on ne les utilise pas sans les avoir regardés. |
| Analyse | Sur une phase qui lit le corpus, une carte ouvre l'Explorer pour cette phase. L'Explorer s'affiche dans l'étude (onglet Explore), avec le même bandeau et les mêmes onglets. | Filtres posés sur les métadonnées (marché, source, langue, date) ou sur les détections IA, plutôt qu'un système de facettes. |
| Livrable | Un graphique ou un verbatim s'épingle sur une phase ; il rejoint les documents de production de l'étude. | Il garde son chemin vers l'Explorer. |

## 3. Le dépôt

1. Dans Martine, onglet Corpus : le fichier part du navigateur vers la data platform par un lien de dépôt temporaire.
2. Depuis Claude : Claude obtient ce lien et le donne ; le fichier ne passe pas par Claude, donc pas de limite de poids. Claude suit ensuite ce que devient le fichier.
3. Plus tard : branchement direct avec les outils sources, sans export.

## 4. Questions ouvertes

1. Martine peut-elle utiliser le lien de dépôt de la data platform, et pas seulement Claude ?
2. Comment Martine est-elle prévenue d'un changement d'état du corpus ?
3. L'Explorer peut-il s'ouvrir sur une étude et des filtres donnés depuis son adresse, et reprendre le bandeau de l'étude ?
4. Identifiant d'étude et connexion communs entre Martine et l'Explorer.
5. Qui lance le traitement (coût, plafond, relecture), l'analyste ou le consultant ?
6. Les études déjà lancées restent sur Files Tools, Corpus Manager et ICC : choix du circuit à la création, ou deuxième version de la méthode ?
7. Les filtres des sujets de l'étude se définissent-ils dans Martine (méthode et périmètre) ou dans l'Explorer ?

## Annexe : dans ce dépôt

- Données fictives : `data/corpus.json` (états de départ, paramètres du traitement, exemples à vérifier, données de l'Explorer pour TR-2611-01).
- La phase qui construit ou lit le corpus : champ `corpus` (`build`, `analyse`) d'une phase dans `data/methods/*.json`, conservé à chaque import.
- Logique : `src/shared/lib/corpus.ts` ; état dans le store local (`corpusOf`, `confirmTarget`, `deposit`, `launchCorpus`, `checkCorpus`).
- Écrans : `src/features/corpus/` (onglet Corpus, carte sur une phase, résumé sur Overview), `src/features/explore/` (l'Explorer simulé).
- Le traitement prend quelques secondes par étape dans le prototype, pour la démo.

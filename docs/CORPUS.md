# Les corpus d'une étude : de Martine à l'Explorer

Ce document décrit le parcours tel que le prototype le montre. Il est écrit au niveau produit ; ce qui est propre à ce dépôt est en annexe. Les fichiers et les chiffres du prototype sont fictifs.

## 1. Le principe

Martine est le Studio de l'analyste : on y crée l'étude, on y dépose les fichiers, et la chaîne de traitement de la data platform remplace Files Tools et le Corpus Manager. L'analyse se fait dans l'Explorer, une application à part, que Martine ouvre sur l'étude.

Toute étude peut avoir un ou plusieurs corpus (la marque et ses concurrents, le social et les avis). La méthode dit quelle phase les construit et quelles phases les lisent.

## 2. Aujourd'hui et demain dans le prototype

Un sélecteur en haut de chaque page, *Today* / *Tomorrow* :

- **Today** : Martine telle qu'elle est, sans corpus. Les tâches ouvrent Files Tools, le Corpus Manager et l'ICC, comme le disent les méthodes.
- **Tomorrow** : l'onglet Corpus, les bandeaux sur les phases et l'Explorer. Les méthodes ne sont pas réécrites : sur une tâche écrite pour le Corpus Manager ou l'ICC, une ligne dit ce qui la remplace demain.

Demain part d'aujourd'hui : Hair skinification (phase 2 en cours) a son corpus nommé, sans fichiers encore ; le brand audit Lumen Café a un corpus de la marque et un des concurrents ; les études livrées ont été faites avec le Corpus Manager.

## 3. Le parcours, demain

1. **Déposer.** Sur un corpus de l'étude, l'analyste dépose les exports en disant de quel outil ils viennent. Chaque fichier est « accepté » ou « format non accepté », avec la raison : jamais de refus silencieux.
2. **Traiter.** Le traitement part tout seul : langue, traduction, dédoublonnage, dépollution, détections IA. Il prend du temps ; les phases qui n'ont pas besoin du corpus continuent.
3. **Analyser.** Quand le corpus est prêt, *Open in Explorer* ouvre l'Explorer dans un nouvel onglet, sur l'étude et, depuis une phase, sur cette phase.

Où ça se voit : un onglet Corpus dans l'étude (une carte par corpus), une ligne sur Overview, et un bandeau sur les phases qui construisent ou lisent les corpus. Les tâches qui citaient Files Tools ou le Corpus Manager ouvrent l'onglet Corpus ; celles qui citaient l'ICC ouvrent l'Explorer.

## 4. La trajectoire (Fabien)

1. Connecter le legacy à l'Explorer, comme pour Reviews, et enrichir les études ICC par une chaîne complémentaire.
2. Puis une première version simple de Studio qui court-circuite le Corpus Manager : on dépose et on y va. C'est ce que le prototype montre.

Côté Explorer, prévu mais pas encore développé : s'ouvrir sur une étude et une phase depuis son adresse, avec un retour vers Martine ; faire revenir dans les documents de l'étude ce qu'on retient dans l'Explorer.

## 5. Questions ouvertes

1. Dans l'Explorer, les corpus d'une étude sont-ils plusieurs vues d'une même étude, ou chacun son espace ?
2. Comment Martine est-elle prévenue qu'un corpus est traité ?
3. Identifiant d'étude et connexion communs entre Martine et l'Explorer.
4. Les études déjà lancées restent sur Files Tools, Corpus Manager et ICC : choix du circuit à la création, ou deuxième version de la méthode ?
5. Ce que le prototype ne montre pas encore : le périmètre de la dépollution, la vérification de ce qui a été retiré ou détecté, le coût d'un traitement. À reprendre quand la chaîne de bout en bout sera prouvée sur une étude réelle.

## Annexe : dans ce dépôt

- Données fictives : `data/corpus.json` (corpus de départ par étude, sources et formats acceptés).
- La phase qui construit ou lit les corpus : champ `corpus` (`build`, `analyse`) d'une phase dans `data/methods/*.json`, conservé à chaque import.
- Logique : `src/shared/lib/corpus.ts` ; état dans le store local (`horizon`, `corporaOf`, `addCorpus`, `renameCorpus`, `deposit`, `removeCorpusFile`). L'Explorer est dans `data/catalog.json` avec `tomorrow: true`.
- Écrans : `src/features/corpus/`. Le traitement prend quelques secondes dans le prototype. L'adresse de l'Explorer reste hors du prototype : un clic dit où il mènerait.

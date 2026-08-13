# Relations Clients ↔ Mandats ↔ Contrats ↔ Registres

Ce document décrit les relations entre les **clients**, les **mandats**, les **contrats** et le **registre** du CRM immobilier, ainsi que les **dépendances déclenchées lors d'un changement de statut**.

---

## 1. Vue d'ensemble des entités

| Entité | Table SQL | Préfixe référence | Rôle | Champ de statut principal |
|---|---|---|---|---|
| **Client** | `owner_clients` | — | Fiche client (Acheteur, Vendeur, Bailleur, Locataire, Voyageur). **Source de vérité** : c'est son statut qui déclenche la cascade. | `mandat_status` (statut du mandat) + `statut_metier` (statut métier) |
| **Mandat / Transaction** | `transactions` | `MVT-AAAA-NNN` | Suivi opérationnel du mandat (vente, recherche, gestion, location). | `etape` |
| **Registre** | `registre` | `REG-AAAA-NNN` | Entrée officielle du registre de l'agence. | `etape` |
| **Contrat** | `contracts` | `CTR-AAAA-NNN` | Contrat commercial (vente, location classique, location saisonnière). Historique dans `contract_history`. | `status` + `contract_type` |

> Le **mandat n'est pas une table dédiée** : il est porté par le client
> (`mandat_status`, `statut_metier`, `typeMandat` dans la colonne `data`) et reflété
> dans la table `transactions` (les références `MVT-…` correspondent aux mandats).

### 1.1 Valeurs possibles

**Statuts du mandat (`mandat_status`)** — Acheteur, Vendeur, Bailleur, Locataire :

`Non défini` · `En attente de signature` · `Actif` · `Termine` · `Expire` · `Resilie`

**Statuts de réservation (`statutReservation`)** — Voyageur :

`Brouillon` · `En attente` · `Confirmée` · `Payée` · `Occupé` · `Terminé` · `Annulée`

**Étapes de transaction (`transactions.etape`)** :

`en_attente` · `actif` · `reservation` · `signe` · `cloture` · `expire` · `resilie` · `annule`

**Étapes du registre (`registre.etape`)** :

`actif` · `reservation` · `signe` · `cloture` · `expire` · `resilie` · `annule`

**Types de contrat (`contracts.contract_type`)** :

`vente` · `location_classique` · `location_saisonniere`

**Statuts de contrat (`contracts.status`)** :

`en_cours` · `confirme_actif` · `paye` · `occupe` · `finalise_termine` · `annule`

---

## 2. Schéma des relations

```
                       ┌────────────────────────────┐
                       │        CLIENT              │
                       │  owner_clients             │
                       │  • mandat_status           │  ← SOURCE DE VÉRITÉ
                       │  • statut_metier           │     (déclenche la cascade)
                       │  • typeMandat (data)       │
                       └────────────┬───────────────┘
                                    │
         mandat_status + statut_metier
                  ▼
      ┌────────────────────────────┴───────────────────────────────┐
      │                                                            │
      ▼                                                            ▼
┌──────────────┐   transaction_id   ┌──────────────┐        ┌──────────────┐
│   MANDAT     │ ─────────────────▶ │   REGISTRE   │        │   CONTRAT    │
│ transactions │                    │  registre    │        │   contracts  │
│  (MVT-…/… )  │   1 ── 1          │  (REG-…)     │        │  (CTR-…)     │
│              │                    │              │        │              │
│  etape       │                    │  etape       │        │  status      │
│  type        │                    │  type        │        │  contract_   │
│  client_id   │                    │  client_id   │        │    type      │
└──────────────┘                    │  property_…  │        │  client_id   │
                                    └──────────────┘        │  property_…  │
                                                            └──────────────┘
```

**Cardinalités** (chacune via `client_id` ⇒ FK vers `owner_clients`, `ON DELETE CASCADE`) :

- 1 Client → 1..n **Mandats** (`transactions`) : un mandat actif par client en pratique, la cascade met à jour le plus récent.
- 1 Client → 1..n **Entrées de registre** (`registre`).
- 1 Client → 1..n **Contrats** (`contracts`).
- 1 Mandat → 0..1 **Registre** : `registre.transaction_id` référence la transaction correspondante.
- Chaque entité référence optionnellement un **bien** (`properties`) via `property_id` et l'**agent** via `agent_id` / `agent_name`.

---

## 3. Règles de dépendance lors d'un changement de statut

### 3.1 Principe général

Tout changement de statut se fait **sur le client** (`statutMandat` + `statutMetier`).
Le service `onClientStatusChange` (dans `src/backend/services/status-transition.service.js`)
résout la **combinaison** `statutMandat::statutMetier` dans une table de cascade propre au
**type de client**, puis **propage la modification vers le bas** : transaction, registre,
puis contrat.

Pour chaque entité cible, la règle est **« créer ou mettre à jour »** :

- si une ligne existe déjà pour ce `client_id` (la plus récente, `ORDER BY created_at DESC LIMIT 1`), elle est **mise à jour** ;
- sinon, une nouvelle ligne est **créée** avec une référence générée (`MVT-`, `REG-`, `CTR-`).

Les combinaisons sans effet (`—`) ne créent ni ne modifient rien pour l'entité concernée.

### 3.2 Chaîne de propagation

| Étape | Entité | Action |
|---|---|---|
| 1 | Client (`owner_clients`) | Mise à jour de `mandat_status` / `statut_metier` (saisie agent). |
| 2 | Mandat (`transactions`) | `etape` ← valeur cascade ; `type` recalculé selon le type de client / `typeMandat`. |
| 3 | Registre (`registre`) | `etape` ← valeur cascade ; `type` recalculé (identique à la transaction pour le Vendeur). |
| 4 | Contrat (`contracts`) | `status` + `contract_type` ← valeurs cascade ; écriture d'une entrée dans `contract_history` (« Contrat créé » ou « Changement de statut »). |

> Seul un sous-ensemble de statuts **crée/active un contrat** : typiquement
> « Actif :: En compromis » (vente) ou « Actif :: En location » / « Actif :: Bail signé » /
> « Actif :: Réservation en cours » (location). Les autres combinaisons ne touchent que la
> transaction et le registre.

### 3.3 Actions spécifiques des mandats

En plus de la cascade générique, trois actions dédiées gèrent le cycle de vie du mandat :

| Fonction | Déclencheur | Effets |
|---|---|---|
| `onMandatSigned` | Signature du mandat | `transactions.etape = 'actif'`, `registre.etape = 'actif'` + rattachement du bien, montant et date d'expiration. |
| `onMandatResiliated` | Résiliation | `transactions.etape = 'resilie'`, `registre.etape = 'resilie'`, client → `statut_metier = 'Perdu'`. |
| `onMandatExpired` | Expiration | `transactions.etape = 'expire'`, `registre.etape = 'expire'`, client → `statut_metier = 'Inactif'`. |

### 3.4 Particularités

- **Vendeur** : le `type` de la transaction et du registre suit le **type de mandat**
  (`Simple` → `simple`, `Co-exclusif` → `co_exclusif`, `Exclusif` → `exclusif`,
  `Exclusif agence` → `exclusif_agence`, `Délégation` → `delegation`, `Confrère` → `confrere`).
  Ce `type` est resynchronisé même si la cascade n'a pas d'effet (mise à jour du type seul).
- **Voyageur** : le statut est piloté par la **réservation** (`statutReservation`).
  `onVoyageurReservationCreated` crée le contrat (`en_cours`) et passe le registre en
  `reservation` ; `onVoyageurReservationConfirmed` → contrat `confirme_actif`, registre `signe` ;
  `onVoyageurReservationCancelled` → contrat `annule`, registre `annule`.
- **Renommage du client** : le nouveau nom est propagé vers `registre`, `contracts`,
  `transactions` et `reservations`.
- **Suppression du client** : suppression en cascade des mandats, registres et contrats liés
  (FK `ON DELETE CASCADE`).

---

## 4. Tableau récapitulatif principal

Résultat de la cascade pour chaque combinaison `(type client, statutMandat, statutMetier)` :

| Type de client | statutMandat | statutMetier | Mandat (`transactions.etape`) | Registre (`registre.etape`) | Contrat (`contract_type` / `status`) |
|---|---|---|---|---|---|
| Acheteur | Non défini | En qualification | — | — | — |
| Acheteur | En attente de signature | En qualification | `en_attente` | — | — |
| Acheteur | Actif | En recherche | `actif` | `actif` | — |
| Acheteur | Actif | En négociation | `actif` | `actif` | — |
| Acheteur | Actif | En compromis | `actif` | `reservation` | `vente` / `en_cours` |
| Acheteur | Terminé | Vendu / Acheté | `cloture` | `cloture` | `vente` / `finalise_termine` |
| Acheteur | Expiré | Inactif | `expire` | `expire` | — |
| Acheteur | Résilié | Perdu | `resilie` | `resilie` | — |
| Vendeur | Non défini | En attente de signature | — | — | — |
| Vendeur | En attente de signature | En attente de signature | `en_attente` | — | — |
| Vendeur | Actif | En mandat | `actif` | `actif` | — |
| Vendeur | Actif | En négociation | `actif` | `actif` | — |
| Vendeur | Actif | En compromis | `actif` | `reservation` | `vente` / `en_cours` |
| Vendeur | Terminé | Vendu | `cloture` | `cloture` | `vente` / `finalise_termine` |
| Vendeur | Expiré | Inactif | `expire` | `expire` | — |
| Vendeur | Résilié | Perdu | `resilie` | `resilie` | — |
| Bailleur | Non défini | En attente de signature | — | — | — |
| Bailleur | En attente de signature | En attente de signature | `en_attente` | — | — |
| Bailleur | Actif | En mandat | `actif` | `actif` | — |
| Bailleur | Actif | En négociation | `actif` | `actif` | — |
| Bailleur | Actif | En location | `actif` | `reservation` | `location_classique` / `en_cours` |
| Bailleur | Terminé | Loué | `cloture` | `cloture` | `location_classique` / `finalise_termine` |
| Bailleur | Expiré | Inactif | `expire` | `expire` | — |
| Bailleur | Résilié | Perdu | `resilie` | `resilie` | — |
| Locataire | Non défini | En recherche | — | — | — |
| Locataire | En attente de signature | En recherche | `en_attente` | — | — |
| Locataire | Actif | En visite | `actif` | `actif` | — |
| Locataire | Actif | En dossier | `actif` | `actif` | — |
| Locataire | Actif | Bail signé | `actif` | `reservation` | `location_classique` / `en_cours` |
| Locataire | Terminé | Installé | `cloture` | `cloture` | `location_classique` / `finalise_termine` |
| Locataire | Expiré | Inactif | `expire` | `expire` | — |
| Locataire | Résilié | Perdu | `resilie` | `resilie` | — |
| Voyageur | Brouillon | En recherche | — | — | — |
| Voyageur | En attente | Réservation en cours | `actif` | `reservation` | `location_saisonniere` / `en_cours` |
| Voyageur | Actif | Confirmé | `actif` | `signe` | `location_saisonniere` / `confirme_actif` |
| Voyageur | Actif | Payé | `actif` | `signe` | `location_saisonniere` / `paye` |
| Voyageur | Actif | En séjour | `actif` | `actif` | `location_saisonniere` / `occupe` |
| Voyageur | Terminé | Terminé | `cloture` | `cloture` | `location_saisonniere` / `finalise_termine` |
| Voyageur | Annulé | Annulé | `resilie` | `annule` | `location_saisonniere` / `annule` |
| Voyageur | Inactif | Inactif | `expire` | `annule` | `location_saisonniere` / `annule` |

### 4.1 Lecture du tableau

- **Le client reste la source de vérité** : c'est la combinaison `statutMandat::statutMetier`
  saisie sur la fiche client qui pilote tout.
- Les lignes `Actif` sans contrat (`En recherche`, `En mandat`, `En négociation`, `En visite`,
  `En dossier`) activent le mandat et le registre **sans créer de contrat**.
- Seul le passage à un statut « contractuel » (`En compromis`, `En location`, `Bail signé`,
  `Réservation en cours`, etc.) crée le contrat.
- Les statuts terminaux (`Terminé`) clôturent le contrat ; les statuts
  `Expiré`/`Résilié` (et `Annulé` pour le Voyageur) **ne touchent pas le contrat existant**
  dans la cascade générique — ils ne font qu'expirer/résilier le mandat et le registre
  (la résiliation du contrat relève des actions dédiées `onMandatResiliated` /
  `onVoyageurReservationCancelled`).

---

## 5. Tables détaillées par type de client

Extrait direct des tables de cascade du service `status-transition.service.js`
(les entrées `::*` sont les replis appliqués quand la combinaison exacte n'est pas mappée).

### 5.1 Acheteur

| statutMandat | statutMetier | Mandat | Registre | Contrat |
|---|---|---|---|---|
| Non défini | En qualification | — | — | — |
| En attente de signature | En qualification | `en_attente` | — | — |
| Actif | En recherche | `actif` | `actif` | — |
| Actif | En négociation | `actif` | `actif` | — |
| Actif | En compromis | `actif` | `reservation` | `vente` / `en_cours` |
| Terminé | Vendu / Acheté | `cloture` | `cloture` | `vente` / `finalise_termine` |
| Expiré | Inactif | `expire` | `expire` | — |
| Résilié | Perdu | `resilie` | `resilie` | — |
| *(replis)* | Non défini · Expiré · Résilié · Terminé · Actif | `—` / `en_attente` / `expire` / `resilie` / `cloture` / `actif` | `—` / `expire` / `resilie` / `cloture` / `actif` | — |

### 5.2 Vendeur

| statutMandat | statutMetier | Mandat | Registre | Contrat |
|---|---|---|---|---|
| Non défini | En attente de signature | — | — | — |
| En attente de signature | En attente de signature | `en_attente` | — | — |
| Actif | En mandat | `actif` | `actif` | — |
| Actif | En négociation | `actif` | `actif` | — |
| Actif | En compromis | `actif` | `reservation` | `vente` / `en_cours` |
| Terminé | Vendu | `cloture` | `cloture` | `vente` / `finalise_termine` |
| Expiré | Inactif | `expire` | `expire` | — |
| Résilié | Perdu | `resilie` | `resilie` | — |
| *(replis)* | Non défini · En attente · Actif · Terminé · Expiré · Résilié | `—` / `en_attente` / `actif` / `cloture` / `expire` / `resilie` | `—` / `actif` / `cloture` / `expire` / `resilie` | — |

### 5.3 Bailleur

| statutMandat | statutMetier | Mandat | Registre | Contrat |
|---|---|---|---|---|
| Non défini | En attente de signature | — | — | — |
| En attente de signature | En attente de signature | `en_attente` | — | — |
| Actif | En mandat | `actif` | `actif` | — |
| Actif | En négociation | `actif` | `actif` | — |
| Actif | En location | `actif` | `reservation` | `location_classique` / `en_cours` |
| Terminé | Loué | `cloture` | `cloture` | `location_classique` / `finalise_termine` |
| Expiré | Inactif | `expire` | `expire` | — |
| Résilié | Perdu | `resilie` | `resilie` | — |

### 5.4 Locataire

| statutMandat | statutMetier | Mandat | Registre | Contrat |
|---|---|---|---|---|
| Non défini | En recherche | — | — | — |
| En attente de signature | En recherche | `en_attente` | — | — |
| Actif | En visite | `actif` | `actif` | — |
| Actif | En dossier | `actif` | `actif` | — |
| Actif | Bail signé | `actif` | `reservation` | `location_classique` / `en_cours` |
| Terminé | Installé | `cloture` | `cloture` | `location_classique` / `finalise_termine` |
| Expiré | Inactif | `expire` | `expire` | — |
| Résilié | Perdu | `resilie` | `resilie` | — |

### 5.5 Voyageur (piloté par la réservation)

| statutReservation | statutMetier | Mandat | Registre | Contrat |
|---|---|---|---|---|
| Brouillon | En recherche | — | — | — |
| En attente | Réservation en cours | `actif` | `reservation` | `location_saisonniere` / `en_cours` |
| Actif | Confirmé | `actif` | `signe` | `location_saisonniere` / `confirme_actif` |
| Actif | Payé | `actif` | `signe` | `location_saisonniere` / `paye` |
| Actif | En séjour | `actif` | `actif` | `location_saisonniere` / `occupe` |
| Terminé | Terminé | `cloture` | `cloture` | `location_saisonniere` / `finalise_termine` |
| Annulé | Annulé | `resilie` | `annule` | `location_saisonniere` / `annule` |
| Inactif | Inactif | `expire` | `annule` | `location_saisonniere` / `annule` |

---

## 6. Types appliqués par type de client

Quand une ligne de cascade touche la transaction ou le registre, le champ `type` est
renseigné selon la table ci-dessous (le **Vendeur** reprend le type de mandat choisi) :

| Type de client | `transactions.type` / `registre.type` | `contracts.contract_type` |
|---|---|---|
| Vendeur | `simple` · `co_exclusif` · `exclusif` · `exclusif_agence` · `delegation` · `confrere` (selon `typeMandat`) | `vente` |
| Acheteur | `recherche_achat` | `vente` |
| Bailleur | `location_gestion` | `location_classique` |
| Locataire | `recherche_location` | `location_classique` |
| Voyageur | `location_saisonniere` | `location_saisonniere` |

---

## 7. Références dans le code

| Rôle | Fichier |
|---|---|
| Tables de cascade et propagation | `src/backend/services/status-transition.service.js` |
| Dérivation statutMandat → statutMetier | `src/backend/controllers/client.controller.js` |
| Appel de la cascade à la création/mise à jour d'un client | `src/backend/controllers/client.controller.js` |
| Actions mandat signé / résilié / expiré | `src/backend/controllers/transaction.controller.js` |
| Flux réservation Voyageur | `src/backend/controllers/reservation.controller.js` + `status-transition.service.js` |
| Schéma `transactions` / `registre` / `contracts` | `src/backend/migrations/023-add-client-status-and-contracts.js` · `028-create-transactions-and-registre.js` |
| Historique des contrats | `src/backend/migrations/075-contract-documents-and-history.js` |

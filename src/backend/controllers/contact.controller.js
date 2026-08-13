import pool from '../config/db.js';
import { getEffectivePermissions } from '../services/permissions.service.js';

// For agents only, checks that the given permission is allowed. Returns the
// effective permissions map (or null for non-agents). Throws 403 otherwise.
async function assertAgentPermission(req, permissionKey, message) {
  if (req.user?.role !== 'agent') return null;
  const perms = await getEffectivePermissions(req.user.id);
  if (!perms[permissionKey]) {
    const err = new Error(message);
    err.status = 403;
    throw err;
  }
  return perms;
}

function rowToContact(row) {
  return {
    id: String(row.id),
    type: row.contact_type,
    civility: row.civility,
    firstName: row.first_name,
    lastName: row.last_name,
    emailPrincipal: row.email_principal,
    emailSecondaire: row.email_secondaire,
    mobile: row.mobile,
    telephoneFixe: row.telephone_fixe,
    profession: row.profession,
    lieuNaissance: row.lieu_naissance,
    dateNaissance: row.date_naissance,
    nationalite: row.nationalite,
    numeroFiscal: row.numero_fiscal,
    adresse: row.adresse,
    adresse2: row.adresse2,
    codePostal: row.code_postal,
    ville: row.ville,
    pays: row.pays,
    moyenContactPrefere: row.moyen_contact_prefere,
    langueParlee: row.langue_parlee || [],
    devisePreferee: row.devise_preferee,
    situationFamiliale: row.situation_familiale,
    nombreEnfants: row.nombre_enfants,
    prescripteur: row.prescripteur,
    regimeMatrimonial: row.regime_matrimonial,
    siteInternet: row.site_internet,
    commentairePrive: row.commentaire_prive,
    originalProspectId: row.original_prospect_id,
    originalContactId: row.original_contact_id || null,
    mandats: row.mandats || [],
    agentId: row.agent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getContacts(req, res) {
  try {
    const perms = await assertAgentPermission(req, 'contacts-lecture', "Vous n'avez pas accès aux contacts.");
    const { search, type, mandat_type, include_copies } = req.query;
    let query = 'SELECT * FROM contacts';
    const conditions = [];
    const values = [];
    let idx = 1;

    if (include_copies !== 'true') {
      conditions.push(`original_contact_id IS NULL`);
    }

    if (perms && !perms['contacts-demandes']) {
      conditions.push(`NOT (mandats @> $${idx}::jsonb)`);
      values.push(JSON.stringify([{ clientType: 'Acheteur' }]));
      idx++;
    }

    if (search) {
      conditions.push(`(LOWER(first_name) LIKE $${idx} OR LOWER(last_name) LIKE $${idx} OR LOWER(email_principal) LIKE $${idx} OR mobile LIKE $${idx})`);
      values.push(`%${search.toLowerCase()}%`);
      idx++;
    }
    if (type) {
      conditions.push(`contact_type = $${idx}`);
      values.push(type);
      idx++;
    }
    if (mandat_type) {
      conditions.push(`mandats @> $${idx}::jsonb`);
      values.push(JSON.stringify([{ clientType: mandat_type }]));
      idx++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    res.json(result.rows.map(rowToContact));
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getContactById(req, res) {
  try {
    const perms = await assertAgentPermission(req, 'contacts-lecture', "Vous n'avez pas accès aux contacts.");
    if (perms && !perms['contacts-info-privees']) {
      const err = new Error("Vous n'avez pas accès aux informations privées de ce contact.");
      err.status = 403;
      throw err;
    }
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(rowToContact(result.rows[0]));
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function createContact(req, res) {
  try {
    await assertAgentPermission(req, 'contacts-ecriture', "Vous n'avez pas le droit d'ajouter des contacts.");
    const b = req.body;
    const result = await pool.query(
      `INSERT INTO contacts (
        contact_type, civility, first_name, last_name, email_principal, email_secondaire,
        mobile, telephone_fixe, profession, lieu_naissance, date_naissance, nationalite,
        numero_fiscal, adresse, adresse2, code_postal, ville, pays, moyen_contact_prefere,
        langue_parlee, devise_preferee, situation_familiale, nombre_enfants, prescripteur,
        regime_matrimonial, site_internet, commentaire_prive, original_prospect_id,
        original_contact_id, mandats, agent_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31
      ) RETURNING *`,
      [
        b.type || 'Particulier', b.civility || 'M.', b.firstName || '', b.lastName || '',
        b.emailPrincipal || '', b.emailSecondaire || '', b.mobile || '', b.telephoneFixe || '',
        b.profession || '', b.lieuNaissance || '', b.dateNaissance || '', b.nationalite || '',
        b.numeroFiscal || '', b.adresse || '', b.adresse2 || '', b.codePostal || '',
        b.ville || '', b.pays || '', b.moyenContactPrefere || '',
        JSON.stringify(b.langueParlee || []), b.devisePreferee || '',
        b.situationFamiliale || '', b.nombreEnfants || null, b.prescripteur || '',
        b.regimeMatrimonial || '', b.siteInternet || '', b.commentairePrive || '',
        b.originalProspectId || null, b.originalContactId || null,
        JSON.stringify(b.mandats || []),
        b.agentId || req.user?.id || null,
      ]
    );
    const contact = rowToContact(result.rows[0]);

    const assignedAgentId = b.agentId || req.user?.id || null;
    if (assignedAgentId && String(assignedAgentId) !== String(req.user?.id || '')) {
      let senderName = 'Administrateur';
      if (req.user?.id) {
        const senderResult = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
        if (senderResult.rows.length > 0) {
          const s = senderResult.rows[0];
          senderName = `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Administrateur';
        }
      }
      const contactName = `${b.civility || ''} ${b.firstName || ''} ${b.lastName || ''}`.trim();
      await pool.query(
        `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [String(assignedAgentId), senderName, 'contact_assigned',
         `Le contact ${contactName} vous a été attribué.`,
         String(contact.id), contactName]
      );
    }

    res.status(201).json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function updateContact(req, res) {
  try {
    await assertAgentPermission(req, 'contacts-ecriture', "Vous n'avez pas le droit de modifier les contacts.");
    const { id } = req.params;
    const b = req.body;

    if (b.agentId !== undefined) {
      const oldResult = await pool.query('SELECT agent_id, first_name, last_name FROM contacts WHERE id = $1', [id]);
      const oldAgentId = oldResult.rows.length > 0 ? String(oldResult.rows[0].agent_id || '') : '';
      const newAgentId = String(b.agentId || '');

      await pool.query(
        `UPDATE contacts SET agent_id = $1, updated_at = NOW() WHERE id = $2`,
        [newAgentId || null, id]
      );

      if (newAgentId && newAgentId !== oldAgentId && newAgentId !== String(req.user?.id || '')) {
        let senderName = 'Administrateur';
        if (req.user?.id) {
          const senderResult = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
          if (senderResult.rows.length > 0) {
            const s = senderResult.rows[0];
            senderName = `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Administrateur';
          }
        }
        const contactName = oldResult.rows.length > 0
          ? `${oldResult.rows[0].first_name || ''} ${oldResult.rows[0].last_name || ''}`.trim()
          : '';
        await pool.query(
          `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newAgentId, senderName, 'contact_assigned',
           `Le contact ${contactName} vous a été attribué.`,
           String(id), contactName]
        );
      }

      const updated = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
      return res.json(rowToContact(updated.rows[0]));
    }

    const result = await pool.query(
      `UPDATE contacts SET
        contact_type = $1, civility = $2, first_name = $3, last_name = $4,
        email_principal = $5, email_secondaire = $6, mobile = $7, telephone_fixe = $8,
        profession = $9, lieu_naissance = $10, date_naissance = $11, nationalite = $12,
        numero_fiscal = $13, adresse = $14, adresse2 = $15, code_postal = $16,
        ville = $17, pays = $18, moyen_contact_prefere = $19, langue_parlee = $20,
        devise_preferee = $21, situation_familiale = $22, nombre_enfants = $23,
        prescripteur = $24, regime_matrimonial = $25, site_internet = $26,
        commentaire_prive = $27, original_prospect_id = $28, original_contact_id = $29,
        mandats = $30,
        updated_at = NOW()
      WHERE id = $31 RETURNING *`,
      [
        b.type || 'Particulier', b.civility || 'M.', b.firstName || '', b.lastName || '',
        b.emailPrincipal || '', b.emailSecondaire || '', b.mobile || '', b.telephoneFixe || '',
        b.profession || '', b.lieuNaissance || '', b.dateNaissance || '', b.nationalite || '',
        b.numeroFiscal || '', b.adresse || '', b.adresse2 || '', b.codePostal || '',
        b.ville || '', b.pays || '', b.moyenContactPrefere || '',
        JSON.stringify(b.langueParlee || []), b.devisePreferee || '',
        b.situationFamiliale || '', b.nombreEnfants || null, b.prescripteur || '',
        b.regimeMatrimonial || '', b.siteInternet || '', b.commentairePrive || '',
        b.originalProspectId || null, b.originalContactId || null,
        JSON.stringify(b.mandats || []),
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(rowToContact(result.rows[0]));
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function syncContactMandatFromClient(clientData) {
  try {
    const contactId = clientData.contactId;
    if (!contactId) return;

    const contactResult = await pool.query('SELECT id, mandats FROM contacts WHERE id = $1', [contactId]);
    if (contactResult.rows.length === 0) return;

    const contact = contactResult.rows[0];
    const mandats = contact.mandats || [];
    const clientId = String(clientData.id);
    const mandatId = `client-${clientId}`;

    const mandatStatus = clientData.statutMandat || clientData.mandatStatus || '';
    let mappedStatus = 'En attente';
    if (mandatStatus === 'Actif') {
      mappedStatus = 'Actif';
    } else if (['Expire', 'Resilie', 'Termine', 'Annulee', 'Inactif'].includes(mandatStatus)) {
      mappedStatus = 'Expiré';
    }

    const newMandat = {
      id: mandatId,
      clientId,
      clientType: clientData.clientType || clientData.type || '',
      status: mappedStatus,
      startDate: clientData.dateDebut || clientData.dateSignature || '',
      endDate: clientData.dateExpiration || '',
      numeroMandat: clientData.numeroMandat || clientData.numeroReservation || '',
      typeMandat: clientData.typeMandat || '',
      statutMetier: clientData.statutMetier || '',
      statutMandat: mandatStatus,
      dateSignature: clientData.dateSignature || '',
      conjoint: clientData.conjoint || '',
      societe: clientData.societe || '',
      bienConcerneId: clientData.bienConcerneId || clientData.bienRechercheId || '',
      dureeProtection: clientData.dureeProtection || '',
      typeRemuneration: clientData.typeRemuneration || '',
      montantRemuneration: clientData.montantRemuneration || null,
      remunerationIsPercentage: clientData.remunerationIsPercentage || false,
      conditionPaiement: clientData.conditionPaiement || '',
      agentDesigne: clientData.agentDesigne || '',
      mandatPdfUrl: clientData.mandatPdfUrl || '',
      mandatPdfName: clientData.mandatPdfName || '',
      fraisMiseEnLocation: clientData.fraisMiseEnLocation || null,
      fraisEtatDesLieux: clientData.fraisEtatDesLieux || null,
      fraisRenouvellementBail: clientData.fraisRenouvellementBail || null,
    };

    if (clientData.clientType === 'Voyageur' || clientData.type === 'Voyageur') {
      newMandat.numeroReservation = clientData.numeroReservation || '';
      newMandat.statutReservation = clientData.statutReservation || '';
      newMandat.dateArrivee = clientData.dateArrivee || '';
      newMandat.dateDepart = clientData.dateDepart || '';
      newMandat.tarifNuit = clientData.tarifNuit || null;
      newMandat.bienReserve = clientData.bienReserve || '';
      newMandat.nbNuits = clientData.nbNuits || 0;
      newMandat.nbAdultes = clientData.nbAdultes || null;
      newMandat.nbEnfants = clientData.nbEnfants || null;
      newMandat.montantTotalAvecOptions = clientData.montantTotalAvecOptions || null;
      newMandat.acompteMontant = clientData.acompteMontant || null;
      newMandat.soldeRestant = clientData.soldeRestant || null;
      newMandat.cautionMontant = clientData.cautionMontant || null;
      newMandat.checkInHeure = clientData.checkInHeure || '';
      newMandat.checkOutHeure = clientData.checkOutHeure || '';
      newMandat.contratPdfUrl = clientData.contratPdfUrl || '';
      newMandat.conditionAnnulation = clientData.conditionAnnulation || '';
      newMandat.optionsSelectionnees = clientData.optionsSelectionnees || [];
      newMandat.animauxAcceptes = clientData.animauxAcceptes || false;
      newMandat.fumeur = clientData.fumeur || false;
      newMandat.montantTotalHorsOptions = clientData.montantTotalHorsOptions || null;
      newMandat.dateReservation = clientData.dateReservation || '';
    }

    const existingIdx = mandats.findIndex((m) => m.id === mandatId);
    if (existingIdx >= 0) {
      mandats[existingIdx] = { ...mandats[existingIdx], ...newMandat };
    } else {
      mandats.push(newMandat);
    }

    await pool.query(
      'UPDATE contacts SET mandats = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(mandats), contactId]
    );
  } catch (err) {
    console.error('Error syncing contact mandat:', err);
  }
}

export async function removeContactMandatOnClientDelete(clientId, contactId) {
  try {
    if (!contactId || !clientId) return;
    const contactResult = await pool.query('SELECT id, mandats FROM contacts WHERE id = $1', [contactId]);
    if (contactResult.rows.length === 0) return;
    const mandats = contactResult.rows[0].mandats || [];
    const mandatId = `client-${clientId}`;
    const filtered = mandats.filter((m) => m.id !== mandatId);
    if (filtered.length !== mandats.length) {
      await pool.query(
        'UPDATE contacts SET mandats = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(filtered), contactId]
      );
    }
  } catch (err) {
    console.error('Error removing contact mandat:', err);
  }
}

export async function deleteContact(req, res) {
  try {
    await assertAgentPermission(req, 'contacts-supprimer', "Vous n'avez pas le droit de supprimer les contacts.");
    const { id } = req.params;
    await pool.query(
      "UPDATE owner_clients SET data = data - 'contactId' WHERE data->>'contactId' = $1",
      [id]
    );
    await pool.query(
      'DELETE FROM contacts WHERE original_contact_id = $1',
      [id]
    );
    const result = await pool.query('DELETE FROM contacts WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function duplicateContact(req, res) {
  try {
    await assertAgentPermission(req, 'contacts-ecriture', "Vous n'avez pas le droit d'ajouter des contacts.");
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    const src = result.rows[0];
    const duplicatorId = req.user?.id ? String(req.user.id) : src.agent_id;

    const cols = [
      'contact_type', 'civility', 'first_name', 'last_name', 'email_principal',
      'email_secondaire', 'mobile', 'telephone_fixe', 'profession', 'lieu_naissance',
      'date_naissance', 'nationalite', 'numero_fiscal', 'adresse', 'adresse2',
      'code_postal', 'ville', 'pays', 'moyen_contact_prefere', 'langue_parlee',
      'devise_preferee', 'situation_familiale', 'nombre_enfants', 'prescripteur',
      'regime_matrimonial', 'site_internet', 'commentaire_prive', 'original_prospect_id',
      'original_contact_id', 'mandats', 'agent_id',
    ];
    const vals = [
      src.contact_type, src.civility, src.first_name, src.last_name,
      src.email_principal, src.email_secondaire, src.mobile, src.telephone_fixe,
      src.profession, src.lieu_naissance, src.date_naissance, src.nationalite,
      src.numero_fiscal, src.adresse, src.adresse2, src.code_postal,
      src.ville, src.pays, src.moyen_contact_prefere,
      JSON.stringify(src.langue_parlee || []), src.devise_preferee || '',
      src.situation_familiale || '', src.nombre_enfants || null, src.prescripteur || '',
      src.regime_matrimonial || '', src.site_internet || '', src.commentaire_prive || '',
      src.original_prospect_id || null, src.original_contact_id || src.id,
      JSON.stringify(src.mandats || []),
      duplicatorId || src.agent_id,
    ];
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const insertResult = await pool.query(
      `INSERT INTO contacts (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals
    );
    res.status(201).json(rowToContact(insertResult.rows[0]));
  } catch (error) {
    console.error('Error duplicating contact:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

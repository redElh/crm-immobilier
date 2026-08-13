import pool from '../config/db.js';

export async function up(pg) {
  const { rows: clients } = await pg.query(`
    SELECT c.id, c.client_type, c.first_name, c.last_name, c.mandat_status,
           c.statut_metier, c.mandat_pdf_url, c.agent_designe,
           c.data, ct.id AS contact_id
    FROM owner_clients c
    JOIN contacts ct ON CAST(ct.id AS TEXT) = c.data->>'contactId'
    WHERE c.data->>'contactId' IS NOT NULL AND c.data->>'contactId' != ''
  `);

  for (const client of clients) {
    const data = client.data || {};
    const clientId = String(client.id);
    const mandatId = `client-${clientId}`;

    const mandatStatus = client.mandat_status || data.statutMandat || '';
    let mappedStatus = 'En attente';
    if (mandatStatus === 'Actif') {
      mappedStatus = 'Actif';
    } else if (['Expire', 'Resilie', 'Termine', 'Annulee', 'Inactif'].includes(mandatStatus)) {
      mappedStatus = 'Expiré';
    }

    const newMandat = {
      id: mandatId,
      clientId,
      clientType: client.client_type || '',
      status: mappedStatus,
      startDate: data.dateDebut || data.dateSignature || '',
      endDate: data.dateExpiration || '',
      numeroMandat: data.numeroMandat || data.numeroReservation || '',
      typeMandat: data.typeMandat || '',
      statutMetier: client.statut_metier || '',
      statutMandat: mandatStatus,
      dateSignature: data.dateSignature || '',
      conjoint: data.conjoint || '',
      societe: data.societe || '',
      bienConcerneId: data.bienConcerneId || data.bienRechercheId || '',
      dureeProtection: data.dureeProtection || '',
      typeRemuneration: data.typeRemuneration || '',
      montantRemuneration: data.montantRemuneration || null,
      remunerationIsPercentage: data.remunerationIsPercentage || false,
      conditionPaiement: data.conditionPaiement || '',
      agentDesigne: client.agent_designe || '',
      mandatPdfUrl: client.mandat_pdf_url || '',
      mandatPdfName: data.mandatPdfName || '',
      fraisMiseEnLocation: data.fraisMiseEnLocation || null,
      fraisEtatDesLieux: data.fraisEtatDesLieux || null,
      fraisRenouvellementBail: data.fraisRenouvellementBail || null,
    };

    if (client.client_type === 'Voyageur') {
      newMandat.numeroReservation = data.numeroReservation || '';
      newMandat.statutReservation = data.statutReservation || '';
      newMandat.dateArrivee = data.dateArrivee || '';
      newMandat.dateDepart = data.dateDepart || '';
      newMandat.tarifNuit = data.tarifNuit || null;
      newMandat.bienReserve = data.bienReserve || '';
      newMandat.nbNuits = data.nbNuits || 0;
      newMandat.nbAdultes = data.nbAdultes || null;
      newMandat.nbEnfants = data.nbEnfants || null;
      newMandat.montantTotalAvecOptions = data.montantTotalAvecOptions || null;
      newMandat.acompteMontant = data.acompteMontant || null;
      newMandat.soldeRestant = data.soldeRestant || null;
      newMandat.cautionMontant = data.cautionMontant || null;
      newMandat.checkInHeure = data.checkInHeure || '';
      newMandat.checkOutHeure = data.checkOutHeure || '';
      newMandat.contratPdfUrl = data.contratPdfUrl || '';
      newMandat.conditionAnnulation = data.conditionAnnulation || '';
      newMandat.optionsSelectionnees = data.optionsSelectionnees || [];
      newMandat.animauxAcceptes = data.animauxAcceptes || false;
      newMandat.fumeur = data.fumeur || false;
      newMandat.montantTotalHorsOptions = data.montantTotalHorsOptions || null;
      newMandat.dateReservation = data.dateReservation || '';
    }

    const contactResult = await pg.query('SELECT mandats FROM contacts WHERE id = $1', [client.contact_id]);
    if (contactResult.rows.length === 0) continue;

    const mandats = contactResult.rows[0].mandats || [];
    const existingIdx = mandats.findIndex((m) => m.id === mandatId);
    if (existingIdx >= 0) {
      mandats[existingIdx] = newMandat;
    } else {
      mandats.push(newMandat);
    }

    await pg.query(
      'UPDATE contacts SET mandats = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(mandats), client.contact_id]
    );
  }
}

export async function down(pg) {
}

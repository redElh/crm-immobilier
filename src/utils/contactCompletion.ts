import type { Contact } from '../types/contact';

export function calcContactCompletion(contact: Contact): number {
  const check = (v: any) => v !== undefined && v !== null && String(v).trim() !== '';
  const fields = [
    contact.firstName, contact.lastName, contact.emailPrincipal, contact.emailSecondaire,
    contact.mobile, contact.telephoneFixe, contact.profession, contact.lieuNaissance,
    contact.dateNaissance, contact.nationalite, contact.numeroFiscal, contact.adresse,
    contact.adresse2, contact.codePostal, contact.ville, contact.pays,
    contact.moyenContactPrefere, contact.langueParlee?.length > 0 ? 'x' : '',
    contact.devisePreferee, contact.situationFamiliale, contact.nombreEnfants,
    contact.prescripteur, contact.regimeMatrimonial, contact.siteInternet, contact.commentairePrive,
  ];
  const filled = fields.filter(f => check(f)).length;
  return Math.round((filled / fields.length) * 100);
}

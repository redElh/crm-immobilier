const { Pool } = require('pg');
const p = new Pool({ connectionString: 'postgresql://postgres:1986ridaelhiri@localhost:5432/crm_immobilier' });

const rows = [
  { type:'Acheter', origin:'Site web', date:'2026-09-01', civility:'M.', first:'Ahmed', last:'Benali', email:'ahmed.benali.mock@email.com', phone:'+212 6 12 34 56 78', mobile:'+212 6 98 76 54 32', spoken:'Francais', means:['email','phone'], categories:'Vente', propertyTypes:['Appartement'], location:'Marrakech', rooms:3, bedrooms:2, minSurface:80, maxPrice:1200000, currency:'MAD', status:'Nouveau', message:'Interesse par un appartement a Marrakech.' },
  { type:'Louer', origin:'Properstar', date:'2026-09-05', civility:'Mme', first:'Sophie', last:'Martin', email:'sophie.martin.mock@email.com', phone:'+33 6 98 76 54 32', spoken:'Francais', means:['email'], categories:'Location', propertyTypes:['Maison'], location:'Casablanca', rooms:4, bedrooms:3, minSurface:120, maxPrice:15000, currency:'MAD', status:'Contact\u00e9', message:'Cherche maison a louer.' },
  { type:'Acheter', origin:'Reseaux sociaux', date:'2026-09-10', civility:'M.', first:'Youssef', last:'Amrani', email:'y.amrani.mock@email.com', phone:'+212 6 54 32 10 98', spoken:'Arabe', means:['phone','sms'], categories:'Vente', propertyTypes:['Appartement'], location:'Rabat', maxPrice:250000, currency:'MAD', status:'Nouveau' },
  { type:'Acheter', origin:'Mubawab', date:'2026-08-20', civility:'Mme', first:'Leila', last:'Benbrahim', email:'leila.mock@email.com', phone:'+212 6 11 22 33 44', spoken:'Francais', means:['email','phone'], categories:'Vente', propertyTypes:['Appartement','Villa'], location:'Marrakech', rooms:5, bedrooms:4, minSurface:150, maxPrice:3500000, currency:'MAD', status:'Qualifi\u00e9' },
  { type:'Vendre', origin:'Recommandation', date:'2026-08-15', civility:'M.', first:'Karim', last:'El Fassi', email:'karim.elfassi.mock@email.com', phone:'+212 6 33 44 55 66', spoken:'Francais', means:['email'], categories:'Vente', propertyTypes:['Villa'], location:'Tanger', rooms:8, bedrooms:5, minSurface:300, maxPrice:6000000, currency:'MAD', status:'Qualifi\u00e9', message:'Souhaite vendre sa villa.' },
  { type:'Louer', origin:'Green-Acres', date:'2026-09-12', civility:'Mlle', first:'Nadia', last:'Tazi', email:'nadia.tazi.mock@email.com', phone:'+212 6 55 66 77 88', spoken:'Francais', means:['phone'], categories:'Location', propertyTypes:['Appartement'], location:'Rabat', rooms:2, bedrooms:1, minSurface:50, maxPrice:5000, currency:'MAD', status:'Contact\u00e9' },
];

(async () => {
  let created = 0;
  for (const r of rows) {
    try {
      await p.query(
        `INSERT INTO prospects (prospect_type, origin, prospect_date, message, civility, first_name, last_name, email, phone, mobile, spoken_language, means_of_contact, categories, property_types, location, rooms, bedrooms, min_surface, max_price, currency, status, agent_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
        [r.type, r.origin, r.date, r.message||'', r.civility, r.first, r.last, r.email, r.phone, r.mobile||'', r.spoken, JSON.stringify(r.means||[]), r.categories||'', JSON.stringify(r.propertyTypes||[]), r.location||'', r.rooms||null, r.bedrooms||null, r.minSurface||null, r.maxPrice||null, r.currency||'MAD', r.status, '6']
      );
      created++;
    } catch (e) { console.error('FAIL', r.email, e.message); }
  }
  console.log('created', created);
  await p.end();
})();

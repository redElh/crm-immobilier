import nodemailer from 'nodemailer';

let _transporter = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    });
  }
  return _transporter;
}

function parseAddress(input) {
  if (input && typeof input === 'object') return input;
  const s = String(input || '').trim();
  const m = s.match(/^(?:"?([^"<>]*)"?\s*)?<([^>]+)>$/);
  if (m) return { name: (m[1] || '').trim() || undefined, email: m[2] };
  return { email: s };
}

// Central send: uses Brevo's HTTPS API when BREVO_API_KEY is set (required on
// Railway Free/Hobby plans where outbound SMTP is blocked). Falls back to SMTP
// via nodemailer otherwise (local development).
async function sendMail(mailOptions) {
  if (process.env.BREVO_API_KEY) {
    await sendViaBrevoApi(mailOptions);
    return;
  }
  await getTransporter().sendMail(mailOptions);
}

async function sendViaBrevoApi(mailOptions) {
  const to = (Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to]).map(parseAddress);
  const body = {
    sender: parseAddress(mailOptions.from),
    to,
    subject: mailOptions.subject,
    htmlContent: mailOptions.html,
  };
  if (mailOptions.attachments && mailOptions.attachments.length > 0) {
    body.attachment = mailOptions.attachments.map((a) => ({
      name: a.filename || 'attachment',
      content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : String(a.content || ''),
    }));
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo API ${res.status}: ${text}`);
  }
}

export const sendAgentWelcomeEmail = async ({ email, firstName, lastName, password, loginLink }) => {
  const mailOptions = {
    from: `"Real Estate CRM" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Your Agent Account Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Our Real Estate CRM</h2>
        <p>Hello ${firstName} ${lastName},</p>
        <p>Your agent account has been created by the administrator.</p>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Login Credentials:</strong></p>
          <p>Email: ${email}</p>
          <p>Password: ${password}</p>
        </div>
        
        <p>Please use these credentials to log in at:</p>
        <a href="${loginLink}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Login to Your Account
        </a>
        
        <p style="font-size: 0.9em; color: #6b7280;">
          For security reasons, we recommend changing your password after first login.
        </p>
      </div>
    `,
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
};

export const sendUserWelcomeEmail = async ({ email, firstName, lastName, password, loginLink, role }) => {
  const roleLabel = role === 'admin' ? 'Administrateur' : role === 'gerant' ? 'Gérant' : 'Agent';
  const mailOptions = {
    from: `"Real Estate CRM" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Vos identifiants de connexion ${roleLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bienvenue sur notre CRM Immobilier</h2>
        <p>Bonjour ${firstName} ${lastName},</p>
        <p>Votre compte ${roleLabel} a été créé par l'administrateur.</p>

        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Vos identifiants de connexion :</strong></p>
          <p>Email : ${email}</p>
          <p>Mot de passe : ${password}</p>
        </div>

        <p>Veuillez utiliser ces identifiants pour vous connecter :</p>
        <a href="${loginLink}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Connectez-vous à votre compte
        </a>

        <p style="font-size: 0.9em; color: #6b7280;">
          Pour des raisons de sécurité, vous devrez changer votre mot de passe lors de votre première connexion.
        </p>
      </div>
    `,
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export const sendAccountWarningEmail = async ({ email, firstName, daysInactive, loginLink }) => {
  const mailOptions = {
    from: `"Real Estate CRM" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Votre compte est inactif',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Compte inactif</h2>
        <p>Bonjour ${firstName},</p>
        <p>Votre compte n'a pas été utilisé depuis <strong>${daysInactive} jours</strong>.</p>
        <p>Si vous ne vous connectez pas dans les prochains jours, votre compte sera suspendu.</p>
        <a href="${loginLink}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Me connecter
        </a>
      </div>
    `,
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending warning email:', error);
    throw error;
  }
};

export const sendAccountSuspendedEmail = async ({ email, firstName, loginLink }) => {
  const mailOptions = {
    from: `"Real Estate CRM" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Votre compte a été suspendu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Compte suspendu</h2>
        <p>Bonjour ${firstName},</p>
        <p>Votre compte a été suspendu en raison d'une inactivité prolongée.</p>
        <p>Veuillez contacter votre administrateur pour réactiver votre compte.</p>
        <a href="${loginLink}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Page de connexion
        </a>
      </div>
    `,
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending suspension email:', error);
    throw error;
  }
};

export const sendAccountDeletionWarningEmail = async ({ email, firstName, daysUntilDeletion, loginLink }) => {
  const mailOptions = {
    from: `"Real Estate CRM" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Votre compte sera bientôt supprimé',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Compte marqué pour suppression</h2>
        <p>Bonjour ${firstName},</p>
        <p>Votre compte n'a pas été utilisé depuis longtemps et sera définitivement supprimé dans <strong>${daysUntilDeletion} jours</strong>.</p>
        <p>Si vous souhaitez conserver votre compte, veuillez vous connecter avant la date de suppression.</p>
        <a href="${loginLink}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Me connecter
        </a>
        <p style="font-size: 0.9em; color: #6b7280;">
          Passé ce délai, toutes vos données personnelles seront supprimées et votre compte ne pourra pas être récupéré.
        </p>
      </div>
    `,
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending deletion warning email:', error);
    throw error;
  }
};

export const sendAccountSuspensionNotificationEmail = async ({ email, firstName, reason, loginLink }) => {
  const mailOptions = {
    from: `"Real Estate CRM" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Votre compte a été suspendu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Compte suspendu</h2>
        <p>Bonjour ${firstName},</p>
        <p>Votre compte a été suspendu${reason ? ` pour la raison suivante : <strong>${reason}</strong>` : ''}.</p>
        <p>Veuillez contacter votre administrateur pour plus d'informations ou pour réactiver votre compte.</p>
        <a href="${loginLink}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Page de connexion
        </a>
      </div>
    `,
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending suspension notification email:', error);
    throw error;
  }
};

export const sendAccountReactivatedEmail = async ({ email, firstName, loginLink, resetLink }) => {
  const mailOptions = {
    from: `"Real Estate CRM" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Votre compte a été réactivé',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Compte réactivé</h2>
        <p>Bonjour ${firstName},</p>
        <p>Votre compte a été réactivé par l'administrateur. Vous pouvez dès à présent vous connecter.</p>
        <a href="${loginLink}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Se connecter
        </a>
        ${resetLink ? `
        <p style="margin-top: 24px; font-size: 0.9em; color: #6b7280;">
          Si vous avez oublié votre mot de passe, vous pouvez le réinitialiser ici :
        </p>
        <a href="${resetLink}" style="display: inline-block; background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 8px 0;">
          Réinitialiser mon mot de passe
        </a>
        ` : ''}
      </div>
    `,
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending reactivation email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async ({ email, firstName, resetLink }) => {
  const mailOptions = {
    from: `"Real Estate CRM" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Réinitialisation de mot de passe</h2>
        <p>Bonjour ${firstName},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
        <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Réinitialiser mon mot de passe
        </a>
        <p style="font-size: 0.9em; color: #6b7280;">
          Ce lien expirera dans 1 heure.
        </p>
        <p style="font-size: 0.9em; color: #6b7280;">
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
      </div>
    `,
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

export const sendFinancementEmail = async ({ to, subject, message, clientName, agentName }) => {
  const mailOptions = {
    from: `"${agentName || 'Votre agent immobilier'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: subject || 'Simulation de financement',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e; font-size: 1.3em;">Simulation de financement</h2>
        <p style="color: #374151;">Bonjour ${clientName},</p>
        <div style="background: #f9fafb; border-left: 3px solid #6366f1; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin:0; color: #374151; white-space: pre-wrap;">${message}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 0.8em; color: #9ca3af;">Envoyé depuis CRM Immobilier</p>
      </div>
    `,
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending financement email:', error);
    throw error;
  }
};

export const sendDocumentEmail = async ({ to, subject, message, senderName, attachments }) => {
  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  const inlineImages = attachments.filter(a => IMAGE_TYPES.includes(a.contentType));
  const otherFiles = attachments.filter(a => !IMAGE_TYPES.includes(a.contentType));

  const inlineHtml = inlineImages.map((a, i) => {
    const cid = `img-${i}`;
    return `
      <div style="margin-bottom: 12px;">
        <p style="color: #6b7280; font-size: 0.85em; margin-bottom: 4px;">${a.filename}</p>
        <img src="cid:${cid}" alt="${a.filename}" style="max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb;" />
      </div>`;
  }).join('');

  const otherHtml = otherFiles.length > 0 ? `
    <div style="margin-top: 16px;">
      <p style="color: #6b7280; font-size: 0.9em; margin-bottom: 8px;">Pièces jointes :</p>
      <ul style="list-style: none; padding: 0;">
        ${otherFiles.map(a => `<li style="padding: 6px 0; border-bottom: 1px solid #e5e7eb; color: #374151;">📎 ${a.filename}</li>`).join('')}
      </ul>
    </div>` : '';

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: subject || 'Documents partagés',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e; font-size: 1.3em;">Documents partagés</h2>
        <p style="color: #374151;">
          ${senderName ? `<strong>${senderName}</strong> vous a envoyé ${attachments.length} document${attachments.length > 1 ? 's' : ''}.` : `${attachments.length} document${attachments.length > 1 ? 's' : ''} joint${attachments.length > 1 ? 's' : ''} à cet email.`}
        </p>
        ${message ? `<div style="background: #f9fafb; border-left: 3px solid #6366f1; padding: 12px 16px; margin: 16px 0; border-radius: 4px;"><p style="margin:0; color: #374151; white-space: pre-wrap;">${message}</p></div>` : ''}
        ${inlineHtml}
        ${otherHtml}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 0.8em; color: #9ca3af;">Envoyé depuis CRM Immobilier</p>
      </div>
    `,
    attachments: attachments.map((a, i) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
      ...(IMAGE_TYPES.includes(a.contentType) ? { cid: `img-${inlineImages.indexOf(a)}` } : {}),
    })),
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending document email:", error);
    throw error;
  }
};

export const sendPropertyProposalEmail = async ({ to, clientName, property, score, message, agentName, agentEmail, details }) => {
  const mailOptions = {
    from: `"${agentName || 'Votre agent immobilier'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: `Proposition de bien immobilier — ${property.title || property.reference || 'Référence ' + property.propertyId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 36px 32px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 1.4em; font-weight: 600;">Proposition de Bien</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 0.95em;">Un bien correspondant à vos critères a été sélectionné pour vous</p>
        </div>

        <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="margin: 0 0 16px; font-size: 1em;">Bonjour <strong>${clientName}</strong>,</p>
          <p style="margin: 0 0 24px; color: #475569; line-height: 1.6;">
            Nous avons sélectionné le bien suivant qui correspond à vos critères de recherche avec un score de compatibilité de <strong style="color: #6366f1;">${score}%</strong>.
          </p>

          <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 24px;">
            ${property.images && property.images[0] ? `<img src="${property.images[0]}" alt="${property.title}" style="width: 100%; height: 200px; object-fit: cover;" />` : ''}
            <div style="padding: 28px;">
              <h2 style="margin: 0 0 8px; font-size: 1.15em; color: #1a1a2e;">${property.title || 'Bien immobilier'}</h2>
              ${property.reference ? `<p style="margin: 0 0 14px; font-size: 0.85em; color: #94a3b8;">Réf: ${property.reference}</p>` : ''}

              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px;">
                <tr>
                  ${property.price ? `<td style="background: #f0fdf4; padding: 10px 16px; border-radius: 8px; border: 1px solid #bbf7d0; text-align: center; padding-right: 14px;"><span style="font-size: 0.75em; color: #16a34a; text-transform: uppercase; font-weight: 600;">Prix</span><br/><span style="font-size: 1.05em; font-weight: 700; color: #15803d;">${Number(property.price).toLocaleString()} MAD</span></td><td style="width: 12px;"></td>` : ''}
                  ${property.surface ? `<td style="background: #eff6ff; padding: 10px 16px; border-radius: 8px; border: 1px solid #bfdbfe; text-align: center;"><span style="font-size: 0.75em; color: #2563eb; text-transform: uppercase; font-weight: 600;">Surface</span><br/><span style="font-size: 1.05em; font-weight: 700; color: #1d4ed8;">${property.surface} m²</span></td><td style="width: 12px;"></td>` : ''}
                  ${property.rooms ? `<td style="background: #fefce8; padding: 10px 16px; border-radius: 8px; border: 1px solid #fde68a; text-align: center;"><span style="font-size: 0.75em; color: #ca8a04; text-transform: uppercase; font-weight: 600;">Pièces</span><br/><span style="font-size: 1.05em; font-weight: 700; color: #a16207;">${property.rooms}</span></td><td style="width: 12px;"></td>` : ''}
                  ${property.bedrooms ? `<td style="background: #fdf2f8; padding: 10px 16px; border-radius: 8px; border: 1px solid #fbcfe8; text-align: center;"><span style="font-size: 0.75em; color: #db2777; text-transform: uppercase; font-weight: 600;">Chambres</span><br/><span style="font-size: 1.05em; font-weight: 700; color: #be185d;">${property.bedrooms}</span></td>` : ''}
                </tr>
              </table>

              ${property.city ? `<p style="margin: 0 0 4px; color: #64748b; font-size: 0.9em;">📍 ${property.city}${property.district ? ', ' + property.district : ''}</p>` : ''}
              ${property.description ? `<p style="margin: 12px 0 0; color: #475569; font-size: 0.9em; line-height: 1.5;">${property.description.substring(0, 300)}${property.description.length > 300 ? '...' : ''}</p>` : ''}
            </div>
          </div>

          ${message ? `
          <div style="background: white; border-left: 3px solid #6366f1; padding: 18px 22px; border-radius: 0 8px 8px 0; margin-bottom: 24px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #374151; font-size: 0.9em; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>` : ''}

          ${details && typeof details === 'object' && Object.keys(details).length > 0 ? `
          <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 18px; font-size: 0.95em; color: #1a1a2e; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">📊 Analyse de compatibilité</h3>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${Object.entries(details).map(([key, val]) => {
                const pct = Math.round((val || 0) * 100);
                const label = { location:'Localisation', budget:'Budget', surface:'Surface', chambres:'Chambres', criteres:'Critères', prestations:'Prestations', proximites:'Proximités', attributs:'Attributs', vue:'Vue', exposition:'Exposition', etat:'État' }[key] || key;
                const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                const textColor = pct >= 80 ? '#15803d' : pct >= 50 ? '#a16207' : '#dc2626';
                return `
                <tr>
                  <td style="padding: 6px 12px 6px 0; font-size: 0.82em; color: #64748b; white-space: nowrap; vertical-align: middle;">${label}</td>
                  <td style="padding: 6px 0; width: 100%; vertical-align: middle;">
                    <div style="background: #f1f5f9; border-radius: 4px; height: 8px; overflow: hidden; width: 100%;">
                      <div style="width: ${pct}%; background: ${barColor}; height: 8px; border-radius: 4px;"></div>
                    </div>
                  </td>
                  <td style="padding: 6px 0 6px 12px; font-size: 0.82em; font-weight: 600; color: ${textColor}; white-space: nowrap; vertical-align: middle; text-align: right;">${pct}%</td>
                </tr>`;
              }).join('')}
            </table>
          </div>` : ''}

          <div style="text-align: center; margin-top: 28px; padding: 20px 0;">
            <a href="mailto:${agentEmail || process.env.EMAIL_FROM || process.env.EMAIL_USER || ''}?subject=${encodeURIComponent('Réponse : Proposition de bien - ' + (property.title || property.reference || ''))}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.95em;">
              Contacter votre agent
            </a>
          </div>
        </div>

        <div style="padding: 18px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 0.78em; color: #94a3b8; margin: 0;">Envoyé depuis CRM Immobilier${agentName ? ' par ' + agentName : ''}</p>
        </div>
      </div>
    `,
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending property proposal email:', error);
    throw error;
  }
};

export const sendOwnerBuyerNotificationEmail = async ({ to, ownerName, property, buyerName, buyerEmail, buyerPhone, score, message, agentName, agentEmail, details, clientType }) => {
  const isLocataire = clientType === 'Locataire';
  const headerTitle = isLocataire ? 'Locataire Potentiel' : 'Acheteur Potentiel';
  const headerSubtitle = isLocataire ? 'Un locataire correspondant à votre bien a été identifié' : 'Un acheteur correspondant à votre bien a été identifié';
  const ownerGreeting = isLocataire ? 'Nous avons identifié un locataire potentiel pour votre bien' : 'Nous avons identifié un acheteur potentiel pour votre bien';
  const clientSectionTitle = isLocataire ? '👤 Locataire potentiel' : '👤 Acquéreur potentiel';
  const contactBtnLabel = isLocataire ? "Contacter le locataire" : "Contacter l'acheteur";
  const priceLabel = isLocataire ? 'Loyer' : 'Prix';
  const priceSuffix = isLocataire ? '/mois' : '';

  const pct = (v) => Math.round((v || 0) * 100);
  const detailRows = details ? Object.entries(details).map(([key, val]) => {
    const p = pct(val);
    const label = { location:'Localisation', budget:'Budget', surface:'Surface', chambres:'Chambres', criteres:'Critères', prestations:'Prestations', proximites:'Proximités', attributs:'Attributs', vue:'Vue', exposition:'Exposition', etat:'État' }[key] || key;
    const barColor = p >= 80 ? '#22c55e' : p >= 50 ? '#f59e0b' : '#ef4444';
    const textColor = p >= 80 ? '#15803d' : p >= 50 ? '#a16207' : '#dc2626';
    return `
      <tr>
        <td style="padding: 6px 12px 6px 0; font-size: 0.82em; color: #64748b; white-space: nowrap; vertical-align: middle;">${label}</td>
        <td style="padding: 6px 0; width: 100%; vertical-align: middle;">
          <div style="background: #f1f5f9; border-radius: 4px; height: 8px; overflow: hidden; width: 100%;">
            <div style="width: ${p}%; background: ${barColor}; height: 8px; border-radius: 4px;"></div>
          </div>
        </td>
        <td style="padding: 6px 0 6px 12px; font-size: 0.82em; font-weight: 600; color: ${textColor}; white-space: nowrap; vertical-align: middle; text-align: right;">${p}%</td>
      </tr>`;
  }).join('') : '';

  const mailOptions = {
    from: `"${agentName || 'Votre agent immobilier'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: `${headerTitle} pour votre bien — ${property.title || property.reference || ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: linear-gradient(135deg, ${isLocataire ? '#6366f1 0%, #4f46e5' : '#22c55e 0%, #16a34a'} 100%); padding: 36px 32px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 1.4em; font-weight: 600;">${headerTitle}</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 0.95em;">${headerSubtitle}</p>
        </div>

        <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="margin: 0 0 16px; font-size: 1em;">Bonjour <strong>${ownerName}</strong>,</p>
          <p style="margin: 0 0 24px; color: #475569; line-height: 1.6;">
            ${ownerGreeting} avec un score de compatibilité de <strong style="color: ${isLocataire ? '#6366f1' : '#22c55e'};">${score}%</strong>.
          </p>

          <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px; font-size: 0.95em; color: #1a1a2e; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">${clientSectionTitle}</h3>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding: 6px 0; font-size: 0.85em; color: #64748b; width: 120px;">Nom</td>
                <td style="padding: 6px 0; font-size: 0.85em; font-weight: 600; color: #1a1a2e;">${buyerName}</td>
              </tr>
              ${buyerEmail ? `<tr><td style="padding: 6px 0; font-size: 0.85em; color: #64748b;">Email</td><td style="padding: 6px 0; font-size: 0.85em;"><a href="mailto:${buyerEmail}" style="color: #6366f1;">${buyerEmail}</a></td></tr>` : ''}
              ${buyerPhone ? `<tr><td style="padding: 6px 0; font-size: 0.85em; color: #64748b;">Téléphone</td><td style="padding: 6px 0; font-size: 0.85em;"><a href="tel:${buyerPhone}" style="color: #6366f1;">${buyerPhone}</a></td></tr>` : ''}
              <tr>
                <td style="padding: 6px 0; font-size: 0.85em; color: #64748b;">Score</td>
                <td style="padding: 6px 0; font-size: 0.85em; font-weight: 700; color: #22c55e;">${score}%</td>
              </tr>
            </table>
          </div>

          <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 24px;">
            ${property.images && property.images[0] ? `<img src="${property.images[0]}" alt="${property.title}" style="width: 100%; height: 200px; object-fit: cover;" />` : ''}
            <div style="padding: 28px;">
              <h3 style="margin: 0 0 8px; font-size: 0.95em; color: #1a1a2e;">🏠 Votre bien</h3>
              <h2 style="margin: 0 0 8px; font-size: 1.1em; color: #1a1a2e;">${property.title || 'Bien immobilier'}</h2>
              ${property.reference ? `<p style="margin: 0 0 12px; font-size: 0.82em; color: #94a3b8;">Réf: ${property.reference}</p>` : ''}
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px;">
                <tr>
                  ${property.price ? `<td style="background: #f0fdf4; padding: 10px 16px; border-radius: 8px; border: 1px solid #bbf7d0; text-align: center;"><span style="font-size: 0.75em; color: #16a34a; text-transform: uppercase; font-weight: 600;">${priceLabel}</span><br/><span style="font-size: 1.05em; font-weight: 700; color: #15803d;">${Number(property.price).toLocaleString()} MAD${priceSuffix}</span></td><td style="width: 12px;"></td>` : ''}
                  ${property.surface ? `<td style="background: #eff6ff; padding: 10px 16px; border-radius: 8px; border: 1px solid #bfdbfe; text-align: center;"><span style="font-size: 0.75em; color: #2563eb; text-transform: uppercase; font-weight: 600;">Surface</span><br/><span style="font-size: 1.05em; font-weight: 700; color: #1d4ed8;">${property.surface} m²</span></td><td style="width: 12px;"></td>` : ''}
                  ${property.rooms ? `<td style="background: #fefce8; padding: 10px 16px; border-radius: 8px; border: 1px solid #fde68a; text-align: center;"><span style="font-size: 0.75em; color: #ca8a04; text-transform: uppercase; font-weight: 600;">Pièces</span><br/><span style="font-size: 1.05em; font-weight: 700; color: #a16207;">${property.rooms}</span></td>` : ''}
                </tr>
              </table>
              ${property.city ? `<p style="margin: 0; color: #64748b; font-size: 0.9em;">📍 ${property.city}${property.district ? ', ' + property.district : ''}</p>` : ''}
            </div>
          </div>

          ${detailRows ? `
          <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 18px; font-size: 0.95em; color: #1a1a2e; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">📊 Analyse de compatibilité</h3>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${detailRows}
            </table>
          </div>` : ''}

          ${message ? `
          <div style="background: white; border-left: 3px solid ${isLocataire ? '#6366f1' : '#22c55e'}; padding: 18px 22px; border-radius: 0 8px 8px 0; margin-bottom: 24px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #374151; font-size: 0.9em; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>` : ''}

          <div style="text-align: center; margin-top: 28px; padding: 20px 0;">
            <a href="mailto:${buyerEmail || ''}?subject=${encodeURIComponent('Re: Intérêt pour votre bien - ' + (property.title || property.reference || ''))}" style="display: inline-block; background: ${isLocataire ? '#6366f1' : '#22c55e'}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.95em;">
              ${contactBtnLabel}
            </a>
          </div>
        </div>

        <div style="padding: 18px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 0.78em; color: #94a3b8; margin: 0;">Envoyé depuis CRM Immobilier${agentName ? ' par ' + agentName : ''}</p>
        </div>
      </div>
    `,
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending owner buyer notification email:', error);
    throw error;
  }
};

export const sendContractEmail = async ({ to, ownerName, subject, message, contract, senderName }) => {
  const money = (n) =>
    n == null || Number.isNaN(n)
      ? '—'
      : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: contract?.devise || 'MAD', maximumFractionDigits: 0 }).format(n);
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

  const rows = [
    ['Référence', contract?.reference || ''],
    ['Bien', contract?.propertyTitle || ''],
    ['Réf. bien', contract?.propertyRef || ''],
    ['Adresse', contract?.propertyAddress || ''],
    ['Voyageur', contract?.partieA?.name || contract?.clientName || ''],
    ['Arrivée', fmtDate(contract?.dateArrivee || contract?.startDate)],
    ['Départ', fmtDate(contract?.dateDepart || contract?.endDate)],
    ['Total du séjour', money(contract?.prixTotalSejour || contract?.amount)],
    ['Acompte versé', money(contract?.acompteVerse)],
    ['Solde restant', money(contract?.soldeRestant)],
    ['Caution', money(contract?.caution)],
  ].filter(([, v]) => v !== '' && v !== '—');

  const tableRows = rows
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;font-size:0.85em;color:#6b7280;width:180px;">${k}</td>
        <td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;font-size:0.88em;font-weight:600;color:#1a1a2e;">${v}</td>
      </tr>`
    )
    .join('');

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: subject || `Contrat ${contract?.reference || ''} — ${contract?.propertyTitle || ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: linear-gradient(135deg, #32612D 0%, #2c8264 100%); padding: 28px 32px; border-radius: 14px 14px 0 0;">
          <div>
            <h1 style="color: white; margin: 0; font-size: 1.25em; font-weight: 700;">Contrat de location saisonnière</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 0.9em;">${contract?.reference || ''}</p>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
          ${ownerName ? `<p style="margin: 0 0 16px; font-size: 1em;">Bonjour <strong>${ownerName}</strong>,</p>` : ''}
          <p style="margin: 0 0 24px; color: #475569; line-height: 1.6;">
            Un contrat de location saisonnière vous concernant a été établi par <strong>CRM Immobilier</strong>.
          </p>

          <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">${tableRows}</table>
          </div>

          ${message ? `
          <div style="background: white; border-left: 3px solid #2c8264; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #374151; font-size: 0.9em; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>` : ''}

          <p style="margin: 0; color: #475569; font-size: 0.9em; line-height: 1.6;">
            Le contrat est consultable depuis votre espace client ou en contactant votre agent ${senderName ? `<strong>${senderName}</strong>` : ''}.
          </p>
        </div>

        <div style="padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0; background: #fff;">
          <p style="font-size: 0.78em; color: #94a3b8; margin: 0;">Envoyé depuis CRM Immobilier${senderName ? ' par ' + senderName : ''} — Tous droits réservés</p>
        </div>
      </div>
    `,
  };

  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending contract email:', error);
    throw error;
  }
};

export const sendRawEmail = async ({ to, subject, html, attachments }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    ...(attachments && attachments.length > 0 ? { attachments } : {}),
  };
  try {
    await sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending raw email:', error);
    throw error;
  }
};
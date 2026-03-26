import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

const resend = new Resend(RESEND_API_KEY);

export async function POST({ request }) {
  const { name, email, checkin, checkout, suite, message } = await request.json();

  try {
    await resend.emails.send({
      from: 'La Belle Résidence <reservations@labelleresidence.com>',
      to: 'twb@diogenesgroup.ltd',
      replyTo: email,
      subject: `New Enquiry — ${suite || 'General'} — ${name}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#1c1917; font-family: Georgia, serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1c1917; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:#1c1917; padding: 40px 0 24px; text-align:center; border-bottom: 1px solid #44403c;">
              <p style="margin:0; color:#d97706; font-size:10px; letter-spacing:0.4em; text-transform:uppercase; font-family: Arial, sans-serif;">La Belle Résidence</p>
              <p style="margin:6px 0 0; color:#78716c; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; font-family: Arial, sans-serif;">Phnom Penh · Cambodia</p>
            </td>
          </tr>

          <!-- TITLE -->
          <tr>
            <td style="background:#1c1917; padding: 32px 40px 24px; text-align:center;">
              <p style="margin:0; color:#78716c; font-size:10px; letter-spacing:0.3em; text-transform:uppercase; font-family: Arial, sans-serif;">New Enquiry</p>
              <h1 style="margin:12px 0 0; color:#fafaf9; font-size:28px; font-weight:400; font-style:italic;">
                ${name}
              </h1>
            </td>
          </tr>

          <!-- BOOKING DETAILS -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#292524; border-radius:12px; overflow:hidden;">

                ${suite ? `
                <tr>
                  <td style="padding:20px 24px; border-bottom:1px solid #44403c;">
                    <p style="margin:0 0 4px; color:#78716c; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; font-family:Arial,sans-serif;">Suite</p>
                    <p style="margin:0; color:#fafaf9; font-size:15px;">${suite}</p>
                  </td>
                </tr>` : ''}

                ${checkin ? `
                <tr>
                  <td style="padding:20px 24px; border-bottom:1px solid #44403c;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%">
                          <p style="margin:0 0 4px; color:#78716c; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; font-family:Arial,sans-serif;">Check In</p>
                          <p style="margin:0; color:#fafaf9; font-size:15px;">${checkin}</p>
                        </td>
                        <td width="50%">
                          <p style="margin:0 0 4px; color:#78716c; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; font-family:Arial,sans-serif;">Check Out</p>
                          <p style="margin:0; color:#fafaf9; font-size:15px;">${checkout || '—'}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>` : ''}

                <tr>
                  <td style="padding:20px 24px; border-bottom:1px solid #44403c;">
                    <p style="margin:0 0 4px; color:#78716c; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; font-family:Arial,sans-serif;">Email</p>
                    <p style="margin:0; color:#d97706; font-size:15px;">${email}</p>
                  </td>
                </tr>

                ${message ? `
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px; color:#78716c; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; font-family:Arial,sans-serif;">Message</p>
                    <p style="margin:0; color:#d4d4d4; font-size:14px; line-height:1.7;">${message}</p>
                  </td>
                </tr>` : ''}

              </table>
            </td>
          </tr>

          <!-- REPLY BUTTON -->
          <tr>
            <td style="padding: 0 40px 40px; text-align:center;">
              <a href="mailto:${email}" style="display:inline-block; background:#d97706; color:#1c1917; text-decoration:none; padding:14px 36px; border-radius:100px; font-size:12px; letter-spacing:0.15em; text-transform:uppercase; font-family:Arial,sans-serif; font-weight:600;">
                Reply to ${name.split(' ')[0]}
              </a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 40px; border-top:1px solid #44403c; text-align:center;">
              <p style="margin:0; color:#57534e; font-size:11px; font-family:Arial,sans-serif; line-height:1.8;">
                #1491 Street 81BT, Sangkat Boeng Tumpun, Khan Mean Chey<br/>
                Phnom Penh, Kingdom of Cambodia<br/>
                <a href="tel:+85531636123" style="color:#78716c; text-decoration:none;">+855 (0)31 636 1237</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
      `
    });

    return json({ success: true });
  } catch (error) {
    return json({ success: false }, { status: 500 });
  }
}

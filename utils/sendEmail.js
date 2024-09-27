
const nodemailer = require('nodemailer');


 const sendEmail = async (subject, message, send_to, sent_from, reply_to,pdfPath) => {

    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: 465,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

    // Send the email
    const options = {
          from: sent_from,
          to: send_to,
          replyTo: reply_to,
          subject: subject,
          html: message,
          attachments: [
            {
                filename: `receipt-${send_to}.pdf`,
                path: pdfPath,
            },
          ],

        };
       // Send Email
  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
}

module.exports =sendEmail;

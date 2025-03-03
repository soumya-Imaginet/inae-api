
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "imaginetventurestest123@gmail.com",
    pass: "brygofmanqvommjh",
  },
});

const sendEmail = async (to, subject, templateName, data, attachment) => {
  try {
    
    const html = await ejs.renderFile(
      path.resolve(`views/email/template/${templateName}.ejs`),
      data
    );

    const mailOptions = {
      from: '"INAE Individual Membership Module" <imaginetventurestest123@gmail.com> ',
      to,
      subject,
      html,
    };

    
    if (attachment) {
      mailOptions.attachments = [
        {
          filename: attachment.originalname,
          path: attachment.path,
        },
      ];
    }

    
    try {
      const sendMail = await transporter.sendMail(mailOptions);
      if (sendMail) console.log("mail sent...",to);
    } catch (error) {
      console.log(error.message);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendEmail;

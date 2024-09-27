require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const crypto = require("crypto");

require('./db/conn');
const Razorpay = require("razorpay");
const authRoutes = require('./routes/authRoutes');
const User = require("./model/userModel");
const EventRegistration = require("./model/registrationSchema");
const sendEmail = require("./utils/sendEmail");
const Payment = require("./model/paymentModel");
const BasicRegistration = require("./model/basicRegistration");
const MembershipCard = require("./model/membershipCard");
const fs = require('fs');
const PDFDocument = require('pdfkit');

const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';


app.use(cors({
  origin: `${BASE_URL}`,
  methods: "GET,POST,PUT,DELETE",

}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/auth/', authRoutes);



function generateBasicPDF(userData) {
  const doc = new PDFDocument();
  const filePath = `./receipt-${userData.email}.pdf`;

  doc.pipe(fs.createWriteStream(filePath));

  // Header styling
  doc.fontSize(25)
    .font('Helvetica-Bold') // Bold font
    .fillColor('#003366') // Blue color
    .text('Payment Receipt', {
      align: 'center',
      underline: true
    });

  doc.moveDown(2); // Adds vertical spacing

  // User Data section with styling
  doc.fontSize(12)
    .font('Helvetica') // Regular font
    .fillColor('#000') // Reset to black text color
    .text(`Name: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.name}`); // Bold for user data

  doc.font('Helvetica')
    .text(`Email: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.email}`);

  doc.font('Helvetica')
    .text(`Phone: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.mobile}`);

  doc.font('Helvetica')
    .text(`Tickets Purchased: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.tickets}`);

  doc.font('Helvetica')
    .text(`Amount Paid: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.amount}`);

  doc.font('Helvetica')
    .text(`Payment_Id: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.payment_Id}`);

  // Footer section
  doc.moveDown(2);
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#555') // Lighter color for footer
    .text('Thank you for your purchase!', {
      align: 'center'
    });

  doc.end();

  return filePath;
}

function generateMembershipPDF(userData) {
  const doc = new PDFDocument();
  const filePath = `./receipt-${userData.email}.pdf`;

  doc.pipe(fs.createWriteStream(filePath));

  // Header styling
  doc.fontSize(25)
    .font('Helvetica-Bold') // Bold font
    .fillColor('#003366') // Blue color
    .text('Payment Receipt', {
      align: 'center',
      underline: true
    });

  doc.moveDown(2); // Adds vertical spacing

  // User Data section with styling
  doc.fontSize(12)
    .font('Helvetica') // Regular font
    .fillColor('#000') // Reset to black text color
    .text(`Name: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.name}`); // Bold for user data

  doc.font('Helvetica')
    .text(`Email: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.email}`);

  doc.font('Helvetica')
    .text(`Phone: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.mobile}`);


  doc.font('Helvetica')
    .text(`Amount Paid: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.amount}`);

  doc.font('Helvetica')
    .text(`Payment_Id: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.payment_Id}`);

  // Footer section
  doc.moveDown(2);
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#555') // Lighter color for footer
    .text('Thank you for your purchase!', {
      align: 'center'
    });

  doc.end();

  return filePath;
}

function generateEventPDF(userData) {
  const doc = new PDFDocument();
  const filePath = `./receipt-${userData.teamLeaderEmail}.pdf`;

  doc.pipe(fs.createWriteStream(filePath));

  // Header styling
  doc.fontSize(25)
    .font('Helvetica-Bold') // Bold font
    .fillColor('#003366') // Blue color
    .text('Payment Receipt', {
      align: 'center',
      underline: true
    });

  doc.moveDown(2); // Adds vertical spacing

  // User Data section with styling
  doc.fontSize(12)
    .font('Helvetica') // Regular font
    .fillColor('#000') // Reset to black text color
    .text(`Name: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.teamLeaderName}`); // Bold for user data

  doc.font('Helvetica')
    .text(`Email: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.teamLeaderEmail}`);

  doc.font('Helvetica')
    .text(`Phone: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.teamLeaderMobileNo}`);


  doc.font('Helvetica')
    .text(`Amount Paid: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.amount}`);

  doc.font('Helvetica')
    .text(`Payment_Id: `, { continued: true })
    .font('Helvetica-Bold')
    .text(`${userData.payment_Id}`);

  // Footer section
  doc.moveDown(2);
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#555') // Lighter color for footer
    .text('Thank you for your purchase!', {
      align: 'center'
    });

  doc.end();

  return filePath;
}


//Payment Route
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

const checkout = async (req, res) => {
  try {
    const options = {
      amount: Number(req.body.amount * 100), // Convert amount to paisa (smallest unit for INR)
      currency: "INR",
      receipt: "receipt_order_12345",
    };
    const order = await instance.orders.create(options); // Creating Razorpay order
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({
      success: false,
      message: "Something went wrong during checkout",
    });
  }
};

const paymentVerification = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Database operation
      await Payment.create({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      res.redirect(`${BASE_URL}/paymentsuccess?reference=${razorpay_payment_id}`);
    } else {
      res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error('Error during payment verification:', error);
    res.status(500).json({
      success: false,
      message: "An error occurred during payment verification",
    });
  }
};

const basicpaymentVerification = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, name, email, mobile, tickets, amount } = req.body;


    var {
      validatePaymentVerification,
      validateWebhookSignature,
    } = require("./node_modules/razorpay/dist/utils/razorpay-utils");

    if (
      validatePaymentVerification(
        { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
        razorpay_signature,
        process.env.RAZORPAY_API_SECRET
      )) {
      try {
        // Save registration with payment details
        const registrationData = {
          name,
          email,
          mobile,
          tickets,
          amount,
          payment_Id: razorpay_payment_id,
          order_Id: razorpay_order_id,
          signature: razorpay_signature,
        };

        const newRegistration = new BasicRegistration(registrationData);
        await newRegistration.save();

        const send_to = email;
        const sent_from = process.env.EMAIL_USER;
        const reply_to = email;
        const subject = " PYREXIA 2024 Basic Registration Confirmation";
        const message = `
        <p> Dear ${name},</p>
        
          <p> We are excited to confirm your basic registration for PYREXIA 2024, which will take place from October 10th to October 14th, 2024, at AIIMS Rishikesh. Thank you for being a part of this vibrant event!</p>
        
        <p> PYREXIA promises to be an exciting celebration of culture, talent, and academic excellence, and we’re thrilled to have you join us. In the coming days, you will receive more details regarding the event schedule, activities, and participation guidelines.</p>
        
       <p> Please find the e-bill attached for your reference. Should you have any questions or need further assistance, don’t hesitate to reach out.</p>
        
       <p> Once again, thank you for your registration. We look forward to welcoming you at PYREXIA 2024!</p>
        
       <p> Best regards,</p>
       <p> Team PYREXIA </p>
        `;


        const pdfPath = generateBasicPDF(registrationData);

        try {
          await sendEmail(subject, message, send_to, sent_from, reply_to, pdfPath);
          if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
          }
          return res.status(200).json({
            success: true,
            message: "Payment verified and registration saved. A confirmation email has been sent.",
          });
        } catch (error) {
          console.error("Error sending confirmation email:", error);
          return res.status(500).json({
            success: true, // Payment was still successful, but email failed
            message: "Payment verified but failed to send confirmation email. Please contact support.",
          });
        }
      } catch (error) {
        console.error("Error saving registration data:", error);
        return res.status(500).json({
          success: false,
          message: "Error saving registration data",
          error,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Error during payment verification:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during payment verification",
    });
  }
};

const membershipCardPaymentVerification = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, name, email, mobile } = req.body;

    var {
      validatePaymentVerification,
      validateWebhookSignature,
    } = require("./node_modules/razorpay/dist/utils/razorpay-utils");

    if (
      validatePaymentVerification(
        { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
        razorpay_signature,
        process.env.RAZORPAY_API_SECRET
      )) {
      try {
        // Save registration with payment details
        const registrationData = {
          name,
          email,
          mobile,
          amount,
          payment_Id: razorpay_payment_id,
          order_Id: razorpay_order_id,
          signature: razorpay_signature,
        };

        const newRegistration = new MembershipCard(registrationData);
        await newRegistration.save();

        const send_to = email;
        const sent_from = process.env.EMAIL_USER;
        const reply_to = email;
        const subject = " PYREXIA 2024 Membership Card Confirmation";
        const message = `
        <p>Dear ${name},</p>
        
         <p>We are excited to confirm your registration for  Membership Card of PYREXIA 2024, which will take place from October 10th to October 14th, 2024, at AIIMS Rishikesh. Thank you for being a part of this vibrant event!</p>
        
         <p>PYREXIA promises to be an exciting celebration of culture, talent, and academic excellence, and we’re thrilled to have you join us. In the coming days, you will receive more details regarding the event schedule, activities, and participation guidelines.</p>
        
         <p>Please find the e-bill attached for your reference. Should you have any questions or need further assistance, don’t hesitate to reach out.</p>
        
         <p>Once again, thank you for your registration. We look forward to welcoming you at PYREXIA 2024!</p>
        
         <p>Best regards,</p>
         <p>Team PYREXIA</p>
        `;


        const pdfPath = generateMembershipPDF(registrationData);


        try {
          await sendEmail(subject, message, send_to, sent_from, reply_to, pdfPath);
          fs.unlinkSync(pdfPath);
          return res.status(200).json({
            success: true,
            message: "Payment verified and registration saved. A confirmation email has been sent.",
          });

        } catch (error) {
          console.error("Error sending confirmation email:", error);
          return res.status(500).json({
            success: true, // Payment was still successful, but email failed
            message: "Payment verified but failed to send confirmation email. Please contact support.",
          });
        }
      } catch (error) {
        console.error("Error saving registration data:", error);
        return res.status(500).json({
          success: false,
          message: "Error saving registration data",
          error,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Error during payment verification:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during payment verification",
    });
  }
};

const eventpaymentVerification = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, eventName, amount } = req.body;

    var {
      validatePaymentVerification,
      validateWebhookSignature,
    } = require("./node_modules/razorpay/dist/utils/razorpay-utils");

    if (
      validatePaymentVerification(
        { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
        razorpay_signature,
        process.env.RAZORPAY_API_SECRET
      )) {
      try {
        const registration = await EventRegistration.findOne({ teamLeaderEmail: email, eventName });


        if (!registration) {
          return res.status(404).json({ error: 'Registration not found' });
        }

        registration.Paid = true;
        registration.amount = amount;
        registration.payment_Id = razorpay_payment_id;
        registration.order_Id = razorpay_order_id;
        registration.signature = razorpay_signature;

        await registration.save();
        console.log(registration);


        const send_to = email;
        const sent_from = process.env.EMAIL_USER;
        const reply_to = email;
        const subject = `PYREXIA 2024 ${eventName} Confirmation`;
        const message = `
        <p>Dear ${registration.teamLeaderName},</p>
        
        <p>We are excited to confirm your registration for event  ${eventName} of PYREXIA 2024, which will take place from October 10th to October 14th, 2024, at AIIMS Rishikesh. Thank you for being a part of this vibrant event!</p>
        
        <p>PYREXIA promises to be an exciting celebration of culture, talent, and academic excellence, and we’re thrilled to have you join us. In the coming days, you will receive more details regarding the event schedule, activities, and participation guidelines.</p>
        
        <p>Please find the e-bill attached for your reference. Should you have any questions or need further assistance, don’t hesitate to reach out.</p>
        
        <p>Once again, thank you for your registration. We look forward to welcoming you at PYREXIA 2024!</p>
        
       <p> Best regards,</p>
       <p> Team PYREXIA</p>
        `;


        const pdfPath = generateEventPDF(registration);


        try {
          await sendEmail(subject, message, send_to, sent_from, reply_to, pdfPath);
          fs.unlinkSync(pdfPath);
          return res.status(200).json({
            success: true,
            message: "Payment verified and registration saved. A confirmation email has been sent.",
          });
        } catch (error) {
          console.error("Error sending confirmation email:", error);
          return res.status(500).json({
            success: true, // Payment was still successful, but email failed
            message: "Payment verified but failed to send confirmation email. Please contact support.",
          });
        }
      } catch (error) {
        console.error("Error saving registration data:", error);
        return res.status(500).json({
          success: false,
          message: "Error saving registration data",
          error,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Error during payment verification:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during payment verification",
    });
  }
};


const router = express.Router();

// Define routes
router.route('/checkout').post(checkout);
router.route('/paymentverification').post(paymentVerification);
router.route('/basicpaymentverification').post(basicpaymentVerification);
router.route('/membershipCardPaymentVerification').post(membershipCardPaymentVerification);
router.route('/eventpaymentverification').post(eventpaymentVerification);

app.use('/api', router);

// Endpoint to get Razorpay API key
app.get('/api/getkey', (req, res) =>
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY })
);

//Payment Route Ends

// app.all('*', (req, res, next) => {
//     next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
// });


app.post('/user/registrations', async (req, res) => {
  const email = req.body.email;


  try {
    const registrations = await BasicRegistration.find({ email });
    if (!registrations) {
      return res.status(404).json({ message: 'No registrations found' });
    }

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registrations', error });
  }
});


app.post('/user/member-card', async (req, res) => {
  const email = req.body.email;


  try {
    const registrations = await MembershipCard.find({ email });
    if (!registrations) {
      return res.status(404).json({ message: 'No registrations found' });
    }


    res.json(registrations[0].payment_Id);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registrations', error });
  }
});


app.post('/registerevent', async (req, res) => {
  const { eventName, teamLeaderName, teamLeaderMobileNo, teamLeaderEmail, teamLeaderCollege, teamSize, teamLeaderGender, fees } = req.body;

  if (!eventName || !teamLeaderName || !teamLeaderMobileNo || !teamLeaderEmail || !teamLeaderCollege || !fees || teamSize === undefined) {
    return res.status(400).json({ error: 'All required fields must be provided.' });
  }

  try {
    const existingRegistration = await EventRegistration.findOne({ teamLeaderEmail, eventName });

    if (existingRegistration) {
      return res.status(400).json({ error: 'A registration with this email already exists for this event.' });
    }
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }

  try {
    const registration = new EventRegistration({
      eventName,
      teamLeaderName,
      teamLeaderMobileNo,
      teamLeaderEmail,
      teamLeaderCollege,
      teamSize,
      teamLeaderGender,
      fees
    });
    await registration.save();
    res.status(200).json({ success: true, message: 'Successfully added to Cart! Pay to complete registration process' });
  } catch (error) {
    console.error('Database save error:', error);
    res.status(500).json({ error: 'Error in adding event to cart. Please try again later.' });
  }
});


app.post('/cart/remove', async (req, res) => {
  const { eventName, userEmail } = req.body; // Ensure you use the correct field names

  try {
    // Delete documents matching the criteria
    const result = await EventRegistration.deleteMany({ teamLeaderEmail: userEmail, eventName: eventName });

    // Check if any documents were deleted
    if (result.deletedCount > 0) {
      res.json({ success: true, message: 'Item(s) removed successfully' });
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (error) {
    console.error('Failed to remove item:', error);
    res.status(500).json({ message: 'Failed to remove item' });
  }
});



app.post('/user/events', async (req, res) => {
  const { email: userEmail } = req.body; // Use destructuring to get the email from the request body

  try {
    const cartItems = await EventRegistration.find({ teamLeaderEmail: userEmail, Paid: true });

    if (cartItems.length === 0) {
      return res.status(404).json({ message: "No paid registrations found for this user." });
    }


    res.status(200).json(cartItems);
  } catch (error) {
    console.error("Error fetching registration details:", error);
    res.status(500).json({ error: "Error fetching registration details", details: error.message });
  }
});



app.post('/cart', async (req, res) => {
  const userEmail = req.query.email;

  try {
    const cartItems = await EventRegistration.find({ teamLeaderEmail: userEmail, Paid: false });
    res.status(200).json(cartItems);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cart items", details: error });
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`)
})

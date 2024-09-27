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


const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';


app.use(cors({
  origin: `${BASE_URL}`,
  methods: "GET,POST,PUT,DELETE",
  
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/auth/', authRoutes);

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, name, email, mobile, tickets } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      try {
        // Save registration with payment details
        const registrationData = {
          name,
          email,
          mobile,
          tickets,
          payment_Id: razorpay_payment_id,
          order_Id: razorpay_order_id,
          signature: razorpay_signature,
        };

        const newRegistration = new BasicRegistration(registrationData);
        await newRegistration.save();

        const send_to = email;
        const sent_from = process.env.EMAIL_USER;
        const reply_to = email;
        const subject = "Basic Registration Ticket Confirmation";
        const message = `
            Thank you for registering. Your payment is successful. You have purchased ${tickets} tickets. Your Payment Id is ${razorpay_payment_id}.
          `;

        try {
          await sendEmail(subject, message, send_to, sent_from, reply_to);
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, name, email, mobile } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      try {
        // Save registration with payment details
        const registrationData = {
          name,
          email,
          mobile,
          payment_Id: razorpay_payment_id,
          order_Id: razorpay_order_id,
          signature: razorpay_signature,
        };

        const newRegistration = new MembershipCard(registrationData);
        await newRegistration.save();

        const send_to = email;
        const sent_from = process.env.EMAIL_USER;
        const reply_to = email;
        const subject = "Membership Card Ticket Confirmation";
        const message = `
            Thank you for registering. Your payment is successful.Your Payment Id is ${razorpay_payment_id}.
          `;

        try {
          await sendEmail(subject, message, send_to, sent_from, reply_to);
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, eventName } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      try {
        const registration = await EventRegistration.findOne({teamLeaderEmail:email, eventName});
       

        if (!registration) {
          return res.status(404).json({ error: 'Registration not found' });
        }

        registration.Paid = true;
        registration.payment_Id = razorpay_payment_id;
        registration.order_Id = razorpay_order_id;
        registration.signature = razorpay_signature;

        await registration.save();


        const send_to = email;
        const sent_from = process.env.EMAIL_USER;
        const reply_to = email;
        const subject = `${eventName} Registraion Confirmation`;
        const message = `
            Thank you for registering for ${eventName}. Your payment is successful.Your Payment Id is ${razorpay_payment_id}.
          `;

        try {
          await sendEmail(subject, message, send_to, sent_from, reply_to);
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

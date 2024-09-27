const mongoose = require("mongoose");

const basicregistrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String,  },
    amount: { type: String, required: true },
    tickets: { type: Number, required: true },
    order_Id: { type: String, required: true },
    payment_Id: {
        type: String,
        required: true,
    },
    signature: {
        type: String,
        required: true,
    },

});

const BasicRegistration = mongoose.model('BasicRegistration', basicregistrationSchema);
module.exports = BasicRegistration;


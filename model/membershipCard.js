const mongoose = require("mongoose");

const membershipCardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String,  },
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

const MembershipCard = mongoose.model('MembershipCard', membershipCardSchema);
module.exports = MembershipCard;


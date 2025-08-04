const xendit = require('xendit-node');
const x = new xendit({
    'secretKey': process.env.XENDIT_SECRET_KEY,
});

const { Invoice } = x;
exports.createInvoice = async (data) => {
    const i = new Invoice();

    return await i.createInvoice({
        externalID: data.invoiceID,
        payerEmail: data.email,
        description: "Payment #" + data.invoiceID,
        amount: data.amount,
        invoiceDuration: 172800
    });
}

exports.getInvoice = async (model) => {
    const i = new Invoice();

    return await i.getInvoice({
        invoiceID: model.gateway_reference_id
    })
}

exports.XENDIT_PAID = 'PAID';
exports.XENDIT_EXPIRED = 'EXPIRED';

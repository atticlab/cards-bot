var Conf    = require('../config'),
    Helpers = require('./Helpers'),
    Sender  = require('./Sender');

var Handler = (transaction, riak) => {
    var order_id = getMerchantOrderIDFromMemo(transaction.memo);
    if (!order_id) {
        return false;
    }
    var riak_order_obj = false;
    var order_data     = false;
    var payment_data   = false;
    var store_data     = false;

    Helpers.getObjectByBucketAndID(Conf.riak_options.order.bucket_name, order_id, riak)
        .then(function(object) {
            riak_order_obj = object;
            order_data = Helpers.decodeRiakData(riak_order_obj.value);
            if (!order_data || typeof order_data.status_i == 'undefined' || typeof order_data.store_id_s == 'undefined') {
                return Promise.reject('Order with id [' + order_id + '] has bad structure')
            }
            if (order_data.status_i != Conf.statuses.STATUS_WAIT_PAYMENT) {
                return Promise.reject('Order with id [' + order_id + '] has been already handled');
            }
            return getPaymentFromTX(transaction.id);
        })
        .then(function(payment) {
            //check payment structure
            if (typeof payment.records != 'object') {
                return Promise.reject();
            }
            if (payment.records.length != 1) {
                return Promise.reject();
            }
            payment_data = payment.records[0];
            if (typeof payment_data.from == 'undefined') {
                return Promise.reject();
            }
            if (typeof payment_data.to == 'undefined') {
                return Promise.reject();
            }
            if (typeof payment_data.amount == 'undefined' || !payment_data.amount) {
                return Promise.reject();
            }
            return Helpers.getObjectByBucketAndID(Conf.riak_options.store.bucket_name, order_data.store_id_s, riak)
        })
        .then(function(object){
            //check receiver details from payment data
            store_data = Helpers.decodeRiakData(object.value);
            if (store_data.merchant_id_s != payment_data.to) {
                return Promise.reject('Transaction with id [' + transaction.id + '] has correct memo but incorrect receiver. Its may be try of hack');
            }
        })
        .then(function(){
            //update order data
            order_data.payment_amount = parseFloat(payment_data.amount);
            order_data.payment_date   = Math.floor(Date.now() / 1000);
            order_data.payer          = payment_data.from;
            order_data.tx             = transaction.id;
            if (parseFloat(payment_data.amount) >= parseFloat(order_data.amount_f)) {
                //payment complete in full size, set tx status to success
                order_data.status_i = Conf.statuses.STATUS_WAIT_ANSWER;
            } else {
                //set tx status to partial payment
                order_data.status_i = Conf.statuses.STATUS_PARTIAL_PAYMENT;
            }
            return Helpers.updateRiakObject(riak_order_obj, order_data, riak);
        })
        .then(function(result){
            //TODO: check if result is success
            return Sender(order_data, riak);
        })
        .catch(function(err){
            if(err){
                Conf.log.error(err);
            }
        })
};

function getPaymentFromTX(transaction_id) {
    return Conf.horizon.payments()
        .forTransaction(transaction_id)
        .call();
}

function getMerchantOrderIDFromMemo(memo) {
    if (typeof memo == 'undefined') {
        return false;
    }
    if (memo.length <= Conf.order.order_prefix.length) {
        return false;
    }
    // if (memo.length != 14) {
    //     return false;
    // }
    var prefix   = memo.substr(0, Conf.order.order_prefix.length);
    var order_id = memo.substr(Conf.order.order_prefix.length);
    if (prefix != Conf.order.order_prefix || !order_id) {
        return false;
    }

    return order_id;
}

module.exports = Handler;
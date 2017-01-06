var Conf    = require('../config'),
    Helpers = require('./Helpers'),
    Sender  = require('./Sender');

var Handler = (transaction, riak) => {
    var card_id = transaction.source_account;
    if (!card_id) {
        return false;
    }
    var riak_card_obj = false;
    var card_data     = false;
    var balances_data = false;
    var stored_data   = false;
    var new_data      = false;

    Helpers.getObjectByBucketAndID(Conf.riak_options.cards.bucket_name, card_id, riak)
        .then(function(object) {
            riak_card_obj = object;
            card_data = Helpers.decodeRiakData(riak_card_obj.value);
            if (!card_data || typeof card_data.seed == 'undefined' || typeof card_data.type_i == 'undefined') {
                return Promise.reject('Card with id [' + card_id + '] has bad structure')
            }
            if (card_data.is_used_b != false) {
                return Promise.reject('Card with id [' + card_id + '] has been already used');
            }
            return getAccount(card_id);
        })
        .then(function(account) {
            //check account structure
            if (typeof account.type != 'scratch_card') {
                return Promise.reject();
            }
            if (account.balances.length < 1) {
                return Promise.reject();
            }
            balances_data = account.balances.records[0];

            if (typeof balances_data.asset_code != config.asset) {
                return Promise.reject();
            }

            if (typeof balances_data.balance == 'undefined') {
                return Promise.reject();
            }
            return Helpers.getObjectByBucketAndID(Conf.riak_options.store.bucket_name, account.id, riak)
        })
        .then(function(object){
            //check receiver details from payment data
            stored_data = Helpers.decodeRiakData(object.value);
            if (stored_data.account_id != account.id) {
                return Promise.reject();
            }
        })
        .then(function(){
            //update card data
            new_data = stored_data;
            new_data.amount_f             = parseFloat(balances_data.balance);
            new_data.used_date            = Math.floor(Date.now() / 1000);

            if (parseFloat(new_data.amount_f) <= 0) {
                new_data.is_used_b            = true;
            }
            return Helpers.updateRiakObject(riak_order_obj, new_data, riak);
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

function getAccount(account_id) {
    return Conf.horizon.accounts()
        .accountId(account_id)
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
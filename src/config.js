var StellarSdk = require('stellar-sdk');

var config = {};

config.horizon_url = process.env.HORIZON_HOST;

config.order = {
    order_prefix: "mo:"
};

config.bot = {
    sender: {
        sleep: 1000*60*5,
        count_of_request_retries: 3,
        good_answer: 'OK',
    },
};

config.errors = {
        db_conn_err:                'database_connection_error',
        db_update_err:              'database_update_error',
        horizon_err:                'horizon_error',
        order_collection_err:       'order_collection_error',
        order_not_found:            'order_not_found',
        merchant_collection_err:    'merchant_collection_error',
        merchant_not_found:         'merchant_not_found',
        empty_tx_payment:           'empty_transaction_payment',
        empty_order_amount:         'empty_order_amount',
        empty_payment_amount:       'empty_payment_amount',
        empty_payment_receiver:     'empty_payment_receiver',
        bad_order_merchant_id:      'bad_order_merchant_id',
        empty_merchant_acc_id:      'empty_merchant_account_id',
        bad_payment_receiver:       'bad_payment_receiver',
};

var log_params= {
    consoleOutput : true,
    consoleOutputLevel: ['DEBUG','ERROR','WARNING', 'INFO'],

    dateTimeFormat: "DD.MM.YYYY HH:mm:ss.S",
    outputPath: "logs/",
    fileNameDateFormat: "DD-MM-YYYY",
    fileNamePrefix:"bot-"
};


config.log = require('noogger').init(log_params);

config.horizon = new StellarSdk.Server(config.horizon_url);

config.riak_options = {
    // auth: {
    //     user: 'ihor',
    //     pass: '123123'
    // },
    default_bucket_type: 'default',
    store: {
        bucket_name: 'merchantstores',
    },
    order: {
        bucket_name:  'merchantorders',
    }
};

config.statuses = {
    STATUS_WAIT_PAYMENT: 1, //create order record in db, wait payment
    STATUS_WAIT_ANSWER: 2, //payment complete, wait answer from merchant domain
    STATUS_PARTIAL_PAYMENT: 3, //amount of payment is less than amount of order
    STATUS_FAIL: 4,
    STATUS_SUCCESS: 5
};

config.riak_nodes = [process.env.RIAK_HOST];

module.exports = config;


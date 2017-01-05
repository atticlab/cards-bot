var Conf   = require('../config'),
    Helpers = require('./Helpers'),
    needle = require('needle');

//VARIANT 1: WITH ADDITIONAL REQUEST FOR RECHECK STATUS OF ORDER (in case if another bot has been handled it faster)
var Sender = (order, riak) => {

    Helpers.getObjectByBucketAndID(Conf.riak_options.order.bucket_name, order.id, riak)
        .then(function(riak_object){
            var order_data = Helpers.decodeRiakData(riak_object.value);
            if (order_data.status_i != Conf.statuses.STATUS_WAIT_ANSWER) {
                return false;
            }
            needle.post(order_data.server_url, order_data.server_url_data, function (err, resp, body) {
                if (err || body != Conf.bot.sender.good_answer) {
                    Conf.log.error('Try #' + (parseInt(order_data.bot_request_count)+1) +' : Bad answer from ' + order_data.server_url);
                    if (err) {
                        Conf.log.error(err);
                    }
                    //up bot request counter
                    order_data.bot_request_count += 1;
                    return Helpers.updateRiakObject(riak_object, order_data, riak);
                }
                //up status to STATUS_SUCCESS
                order_data.status_i = Conf.statuses.STATUS_SUCCESS;
                Helpers.updateRiakObject(riak_object, order_data, riak);
            });
            if (order_data.status_i != Conf.statuses.STATUS_WAIT_ANSWER) {
                return false;
            }
            if (order_data.bot_request_count >= Conf.bot.sender.count_of_request_retries) {
                return false;
            }

            setTimeout(function() {
                Sender(order_data, riak);
            }, Conf.bot.sender.sleep);

        });

};

//VARIANT 2: WITHOUT ADDITIONAL REQUEST FOR RECHECK STATUS OF ORDER (in case if another bot handle it faster)
//Need riak object as second parameter (DON'T FORGET TO PASS IT in Sender() function)

// var Sender = (order_data, riak_object, riak) => {
//
//     needle.post(order_data.server_url, order_data.server_url_data, function (err, resp, body) {
//         if (err || body != Conf.bot.sender.good_answer) {
//             Conf.log.error('Try #' + (parseInt(order_data.bot_request_count)+1) +' : Bad answer from ' + order_data.server_url);
//             if (err) {
//                 Conf.log.error(err);
//             }
//             //up bot request counter
//             order_data.bot_request_count += 1;
//             return Helpers.updateRiakObject(riak_object, order_data, riak);
//         }
//         //up status to STATUS_SUCCESS
//         order_data.status_i = Conf.statuses.STATUS_SUCCESS;
//         Helpers.updateRiakObject(riak_object, order_data, riak);
//     });
//     if (order_data.status_i != Conf.statuses.STATUS_WAIT_ANSWER) {
//         return false;
//     }
//     if (order_data.bot_request_count >= Conf.bot.sender.count_of_request_retries) {
//         return false;
//     }
//     setTimeout(function() {
//         Sender(order_data, riak_object, riak);
//     }, Conf.bot.sender.sleep);
//
// };

module.exports = Sender;
var Handler = require('./inc/Handler');
var Conf = require('./config');
var prompt = require('prompt');
var Riak = require('basho-riak-client');

var riak_client = null;

Conf.horizon.transactions()
    .cursor('now')
    .stream({
        onmessage: function (transaction) {
            checkConnection(riak_client)
                .catch(function(){
                    return connection();
                })
                .then(function(client){
                    //if client not null in this then
                    //it means that was reconnect
                    //need to update client
                    if (client) {
                        riak_client = client;
                    }
                    Handler(transaction, riak_client);
                })
        },
        onerror: function (error) {
            Conf.log.error(Conf.errors.horizon_err);
            Conf.log.error(error);
        }
    });
function checkConnection(riak_client){
    return new Promise(function(resolve, reject){
        if (!riak_client) {
            return reject(false)
        }
        if (typeof riak_client.ping == 'undefined') {
            return reject(false)
        }
        riak_client.ping(function (err, rslt) {
            if (err || rslt !== true) {
                return reject(false)
            }
            //must return empty resolve
            return resolve();
        });
    });
}
function connection(){
    // for cluster with auth
    // var cluster = buildCluster(Conf.riak_nodes, Conf.riak_options.auth.user, Conf.riak_options.auth.pass);

    // for cluster without auth
    var cluster = buildCluster(Conf.riak_nodes);

    return new Promise(function(resolve, reject){
        new Riak.Client(cluster, function (err, client) {
            if (err) {
                Conf.log.error('Riak connection error');
                Conf.log.error(err);
                return reject(false);
            }
            client.ping(function (err, rslt) {
                if (err || rslt !== true) {
                    Conf.log.error('Error while trying to ping riak client');
                    Conf.log.error(err);
                    return reject(false);
                }
                return resolve(client);
            });

        });
    });
}
function buildCluster(nodes, user, pass){
    //with auth
    if (user && pass) {
        var riak_nodes = Riak.Node.buildNodes(nodes, {auth: {
                user: user,
                password: pass
            }
        });
        return new Riak.Cluster({ nodes: riak_nodes});
    } else {
        //without auth
        return nodes;
    }
}
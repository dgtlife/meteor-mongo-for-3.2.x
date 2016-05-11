/**
 * @file Defines the Remote Collection Driver that connects to a Mongo database
 *       or database cluster. This is a modification of the original file to
 *       update it for MongoDB Driver 2.1.18 in order to handle SSL with
 *       validation and X.509 Authentication.
 * @author Derek Gransaull <derek@dgtlife.com>
 * @copyright DGTLife, LLC 2016
 *
 * Created on 5/5/2016
 */

const fs = require('fs');

MongoInternals.RemoteCollectionDriver = function (mongoUrl, options) {
  var self = this;
  self.mongo = new MongoConnection(mongoUrl, options);
};

_.extend(MongoInternals.RemoteCollectionDriver.prototype, {
  open: function (name) {
    var self = this;
    var ret = {};
    _.each(
      ['find', 'findOne', 'insert', 'update', 'upsert',
       'remove', '_ensureIndex', '_dropIndex', '_createCappedCollection',
       'dropCollection', 'rawCollection'],
      function (m) {
        ret[m] = _.bind(self.mongo[m], self.mongo, name);
      });
    return ret;
  }
});

/*
 * Create the singleton RemoteCollectionDriver only on demand, so we
 * only require Mongo configuration if it's actually used (i.e. not if
 * you're only trying to receive data from a remote DDP server.)
 */
MongoInternals.defaultRemoteCollectionDriver = _.once(function () {
  /*
   * First, check that we have the MONGO_URL environment variable for the remote
   * connection case.
   */
  const mongoUrl = process.env.MONGO_URL;
  if (! mongoUrl) {
    throw new Error(
      "MongoDB connection string URI was not set in environment variable " +
      "MONGO_URL"
    );
  }

  // Assign the connection URI. It may or may not be overwritten subsequently.
  let connectionURI = mongoUrl;

  // Initialize the options object.
  const options = {
    db: { safe: true },
    server: {}
  };

  // Process other environment variables.
  const sslKey = process.env.MONGO_SSL_KEY_FILE;
  const sslCert = process.env.MONGO_SSL_CERT_FILE;
  const sslCA = process.env.MONGO_SSL_CA_FILE;
  const x509User = process.env.MONGO_X509_USER;
  const oplogUrl = process.env.MONGO_OPLOG_URL;
  const sslValidate = (process.env.MONGO_SSL_VALIDATE === 'true') ||
    (process.env.MONGO_SSL_VALIDATE === 'TRUE');

  options.server.sslKey = fs.readFileSync(sslKey);
  options.server.sslCert = fs.readFileSync(sslCert);
  options.server.sslValidate = sslValidate;
  options.server.sslCA = [fs.readFileSync(sslCA)];

  /*
   * If SSL server certificate validation is required, check that we have the
   * SSL CA file as well.
   */
  if (sslValidate && (! sslCA)) {
    throw new Error(
      "MongoDB connection SSL validation required but no SSL CA file " +
      "specified in MONGO_SSL_CA_FILE"
    );
  }

  // If we have a replica set, add the SSL options to the 'replSet' section.
  if (/replicaSet/.test(mongoUrl)) {
    options.replSet = {};
    options.replSet.sslKey = fs.readFileSync(sslKey);
    options.replSet.sslCert = fs.readFileSync(sslCert);
    options.replSet.sslValidate = sslValidate;
    options.replSet.sslCA = [fs.readFileSync(sslCA)];
  }

  /*
   * If we have the MONGO_X509_USER environment variable for an X.509 user,
   * insert the escaped 'user' string. But first check that we have the SSL
   * necessities specified as well.
   */
  if (x509User) {
    if (! (sslKey && sslCert)) {
      throw new Error(
        "MongoDB connection X.509 Authentication requires SSL key and cert files"
      );
    }
    const urlParts = mongoUrl.split('//');
    connectionURI =
      urlParts[0] + '//' +
      encodeURIComponent(x509User) + '@' +
      urlParts[1];
  }

  // Add the Oplog URL.
  if (oplogUrl) {
    options.oplogUrl = oplogUrl;
  }

  return new MongoInternals.RemoteCollectionDriver(connectionURI, options);
});

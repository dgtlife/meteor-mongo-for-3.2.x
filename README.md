# Modifications to `mongo` and `npm-mongo` to work with MongoDB v3.2.6
This repo contains the modifications made to the `mongo` and `npm-mongo` packages from Meteor 1.3.x in order to obtain the following:
- use of the (latest) MongoDB Node.js Driver v.2.1.18
- use of X.509 Authentication over SSL transport for Meteor's default connection to a replica set (should work for single server case)
- use of X.509 Authentication over SSL transport for Meteor's Oplog Tailing connection
- use of Meteor 1.3.x with MongoDB v3.2.6

In addition, to `MONGO_URL`, and `MONGO_OPLOG_URL` the following environmental variables are used.
- MONGO_SSL_VALIDATE
- MONGO_SSL_CA_FILE
- MONGO_SSL_KEY_FILE
- MONGO_SSL_CERT_FILE
- MONGO_SSL_CERT_PASS (if you're using a password-protected cert)
- MONGO_X509_USER=
- MONGO_OPLOG_URL
- MONGO_OPLOG_SSL_KEY_FILE
- MONGO_OPLOG_SSL_CERT_FILE
- MONGO_OPLOG_SSL_CERT_PASS (if you're using a password-protected cert)
- MONGO_OPLOG_X509_USER


This is NOT to be considered production quality code as it was simply a quick hack to allow me to continue to work in the above context while waiting for the official update of the `mongo` package from MDG. It may provide useful insight and input into the `mongo` update project. Use this at your own risk. 
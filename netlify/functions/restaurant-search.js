const handler = require('../../api/restaurant-search.js');

exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  const req = {
    method: event.httpMethod || 'GET',
    query
  };

  let statusCode = 200;
  const headers = {};
  let body = '';
  let isBinary = false;

  const res = {
    status(code) {
      statusCode = Number(code) || 200;
      return this;
    },
    setHeader(name, value) {
      headers[String(name)] = String(value);
    },
    json(value) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json; charset=utf-8';
      body = JSON.stringify(value);
      return this;
    },
    end(value) {
      if (value === undefined || value === null) {
        body = '';
      } else if (Buffer.isBuffer(value)) {
        body = value.toString('base64');
        isBinary = true;
      } else {
        body = String(value);
      }
      return this;
    }
  };

  await handler(req, res);

  return {
    statusCode,
    headers,
    body,
    isBase64Encoded: isBinary
  };
};

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var token = process.env.AIRTABLE_TOKEN;
  var baseId = 'appcDXPNTmuIYdF4l';
  var tableId = 'tbljHWjTh5U4L6mCY';

  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'AIRTABLE_TOKEN env var is missing' }) };
  }

  var wbs1 = event.queryStringParameters && event.queryStringParameters.wbs1;
  if (!wbs1) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing wbs1 parameter' }) };
  }

  var headers = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  };

  try {
    var searchUrl = 'https://api.airtable.com/v0/' + baseId + '/' + tableId +
      '?filterByFormula=' + encodeURIComponent('{WBS1}="' + wbs1 + '"') + '&maxRecords=1';

    var res = await fetch(searchUrl, { headers: headers });
    var data = await res.json();

    if (data.error) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
    }

    var tenants = [];
    if (data.records && data.records.length > 0) {
      tenants = data.records[0].fields.Tenants || [];
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ tenants: tenants })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

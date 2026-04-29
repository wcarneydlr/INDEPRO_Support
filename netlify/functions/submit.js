exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var token = process.env.AIRTABLE_TOKEN;
  var baseId = 'appcDXPNTmuIYdF4l';
  var tableId = 'tbljHWjTh5U4L6mCY';

  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'AIRTABLE_TOKEN env var is missing' }) };
  }

  var body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  var wbs1 = body.wbs1;
  var tenants = body.tenants;

  if (!wbs1 || !tenants || !tenants.length) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing wbs1 or tenants' }) };
  }

  var airtableBase = 'https://api.airtable.com/v0/' + baseId + '/' + tableId;
  var headers = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  };

  try {
    var searchUrl = airtableBase + '?filterByFormula=' + encodeURIComponent('{WBS1}="' + wbs1 + '"') + '&maxRecords=1';
    var searchRes = await fetch(searchUrl, { headers: headers });
    var searchText = await searchRes.text();

    var searchData;
    try {
      searchData = JSON.parse(searchText);
    } catch(e) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Airtable response not JSON: ' + searchText }) };
    }

    if (searchData.error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Search error: ' + JSON.stringify(searchData.error),
          tokenLength: token.length,
          tokenStart: token.substring(0, 8)
        })
      };
    }

    var fields = { Tenants: tenants };
    var res, data;

    if (searchData.records && searchData.records.length > 0) {
      var recordId = searchData.records[0].id;
      res = await fetch(airtableBase + '/' + recordId, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ fields: fields })
      });
    } else {
      fields.WBS1 = wbs1;
      res = await fetch(airtableBase, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ fields: fields })
      });
    }

    var resText = await res.text();
    try {
      data = JSON.parse(resText);
    } catch(e) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Write response not JSON: ' + resText }) };
    }

    if (data.error) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error.message || JSON.stringify(data.error) }) };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, recordId: data.id })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { httpMethod, path, body, headers } = event;
  
  // Handle preflight OPTIONS requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }
  
  // Your backend URL - try localhost first, fallback to tunnel
  const API_BASE = 'http://localhost:3000';
  
  // Extract the API path (remove the netlify function path)
  const apiPath = path.replace('/.netlify/functions/api', '');
  const url = `${API_BASE}${apiPath}`;
  
  console.log(`Proxying ${httpMethod} request to: ${url}`);
  
  try {
    const requestOptions = {
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Add authorization header if present
    if (headers.authorization) {
      requestOptions.headers['Authorization'] = headers.authorization;
    }
    
    // Add body for non-GET requests
    if (httpMethod !== 'GET' && body) {
      requestOptions.body = body;
    }
    
    const response = await fetch(url, requestOptions);
    const data = await response.text();
    
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: data
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Backend connection failed', details: error.message })
    };
  }
};

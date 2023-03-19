const express = require('express');
const request = require('request');
const cors = require('cors');

const app = express();
const PORT = 3002; // you can change this to any port you want
const URL = 'https://api.openai.com/v1/chat/completions'; // replace this with the URL you want to forward requests to
const KEY = process.env.OPENAI_API_KEY; // replace this with your API key

app.use(express.json()); // the server will parse incoming JSON data
app.use(cors());

app.post('/', (req, res) => {
  const options = {
    url: URL,
    headers: {
      'Authorization': `Bearer ${KEY}`
    },
    json: req.body // forward the JSON data from the original request
  };

  // make a request to the specified URL with the added header
  const forwardedReq = request.post(options);

  // stream the response from the forwarded request back to the client
  forwardedReq.pipe(res);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


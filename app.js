const express = require('express')
const fetch = require('node-fetch')
const app = express()
const port = 3000
var data = null
app.listen(3000, () => console.log('listening at 3000'))
app.use(express.static('public'));
app.use(express.json());

app.post('/api', (request, response) => {
  data = request.body
  console.log(data)
  response.json({
    status: "success"
  })
});

app.get('/weather', (request, response) =>{
  const api_url = `https://api.openweathermap.org/data/2.5/forecast?q=${data.Data}&APPID=3e2d927d4f28b456c6bc662f34350957&units=metric`
  api_response = fetch(api_url).then(api_response => api_response.json())
  .then(api_response => {
    console.log("The following is the response")
    console.log(api_response)
    response.json(api_response)
  });
})
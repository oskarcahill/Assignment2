const express = require('express')
const fetch = require('node-fetch')
const app = express()
const port = 3000
var params = null
app.listen(3000, () => console.log('listening at 3000'))
app.use(express.static('public'));
app.use(express.json());

var AWS = require("aws-sdk")
AWS.config.update({
  region: "us-east-1",
  endpoint: AWS.config.update({endpoint: "https://dynamodb.us-east-1.amazonaws.com"})
})
var dynamodb = new AWS.DynamoDB();

app.post('/query', (request, response) => {
  var yearAsString = request.body.query.movieYear.Data
  yearInt = parseInt(yearAsString,10)

  var docClientQ = new AWS.DynamoDB.DocumentClient();
  var params = {
    TableName: "Movies",
    ProjectionExpression: "#yr, title",
    KeyConditionExpression: "#yr = :yyyy and begins_with(title,:substring)",
    ExpressionAttributeNames:{
      "#yr": "year"
    },
    ExpressionAttributeValues: {
      ":yyyy": yearInt,
      ":substring": '' + request.body.query.movieName.Data
    }
  }
  docClientQ.query(params, function(err,data){
    if(err){
      console.log("Unable to query",JSON.stringify(err))
    }
    else{
      console.log("Query suceeded")
      console.log(data)
    }
    response.json({
      Data: data,
      Count: data.Count
    })
  })
  
});

app.get('/create', (request,response) =>{
  console.log("creating database")
  response.json({
    status: "success"
  })

  var s3 = new AWS.S3();
  var docClient = new AWS.DynamoDB.DocumentClient();
  
  params = {
      TableName : "Movies",
      KeySchema: [       
          { AttributeName: "year", KeyType: "HASH"},  //Partition key
          { AttributeName: "title", KeyType: "RANGE" },  //Sort key
      ],
      AttributeDefinitions: [       
          { AttributeName: "title", AttributeType: "S" },
          { AttributeName: "year", AttributeType: "N" },
      ],
      ProvisionedThroughput: {       
          ReadCapacityUnits: 1, 
          WriteCapacityUnits: 1
      }
  };
  
  dynamodb.createTable(params, function(err, data) {
      if (err) {
          console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
      }
  });

  var getParams = {
    Bucket : 'csu44000assign2useast20',
    Key: 'moviedata.json',
  }

  s3.getObject(getParams, function(err, data){
    if(err){
      console.log(err)
      return err;
    }
    var objectData = JSON.parse(data.Body.toString())
    console.log("ObjectData",objectData)
    objectData.forEach(function(movie) {
      var params2 = {
        TableName: "Movies",
        Item: {
          "title": movie.title,
          "year": movie.year
        }
      }
      docClient.put(params2, function(err,data){
        if(err){
          console.log("unable to add movie", movie.title,err)
        }
      })
    })
  })
  
})

app.get('/delete', (request, response) =>{
  var params = {
    TableName: "Movies"
  }

  dynamodb.deleteTable(params,function(err,data){
    if (err) {
      console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
  }
  })
})

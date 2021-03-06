# myskin REST-API server

## Description

This is the REST-API server for "mySkin" - a German React Native app to detect skin cancer (melanoma) from a mole image uploaded by the user. 
The app repo can be found [here](http://github.com/RyanLinXiang/myskin). The app is a proof-of-concept and the first React native app known to include a locally saved and run AI model, imported with TensorflowJS. 

Beside the AI part, the app offers many information, real-time UV index, reminder function for the next skin screening and a discussion forum. 
Primarily for the discussion forum this REST API back-end was written to allow CRUD actions. Furthermore it also includes basic login/register functionalities based on JWT tokens. Because of that this repo can be used for and adapted to any projects realizing discussion forum functionalities.

The app is part of the final project of an intense 3-months bootcamp on JavaScript and should not only showcase what has been learned but also what is possbile nowadays with this powerful programming language.

## Getting Started

The database table structure of the discussion forum feature is included in the following file:

```
structure.sql
```

The server needs the following environmental variables set:

```
process.env.DBHost // database host name 
process.env.DBUser // database user name
process.env.DBPassword // database password
process.env.DBDatabase // database name
```

### Dependencies

```
package.json
```

### Installing

```
npm install
```

### Executing program

```
npm start
```

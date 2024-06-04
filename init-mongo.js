// init-mongo.js

const collections = [
    'GameRoom',
    'User',
    'ReactionTime',
    'PreviousGame',
    'AverageReactionTime'
];

const db = db.getSiblingDB('ktv'); // Change to the name of your database

collections.forEach(collection => {
    db.createCollection(collection);
    db.getCollection(collection).insertOne({ name: `Test Document in ${collection}` });
});

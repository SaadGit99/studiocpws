const express = require('express');
const http = require('http');
const mysql = require('mysql');
const MySQLEvents = require('@rodrigogs/mysql-events');
const cors = require('cors');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const  io = require('socket.io')(server, {
    cors: {
      origin: '*',
    }
  });;
const {database} = require('./config/helpers');


// Middlewares
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Define some array variables
let currentData = Array(0);

// Use Sockets to setup the connection
io.sockets.on('connection', (socket) => {
  console.log('connected');
});

const program = async () => {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'studiocp',
        password: 'studiocp'
    });

    // Create MySQLEvents
    const instance = new MySQLEvents(connection, {
        startAtEnd: true  // to record only new binary logs
    });
    await instance.start();
    instance.addTrigger({
        name: 'Monitor all SQL Statements',
        expression: 'booking.bookings',  // listen to mega_shop database
        statement: MySQLEvents.STATEMENTS.ALL,
        onEvent: e => {
            currentData = e.affectedRows;


            switch (e.type) {
                case "DELETE":
                    console.log("DELETE");
                    io.sockets.emit('update', { type: "DELETE"});
                    break;

                case "UPDATE":
                    console.log("UPDATE");
                    io.sockets.emit('update', { type: "UPDATE"});
                    break;

                case "INSERT":
                    console.log("INSERT");
                    io.sockets.emit('update', { type: "INSERT"});
                    break;
                default:
                    break;
            }
        }
    });

    instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
    instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);

};

program().then();

server.listen(3000, () => {
    console.log('Server running on port 3000');
})

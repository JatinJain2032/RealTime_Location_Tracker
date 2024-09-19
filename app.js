const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server); // Passing server to the socket.io function

// Set up the view engine and static files
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Socket.io event handling
io.on("connection", function(socket) {
    console.log("New client connected");

    // Handle receiving location data from the client
    socket.on("send-location", function(data) {
        io.emit("receive-location", { id: socket.id, ...data });
    });

    // Handle client disconnection
    socket.on("disconnect", function() {
        io.emit("user-disconnected", socket.id);
        console.log("Client disconnected");
    });
});

// Route to serve the main page
app.get("/", function(req, res) {
    res.render("index");
});

// Error handling

// 404 error handler for unknown routes
app.use((req, res, next) => {
    res.status(404).send("Sorry, can't find that!");
});

// Generic error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

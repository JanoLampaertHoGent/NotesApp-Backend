// Creëer Express applicatie
var express = require("express");
var cors = require("cors");
var app = express();
const path = require("path");

// Initialiseer de database
const dbFile = path.join("./sqlite.db");
const fs = require("fs");
//fs.unlinkSync(dbFile); // uncomment deze lijn tijdelijk als je de database wilt verwijderen
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// Creëer de database tabellen
// Goede bron voor SQLite naslag: https://www.sqlitetutorial.net/
db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE Users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);"
    );
    db.run(
      "CREATE TABLE Notes (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, userId INTEGER, FOREIGN KEY(userId) REFERENCES Users(id));"
    );
  }
});

// Sta externe communicatie toe
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "*");
//   next();
// });
app.use(cors());

// Tell Express to use the body-parser middleware and to not parse extended bodies
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Voorbeeld van een html response met Express (ter illustratie)
app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname + "/index.html"));
});

// Antwoord met een lijst van alle gebruikers
app.get("/users", (req, res) => {
  db.all("SELECT * from Users", (err, rows) => {
    if (err) {
      res.send({ error: err });
      return;
    }
    res.send(JSON.stringify(rows));
  });
});

//Antwoord met 1 gebruiker
app.get("/users/:userId", (req, res) => {
  let userId = req.params.userId;

  if (!userId) {
    res.send({ error: "No userId argument found" });
    return;
  }

  db.all("SELECT * from Users WHERE id = (?)", userId, (err, rows) => {
    if (err) {
      res.send({ error: err });
      return;
    }
    res.send(JSON.stringify(rows));
  });
});

// Voeg een gebruiker toe aan de database
app.post("/users", (req, res) => {
  // controleer of de name parameter is meegegeven
  let name = req.body.name;

  if (!name) {
    res.send({ error: "No name argument found" });
    return;
  }

  db.all(`SELECT name from Users WHERE name Like (?)`, name, (err, rows) => {
    // return eventuele errors
    if (err) {
      res.send({ error: err });
      return;
    }
    if (rows.length > 0) {
      res.send({ error: "User already exists" });
      return;
    }

    db.run(`INSERT INTO Users (name) VALUES (?)`, name, error => {
      if (error) {
        res.send({ error: error });
        return;
      }
      res.send({ success: `Successfully added ${name}` });
    });
  });
});

// Voeg een notitie toe
app.post("/users/:userId/notes", (req, res) => {
  // controleer of de parameters meegegeven zijn
  let userId = req.params.userId;
  let content = req.body.content;

  if (!content) {
    res.send({ error: "Parameters content is required" });
    return;
  }

  db.run(
    `INSERT INTO Notes(content, userId) VALUES(?, ?)`,
    [content, userId],
    err => {
      if (err) {
        res.send({ error: err });
        return;
      }
      res.send({ success: "Inserted note" });
    }
  );
});

// Antwoord met een lijst van alle notities van een gebruiker
app.get("/users/:userId/notes", (req, res) => {
  // controleer of de naam parameter is meegegeven
  let userId = req.params.userId;

  if (!userId) {
    res.send({ error: "No userId argument found" });
    return;
  }

  db.all("SELECT * from Notes WHERE userId = ?", userId, (err, rows) => {
    if (err) {
      res.send({ error: err });
      return;
    }
    res.send(JSON.stringify(rows));
  });
});

// Verwijdert gebruiker met diens notities
app.delete("/users/:userId", (req, res) => {
  // controleer of de naam parameter is meegegeven
  let userId = req.params.userId;

  if (!userId) {
    res.send({ error: "No userId argument found" });
    return;
  }

  
  db.run(`DELETE FROM Notes WHERE userId = (?)`, [userId], err => {
    if (err) {
      res.send({ error: err });
      return;
    }
  });
  // verwijder de gebruiker
  db.run(`DELETE FROM Users WHERE id = (?)`, [userId], err => {
    if (err) {
      res.send({ error: err });
      return;
    }
    res.send({ success: "Deleted successfully" });
  });
});

var server = app.listen(8081, function() {
  var port = server.address().port;
  console.log("Example app listening on port %s", port);
});

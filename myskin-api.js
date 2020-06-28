const express = require("express");
const mariadb = require("mariadb");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();

let connection_id = mariadb.createConnection({
  host: "myskin.cyqiccjtkp3p.eu-central-1.rds.amazonaws.com",
  user: "root",
  password: "kwaWAChaS91Yuhk1Pk8r",
  database: "myskin",
});

const app = express();
const port = process.env.PORT || 3000;

var user_id;

function validate_token(token, res) {
  try {
    token = token.split(" ")[1];
    const payload = jwt.verify(token, process.env.ACCESS_KEY);
    user_id = payload.user_id;
  } catch {
    res.statusCode = 401;
    res.json({ error: "wrong token" });
    res.end("Unauthorized");
  }

  return true;
}

app.use(express.static("public"));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  const path = require("path");
  res.sendFile(path.resolve(__dirname, "public/index.html"));
});

app.use(function (req, res, next) {
  if (req.path === "/register" || req.path === "/login") next();
  else {
    token = req.headers.authorization;
    if (token && validate_token(token, res)) next();
    else {
      res.statusCode = 401;
      res.json({ error: "wrong token" });
      res.end("Unauthorized");
    }
  }
});

app.get("/questions/:question_id", (req, res) => {
  let apiData = [];
  const question_id = req.params.question_id;
  const start_index = req.query.start;
  const number_of_entries = req.query.numbers;

  connection_id.then(async (myskin) => {
    await myskin
      .query(
        "SELECT q.*, u.user_name, DATEDIFF(CURRENT_TIMESTAMP , q.creation_date) AS dayspast FROM questions q, users u WHERE q.id=? AND q.user_id=u.id",
        question_id
      )

      .then((entry) => {
        apiData.push(entry[0]);
        apiData.push([]);
      });

    await myskin
      .query(
        "SELECT a.*, u.user_name, DATEDIFF(CURRENT_TIMESTAMP , a.creation_date) AS dayspast FROM answers a, users u WHERE a.question_id=? AND a.user_id=u.id ORDER by a.id DESC Limit " +
          start_index +
          "," +
          number_of_entries,
        question_id
      )

      .then((entries) => {
        entries.forEach((element) => {
          apiData[1].push(element);
        });
      });

    res.json(apiData);
  });
});

app.get("/questions", (req, res) => {
  const start_index = req.query.start;
  const number_of_entries = req.query.numbers;

  connection_id.then((connection) => {
    connection
      .query(
        "SELECT q.id, q.user_id, LEFT(q.subject, 100) AS subject, u.user_name, DATEDIFF(CURRENT_TIMESTAMP , q.creation_date) AS dayspast, count(a.id) AS num, count(f.id) AS fav FROM questions q  LEFT JOIN answers a ON (a.question_id=q.id) LEFT JOIN users u ON (u.id=q.user_id) LEFT JOIN favorites f ON (f.user_id=? AND f.question_id=q.id) GROUP BY q.id ORDER BY q.id DESC Limit " +
          start_index +
          "," +
          number_of_entries,
        user_id
      )
      .then((entries) => res.json(entries));
  });
});

app.get("/questions/search/:keyword", (req, res) => {
  const start_index = req.query.start;
  const number_of_entries = req.query.numbers;
  const keyword = decodeURIComponent(req.params.keyword);
  const keyword_beginning = keyword + "%";
  const keyword_between = "%" + keyword + "%";
  const keyword_end = "%" + keyword;
  console.log(keyword);
  connection_id.then((connection) => {
    connection
      .query(
        "SELECT q.id, q.user_id, LEFT(q.subject, 100) AS subject, u.user_name, DATEDIFF(CURRENT_TIMESTAMP , q.creation_date) AS dayspast, count(a.id) AS num, count(f.id) AS fav FROM questions q LEFT JOIN answers a ON (a.question_id=q.id) LEFT JOIN users u ON (u.id=q.user_id) LEFT JOIN favorites f ON (f.user_id=? AND f.question_id=q.id) WHERE (LOWER (q.subject) LIKE LOWER (?) OR LOWER (q.subject) LIKE LOWER (?) OR LOWER (q.subject) LIKE LOWER (?)) AND u.id=q.user_id GROUP BY q.id ORDER BY q.id DESC Limit " +
          start_index +
          "," +
          number_of_entries,
        [user_id, keyword_beginning, keyword_between, keyword_end]
      )
      .then((entries) => {
        console.log(entries);
        return res.json(entries);
      });
  });
});

app.post("/questions", (req, res) => {
  const subject = req.body.subject;
  const question = req.body.question;

  connection_id.then((connection) => {
    connection
      .query(
        "INSERT INTO questions (user_id, subject, question, creation_date) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        [user_id, subject, question]
      )
      .then((status) => res.json(status))
      .catch(console.log);
  });
});

app.post("/answers", (req, res) => {
  const answer = req.body.answer;
  const question_id = req.body.question_id;

  connection_id.then((connection) => {
    connection
      .query(
        "INSERT INTO answers (user_id, question_id, answer, creation_date) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        [user_id, question_id, answer]
      )
      .then((status) => res.json(status))
      .catch(console.log);
  });
});

app.patch("/questions/:question_id", (req, res) => {
  const question_id = req.params.question_id;
  const subject = req.body.subject;
  const question = req.body.question;

  connection_id.then((connection) => {
    connection
      .query("UPDATE questions SET subject=?, question=? WHERE id=?", [
        subject,
        question,
        question_id,
      ])
      .then((status) => res.json(status))
      .catch(console.log);
  });
});

app.patch("/answers/:answer_id", (req, res) => {
  const answer_id = req.params.answer_id;
  const answer = req.body.answer;

  connection_id.then((connection) => {
    connection
      .query("UPDATE answers SET answer=? WHERE id=?", [answer, answer_id])
      .then((status) => res.json(status))
      .catch(console.log);
  });
});

app.delete("/questions/:question_id", (req, res) => {
  const question_id = req.params.question_id;

  connection_id.then((connection) => {
    connection
      .query("DELETE FROM questions WHERE id=?", question_id)
      .then((status) => res.json(status))
      .catch(console.log);
  });
});

app.delete("/answers/:answer_id", (req, res) => {
  const answer_id = req.params.answer_id;

  connection_id.then((connection) => {
    connection
      .query("DELETE FROM answers WHERE id=?", answer_id)
      .then((status) => res.json(status))
      .catch(console.log);
  });
});

app.get("/favorites", (req, res) => {
  const start_index = req.query.start;
  const number_of_entries = req.query.numbers;

  connection_id.then((connection) => {
    connection
      .query(
        "SELECT q.id, q.user_id, LEFT(q.subject, 100) AS subject, u.user_name, DATEDIFF(CURRENT_TIMESTAMP , q.creation_date) AS dayspast, count(a.id) AS num FROM questions q LEFT JOIN answers a ON (a.question_id=q.id) LEFT JOIN users u ON (u.id=q.user_id) LEFT JOIN favorites f ON (f.question_id=q.id) WHERE f.user_id=? GROUP BY q.id ORDER BY q.id DESC Limit " +
          start_index +
          "," +
          number_of_entries,
        user_id
      )
      .then((status) => res.json(status))
      .catch(console.log);
  });
});

app.post("/favorites/:question_id", (req, res) => {
  const question_id = req.params.question_id;
  console.log(user_id, question_id);
  connection_id.then(async (myskin) => {
    let existing = false;

    await myskin
      .query(
        "SELECT COUNT(*) FROM favorites WHERE user_id=? AND question_id=?",
        [user_id, question_id]
      )

      .then((status) => {
        existing = status[0]["COUNT(*)"];
      });

    if (existing) {
      myskin
        .query("DELETE FROM favorites WHERE user_id=? AND question_id=?", [
          user_id,
          question_id,
        ])

        .then((status) => res.json(status))
        .catch(console.log);
    } else {
      myskin
        .query("INSERT INTO favorites (user_id, question_id) VALUES(?,?)", [
          user_id,
          question_id,
        ])

        .then((status) => res.json(status))
        .catch(console.log);
    }
  });
});

app.post("/login", (req, res) => {
  const user_name = req.body.user_name;
  const password = req.body.password;
  let token;
  if (user_name && password) {
    connection_id.then((connection) => {
      connection
        .query(
          "SELECT id FROM users WHERE user_name=? AND password=PASSWORD(?)",
          [user_name, password]
        )
        .then((entry) => {
          if (entry.length > 0) {
            token = jwt.sign(
              {
                user_id: entry[0].id,
                user_name,
              },
              process.env.ACCESS_KEY,
              { expiresIn: "7d" }
            );
            res.statusCode = 200;
            res.json({
              token,
              user_id: entry[0].id,
              user_name,
              success: "Login war erfolgreich",
            });
            res.end("Success");
          } else {
            res.statusCode = 401;
            res.json({ error: "Ihre Zugangsdaten sind fehlerhaft" });
            res.end("Unauthorized");
          }
        })
        .catch(console.log);
    });
  } else {
    res.statusCode = 401;
    res.json({ error: "Bitte beide Felder ausfüllen" });
    res.end("Unauthorized");
  }
});

app.post("/register", (req, res) => {
  const user_name = req.body.user_name;
  const password = req.body.password;
  const email = req.body.email;
  let existing = false;

  if (user_name && password && email) {
    connection_id.then(async (myskin) => {
      await myskin
        .query(
          "SELECT COUNT(*) AS num FROM users WHERE user_name=? OR email=?",
          [user_name, email]
        )
        .then((entry) => {
          res.json({ len: entry.length });
        });

      if (!existing) {
        myskin
          .query(
            "INSERT INTO users (user_name,password,email) VALUES (?,PASSWORD(?),?)",
            [user_name, password, email]
          )
          .then((entry) => {
            res.statusCode = 200;
            res.json({
              success:
                "Registrierung war erfolgreich. Bitte loggen Sie sich nun ein.",
            });
            res.end("Success");
          })
          .catch((e) => console.log(e));
      } else {
        res.statusCode = 400;
        res.json({ error: "Username oder E-Mail-Adresse existiert bereits" });
        res.end("Unauthorized");
      }
    });
  } else {
    res.statusCode = 400;
    res.json({ error: "Bitte alle Felder ausfüllen" });
    res.end("Unauthorized");
  }
});

app.listen(port, () => console.log(`Server is running... Port: ${port}`));

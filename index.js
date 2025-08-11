require('dotenv').config();

const express = require("express");
const engine = require("ejs-mate");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
const port = process.env.PORT || 8080;

app.engine("ejs", engine);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

// --- Added root route to avoid "Cannot GET /" on Railway ---
app.get("/", (req, res) => {
  res.send("School API is running. Use POST /addSchool or GET /listSchools.");
});

app.get("/addSchool", (req, res) => {
  res.render("addSchool.ejs");
});

app.post("/addSchool", async (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: "Latitude and longitude must be numbers" });
  }

  try {
    await db.execute(
      "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
      [name, address, latitude, longitude]
    );
    res.json({ message: "School added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/listSchools", async (req, res) => {
  const userLat = parseFloat(req.query.latitude);
  const userLon = parseFloat(req.query.longitude);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res.status(400).json({ error: "Latitude and longitude are required" });
  }

  try {
    const [rows] = await db.execute("SELECT * FROM schools");

    const schoolsWithDistance = rows.map((school) => {
      const distance = getDistance(userLat, userLon, school.latitude, school.longitude);
      return { ...school, distance };
    });

    schoolsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(schoolsWithDistance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}
function toRad(value) {
  return (value * Math.PI) / 180;
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

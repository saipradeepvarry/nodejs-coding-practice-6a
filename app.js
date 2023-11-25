const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
app.use(express.json());

initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertStatesDBObjectToResponseObject = (DBObject) => {
  return {
    stateId: DBObject.state_id,
    stateName: DBObject.state_name,
    population: DBObject.population,
  };
};

const convertDistrictDBObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API1
app.get(`/states/`, async (request, response) => {
  const statesQuery = `
  SELECT 
  * 
  FROM 
  state;`;
  const query = await db.all(statesQuery);
  response.send(
    query.map((dbObject) => convertStatesDBObjectToResponseObject(dbObject))
  );
});

//API2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const statesQuery = `SELECT * FROM state WHERE state_id=${stateId};`;
  const query = await db.get(statesQuery);
  response.send(convertStatesDBObjectToResponseObject(query));
});

//API3
app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `
  INSERT INTO 
    district(state_id,district_name,cases,cured,active,deaths)
  VALUES(
      ${stateId},'${districtName}',${cases},${cured},${active},${deaths}
  );`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
  SELECT * FROM district WHERE district_id=${districtId};`;
  const querying = await db.get(districtQuery);
  response.send(convertDistrictDBObjectToResponseObject(querying));
});

//API5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
DELETE 
FROM 
district 
WHERE district_id=${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//API6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `
    UPDATE 
        district
    SET
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    WHERE 
        district_id=${districtId};`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//API7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesStatsQuery = `
  SELECT 
  SUM(cases),SUM(cured),SUM(active),SUM(deaths)
  FROM 
  district
  WHERE 
   state_id=${stateId};`;
  const stats = await db.get(getStatesStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `SELECT
  state_name
  FROM 
  district NATURAL JOIN state
  WHERE
  district_id=${districtId};`;
  const distract = await db.get(districtQuery);
  response.send({ stateName: distract.state_name });
});

module.exports = app;

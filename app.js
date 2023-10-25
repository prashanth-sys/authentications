const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19IndiaPortal.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const authentication = (request, response, next) => {
  let jwtToken;
  const authorizationHeader = request.headers["authorization"];
  if (authorizationHeader !== undefined) {
    jwtToken = authorizationHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.send(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};

//API 1 POST LOGIN

/*app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SHIV_PARVATHI");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});*/

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 2 GET

app.get("/states/", authentication, async (request, response) => {
  /*let jwtToken;
  const authorizationHeader = request.headers["authorization"];
  if (authorizationHeader !== undefined) {
    jwtToken = authorizationHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        const getStateQuery = `
                SELECT 
                *
                FROM
                state;`;
        const stateArray = await db.all(getStateQuery);
        const ans = (dbObject) => {
          return {
            stateId: dbObject.state_id,
            stateName: dbObject.state_name,
            population: dbObject.population,
          };
        };
        response.send(stateArray.map((eachState) => ans(eachState)));
      }
    });
  }*/
  const getStateQuery = `
    SELECT 
    *
    FROM
    state;`;
  const stateArray = await db.all(getStateQuery);
  const ans = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };
  response.send(stateArray.map((eachState) => ans(eachState)));
});

//AUTHENTICATION

/*const authentication = (request, response, next) => {
  let jwtToken;
  const authorizationHeader = request.headers("authorization");
  if (authorizationHeader !== undefined) {
    jwtToken = authorizationHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.send(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};*/
app.get("/states/:stateId/", authentication, async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT 
    *
    FROM 
    state 
    WHERE 
    state_id = ${stateId};`;
  const state = await db.get(stateQuery);
  const ans = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };
  response.send(ans(state));
});

//api 4 get

/*app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrict = `
    INSERT INTO 
    district(district_name, state_id, cases, cured, active, deaths)
    VALUES
    (
        '${districtName},
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}'
    );`;
  await db.run(addDistrict);
  response.send("District Successfully Added");
});*/

app.post("/districts/", authentication, async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO 
    district(district_name, state_id, cases, cured, active, deaths)
    VALUES
    (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API 5 DELETE

app.delete(
  "/districts/:districtId/",
  authentication,
  async (request, response) => {
    const { districtId } = request.params;
    const deleteDistrictQuery = `
    DELETE FROM 
    district
    WHERE 
    district_id = ${districtId};`;
    await db.run(deleteDistrictQuery);
    response.send("District Removed");
  }
);

//api put

app.put(
  "/districts/:districtId/",
  authentication,
  async (request, response) => {
    const { districtId } = request.params;
    const addDistrictQuery = request.body;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = addDistrictQuery;
    const UpdateQuery = `
            UPDATE district 
            SET 
                district_name='${districtName}',
                state_id=${stateId},
                cases=${cases},
                cured=${cured},
                active=${active},
                deaths=${deaths}
            WHERE district_id=${districtId};`;
    await db.run(UpdateQuery);
    response.send("District Details Updated");
  }
);

//api 8 get

app.get(
  "/states/:stateId/stats/",
  authentication,
  async (request, response) => {
    const { stateId } = request.params;
    const getStateStatesQuery = `
    SELECT
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths) 
    FROM 
    district
    WHERE 
    state_id = ${stateId};`;
    const stats = await db.get(getStateStatesQuery);
    console.log(stats);
    response.send({
      totalCases: stats["SUM(),cases"],
      totalCured: stats["SUM(),cured"],
      totalActive: stats["SUM(),active"],
      totalDeaths: stats["SUM(),deaths"],
    });
  }
);

//API GET

app.put(
  "/districts/:districtId/",
  authentication,
  async (request, response) => {
    const { districtId } = request.params;
    const addDistrictQuery = request.body;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = addDistrictQuery;
    const UpdateQuery = `
            UPDATE district 
            SET 
                district_name='${districtName}',
                state_id=${stateId},
                cases=${cases},
                cured=${cured},
                active=${active},
                deaths=${deaths}
            WHERE district_id=${districtId};`;
    await db.run(UpdateQuery);
    response.send("District Details Updated");
  }
);

module.exports = app;

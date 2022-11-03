const express = require("express");
const path = require("path");
const addDays = require("date-fns/addDays");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(-1);
  }
};

initializeDBAndServer();

//status
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//priority
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

//category
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

//priority & status
const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

//category & status
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

//category & priority
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

//Get Todos by Status, Priority, Category
app.get("/todos/", async (request, response) => {
  const { priority, status, search_q = "", category, due_date } = request.query;
  let getTodoQuery = "";

  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = `
            SELECT 
              *
            FROM   
              todo
            WHERE 
              todo.todo LIKE '%${search_q}%'
              AND todo.status = '${status}';
          `;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
            SELECT 
              *
            FROM 
              todo
            WHERE 
              todo.todo LIKE '%${search_q}%'
              AND todo.priority = '${priority}';
          `;
      break;
    case hasCategoryProperty(request.query):
      getTodoQuery = `
            SELECT 
              *
            FROM
              todo
            WHERE 
              todo.todo LIKE '%${search_q}%'
              AND todo.category = '${category}';
          `;
      break;
    case hasPriorityAndStatus(request.query):
      getTodoQuery = `
            SELECT 
              *
            FROM 
              todo
            WHERE 
              todo.todo LIKE '%${search_q}%'
              AND todo.priority = '${priority}'
              AND todo.status = '${status}';
          `;
      break;
    case hasCategoryAndStatus(request.query):
      getTodoQuery = `
            SELECT 
              *
            FROM
              todo
            WHERE 
              todo.todo LIKE '%${search_q}%'
              AND todo.category = '${category}'
              AND todo.status = '${status}';
          `;
      break;
    case hasCategoryAndPriority(request.query):
      getTodoQuery = `
            SELECT 
              *
            FROM
              todo
            WHERE 
              todo.todo LIKE '%${search_q}%'
              AND todo.category = '${category}'
              AND todo.priority = '${priority}';
          `;
      break;
    default:
      getTodoQuery = `
            SELECT 
              *
            FROM
              todo
            WHERE 
              todo.todo LIKE '%${search_q}%'
          `;
  }
  const dbResponse = await db.all(getTodoQuery);
  const todoDetails = dbResponse.map((obj) => {
    return {
      id: obj.id,
      todo: obj.todo,
      priority: obj.priority,
      status: obj.status,
      category: obj.category,
      dueDate: obj.due_date,
    };
  });
  response.send(todoDetails);
});

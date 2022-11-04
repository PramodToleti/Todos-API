const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

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

const validStatus = ["TO DO", "IN PROGRESS", "DONE"];
const validPriority = ["HIGH", "MEDIUM", "LOW"];
const validCategory = ["WORK", "HOME", "LEARNING"];

const isValidRequest = (request, response, next) => {
  const { status, priority, category, dueDate } = request.query;
  let isValidDate = false;
  if (dueDate !== undefined) {
    let [year, month, day] = dueDate.split("-");
    year = parseInt(year);
    month = parseInt(month) - 1;
    day = parseInt(day);
    const newDate = new Date(year, month, day);
    isValidDate = isValid(newDate);
  }
  switch (true) {
    case hasStatusProperty(request.query):
      if (!validStatus.includes(status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        next();
      }
      break;
    case hasPriorityProperty(request.query):
      if (!validPriority.includes(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        next();
      }
      break;
    case hasCategoryProperty(request.query):
      if (!validCategory.includes(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        next();
      }
      break;
    default:
      if (isValidDate) {
        response.status(400);
        response.send("Invalid Due Date");
      } else {
        next();
      }
      break;
  }
};

const isValidAdd = (request, response, next) => {
  const { id, priority, status, category, dueDate } = request.body;
  let isValidDate = false;
  if (dueDate !== undefined) {
    let [year, month, day] = dueDate.split("-");
    year = parseInt(year);
    month = parseInt(month) - 1;
    day = parseInt(day);
    isValidDate = isValid(new Date(year, month, day));
  }
  if (priority === undefined || !validPriority.includes(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (status === undefined || !validStatus.includes(status)) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (category === undefined || !validCategory.includes(category)) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (dueDate === undefined || !isValidDate) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

const isValidUpdate = async (request, response, next) => {
  const { priority, status, category, todo, dueDate } = request.body;
  if (priority !== undefined) {
    if (validPriority.includes(priority)) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (status !== undefined) {
    if (validStatus.includes(status)) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (category !== undefined) {
    if (validCategory.includes(category)) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (todo !== undefined) {
    next();
  } else {
    const { dueDate } = request.body;
    let [year, month, day] = dueDate.split("-");
    year = parseInt(year);
    month = parseInt(month) - 1;
    day = parseInt(day);
    const newDate = new Date(year, month, day);
    const isValidDate = isValid(newDate);
    if (isValidDate) {
      next();
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
};

const isValidAgenda = (request, response, next) => {
  const { date } = request.query;
  let isValidDate = false;
  let [year, month, day] = date.split("-");
  year = parseInt(year);
  month = parseInt(month) - 1;
  day = parseInt(day);
  isValidDate = isValid(new Date(year, month, day));
  if (!isValidDate) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

//Get Todos by Status, Priority, Category
app.get("/todos/", isValidRequest, async (request, response) => {
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

//Get Todo Based on ID API
app.get("/todos/:todoId/", isValidRequest, async (request, response) => {
  const { todoId } = request.params;
  const getTodQuery = `
        SELECT 
          * 
        FROM
          todo
        WHERE 
          todo.id = ${todoId};
    `;
  const dbResponse = await db.get(getTodQuery);
  if (dbResponse === undefined) {
    response.send("Invalid Todo Id");
  } else {
    const todoDetails = [dbResponse].map((obj) => {
      return {
        id: obj.id,
        todo: obj.todo,
        priority: obj.priority,
        status: obj.status,
        category: obj.category,
        dueDate: obj.due_date,
      };
    });
    response.send(...todoDetails);
  }
});

//Get Agenda Based on Date API
app.get("/agenda/", isValidAgenda, async (request, response) => {
  const { date } = request.query;
  let [year, month, day] = date.split("-");
  year = parseInt(year);
  month = parseInt(month) - 1;
  day = parseInt(day);

  const formattedDate = format(new Date(year, month, day), "yyyy-MM-dd");
  const getTodoQuery = `
    SELECT 
      *
    FROM
     todo
    WHERE 
      todo.due_date = '${formattedDate}';
  `;
  const dbResponse = await db.all(getTodoQuery);
  if (dbResponse === undefined) {
    response.send("Invalid Due Date");
  } else {
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
  }
});

//Create Todo API
app.post("/todos/", isValidAdd, async (request, response) => {
  const { id, todo, priority, category, status, dueDate } = request.body;
  const addTodoQuery = `
  INSERT INTO
    todo(id, todo, category, priority, status, due_date)
  VALUES
    (${id}, '${todo}', '${category}', '${priority}', '${status}', '${dueDate}');`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//Update Todo based on Request API
app.put("/todos/:todoId/", isValidUpdate, async (request, response) => {
  const requestBody = request.body;
  const { todoId } = request.params;
  let updatedColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updatedColumn = "Category";
      break;
    default:
      updatedColumn = "Due Date";
      break;
  }
  const originalTodoQuery = `
    SELECT 
      *
    FROM
      todo
    WHERE 
      id = ${todoId};
  `;
  const originalTodoDetails = await db.get(originalTodoQuery);
  console.log(originalTodoDetails);
  const {
    status = originalTodoDetails.status,
    priority = originalTodoDetails.priority,
    todo = originalTodoDetails.todo,
    category = originalTodoDetails.category,
    dueDate = originalTodoDetails.due_date,
  } = requestBody;

  const updateTodoQuery = `
    UPDATE 
      todo
    SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${dueDate}'
    WHERE 
      id = ${todoId};
  `;
  const dbResponse = await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

//Delete Todo API
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const removeTodoQuery = `
        DELETE FROM 
          todo
        WHERE 
          todo.id = ${todoId};
    `;
  const dbResponse = await db.run(removeTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

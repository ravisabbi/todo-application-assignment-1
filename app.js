const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/todos/");
    });
  } catch (err) {
    console.log(`DB ERROR: ${err.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// MIDDLEWARE FUNCTIONS

const checkQueryStatus = (request, response, next) => {
  const { status } = request.query;
  const statusList = ["TO DO", "IN PROGRESS", "DONE"];
  if (statusList.includes(status) || status === undefined) {
    console.log(`Status: ${status}`);
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
};

const checkQueryPriority = (request, response, next) => {
  const { priority } = request.query;
  const priorityList = ["HIGH", "MEDIUM", "LOW"];
  if (priorityList.includes(priority) || priority === undefined) {
    console.log(`priority: ${priority}`);
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
};

const checkQueryCategory = (request, response, next) => {
  const { category } = request.query;
  const categoryList = ["WORK", "HOME", "LEARNING"];
  if (categoryList.includes(category) || category === undefined) {
    console.log(`Category:${category}`);
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }
};

const checkQueryDueDate = (request, response, next) => {
  const { date } = request.query;
  if (isValid(new Date(date)) || date === undefined) {
    console.log(`Date: ${date}`);
    next();
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

// POST OR UPDATE MIDDLEWARE FUNCTIONS

const checkBodyStatus = (request, response, next) => {
  const { status } = request.body;
  //console.log(request.body);
  const statusList = ["TO DO", "IN PROGRESS", "DONE"];
  if (statusList.includes(status) || status === undefined) {
    console.log(`Status: ${status}`);
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
};

const checkBodyPriority = (request, response, next) => {
  const { priority } = request.body;
  const priorityList = ["HIGH", "MEDIUM", "LOW"];
  if (priorityList.includes(priority) || priority === undefined) {
    console.log(`priority: ${priority}`);
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
};

const checkBodyDueDate = (request, response, next) => {
  let { dueDate } = request.body;
  console.log(dueDate);
  if (isValid(new Date(dueDate)) || dueDate === undefined) {
    console.log(`Date: '${dueDate}'`);
    next();
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

const checkBodyCategory = (request, response, next) => {
  const { category } = request.body;
  const categoryList = ["WORK", "HOME", "LEARNING"];
  if (categoryList.includes(category) || category === undefined) {
    console.log(`Category:${category}`);
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }
};

// CONVERT DB OBJECT TO RESPONSE OBJECT
const convertDbObjectToResponseObject = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
    category: dbObj.category,
    dueDate: dbObj.due_date,
  };
};

// GET TODOS API
app.get(
  "/todos/",
  checkQueryStatus,
  checkQueryPriority,
  checkQueryCategory,
  checkQueryDueDate,
  async (request, response) => {
    const {
      status = "",
      priority = "",
      category = "",
      date = "",
      search_q = "",
    } = request.query;
    if (date !== "") {
      date = format(new Date(date), "yyyy-MM-dd");
    }

    const getAllTodosQuery = `SELECT 
                                  * FROM todo WHERE
                                    status LIKE '%${status}%'
                                    AND priority LIKE '%${priority}%'
                                    AND category LIKE '%${category}%'
                                    AND todo LIKE '%${search_q}%'
                                    AND due_date LIKE '%${date}%';`;
    const dbTodoList = await db.all(getAllTodosQuery);
    const todoArray = dbTodoList.map((eachTodo) =>
      convertDbObjectToResponseObject(eachTodo)
    );
    response.send(todoArray);
  }
);

// GET SPECIFIC TODO API
app.get(
  "/todos/:todoId/",
  checkQueryStatus,
  checkQueryPriority,
  checkQueryCategory,
  checkQueryDueDate,
  async (request, response) => {
    const { todoId } = request.params;
    const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
    const dbTodo = await db.get(getTodoQuery);
    response.send(convertDbObjectToResponseObject(dbTodo));
  }
);

// GET TODOS WITH SPECIFIC TODO API
app.get(
  "/agenda/",
  checkQueryStatus,
  checkQueryPriority,
  checkQueryCategory,
  checkQueryDueDate,
  async (request, response) => {
    let { date } = request.query;
    if (date !== "") {
      date = format(new Date(date), "yyyy-MM-dd");
    }

    const getTodoWithDateQuery = `SELECT * FROM todo WHERE due_date LIKE '${date}';`;
    const dbTodoList = await db.all(getTodoWithDateQuery);
    const todoArray = dbTodoList.map((eachTodo) =>
      convertDbObjectToResponseObject(eachTodo)
    );
    response.send(todoArray);
  }
);

// POST TODO API
app.post(
  "/todos/",
  checkBodyStatus,
  checkBodyPriority,
  checkBodyCategory,
  checkBodyDueDate,
  async (request, response) => {
    let { id, todo, priority, status, category, dueDate } = request.body;

    if (dueDate !== "") {
      dueDate = format(new Date(dueDate), "yyyy-MM-dd");
    }

    const postTodoQuery = `INSERT INTO todo (id,todo,priority,status,category,due_date)
                           VALUES 
                           (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;

    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
  }
);

// UPDATE TODO QUERY API
app.put(
  "/todos/:todoId/",
  checkBodyStatus,
  checkBodyPriority,
  checkBodyCategory,
  checkBodyDueDate,
  async (request, response) => {
    const { todoId } = request.params;
    let updatedColumn = "";
    const oldTodoQuery = `SELECT * FROM todo WHERE id = '${todoId}';`;
    const oldTodo = await db.get(oldTodoQuery);
    switch (true) {
      case request.body.todo !== undefined:
        updatedColumn = "Todo";
        break;
      case request.body.status !== undefined:
        updatedColumn = "Status";
        break;
      case request.body.category !== undefined:
        updatedColumn = "Category";
        break;
      case request.body.dueDate !== undefined:
        updatedColumn = "Due Date";
        break;
      case request.body.priority !== undefined:
        updatedColumn = "Priority";
        break;
    }
    let {
      id = oldTodo.id,
      status = oldTodo.status,
      priority = oldTodo.priority,
      category = oldTodo.category,
      todo = oldTodo.todo,
      dueDate = oldTodo.due_date,
    } = request.body;

    const updateTodoQuery = `UPDATE todo SET 
                                id = ${id},
                                todo = '${todo}',
                                status = '${status}',
                                priority = '${priority}',
                                category = '${category}',
                                due_date = '${dueDate}'
                                WHERE id = ${todoId};`;

    await db.run(updateTodoQuery);
    response.send(`${updatedColumn} Updated`);
  }
);

// DELETE TODO API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

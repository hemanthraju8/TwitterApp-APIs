const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const dbpath = path.join(__dirname, "todoApplication.db");
const { format, compareAsc } = require("date-fns");
const isMatch = require("date-fns/isMatch");
let db = null;
const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbServer();
const convertCamelCase = (object) => {
  return {
    id: object.id,
    todo: object.todo,
    priority: object.priority,
    status: object.status,
    category: object.category,
    dueDate: object.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { status, priority, category, search_q = "" } = request.query;
  let SqlQ = null;
  let obj = request.query;
  let arrayS = ["DONE", "IN PROGRESS", "TO DO"];
  let arrayC = ["HOME", "WORK", "LEARNING"];
  let arrayP = ["HIGH", "MEDIUM", "LOW"];
  const reject = (error) => {
    response.status(400);
    response.send(error);
  };
  switch (true) {
    case status !== undefined &&
      priority !== undefined &&
      category !== undefined:
      if (arrayS.includes(status)) {
        if (arrayP.includes(priority)) {
          if (arrayC.includes(category)) {
            SqlQ = `SELECT * FROM todo
          WHERE todo LIKE "%${search_q}%" AND status='${status}' AND priority="${priority}" AND category="${category}";`;
          } else {
            reject("Invalid Todo Category");
          }
        } else {
          reject("Invalid Todo Priority");
        }
      } else {
        reject("Invalid Todo Status");
      }
      break;
    case status !== undefined && priority !== undefined:
      if (arrayS.includes(status)) {
        if (arrayP.includes(priority)) {
          SqlQ = `SELECT * FROM todo
          WHERE todo LIKE "%${search_q}%" AND status='${status}' AND priority="${priority}";`;
        } else {
          reject("Invalid Todo Priority");
        }
      } else {
        reject("Invalid Todo Status");
      }
      break;
    case status !== undefined && category !== undefined:
      if (arrayS.includes(status)) {
        if (arrayC.includes(category)) {
          SqlQ = `SELECT * FROM todo
          WHERE todo LIKE "%${search_q}%" AND status='${status}' AND category="${category}";`;
        } else {
          reject("Invalid Todo Category");
        }
      } else {
        reject("Invalid Todo Status");
      }
      break;
    case priority !== undefined && category !== undefined:
      if (arrayP.includes(priority)) {
        if (arrayC.includes(category)) {
          SqlQ = `SELECT * FROM todo
          WHERE todo LIKE "%${search_q}%" AND priority="${priority}" AND category="${category}";`;
        } else {
          reject("Invalid Todo Category");
        }
      } else {
        reject("Invalid Todo Priority");
      }
      break;
    case status !== undefined:
      if (arrayS.includes(status)) {
        SqlQ = `SELECT * FROM todo
          WHERE todo LIKE "%${search_q}%" AND status='${status}';`;
      } else {
        reject("Invalid Todo Status");
      }
      break;
    case priority !== undefined:
      if (arrayP.includes(priority)) {
        SqlQ = `SELECT * FROM todo
          WHERE todo LIKE "%${search_q}%" AND priority='${priority}';`;
      } else {
        reject("Invalid Todo Priority");
      }
      break;
    case category !== undefined:
      if (arrayC.includes(category)) {
        SqlQ = `SELECT * FROM todo
          WHERE todo LIKE "%${search_q}%" AND category='${category}';`;
      } else {
        reject("Invalid Todo Category");
      }
      break;
    default:
      SqlQ = `SELECT * FROM todo
      WHERE todo LIKE "%${search_q}%";`;
      break;
  }
  if (SqlQ !== null) {
    const val = await db.all(SqlQ);
    const value = val.map((item) => {
      return convertCamelCase(item);
    });
    response.send(value);
  }
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const sqlGetQuery = `SELECT * FROM todo
    WHERE id=${todoId};`;
  const output = await db.get(sqlGetQuery);
  const value = convertCamelCase(output);
  response.send(value);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const sqlQ = `SELECT * FROM todo
  WHERE due_date="${newDate}";`;
    const output = await db.all(sqlQ);
    const value = output.map((item) => {
      return convertCamelCase(item);
    });
    response.send(value);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
app.post("/todos/", async (request, response) => {
  const { id, todo, category, dueDate, status, priority } = request.body;
  let arrayS = ["DONE", "IN PROGRESS", "TO DO"];
  let arrayC = ["HOME", "WORK", "LEARNING"];
  let arrayP = ["HIGH", "MEDIUM", "LOW"];
  const reject = (error) => {
    response.status(400);
    response.send(error);
  };
  if (arrayS.includes(status)) {
    if (arrayC.includes(category)) {
      if (arrayP.includes(priority)) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const SqlPostQuery = `INSERT INTO todo (id,todo,category,priority,status,due_date)
                VALUES (${id},"${todo}","${category}","${priority}","${status}","${newDate}");`;
          await db.run(SqlPostQuery);
          response.send("Todo Successfully Added");
        } else {
          reject("Invalid Due Date");
        }
      } else {
        reject("Invalid Todo Priority");
      }
    } else {
      reject("Invalid Todo Category");
    }
  } else {
    reject("Invalid Todo Status");
  }
});
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, category, dueDate, todo } = request.body;
  let SqlQ = null;
  let statusU = null;
  const reject = (error) => {
    response.status(400);
    response.send(error);
  };
  let arrayS = ["DONE", "IN PROGRESS", "TO DO"];
  let arrayC = ["HOME", "WORK", "LEARNING"];
  let arrayP = ["HIGH", "MEDIUM", "LOW"];
  switch (true) {
    case status !== undefined:
      if (arrayS.includes(status)) {
        SqlQ = `UPDATE todo
            SET status="${status}"
            WHERE id=${todoId};`;
        statusU = "Status Updated";
        await db.run(SqlQ);
        response.send(statusU);
      } else {
        reject("Invalid Todo Status");
      }
      break;
    case priority !== undefined:
      if (arrayP.includes(priority)) {
        SqlQ = `UPDATE todo
            SET priority="${priority}"
            WHERE id=${todoId};`;
        statusU = "Priority Updated";
        await db.run(SqlQ);
        response.send(statusU);
      } else {
        reject("Invalid Todo Priority");
      }
      break;
    case todo !== undefined:
      SqlQ = `UPDATE todo
      SET todo="${todo}"
      WHERE id=${todoId};`;
      statusU = "Todo Updated";
      await db.run(SqlQ);
      response.send(statusU);
      break;
    case dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const dateFormat = format(new Date(dueDate), "yyyy-MM-dd");
        SqlQ = `UPDATE todo
            SET due_date="${dateFormat}"
            WHERE id=${todoId};`;
        statusU = "Due Date Updated";
        await db.run(SqlQ);
        response.send(statusU);
      } else {
        reject("Invalid Due Date");
      }
      break;
    case category !== undefined:
      if (arrayC.includes(category)) {
        SqlQ = `UPDATE todo
            SET category="${category}"
            WHERE id=${todoId};`;
        statusU = "Category Updated";
        await db.run(SqlQ);
        response.send(statusU);
      } else {
        reject("Invalid Todo Category");
      }
      break;
    default:
      break;
  }
});
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  sqlDelQuery = `DELETE FROM todo
    WHERE id=${todoId};`;
  await db.run(sqlDelQuery);
  response.send("Todo Deleted");
});
module.exports = app;

const http = require("http");
const path = require("path");
const fs = require("fs/promises");

const PORT = 8000;
const DB = "./data.json";
const filePath = path.resolve(DB);
let tasks = [];
let id = 0;

async function setTasks(){

  const data = await fs.readFile(filePath, "utf-8");
  
  const orderedData = JSON.parse(data).sort((a, b) => a.id - b.id);

  tasks = orderedData;

  return orderedData;

}

async function fileWrite(dataJSON){

  await fs.writeFile(filePath, JSON.stringify(dataJSON), error => {
          
    if (error) console.log(error);

  })

}

const getId = url => Number(url.split("/").at(-1));

(async () => await setTasks())();

const METHODS = {
  GET: {
    status: 200,
    url: "/apiv1/tasks/",
    fn: async (url) => tasks
  },
  POST: {
    status: 201,
    url: "/apiv1/tasks/",
    fn: async(body, url) => {
      
      const newTask = body;
      newTask.id = tasks.at(-1).id + 1;
      tasks.push(newTask);
      await fileWrite(tasks);

    }
  },
  PATCH: {
    status: 200,
    url: "/apiv1/tasks/",
    fn: async(body, url) => {
      
      id = getId(url);
      
      tasks = tasks.map(task => {

        if(task.id == id){

          task.status = body.status;

        }

        return task;

      });

      await fileWrite(tasks);

    }
  },

  PUT: {
    status: 200,
    url: "/apiv1/tasks/",
    fn: async(body, url) => {
      
      id = getId(url);
      tasks = tasks.map(task => {

        if(task.id == id){
          task = body;
          task.id = id;
        }

        return task;

      });

      await fileWrite(tasks);

    }
  }
};

const app = http.createServer( async(req, res) => {

  const {url, method} = req;
  

  if (Object.keys(METHODS).includes(method) && url.includes(METHODS[method].url)) {
    
    res.writeHead(METHODS[method].status, {"Content-Type": "application/json"});
 
    req.on("data", async(body) => {

      await METHODS[method].fn(JSON.parse(body), url);
        
    });

    if(method == "GET"){

      const jsonData = await METHODS[method].fn(url);
      res.write(JSON.stringify(jsonData));
  
    }

  }else if(method == "DELETE" && url.includes("/apiv1/tasks/")){

    res.writeHead(200);
  
    id = getId(url);
    tasks = tasks.filter(task => Number(task.id) != id);
    
    await fileWrite(tasks);

  }else{

    res.writeHead(503);

  }

  res.end();
  
});

app.listen(PORT, () => console.log(`server on port ${PORT}`));
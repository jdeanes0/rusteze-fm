// Client side code

// Avalible message calls to the server that can be implemented
//  - print: prints a message to the console
//  - cd: changes the current directory, takes one argument, the new directory
//  - touch: creates a new file, takes one argument, the name of the file
//  - rm: removes a file/directory, takes one argument, the file/directory to remove
//  - rename: renames a file, takes one string argument, but must contain a comma separating the old and new names; ex: "oldName.txt,newName.txt"



//DOM objects
const getTimeBtn = document.getElementById('getTime');
const fileMenu = document.getElementById('fileMenu');
const vidFrame = document.getElementById('vidFrame');
const actionBtn = document.getElementById('messageServer');

//Variables
let currentFiles = [];     //List of files in the current directory
let fileMenuElements = []; //list containing the HTML DOM elements representing files in current directory
let dirStack = ["/"];      //Stack tracking the current file path

//When page loads, initialize things
document.body.onload = async (e) => {
    getTime();
    await getFileList();
    fillList();
};

//Update the time and refresh file list on press
getTimeBtn.onclick = (e) => {
  getTime();
  fillList();
};

//send a request to the server on buton press
actionBtn.onclick = async (e) => {
  console.log(await postMessage("print", "Hello World!"));
  console.log(await postMessage("rename", "foo.txt,bar.txt"));
}

//Override context menu
if (document.addEventListener) {
  fileMenu.addEventListener('contextmenu', function(e) {
    alert("TODO: Make the menu"); //Make menu here
    e.preventDefault();
  }, false);
} else {
  fileMenu.attachEvent('oncontextmenu', function() {
    alert("You've tried to open context menu");
    window.event.returnValue = false;
  });
}

//Retrieve time from server
async function getTime(){
  fetch('/time')
  .then(response => response.json())
  .then(data => document.getElementById("time").innerHTML=data);
}

//Send request to server, not implemented well yet...
async function postMessage(name, msg){
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const response = await fetch("/action", {
    method: "POST",
    body: JSON.stringify({ name: name, msg: msg}),
    headers: myHeaders,
  });
  console.log(response);
}



//Retreive a json object containing files in 'public' directory
//TODO: Add support for sub-directories
async function getFileList(){
  const response = await fetch('/filelist');
  const json = await response.json();
  currentFiles = json;
  return await json;
}

//Navigates to a subdirectory and updates the file menu
async function getSubDir(dir){
  if(dir != ""){
    dirStack.push(dir + "/");
  }
  let fullDir = "";
  for(let i = 0; i < dirStack.length; i++){
    fullDir += dirStack[i];
  }
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const response = await fetch("/action", {
    method: "POST",
    body: JSON.stringify({ name: "cd", msg: fullDir}),
    headers: myHeaders,
  });
  const json = await response.json();
  currentFiles = json;
  fillList();
  return await json;
}

//Populate the file menu
async function fillList(){
  fileMenu.innerHTML = "";
  list = currentFiles;
  console.log(list);
  let ul = document.getElementById("fileMenu");
  //If in a subdirectory, add a button to return to the parent directory
  if(dirStack.length > 1){
    let backDir = document.createElement("li");
    backDir.setAttribute("onclick", "dirStack.pop(), getSubDir(\"\"), fillList()");
    backDir.appendChild(document.createTextNode("../" + dirStack[dirStack.length-1].slice(0, dirStack[dirStack.length-1].length-1)));
    backDir.setAttribute("id", "fileOption");
    backDir.setAttribute("id", "backDir");
    ul.appendChild(backDir);
  }
  for(let i = 0; i < list.length; i++){
    let realPath = '/files/' + list[i].path.slice(10);
    //fileList.options[fileList.options.length] = new Option(list[i].path.slice(10), realPath);
    
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(list[i].path.split("/")[list[i].path.split("/").length-1]));
    li.setAttribute("id", "fileOption");
    li.setAttribute("onclick", "handleFileSelect(\""+realPath+"\", this.getAttribute(\"class\"))");
    li.setAttribute("id", "fileLink");
    if(list[i].is_dir){
      li.setAttribute("class", "isDirectory");
    }
    ul.appendChild(li);
    fileMenuElements.push(li);
  }
}

//Take an action once a file is clicked on in the file browser
//  Currently only determines if the file is a directory or not to navigate
function handleFileSelect(path, className){
  console.log("Class: ", className);
  console.log(className);
  if(className != null && className.includes("isDirectory")){
    console.log("dir");
    let newSubDir = path.split("/");
    newSubDir = newSubDir[newSubDir.length-1];
    getSubDir(newSubDir);
  }
  console.log(path);
}

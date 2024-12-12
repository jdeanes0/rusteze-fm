// Client side code

// Avalible message calls to the server that can be implemented
//  - print: prints a message to the console
//  - cd: changes the current directory, takes one argument, the new directory
//  - touch: creates a new file, takes one argument, the name of the file
//  - rm: removes a file/directory, takes one argument, the file/directory to remove
//  - rename: renames a file, takes one string argument, but must contain a comma separating the old and new names; ex: "oldName.txt,newName.txt"

const FILE_ITEM_TW =
  " my-1 pl-1 border-2 border-zinc rounded-md cursor-pointer select-none";

//DOM objects
const fileMenu = document.getElementById("fileMenu");
const vidFrame = document.getElementById("vidFrame");

const touchBtn = document.getElementById("doTouch");
const closeModalBtn = document.getElementById("closeModalBtn");
const submitModalBtn = document.getElementById("submitBtn");
const removeBtn = document.getElementById("doRemove");
const renameBtn = document.getElementById("doRename");
const closeRenameModalBtn = document.getElementById("closeRenameModalBtn");
const submitRenameModalBtn = document.getElementById("submitRenameBtn");

//Variables
let currentFiles = []; //List of files in the current directory
let fileMenuElements = []; //list containing the HTML DOM elements representing files in current directory
let dirStack = ["/"]; //Stack tracking the current file path
let selectedFile = ""; //Contains the name of the file currently hosted in the iframe

//When page loads, initialize things
document.body.onload = async (e) => {
  await getFileList();
  fillList();
};

//Open the textbox on click
touchBtn.onclick = (e) => {
  document.getElementById("myModal").style.display = "flex";
};

//Open the new file textbox on click
closeModalBtn.onclick = (e) => {
  document.getElementById("myModal").style.display = "none";
};

// Submits the request to create a new file with the given name
submitModalBtn.onclick = (e) => {
  let fileName = document.getElementById("fnInput").value;
  document.getElementById("myModal").style.display = "none";

  postMessage("touch", dirStack.join("") + fileName).catch((error) =>
    console.error(error)
  );
  refreshFiles().catch((error) => console.log(error));
};

// Deletes the currently opened file
removeBtn.onclick = (e) => {
  postMessage("rm", dirStack.join("") + selectedFile).catch((error) =>
    console.error(error)
  );
  refreshFiles().catch((error) => console.log(error));
};

// Opens the rename file textbox
renameBtn.onclick = (e) => {
  document.getElementById("myRenameModal").style.display = "flex";
};

// Exit out of the textbox without submitting
closeRenameModalBtn.onclick = (e) => {
  document.getElementById("myRenameModal").style.display = "none";
};

// Submit the request to rename with the given parameters
submitRenameModalBtn.onclick = (e) => {
  let fileName = document.getElementById("fnRenameInput").value;
  document.getElementById("myRenameModal").style.display = "none";

  postMessage(
    "rename",
    dirStack.join("") + selectedFile + "," + dirStack.join("") + fileName
  ).catch((error) => console.error(error));

  refreshFiles().catch((error) => console.log(error));
};

//Refreshes the file list
async function refreshFiles() {
  await getFileList();
  fillList();
}

//Send request to server, not implemented well yet...
async function postMessage(name, msg) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const response = await fetch("/action", {
    method: "POST",
    body: JSON.stringify({ name: name, msg: msg }),
    headers: myHeaders,
  });
  console.log(response);
}

//Retreive a json object containing files in 'filelist' directory
async function getFileList() {
  const response = await fetch("/filelist");
  const json = await response.json();
  currentFiles = json;
  return await json;
}

//Navigates to a subdirectory and updates the file menu
async function getSubDir(dir) {
  if (dir != "") {
    dirStack.push(dir + "/");
  }
  let fullDir = "";
  for (let i = 0; i < dirStack.length; i++) {
    fullDir += dirStack[i];
  }
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const response = await fetch("/action", {
    method: "POST",
    body: JSON.stringify({ name: "cd", msg: fullDir }),
    headers: myHeaders,
  });
  const json = await response.json();
  currentFiles = json;
  fillList();
  return await json;
}

//Populate the file menu
async function fillList() {
  fileMenu.innerHTML = "";
  list = currentFiles;
  console.log(list);
  let ul = document.getElementById("fileMenu");
  //If in a subdirectory, add a button to return to the parent directory
  if (dirStack.length > 1) {
    let backDir = document.createElement("li");
    backDir.setAttribute(
      "onclick",
      'dirStack.pop(), getSubDir(""), fillList()'
    );
    backDir.appendChild(
      document.createTextNode(
        "../" +
          dirStack[dirStack.length - 1].slice(
            0,
            dirStack[dirStack.length - 1].length - 1
          )
      )
    );
    backDir.setAttribute("id", "fileOption");
    backDir.setAttribute("id", "backDir");
    backDir.setAttribute("selectable", false);
    backDir.setAttribute(
      "class",
      "hover:bg-red-500 hover:bg-opacity-50" + FILE_ITEM_TW
    );
    ul.appendChild(backDir);
  }
  // Create DOM elements, looping once to get folders, then again for files.
  for(let j = 0; j < 2; j++){
    for (let i = 0; i < list.length; i++) {

      let realPath = "/files/" + list[i].path.slice(12);
      let li = document.createElement("li");
      let rawPath = list[i].path.split("/")[list[i].path.split("/").length - 1];

      li.setAttribute("id", "fileOption");
      li.setAttribute(
        "onclick",
        'handleFileSelect("' + realPath + '", this.getAttribute("class"))'
      );
      li.setAttribute("id", "fileLink");
      li.setAttribute("class", "hover:bg-zinc-400 w-full" + FILE_ITEM_TW);
      if (list[i].is_dir) {
        li.setAttribute(
          "class",
          "isDirectory hover:bg-blue-500 hover:bg-opacity-50" + FILE_ITEM_TW
        );
        rawPath += "/";
        li.appendChild(document.createTextNode(rawPath));
      } else {
        li.appendChild(document.createTextNode(rawPath));
      }
      
      if(j == 0 && list[i].is_dir){
        console.log("isDir");
        fileMenuElements.push(li);
        ul.appendChild(li);
      } else if (j == 1 && !list[i].is_dir){
        console.log("isNotDir");
        fileMenuElements.push(li);
        ul.appendChild(li);
      }
    }
  }
}

//Take an action once a button is clicked on in the file browser depending on if it is a file or a folder
function handleFileSelect(path, className) {
  console.log("Class: ", className);
  console.log(className);
  if (className != null && className.includes("isDirectory")) {
    console.log("dir");
    let newSubDir = path.split("/");
    newSubDir = newSubDir[newSubDir.length - 1];
    getSubDir(newSubDir);
  } else {
    // populate the iframe with the element
    let iframe = document.getElementById("displayFile");
    iframe.src = path;
    let fileClean = path.split("/");
    selectedFile = fileClean[fileClean.length - 1];
  }
  console.log(path);
}

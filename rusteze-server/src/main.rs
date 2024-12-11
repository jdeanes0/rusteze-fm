// File Server Code
//// TODO ////
use actix_cors::Cors;
use actix_files as fs;
use actix_files::NamedFile;
/// Add a way to call command functions in subdirectories
/// Potentially utilize the dirStack from the client side, or create one here
//Imports
use actix_web::{get, web, App, HttpRequest, HttpResponse, HttpServer, Responder};
use chrono::prelude::*;
use serde::Serialize;
use std::fs as stdfs;
use std::fs::File;
use std::io::prelude::*;
use std::path::PathBuf;

//Struct for making file list json object, can be expanded
#[derive(Serialize)]
struct FileList {
    path: String,
    is_dir: bool,
}


#[actix_web::main]
async fn main() -> std::io::Result<()> {
    //Create the HTTP server
    HttpServer::new(|| {
        let cors = Cors::permissive();
        App::new()
            .wrap(cors)
            .service(fs::Files::new("/files", "./user-files").show_files_listing()) //Gives access to files in the user-files folder at /files
            .service(fs::Files::new("/web", "../rusteze-frontend").index_file("index.html")) //Host website client files at /web
            .route("/filelist", web::get().to(serve_file_list))
            .route("/action", web::post().to(handle_msgs))
            .route("/{filename:.*}", web::get().to(index)) //Give access to filesystem
    })
    .bind(("127.0.0.1", 8080))? //Live at 127.0.0.1:8080
    .run() //Start the server
    .await //Await requests
}

//Get request using services
#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

//Manual request using route
async fn manual_hello() -> impl Responder {
    HttpResponse::Ok().body("Hey there!")
}

//Serves the current UTC time in a JSON object
async fn serve_time() -> impl Responder {
    let now = Utc::now().to_string();
    HttpResponse::Ok().json(now)
}

#[allow(unused_parens)]
async fn handle_msgs(raw_json: String) -> impl Responder {
    let json: serde_json::Value =
        serde_json::from_str(raw_json.as_str()).expect("JSON was not well-formatted");
    let name = json
        .as_object()
        .unwrap()
        .get("name")
        .unwrap()
        .to_string()
        .split("\"")
        .collect::<Vec<&str>>()[1]
        .to_string();
    println!("Calling: {:?}", name);
    let msg = json
        .as_object()
        .unwrap()
        .get("msg")
        .unwrap()
        .to_string()
        .split("\"")
        .collect::<Vec<&str>>()[1]
        .to_string();
    let mut res = Vec::new();
    if (name.as_str() == "cd") {
        println!("Message: {:?}", msg);
        res = serve_subdirectories(msg).await;
    } else if (name.as_str() == "touch") {
        println!("Message: {:?}", msg);
        touch(msg).unwrap();
    } else if (name.as_str() == "mkdir") {
        println!("Message: {:?}", msg);
        mkdir(msg).unwrap();
    } else if (name.as_str() == "rm") {
        println!("Message: {:?}", msg);
        rm(msg).unwrap();
    } else if (name.as_str() == "rename") {
        println!("Message: {:?}", msg);
        rename(msg).unwrap();
    } else {
        match msg.as_str() {
            "print" => print_message(msg).await,
            "mkfl" => print_message(msg).await,
            //"cd"=>serve_subdirectories(msg).await,
            _ => print_message(msg).await,
        };
    };
    //println!("{:?}",res[0].path);
    HttpResponse::Ok().json(res)
}

//print out the body of the request
async fn print_message(msg: String) -> impl Responder {
    print!("{:?}", msg);

    HttpResponse::Ok().json("Acknowledged")
}

//Changes the current file path
/*async fn change_file_path(toPath: String) -> impl Responder {
    serve_subdirectories(toPath).await;
    HttpResponse::Ok().json("Acknowledged")
}*/

//Serve a json object containing all files in the user-files folder
async fn serve_subdirectories(sub: String) -> Vec<FileList> {
    let paths = stdfs::read_dir("./user-files".to_string() + sub.as_str()).unwrap();
    let mut path_list = Vec::new();
    let mut temp_string;
    for path in paths {
        temp_string = path.unwrap().path().display().to_string();
        let md = PathBuf::from(temp_string.clone());
        let is_directory = md.is_dir();
        let json_builder = FileList {
            path: temp_string,
            is_dir: is_directory,
        };
        path_list.push(json_builder);
    }
    return path_list;
}

//Serve a json object containing all files in the user-files folder
async fn serve_file_list() -> impl Responder {
    let paths = stdfs::read_dir("./user-files").unwrap();
    println!("{:?}", paths);
    let mut path_list = Vec::new();
    let mut temp_string;
    for path in paths {
        temp_string = path.unwrap().path().display().to_string();
        let md = PathBuf::from(temp_string.clone());
        let is_directory = md.is_dir();
        let json_builder = FileList {
            path: temp_string,
            is_dir: is_directory,
        };
        path_list.push(json_builder);
    }
    HttpResponse::Ok().json(path_list)
}

//Handle requests to fileserver
async fn index(req: HttpRequest) -> actix_web::Result<NamedFile> {
    let path: PathBuf = req.match_info().query("filename").parse().unwrap();
    Ok(NamedFile::open(path)?)
}
//Function makes a file named based on the input parameter string
//  Currently only makes a txt file, remove .txt string to let user specify
fn touch(arg: String) -> std::io::Result<()> {
    let a = "./user-files/";
    let mut file = File::create(a.to_string() + arg.as_str() + ".txt")?;
    file.write_all(b"")?;
    Ok(())
}

//Creates a directory based on the input parameter string
fn mkdir(arg: String) -> std::io::Result<()> {
    let a = "./user-files/";
    stdfs::create_dir(a.to_string() + arg.as_str())?;
    Ok(())
}

//Removes a file or directory based on the input parameter string
#[allow(unused_parens)]
fn rm(arg: String) -> std::io::Result<()> {
    let a = "./user-files/";
    if (PathBuf::from(a.to_string() + arg.as_str()).is_file()) {
        stdfs::remove_file(a.to_string() + arg.as_str())?;
    } else if (PathBuf::from(a.to_string() + arg.as_str()).is_dir()) {
        stdfs::remove_dir_all(a.to_string() + arg.as_str())?;
    }
    Ok(())
}

//Rename file or directory based on given input string
//  Takes two arguments in one string, separated by a comma. ARG1 is the file to be renamed, ARG2 is the new name
fn rename(arg: String) -> std::io::Result<()> {
    let a = "./user-files/";
    let names: Vec<&str> = arg.split(",").collect();
    stdfs::rename(a.to_string() + names[0], a.to_string() + names[1])?;
    Ok(())
}

//TODO: Implement move function

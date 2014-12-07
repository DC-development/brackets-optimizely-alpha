/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    "use strict";



    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus          = brackets.getModule("command/Menus"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils");

    // Function to run when the menu item is clicked
    // 67f2538993cbc7a7a2c4b31e15a64ed0:8ec1c4e8
    function handleHelloWorld() {

        var token = "";
        var projectName = "";
        var projectRoot = ProjectManager.getProjectRoot()._path;
        var localPath = projectRoot+"optimizely.js";
        var configFile = FileSystem.getFileForPath(localPath);
        var projectId = "";
        var jsonObject;
        var readConfig;
  
        // Read The Config File
        readConfig = FileUtils.readAsText(configFile);  // returns a promise

        // and completes asynchronously
        readConfig.done(function (text) {        
           // console.log("The contents of the file are:\n" + text);
            jsonObject = JSON.parse(text)
            token = jsonObject.token;
            projectId = jsonObject.project_id;
            getProject(projectId);
        })
        .fail(function (errorCode) {
            console.log("Error: " + errorCode);  // one of the FileSystemError constants
            if(errorCode == "NotFound"){
                window.alert("No configfile found for optimizely - create 'optimizely.js' in your project root");
            }
        });

        /*/console.log(ProjectManager.addClassesProvider().fullPath());
        // Read Projects
        $.ajax({
            url: "https://www.optimizelyapis.com/experiment/v1/projects/",
            type: "GET",
            beforeSend: function(xhr){xhr.setRequestHeader('token', sec_token);},
            success: function(data) { 
                console.log("Project: "+ data[0]['project_name'] +" - "+ data[0]['id']);    
                getProject(data[0]['id']);            
                console.log("Project: "+ data[1]['project_name'] +" - "+ data[1]['id']);
                getProject(data[1]['id']);
            }
        });
        */
        // Read A Projects Experiments
        function getProject(project_id){
            $.ajax({
                url: "https://www.optimizelyapis.com/experiment/v1/projects/"+project_id+"/experiments/",
                type: "GET",
                beforeSend: function(xhr){xhr.setRequestHeader('token', token);},
                success: function(mdata) { 
                    console.log("Experiments: "+ mdata[0]['description']);
                    console.log(mdata[0]);
                    projectName =  mdata[0]['description'];
                    getVariant(mdata[0].variation_ids[1]);
                }
            });
        }
       

        // Read A  Experiments Variation
        function getVariant(variation_id){
            $.ajax({
                url: "https://www.optimizelyapis.com/experiment/v1/variations/"+variation_id,
                type: "GET",
                beforeSend: function(xhr){xhr.setRequestHeader('token', token);},
                success: function(data) { 
                    console.log("Variation: "+ data.description);
                    console.log(data.js_component); 
                    FileSystem.getDirectoryForPath(projectRoot+projectName).create();
                    // DocumentManager.getCurrentDocument().setText(data.js_component);
                    console.log(projectRoot+projectName+"/"+data.description+".js");
                    FileSystem.getFileForPath(projectRoot+projectName+"/"+data.description+".js").write(data.js_component);
                }
            });
        }   
    }


    // First, register a command - a UI-less object associating an id to a handler
    var MY_COMMAND_ID = "helloworld.sayhello";   // package-style naming to avoid collisions
    CommandManager.register("My Extension", MY_COMMAND_ID, handleHelloWorld);

    // Then create a menu item bound to the command
    // The label of the menu item is the name we gave the command (see above)
    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
    menu.addMenuItem(MY_COMMAND_ID);

    // We could also add a key binding at the same time:
    //menu.addMenuItem(MY_COMMAND_ID, "Ctrl-Alt-H");
    // (Note: "Ctrl" is automatically mapped to "Cmd" on Mac)
});
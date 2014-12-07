/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    "use strict";

    var CommandManager  = brackets.getModule("command/CommandManager"),
        Menus           = brackets.getModule("command/Menus"),
        ProjectManager  = brackets.getModule("project/ProjectManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        FileSystem      = brackets.getModule("filesystem/FileSystem"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils");
 
    ExtensionUtils.loadStyleSheet(module, "style/styles.css");

    var $icon = $("<a id='optimizely-toolbar-icon' href='#'> </a>")
        .attr("title", "Optimizely")
        .appendTo($("#main-toolbar .buttons"));

    $icon.on("click", handleHelloWorld);

    function handleHelloWorld() {

        var token = "";
        var projectName = "";
        var projectRoot = ProjectManager.getProjectRoot()._path;
        var configPath = projectRoot+"optimizely.js";
        var configFile = FileSystem.getFileForPath(configPath);
        var projectId = "";
        var jsonObject;
        var readConfig;
        var experimentName;

        
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

        //console.log(ProjectManager.addClassesProvider().fullPath());
        // Read Projects
        function getProject(project_id){
            $.ajax({
                url: "https://www.optimizelyapis.com/experiment/v1/projects/"+project_id,
                type: "GET",
                beforeSend: function(xhr){xhr.setRequestHeader('token', token);},
                success: function(data) {                  
                    projectName = data.project_name;
                    getExperiments(data.id);
                }
            });
        }

        // Read A Projects Experiments
        function getExperiments(project_id){
            $.ajax({
                url: "https://www.optimizelyapis.com/experiment/v1/projects/"+project_id+"/experiments/",
                type: "GET",
                beforeSend: function(xhr){xhr.setRequestHeader('token', token);},
                success: function(data) { 
                    experimentName =  data[0]['description'];
                    getVariant(data[0].variation_ids[1]);
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
                    
                    var variation = data.description;                    
                    var projectDirectory =  FileSystem.getDirectoryForPath(projectRoot+projectName);
                    var experimentDirectory =  FileSystem.getDirectoryForPath(projectRoot+projectName+"/"+experimentName);
                    var experimentCssDirectory =  FileSystem.getDirectoryForPath(projectRoot+projectName+"/"+experimentName+"/css");
                    var experimentJavaScriptDirectory =  FileSystem.getDirectoryForPath(projectRoot+projectName+"/"+experimentName+"/js");
               
                    var variantCode = FileSystem.getFileForPath(projectRoot+projectName+"/"+experimentName+"/"+variation+".js");
                    projectDirectory.create();
                    experimentDirectory.create();
      
                    experimentCssDirectory.create();
                    experimentJavaScriptDirectory.create();
                    
                    variantCode.write(data.js_component);
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
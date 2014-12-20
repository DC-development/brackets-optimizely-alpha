/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp:
true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        DocumentManager =
        brackets.getModule("document/DocumentManager"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        Menus = brackets.getModule("command/Menus"),
        PanelManager = brackets.getModule("view/PanelManager"),
         AppInit = brackets.getModule("utils/AppInit");


    var panelHtml     = require("text!panel.html");
    PanelManager.createBottomPanel("optimizely", $(panelHtml),200).show();
    //Find out wethet this returns a promise we do not use here
    ExtensionUtils.loadStyleSheet(module, "style/styles.css");

    //This seems to be the most simple way to integrate with brackets-ui
    var $icon = $("<a id='optimizely-toolbar-icon' href='#'> </a>")
        .attr("title", "Optimizely")
        .appendTo($("#main-toolbar .buttons"));

    //Will allways rtigger mainfunction,
    //yet - should be smarter since oyu overriding all your files all the time.
    $icon.on("click", handleHelloWorld);



    /**
     *   Main function of plugin
     */
    function handleHelloWorld() {


        var token = "";

        var projectId = "";
        var jsonObject;
        var readConfig;
        var experimentName;
        var baseUrl = "https://www.optimizelyapis.com/";
        var baseUrlLocal = "https://www.optimizelyapis.com/";

        //Using brackets api to get teh project root
        // @Todo:Find out what happens if theres no project
        var projectRoot = ProjectManager.getProjectRoot()._path;

        //This is actually the exact location of the optimizely config file
        var configPath = projectRoot + "optimizely.js";


        //This is not loading anything it provides a handle with the  path
        var configFile = FileSystem.getFileForPath(configPath);


        // returns a promise with the path as param
        //of wich we will define the done and fail method
        readConfig = FileUtils.readAsText(configFile);

        // and completes asynchronously
        // this makes sense !
        readConfig.done(function (text) {
            // console.log("The contents of the file are:\n" + text);
            jsonObject = JSON.parse(text)
            token = jsonObject.token;
            projectId = jsonObject.project_id;

            //Start importing the projects after config has been loaded
            getProject(projectId);
        })
            .fail(function (errorCode) {
                console.log("Error: " + errorCode); // one of the FileSystemError constants
                if (errorCode == "NotFound") {
                    window.alert("No configfile found for optimizely - create 'optimizely.js' in your project root");
                }
            });

        //console.log(ProjectManager.addClassesProvider().fullPath());
        //Read All Projects for your account
        //project_id is not geting used at all - would read single entry  with
        //id given at the end of path
        function getProject(project_id) {
            $.ajax({
                url: baseUrlLocal + "experiment/v1/projects/",
                type: "GET",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('token', token);
                },
                // @Todo: find out wether this is save to do
                //Maybe theres a better way than "success" something
                //like done or loaded.
                success: function (data) {
                    console.log(data);
                    data.forEach(function (item, index) {
                        console.log(item.project_name);

                        console.log(item.id);
                        //
                        getExperiments(item.id, item.project_name);

                    });
                }
            });
        }

        // @todo: trouble starts here, already - just find out whats going here
        // AND how to safely initialize the renderung, in the frist place
        // Read A Projects Experiments
        function getExperiments(project_id, project_name) {
            $.ajax({
                url: "https://www.optimizelyapis.com/experiment/v1/projects/" + project_id + "/experiments/",
                type: "GET",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('token', token);
                },
                success: function (data) {
                    console.log(data);
                    data.forEach(function (item, index) {

                        experimentName = item.description;

                        item.variation_ids.forEach(function (variation) {
                            console.log(variation);
                            getVariant(variation, project_name, experimentName);
                        })
                        //getVariant(item.variation_ids[1],  project_name);
                    });
                }
            });
        }

        // Read A  Experiments Variation
        function getVariant(variation_id, project_name, experimentName) {
            $.ajax({
                url: "https://www.optimizelyapis.com/experiment/v1/variations/" + variation_id,
                type: "GET",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('token', token);
                },
                success: function (data) {
                    //Just for giggles - actually we have to build up our treeObject and
                    //then inject the generated html relfection of it.
                    $("#optimizelyPanel ul").append("<li id='var_"+variation_id+"'><span class='variation'>"+project_name+"</span></li>")

                    var variation = data.description;
                    var projectDirectory = FileSystem.getDirectoryForPath(projectRoot + "imported/" + project_name);
                    var experimentDirectory = FileSystem.getDirectoryForPath(projectRoot + "imported/" + project_name + "/" + experimentName);
                    var experimentCssDirectory = FileSystem.getDirectoryForPath(projectRoot + "imported/" + project_name + "/" + experimentName + "/css");
                    var experimentJavaScriptDirectory = FileSystem.getDirectoryForPath(projectRoot + "imported/" + project_name + "/" + experimentName + "/js");

                    var variantCode = FileSystem.getFileForPath(projectRoot + "imported/" + project_name + "/" + experimentName + "/" + variation + ".js");

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
    var MY_COMMAND_ID = "helloworld.sayhello"; // package-style naming to avoid collisions
    CommandManager.register("My Extension", MY_COMMAND_ID, handleHelloWorld);

    // Then create a menu item bound to the command
    // The label of the menu item is the name we gave the command (see above)
    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
    menu.addMenuItem(MY_COMMAND_ID);

    // We could also add a key binding at the same time:
    //menu.addMenuItem(MY_COMMAND_ID, "Ctrl-Alt-H");
    // (Note: "Ctrl" is automatically mapped to "Cmd" on Mac)
});

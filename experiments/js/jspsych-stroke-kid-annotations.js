jsPsych.plugins['jspsych-stroke-kid-annotations'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'jspsych-stroke-annotations',
    parameters: {
      rois: {
        type: jsPsych.plugins.parameterType.OBJECT,
        pretty_name: 'ROI metadata for this machine',
        default: undefined,
        description: 'annotated machine with regions of interest'
      },
      strokes: {
        type: jsPsych.plugins.parameterType.OBJECT,
        pretty_name: 'sequence of strokes for this sketch',
        default: undefined,
        description: 'SVG representation of sketch to be annotated'
      }
    } //close parameters
  } // close plugin.info

  plugin.trial = function(display_element, trial) {
    
    // data for single trial already loaded
    // see this line in index.html:
    // <script type="text/javascript" src="data/cat_example.json"></script>

    // extract trial level metadata
    trial.category = _.uniq(_.map(trial.strokes, 'category'))[0];
    trial.age = _.uniq(_.map(trial.strokes, 'age'))[0];
    trial.roi_ids = trial.rois.map(el => el.label_name);
    trial.roi_colors = trial.rois.map(el => el.color);
    trial.num_rois = trial.roi_ids.length;
    trial.filename = _.uniq(_.map(trial.strokes, 'filename'))[0]
    trial.sessionID = _.uniq(_.map(trial.strokes, 'session_id'))[0]
    // trial.stroke_count = _.uniq(_.map(trial.strokes, 'stroke_count'))[0]
    trial.batch_id_across_everything = _.uniq(_.map(trial.strokes, 'batch_id_across_everything'))[0]
    trial.gameType = _.uniq(_.map(trial.strokes, 'gameType'))[0]
    // trial.svg = _.uniq(_.map(trial.strokes, 'svg'))[0]

    // extract trial data
    trial.svgArray = _.map(trial.strokes, 'svg');

    // console.log(trial.svg);

    /////////////////////////////////////
    // build html for stimuli display
    var html = '';

    // add container for text and columns
    html += '<div id="container">'

    // add row 1 for instructions
    html += '<div class="row">'
    html += '<div id="segmentInstructions" class="instructions">'
    html += '<p>Please label the part of the ' + '<category_name>' + (trial.category) + '</category_name>' + ' that the highlighted stroke represents.</p>'
    html += '</div>'

    html += '<div id="symbolInstructions" class="instructions">'
    html += '<p>Please label the part(s) of the drawing that the ' + '<category_name>' + (trial.category) + '</category_name>' + ' corresponds to.</p>'
    html += '</div>'

    // add trial counter
    html += '<div id="trialNum"> ' + (trial.trialNum + 1) + " / " + trial.numTrials + '</div>';

    html += '</div>' // close row

    // add row 2 for for columns
    html += '<div class="row">'

    // add column 1 for buttonGallery: segmentation buttons
    // see map function after all html is inserted for how we add the ROI buttons
    html += '<div class="col">'
    html += '<div id="buttonGallery">'
    html += '<strong>Labels</strong>'

    html += '<div id="special_labels">'
    html += '<p>Special labels</p>'
    html += '</div>'

    // add an "other" button
    html += '<div id="other">'
    html += '<p><button-text>Other</button-text></p>'
    html += '</div>'

    // add an "symbols" button
    html += '<div id="symbols" class="buttons_sym">'
    html += '<p><button-text>Multiple parts</button-text></p>'
    html += '</div>'

    // add an "i dunno" button
    html += '<div id="unintelligible" class="buttons">'
    html += "<p><button-text>I can't tell</button-text></p>"
    html += '</div>' // close last button div

    html += '<div id="whiteOut">'
    html += '</div>' // close whiteOut

    html += '</div>' // close buttonGallery

        //// add duplicate gallery for clicking on elements that relate to a symbol
    // add column 1 for symWhiteOut: symbol buttons
    // html += '<div class="col">'
    html += '<div id="symWhiteOut">'
    html += '<strong>Labels</strong>'
    html += '<button id="done" type="button" class="jspsych-btn">Done</button>'
    html += '</div>' // close buttonGallery
    html += '</div>' // close col for buttonGallery

    // add column 2 for sketch canvas
    html += '<div class="col">'
    // add canvas to display sketch
    html += '<canvas id="myCanvas" resize="false"></canvas>'
    html += '</div>' // close col for canvas

    html += '</div>' // close row of galleries and canvas

    html += '<div class="row">'
    html += '<div id="error">'
    html += '<p>Please label the part(s) that the stroke refers to!</p>'
    html += '</div>'
    html += '</div>'
    
    html += '</div>' // close entire row of columns

    // make row below canvas + button galleries
    html += '<div class="row">' 

    html+= '<div id="textarea">'
    html+= '<form id="myForm">'
    html+= 'Please write your own label:'
    html+= '<input type="text" id="custom_label" name="custom_label">'
    html+= '<input id="submit" type="button" value="submit">'
    html+= '<span id="show"></span>'
    html+= '</form>'
    html+= '</div>' // close textarea

    html += '<div id="error_2">'
    html += '<p>Please write your own label!</p>'
    html += '</div>' // close error_2
    html += '</div>' // close row
    html += '</div>' //close 'container' of text and columns

    /////////////////////////////////////
    // now assign html to display_element.innerHTML and show content container
    display_element.innerHTML = html;

    // record trial start timestamp
    showSketchTimestamp = Date.now();

    // show entire experiment display (including ref image, button menu, and sketch canvas)
    $("#container").fadeIn(500);

    /////////////////////////////////////
    // set up paper canvas
    var myCanvas = new paper.PaperScope();
    myCanvas.setup('myCanvas');

    // convert svg string to paper.js path objects
    var self = this;
    var pathArray = _.map(trial.svgArray, s => new Path(s.toString())); // note that this works because we reset the index
    var scale = 1;
    // var s = 1
    var s = 0.5

    // note to self: this variable seems to scale down strokes but not their thickness 
    // whereas `paper.view.scale` appears to scale down everything including stroke thickness
    var l = myCanvas.project.activeLayer;

    paper.view.viewSize.width = 50;
    paper.view.viewSize.height = 50;
    l.scale(s/scale, [0, 0]);
    // paper.view.scale(s/scale, [0, 0]);
    scale = s;

    // set properties for each stroke
    _.forEach(pathArray, function(path, i) {
      path.strokeColor = 'rgb(0,0,0)';
      path.strokeWidth = 5;
      path.strokeNum = i;
      currIndex = 0;
    })

    // update myCanvas with transformed drawings
    myCanvas.setup('myCanvas');

    trial.strokeIndex = pathArray[currIndex].index;

    console.log('trial', trial);
    
    /////////////////////////////////////
    var turkInfo = jsPsych.turk.turkInfo();       

    //set global variables for timing
    var strokeShownTimestamp;

    // copy all trial info into new variable
    // make sure that all needed data has been extracted from trial! 
    var reducedtrial = {...trial};

    // remove redundant `strokes` and `svgArray` to reduce size 
    // (otherwise, we get "PayloadTooLargeError: request entity too large")
    delete reducedtrial.strokes;
    delete reducedtrial.svgArray;

    // define data object to send to mongo  
    strokeData = _.extend({}, reducedtrial, {
      dbname: trial.dbname,
      colname: trial.colname,
      iterationName: trial.iterationName,
      sketchID: trial.filename,
      eventType: 'labels',
      wID: turkInfo.workerId, 
      hitID: turkInfo.hitId, 
      aID: turkInfo.assignmentId, 
      orig_sessionID: trial.sessionID, 
      gameType: trial.gameType, 
      timeSketchPresented: showSketchTimestamp
    });

    // if 'catch' is already set to true because it is a catchTrial, then keep 'catch' as true
    if (strokeData.catch == true) {
      strokeData
    } 
    // otherwise, if not a catchTrial, set 'catch' to false
    else {
      strokeData = _.extend({}, strokeData, {
        catch: false,
      });
    };

    // console.log('check', strokeData.catch);

      // add as many buttons as there are ROIs
      let $buttonGallery = $("#buttonGallery");
      let myList = trial.roi_ids;
      let myColors = trial.roi_colors;

      // make as many buttons as there are roi's
      myList.map(function(roi, index) {       
        // upon cursor hover over, change color to specific roi color 
          let $button = $("<div></div>")
            .addClass("buttons")
            .attr("id", "button_" + roi)
            .html("<p><button-text>" + roi + "</button-text></p>")
            .on("mouseenter", function() {
              $(this).css("background", myColors[index]);
            })
            .on("mouseleave", function() {
              if (!$(this).hasClass('selected')) {
                $(this).css("background", "transparent");
              }
            })
            .on("click", function() {
              $(this).css("background", myColors[index]);
              $(this).toggleClass('selected');
              
              // print selected button to console
              elementSubmittedTimestamp = Date.now();

              // add selected button to stokeData
              strokeData = _.extend({}, strokeData, {
                strokeIndex: pathArray[currIndex].index,
                arcLength: pathArray[currIndex].length,
                svg: pathArray[currIndex].pathData,
                roi_labelName: roi, 
                roi_buttonType: 'original_labeloption',  
                timeStrokeSubmitted: elementSubmittedTimestamp,
                timeResponseLatency: elementSubmittedTimestamp - strokeShownTimestamp
              });
            // send data to server
            console.log('currentData',strokeData);
            socket.emit('currentData',strokeData);
            })
          $("#special_labels").before($button); 
        });

    // same for symbol button menu
    let $symWhiteOut = $("#symWhiteOut");
        
    // make as many symbol buttons
    let clicked = [];

    myList.map(function(roi, index) { 
      // upon cursor hover over, change color to specific roi color 
        let $symButtons = $("<div></div>")
          .addClass("symButtons")
          .attr("symId", "symButton_" + roi)
          .html("<p><button-text>" + roi + "</button-text></p>")
          .on("mouseenter", function() {
            $(this).css("background", myColors[index]);
          })
          .on("mouseleave", function() {
            if (!$(this).hasClass('symSelected')) {
              $(this).css("background", "transparent");
            }
          })
          .on("click", function() {
            $(this).css("background", myColors[index]);
            $(this).toggleClass('symSelected');

          // push clicked variables to array
          // note that this array contains only the selected buttons
          // i.e., the user can unselect buttons and this will also upadte the array
          clicked = [];
          let syms = document.querySelectorAll('.symSelected');
          console.log('syms',syms);
          for (let n = 0; n < syms.length; n++) {
            if (!clicked.includes(syms[n].textContent)) {
              clicked.push(syms[n].textContent);
            }
          };
        console.log('clicked',clicked);
        symbolSubmittedTimestamp = Date.now();

          // add array to strokeData
          strokeData = _.extend({}, strokeData, {
            strokeIndex: pathArray[currIndex].index,
            svg: pathArray[currIndex].pathData,
            arcLength: pathArray[currIndex].length,
            roi_labelName: clicked,
            roi_labelNum: 'NA',  
            roi_buttonType: 'multiple_parts',
            timeStrokeSubmitted: symbolSubmittedTimestamp,
            timeResponseLatency: symbolSubmittedTimestamp - strokeShownTimestamp
          });

          // note to self: we emit data when the user clicks the done button
          // that way only the final selected array is submitted (not every click)
          });

          $("#done").before($symButtons); 
      });

    // upon clicking a 'symbol' label, allow user to select multiple buttons until click 'done'
    $("#symbols").click(function(){
      $("#symbols").toggleClass("selected");
      nextSymLabel();
    });

    $("#unintelligible").click(function(){
      $(this).toggleClass("selected");
      unintelligibleSubmittedTimestamp = Date.now();

      strokeData = _.extend({}, strokeData, {
        strokeIndex: pathArray[currIndex].index,
        arcLength: pathArray[currIndex].length,
        svg: pathArray[currIndex].pathData,
        roi_labelName: 'unintelligible',  
        roi_labelNum: 'NA', 
        roi_buttonType: 'unintelligible',  
        timeStrokeSubmitted: unintelligibleSubmittedTimestamp,
        timeResponseLatency: unintelligibleSubmittedTimestamp - strokeShownTimestamp
      });
      // send data to server
      console.log('currentData',strokeData);
      socket.emit('currentData',strokeData);
    });

    $("#other").click(function(){
      // $(this).toggleClass("selected");
      $("#textarea").fadeIn(100);
      $("#whiteOut").fadeIn(100);
      unintelligibleSubmittedTimestamp = Date.now();

      $("#submit").on("click", submitOther);
    }); // close 'other' label function


    function submitOther(){
      var customLabel = document.getElementById("custom_label").value;
      
      if (customLabel.length == 0) {
        $("#error_2").fadeIn(100);
      } else if (customLabel.length > 0) {
        strokeData = _.extend({}, strokeData, {
          strokeIndex: pathArray[currIndex].index,
          arcLength: pathArray[currIndex].length,
          svg: pathArray[currIndex].pathData,
          roi_labelName: customLabel,  
          roi_buttonType: 'custom_label',  
          timeStrokeSubmitted: unintelligibleSubmittedTimestamp,
          timeResponseLatency: unintelligibleSubmittedTimestamp - strokeShownTimestamp
        }); // close strokeData

        // clear css of everything else
        $("#textarea").fadeOut(100);
        $("#whiteOut").fadeOut(100);
        $("#error_2").fadeOut(100);

        // send data to server
        console.log('currentData',strokeData);
        socket.emit('currentData',strokeData);

        // move onto nextStroke
        nextStroke()

        // clear form after submitting custom label
        $('#myForm')[0].reset();
        // reset so that error_2 doesn't keep showing up
        $('#error_2').reset();

      } // close else statement
    }; // close submitOther function
  
    // check length of first stroke  
    console.log('check first svg stroke', pathArray[currIndex].length);

    // if first stroke is less than 5px, then skip
    // note to self (7/21/20): we decided to drop this to 0px and will expect people will select "I can't tell"
    var limit = 0;
    strokeShownTimestamp = Date.now();

    if (pathArray[0].length <= limit) {
      strokeData = _.extend({}, strokeData, {
        strokeIndex: pathArray[currIndex].index,
      });
      console.log('skipping first stroke');
      strokeData = _.extend({}, strokeData, {
        strokeIndex: pathArray[currIndex].index,
        arcLength: pathArray[currIndex].length,
        svg: pathArray[currIndex].pathData,
        roi_labelName: 'short', 
        roi_buttonType: 'short',
        timeGreenStrokePresented: showSketchTimestamp, 
        timeResponseLatency: 0
      });
      // send data to server
      console.log('currentData',strokeData);
      socket.emit('currentData',strokeData);
      nextStroke()
    } 
    // otherwise set first stroke to green
    else if (pathArray[0].length > limit){
      // pathArray[0].strokeColor = 'rgb(0,0,0)';
      pathArray[0].strokeColor = 'rgb(0,250,0)';
      strokeData = _.extend({}, strokeData, {
        timeGreenStrokePresented: showSketchTimestamp,
      });
    }

    function nextSymLabel() {
      $("#symWhiteOut").fadeIn(500);
      $("#buttonGallery").fadeOut(10);
      $("#symbolInstructions").show();
      $("#segmentInstructions").hide();
      $("#done").show();

      $("#done").on("click", doneSym);
    }; // end nextSymLabel

    function doneSym() {
      // check that user has labeled what the symbol refers to
      if (clicked.length > 0) {
        $('#error').hide();
        $("#symWhiteOut").fadeOut(500);
        $("#buttonGallery").fadeIn(500);
        $("#symbolInstructions").hide();
        $("#segmentInstructions").show();
        $("#done").hide();

        // send data to server
        // only send final selection of clicked array (so that user can unclick buttons
        // if they change their mind as they annotate symbols)
        console.log('currentData',strokeData);
        socket.emit('currentData',strokeData);

        // reset clicked list
        clicked = [];

        $(".symButtons").css("background", "transparent");
        $("#done").off("click");

        // when done labelling element that symbol corresponds to, move onto next stroke
        nextStroke();

      } else {
        $('#error').show();
      } // close else statement
    } // close doneSym function

    // upon clicking a label, highlight next stroke in green
    $(".buttons").on("click", nextStroke);
    $(".buttons").removeClass("selected");
    $("#symbols").removeClass("selected");
    $(".symButtons").removeClass("symSelected");
    $(".symUnintelligible").removeClass("clicked");

    function nextStroke() {
      strokeShownTimestamp = Date.now();
 
      strokeData = _.extend({}, strokeData, {
        timeGreenStrokePresented: strokeShownTimestamp,
      });

      var currentPath = pathArray[currIndex];
      console.log('check current svg stroke', pathArray[currIndex].length);

      if (currIndex == (pathArray.length - 1)) {
        endTrial();
      } else {
        //set previous stroke to black
        currentPath.strokeWidth = 5;
        currentPath.strokeColor = "rgb(0, 0, 0)";
        currIndex++;
        trial.trialNum++;

        // if it is the 2nd stroke and not out of the bound, set current stroke to green
        if (pathArray[currIndex].length > limit && currIndex != 0 && currIndex < pathArray.length) {
          pathArray[currIndex].strokeColor = "rgb(0, 250, 0)";

        } else if (pathArray[currIndex].length <= limit && currIndex != 0 && currIndex < pathArray.length) {
          console.log('too short, skipping!');
            strokeData = _.extend({}, strokeData, {
              strokeIndex: pathArray[currIndex].index,
              svg: pathArray[currIndex].pathData,
              arcLength: pathArray[currIndex].length,
              roi_labelName: 'short', 
              roi_labelNum: 'NA',
              roi_symLabelID: 'short'
            });
            // currIndex++;
            // trial.trialNum++;
            // send data to server
            console.log('currentData',strokeData);
            socket.emit('currentData',strokeData);
            nextStroke();
          } //close else if statement
        } // close previous else statements

      $(".buttons").removeClass("selected");
      $("#symbols").removeClass("selected");
      $(".symButtons").removeClass("symSelected");
  }; // close nextStroke function

    function endTrial() {
      display_element.innerHTML = "<p>Fetching another sketch for you!";
      jsPsych.finishTrial(); // move on to the next trial
    };
  }; // close plugin.trial function

  return plugin;
})(); // close jsPsych.plugins function

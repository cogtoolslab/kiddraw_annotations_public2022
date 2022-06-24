jsPsych.plugins['jspsych-videodemo'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'jspsych-videodemo',
    parameters: {
      stim_url: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'stim_url',
        default: undefined,
        array: true,
        description: 'The URL for the video cue.'
      }
    } //close parameters
  } // close plugin.info

  plugin.trial = function(display_element, trial) {

    var html = '';

    // add video demonstration instructions
    html += '<div class="row">'
    html += '<div id="videoInstructions">'
    html += '<p>Here is a video demonstration of the machine that the sketchers drew.</p>'
    html += '</div>'
    html += '</div>' // close row

    // add video demonstration
    html += '<div id="videoContainer">'
    html += '<video id="videoCue" autoplay><source src=" ' + trial.stim_url + '" type="video/mp4"></video>'
    html += '</div>'

    html += '<div id="buttonWrapper">'
    html += '<button id="nextButton" type="button" class="jspsych-btn">Next</button>'
    html += '</div>'

    // now assign html to display_element.innerHTML
    display_element.innerHTML = html;

    // check for when video demonstration has ended
    jsPsych.pluginAPI.setTimeout(function() {
      document.getElementById("videoCue").addEventListener('ended', nextButton, false);
    });

    function nextButton() {
      $("#nextButton").show();
      $("#nextButton").click(endTrial);
    };

    function endTrial() {
      // end video demonstration
      jsPsych.finishTrial();
    };

  }; // close plugin.trial

  return plugin;

})();
var expType,
    curTrial = 0,
    correctCount = 0,
    totalTrial = 160,
    totalExercise = 5,
    beginTime,
    endTime,
    timeID,
    trialStage = 'Start',
    instructIdx = 1,
    isExercise,
    totemIdx = -1,
    
    dataCSV = 'Totem 1,Totem 1 Index,Mark Side,React Time 1,React Answer 1,Totem 2,React Time 2,React Answer 2\n',
    data = {},

    SDButtonsText,
    picPath = 'https://ankiitgupta7.github.io/Web-Experiments/FedEx%20Task/',
    wait = [500, 250, 700, 100, 950, 500, 1750, 1000],
    totemNum = 60,
// Big arrow   -L: 10 -R: 10
// Small arrow -L: 10 -R: 10
// Neutraul        20
    totems = ['pic6.png', 'pic7.png', 'pic8.png', 'pic9.png', 'pic10.png', 'pic11.png', 'pic12.png', 'pic18.png', 'pic19.png', 'pic20.png',
              'pic1.png', 'pic2.png', 'pic3.png', 'pic4.png', 'pic5.png', 'pic13.png', 'pic14.png', 'pic15.png', 'pic16.png', 'pic17.png',
              'pic1R.png', 'pic2R.png', 'pic3R.png', 'pic4R.png', 'pic5R.png', 'pic13R.png', 'pic14R.png', 'pic15R.png', 'pic16R.png', 'pic17R.png',
              'pic6R.png', 'pic7R.png', 'pic8R.png', 'pic9R.png', 'pic10R.png', 'pic11R.png', 'pic12R.png', 'pic18R.png', 'pic19R.png', 'pic20R.png',
              'npic1.png', 'npic2.png', 'npic3.png', 'npic4.png', 'npic5.png', 'npic6.png', 'npic7.png', 'npic8.png', 'npic9.png', 'npic10.png',
              'npic1R.png', 'npic2R.png', 'npic3R.png', 'npic4R.png', 'npic5R.png', 'npic6R.png', 'npic7R.png', 'npic8R.png', 'npic9R.png', 'npic10R.png'],
    flag = {LS: 1, RS: 2, LD: 4, RD: 8},
    totemsFlag = [],
    totemQueue = [],
    images = [];

Array.prototype.resize = function(newSize, defaultValue) {
  while(newSize > this.length)
    this.push(defaultValue);
  this.length = newSize;
}

$(document).ready(function(){
  $(document).keypress(function(e){
    var x = e.which || e.keyCode;
    console.log('Key pressed: ' + x);
    if (x === 118 || x === 109) {
      if (trialStage === '' && isExercise)
        RunTrial();
    }
    switch(x) {
      case 13:
        // Prevent enter key submit form
        e.preventDefault();
        break;
      case 118:
        if (trialStage === 'Instruct' && instructIdx > 1) {
          $('#instructions').attr('src', picPath + 'Instruction/Slide' + (--instructIdx) + '.jpg');
          if (instructIdx === 1) {
            $('#startExp').html('Press <kbd class="button">M</kbd> for next slide.');
          } else if (instructIdx === 31) {
            $('#startExp').html('Press <kbd class="button">V</kbd> for previous slide, and <kbd class="button">M</kbd> for next.');
          }
        } else if (trialStage === 'LR')
          AnswerLR('L');
        else if (trialStage === 'SD')
          AnswerSD($('#button1').text());
          break;
      case 109:
        if (trialStage === 'Instruct') {
          if (instructIdx === 32) {
            trialStage = '';
            Exercise();
          } else {
            $('#instructions').attr('src', picPath + 'Instruction/Slide' + (++instructIdx) + '.jpg');
            if (instructIdx === 32) {
              $('#startExp').html('Press <kbd class="button">V</kbd> for previous slide, and <kbd class="button">M</kbd> to start practice trials.');
            } else if (instructIdx === 2) {
              $('#startExp').html('Press <kbd class="button">V</kbd> for previous slide, and <kbd class="button">M</kbd> for next.');
            }
          }
        } else if (trialStage === 'LR')
          AnswerLR('R');
        else if (trialStage === 'SD')
          AnswerSD($('#button2').text());
        break;
    }
  });

  $('#submitButton').click(function(){
    var saving = document.createElement('div');
    saving.innerHTML = "Saving . . .";
    saving.id = 'saving';
    document.getElementById('wait').appendChild(saving);
    $('#dataCSV').val(dataCSV);
    console.log(dataCSV);
    SendToServer(dataCSV);
    $('#saving').hide();
    return false;
  });
  
  $('#formContinue').click(function(){
    if ($('#warning').length !== 0)
      $('#warning').remove();
    var formWarning = '';
    if ($('#age').val() === '' || Number.isNaN(Number($('#age').val())) || Number.parseInt($('#age').val()) <= 0) {
      formWarning = '<p id="warning" style="color:red;">Please enter valid number of age.</p>';
    } else if (!$('input[name="gender"]').is(':checked') || !$('input[name="handedness"]').is(':checked')) {
      formWarning = '<p id="warning" style="color:red;">You must choose a option of ' +
        ($('input[name="gender"]').is(':checked')? 'handedness': 'gender') + '.</p>';
    }
    if (formWarning !== '')
      document.getElementById('formContinue').insertAdjacentHTML('beforebegin', formWarning);
    else {
      $('#instructions').attr('src', picPath + 'Instruction/Slide' + instructIdx + '.jpg');
      $('#questions').hide();
      $('#instructions').css('display', 'block');
      $('#startExp').show();
    }
  });
  
  StartExperiment();
});

/* Start the experiment (check for Turk) */
function StartExperiment () {
  if (IsOnTurk() && IsTurkPreview()) {
    alert("Please accept the HIT before continuing.");
    return false;
  }
  
  /* Loading totem images */
  var loading = document.createElement('div');
  loading.innerHTML = "Loading . . .";
  loading.id = 'loading';
  document.getElementById('wait').appendChild(loading);
  
  /* Pick totems for experiment */
  totemsFlag.resize(totemNum);
  totemsFlag.fill(0);
  // Big arrow
  for (var i = 0; i < 20; ++i)
    for (var j = 0; j < 4; ++j)
      totemQueue.push(i);
  // Small arrow
  var arr = [];
  for (var i = 0; i < 10; ++i) arr.push(i);
  shuffle(arr);
  for (var i = 0; i < 5; ++i) // left - pick 5 out of 10
    for (var j = 0; j < 4; ++j)
      totemQueue.push(20 + arr[i]);
  shuffle(arr);
  for (var i = 0; i < 5; ++i) // right - pick 5 out of 10
    for (var j = 0; j < 4; ++j)
      totemQueue.push(30 + arr[i]);
  // Neutral - pick 10 out of 20
  for (var i = 10; i < 20; ++i) arr.push(i);
  shuffle(arr);
  for (var i = 0; i < 10; ++i)
    for (var j = 0; j < 4; ++j)
      totemQueue.push(40 + arr[i]);
  shuffle(totemQueue);
  
  var type = Math.floor(Math.random() * 3);
  expType = Math.floor(Math.random() * 2) + type * 2;
  $('#experimentType').val(String.fromCharCode(type + 65));
  console.log('Experiment Type: ' + String.fromCharCode(type + 65));
  
  if (Math.random() < 0.5) SDButtonsText = ['Same', 'Different'];
  else                     SDButtonsText = ['Different', 'Same'];
  
  // preLoad picture for later use
  if (IsOnTurk())
    picPath = 'https://' + picPath;
  else
    picPath = 'http://' + picPath;
  totems.forEach(function(element){preload(picPath + element)});
  for (var i = 1; i <= 32; ++i)
    preload(picPath + 'Instruction/Slide' + i + '.jpg');
  $('#loading').hide();
  trialStage = 'Instruct';
}

function Exercise () {
  isExercise = true;
  ++curTrial;
  $('#instructions').hide();
  $('#startExp').hide();
  $('#targetBox').show();
  setTimeout(ShowTotemMark, wait[0]);
}

function RunTrial () {
  isExercise = false;
  $('#trialNum').text('Trial ' + (++curTrial) + ' of ' + totalTrial);
  $('#startExp').hide();
  $('#targetBox').show();
  setTimeout(ShowTotemMark, wait[0]);
}

function ShowTotemMark() {
  if (isExercise) {
    var tmpTotem = Math.floor(Math.random() * totemNum);
    while (tmpTotem == totemIdx)
      tmpTotem = Math.floor(Math.random() * totemNum);
    totemIdx = tmpTotem;
  } else
    totemIdx = totemQueue.pop();

  //console.log('Totem 1: ' + totemIdx);
  data.totem1 = totemIdx;
  
  $('#totem').attr('src', picPath + totems[totemIdx]);
  $('#targetBox').hide();
  $('#totem').css('display', 'block');
  
  setTimeout(function(){
    $('#totem').hide(0);
    if (expType / 2 === 0) {
      $('#targetBox').show();
      setTimeout(ShowExclm, wait[2]);
    } else if (expType / 2 === 1)
      setTimeout(ShowExclm, wait[2]);
    else
      ShowExclm();
  }, wait[1]);
}

function ShowExclm() {
  var r = Math.random();
  var ifR = (totemsFlag[totemIdx] & flag.RS) && (totemsFlag[totemIdx] & flag.RD),
      ifL = (totemsFlag[totemIdx] & flag.LS) && (totemsFlag[totemIdx] & flag.LD)
  if ((r < 0.5 && !ifL) || ifR) {
    $('#exclamationMark').css('left', '-200px');
    data.markSide = 'L';
  } else {
    $('#exclamationMark').css('left', '200px');
    data.markSide = 'R';
  }
  $('#targetBox').show();
  $('#exclamationMark').show();
  
  var ifD = ((data.markSide === 'L') && (totemsFlag[totemIdx] & flag.LD))
        || ((data.markSide === 'R') && (totemsFlag[totemIdx] & flag.RD)),
      ifS = ((data.markSide === 'L') && (totemsFlag[totemIdx] & flag.LS))
        || ((data.markSide === 'R') && (totemsFlag[totemIdx] & flag.RS));
  r = Math.random();
  if ((r < 0.5 && !ifS) || ifD) {
    //console.log('Totem 2: ' + totemIdx);
    data.totem2 = totemIdx;
    if (!isExercise)
      totemsFlag[totemIdx] |= (data.markSide === 'L')? flag.LS: flag.RS;
  } else {
    var tmpTotem = Math.floor(Math.random() * (totemNum - 1));
    tmpTotem += (tmpTotem > totemIdx)? 1: 0;
    //console.log('Totem 2: ' + tmpTotem);
    data.totem2 = tmpTotem;
    $('#totem').attr('src', picPath + totems[tmpTotem]);
    if (!isExercise)
      totemsFlag[totemIdx] |= (data.markSide === 'L')? flag.LD: flag.RD;
  }
  
  setTimeout(function(){
    $('#button1').text('Left');
    $('#button2').text('Right');
    trialStage = 'LR';
    $('#exclamationMark').hide();
    beginTime = new Date();
    //if (!isExercise || curTrial > 2) timeID = setTimeout(function(){ AnswerLR(''); }, wait[4]);
  }, wait[3]);
}

function AnswerLR (ans) {
  if (ans === '') clearTimeout(timeID);
  trialStage = '';
  var duration = new Date() - beginTime;
  data.reactTime1 = duration.toString();
  data.reactAns1 = ans;
  $('#targetBox').hide();
  $('#buttons').hide();
  setTimeout(function(){
    if (expType % 2 == 0) {
      $('#button1').text(SDButtonsText[0]);
      $('#button2').text(SDButtonsText[1]);
    } else {
      $('#button2').text(SDButtonsText[0]);
      $('#button1').text(SDButtonsText[1]);
    }
    trialStage = 'SD';
    $('#totem').css('display', 'block');
    $('#buttons').show();
    beginTime = new Date();
    //if (!isExercise || curTrial > 2) timeID = setTimeout(function(){ AnswerSD(''); }, wait[6]);
  }, wait[5]);
}

function AnswerSD (ans) {
  if (ans === '') clearTimeout(timeID);
  trialStage = '';
  var duration = new Date() - beginTime;
  data.reactTime2 = duration.toString();
  data.reactAns2 = ans;
  $('#buttons').hide();
  $('#totem').hide();
  //console.log('curTrial = ' + curTrial);
  if (isExercise) {
    if (curTrial < totalExercise) setTimeout(Exercise, wait[7]);
    else {
      $('#startExp').html('Press <kbd class="button">V</kbd> or <kbd class="button">M</kbd> to start trial.').show();
      curTrial = 0;
    }
  } else {
    dataCSV += totems[data.totem1] + ','
            + data.totem1 + ','
            + data.markSide + ','
            + data.reactTime1 + ','
            + data.reactAns1 + ','
            + totems[data.totem2] + ','
            + data.reactTime2 + ','
            + data.reactAns2 + '\n';
    if ((data.totem1 === data.totem2 && data.reactAns2 === 'Same') ||
      (data.totem1 !== data.totem2 && data.reactAns2 === 'Different'))
      ++correctCount;
    if (curTrial < totalTrial) {
      setTimeout(RunTrial, wait[7]);
    } else {
      console.log('Correct rate: ' + (correctCount / totalTrial * 100) + ' %');
      $('#correctRate').val(correctCount / totalTrial * 100);
      $('#done').show();
    }
  }
}

function preload () {
  for (var i = 0; i < arguments.length; ++i) {
    images.push(new Image())
    images[images.length-1].src = preload.arguments[i];
  }
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function SendToServer(curData) {
  var id = (IsOnTurk())? GetAssignmentId() : prompt("Doesn't look like you " + 
  "are on Turk, so you're probably testing. Enter an ID to save your data with:", "id");
  $('#assignmentId').val(id);
  document.forms[0].submit();
}

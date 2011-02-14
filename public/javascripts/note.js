var db;
var res;
var i, j;
var slideWidth, slideHeight, cylonOffset;
var slide_array = [];
var paper;
$(function() {
  for(i = 0; i < 4; i++) {
    $(".slides").append('<div id="slide_'+i+'" class="slide zoomed_in_slide">'+
                     '<div id="raphael_'+i+'" class="raphael"> </div>'+
                     '<textarea id="code_for_raphael_'+i+'" class="code">Text for the textarea - why do you go away?</textarea>'+
                     '<div id="run_container"> <button class="run" type="button">Run</button> </div>'+
                 '</div>');
    var n = Slide()
    slide_array.push(n);
    n.create();
    console.log(n);
  }
  setCurrent();

  $(".future").live("click", function() { next(); });
  $(".past").live("click", function() { prev(); });

  $(".run").live("click", function() {
    var id = ($($(this).parentsUntil(".slides")[1]).find(".raphael").attr("id"));
    set_canvas(paper, id);
    localStorage.setItem('code_for_'+id, $("#code_for_"+id).val());
    //$("#code_for_"+id).val(localStorage.getItem("code_for_"+id));
  });
  $("textarea").live("keyup", function(event) {
    event.stopPropagation();
  });

  $(document).keydown( function(e) {
    if( $(e.srcElement).hasClass("edit_area") || $(e.srcElement).hasClass("code")) { 
    } else {
      handleKeys(e); 
    }
  }, false);

});

function handleKeys(e) {
 switch (e.keyCode) {
   case 37: // left arrow
     prev(); break;
   case 39: // right arrow
     next(); break;
   case 80: // P 
     presentationMode(); break;
   case 69: // E
     editingMode(); break;
   case 51: // 3
     //this.switch3D(); break;
   case 83: //S
     reorder_slides(); break;
  }
}

function presentationMode() {
    clear_borders();
    $("#cue_box").hide();
    $(".presentation").removeClass("editing_mode");
}
function editingMode() {
    $(".presentation").addClass("editing_mode");
    $("#cue_box").show();
}
function prev() {
  var current = $(".current")
  if (current.prev().attr("id")!= "progressContainer") {
      var str = "-="+cylonOffset
    $("#progressEye").animate({left: str}, 600, "easeOutCubic");//, function() {moveFake("neg")});
    current.prev().removeClass("reduced past").addClass("current")
    current.next().removeClass("future").addClass("far-future")
    current.addClass("reduced future").removeClass("current")
    current.prev().prev().addClass("past").removeClass("far-past")
  } else if( $(".presentation").hasClass("editing_mode")) {
    
  }
}

function next() {
  var current = $(".current")
  if( current.next().length != 0)  {
      var str = "+="+cylonOffset
    $("#progressEye").animate({left: str}, 600, "easeOutCubic");//, function() {moveFake("pos")});
    current.next().removeClass("future reduced").addClass("current")
    current.prev().removeClass("past").addClass("far-past")
    current.next().next().addClass("future reduced").removeClass("far-future")
    current.addClass("reduced past").removeClass("current") 
    //make_raphael_canvas($(".current"));
  } else if ( $(".presentation").hasClass("editing_mode")) {
    // Create Slide and give it two notes
    current.prev().removeClass("past").addClass("far-past")
    current.addClass("reduced past").removeClass("current") 
    var next = $(".slide").size();
    $(".slides").append(
        '<div id="slide_'+next+'" class="slide zoomed_in_slide current">'+
          '<div id="raphael_'+next+'" class="raphael"> </div>'+
          '<textarea id="code_for_raphael_'+next+'" class="code">Text for the textarea - why do you go away?</textarea>'+
          '<div id="run_container"> <button class="run" type="button">Run</button> </div>'+
        '</div>');
    };
}

function setCurrent() {
  $($(".slide")[0]).addClass("current")
  $($(".slide")[1]).addClass("reduced future")
  for( i = 2; i < $(".slide").length; i++) {
    $($(".slide")[i]).addClass("reduced far-future")
  }
  //make_raphael_canvas($(".current"));
}

function get_order_array() {
  var id_array = [];
  for(i = 0; i < $(".slide").length; i++) {
    id_array.push(parseInt($($(".slide")[i]).attr("id").split("_")[1]));
  }
  localStorage.setItem('slide_order', JSON.stringify({order: id_array}));
}

/*function canvas_generator() {
  for(i = 0; i < $(".slide").size(); i++) {
    make_raphael_canvas($( $(".slide")[i]) );
  }
}*/

function make_raphael_canvas(slide) {
    var id = slide.find(".raphael").attr("id");
    var paper = Raphael(id, 900, 500);
    get_code(id);
    set_canvas(paper, id);
}

function get_code(id) {
  if( localStorage.getItem('code_for_'+id)) {
    return localStorage.getItem("code_for_"+id);
  } else {
    return ('demo1 = I.paper.circle(320, 240, 60).animate({fill: "#223fa3", stroke: "#000", "stroke-width": 80, "stroke-opacity": 0.5}, 2000);\n'+
                    'demo1.node.onclick = function () {\n'+
                    '    demo1.attr("fill", "red");\n'+
                    '};\n\n'+
                    'var st = I.paper.set(); \n'+
                    'var st = I.paper.set(); \n'+
                    'st.push( \n'+
                    '  I.paper.rect(800, 300, 50, 50, 10), \n'+
                    '  I.paper.circle(670, 100, 60) \n'+
                    ');\n\n'+
                    'st.animate({fill: "red", stroke: "#000", "stroke-width": 30, "stroke-opacity": 0.5}, 1000);');
  }
}

function basic_move() {
  startCircle = function () {
    // storing original coordinates
    this.ox = this.attr("cx");
    this.oy = this.attr("cy");
  },
  moveCircle = function (dx, dy) {
    // move will be called with dx and dy
    this.attr({cx: this.ox + dx, cy: this.oy + dy, opacity: .5});
  },
  up = function () {
    // restoring state
    this.attr({opacity: 1});
  };
  startRect = function() {
    this.ox = this.attr("x");
    this.oy = this.attr("y");
  }
  moveRect = function(dx, dy) {
    this.attr({x: this.ox + dx, y: this.oy + dy, opacity: .5});
  }
}

function Slide(I) {
    I = I || {}

    I.id = slide_array.length;
    I.raphael_id = "raphael_"+I.id;
    I.html_ = '<div id="slide_'+i+'" class="slide zoomed_in_slide">'+
                     '<div id="raphael_'+i+'" class="raphael"> </div>'+
                     '<textarea id="code_for_raphael_'+i+'" class="code">Text for the textarea - why do you go away?</textarea>'+
                     '<div id="run_container"> <button class="run" type="button">Run</button> </div>'+
                 '</div>';
    I.code = get_code(I.raphael_id);
    I.paper = Raphael(I.raphael_id, 900, 500);
    I.paper.circle(820*Math.random(), 500*Math.random(), 60).animate({fill: "#223fa3", stroke: "#000", "stroke-width": 80, "stroke-opacity": 0.5}, 2000);

    I.set_code = function() {
      $("code_for"+I.raphael_id).val(I.code);
    }
    
    I.set_canvas = function() {
      I.paper.clear();
      try {
        (new Function("paper", "window", "document", $("#code_for_"+I.raphael_id).val() ) ).call(I.paper, I.paper);
      } catch (e) {
        alert(e.message || e);
      }
    }
    I.create = function() {
      I.set_code();
      I.set_canvas();
    }
    return I;
}


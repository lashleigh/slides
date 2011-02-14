var db;
var res;
var i, j;
var uiLeft, uiTop, uiWidth, uiHeight;
var slideWidth, slideHeight, cylonOffset;
var slide_array = [];
$(function() {
  for(i = 0; i < 4; i++) {
    $(".slides").append('<div id="slide_'+i+'" class="slide zoomed_in_slide">'+
                     '<div id="raphael_'+i+'" class="raphael"> </div>'+
                     '<textarea id="code_for_raphael_'+i+'" class="code"></textarea>'+
                     '<div id="run_container"> <button class="run" type="button">Run</button> </div>'+
                 '</div>');
    var n = Slide()
    slide_array.push(n);
    n.create();
  }
  setCurrent();

  $(".editable").live("dblclick", function(event) {
    $(this).find(".preview").hide();
    $(this).find(".edit_area").show().focus();
    console.log(this);
    event.stopPropagation();
  });
  $(".editable").live("focusout", function(event) {
    var some_note = this;
    var edit_area_content = $(some_note).find(".edit_area").val();
    $(some_note).find(".preview").html(linen($(some_note).find(".edit_area").val()));
    $(some_note).find(".preview").show();
    $(some_note).find(".edit_area").hide();
    prettify();
  });
  $(".editable").live("mouseenter", function() {
    grey_border(this);
    //prettify();
  });
  $(".editable").live("mouseleave", function() {
    clear_borders()
  });

  $(".editable").livequery( function() {
    $(this).draggable({ 
      snap: ".note",
      snapMode: "outer",
      containment: $(this).parent(),
      refreshPositions: true,
      opacity: 0.6,
      drag: function(event, ui) {
        show_borders_this_red(this);
        var thisWidth = parseInt($(this).css("width"));
        var thisHeight = parseInt($(this).css("height"));
        uiLeft = ui.position.left;
        uiTop = ui.position.top;
        if( ui.position.left+thisWidth >= slideWidth) {
          uiLeft = slideWidth - thisWidth;
        }
        if( uiTop + thisHeight >= slideHeight ) {
          uiTop = slideHeight - thisHeight;
        }
        $(this).css("left", uiLeft+"px");
        $(this).css("top", uiTop+"px");
      },
      stop: function(event, ui) {
        $(this).css("left", uiLeft+"px");
        $(this).css("top", uiTop+"px");
        clear_borders();
        grey_border(this);
      }
    });
  });

 $(".editable").livequery( function() {
    $(this).resizable({
      //grid: [460, 290], there is no snap tolerance it just makes the resizing space discrete
      handles: 'ne, nw, se, sw, n, e, s, w',
      containment: $(this).parent(),
      resize: function(event, ui) {
        show_borders_this_red(this);
        uiWidth = ui.size.width;
        uiLeft = ui.position.left;
        uiHeight = ui.size.height;
        uiTop = ui.position.top;
        
        if( ui.position.left < 0) { 
          uiWidth = ui.size.width+ui.position.left;
          uiLeft = 0;
        } 
        if( (ui.position.left + ui.size.width) > slideWidth ) { 
          uiWidth = slideWidth - ui.position.left;
        }
        if( ui.position.top < 0) {
          uiHeight = ui.size.height+ui.position.top;
          uiTop = 0;
        } 
        if( ui.position.top + ui.size.height > slideHeight ) {
          uiHeight = slideHeight - ui.position.top;
        }

        $(this).find('.preview').css("width",(uiWidth)+"px");
        $(this).find('.edit_area').css("width",(uiWidth)+"px");
        $(this).find('.preview').css("height",(uiHeight)+"px");
        $(this).find('.edit_area').css("height",(uiHeight)+"px");
      },
      stop: function(event, ui) {
        clear_borders();
        grey_border(this);
      }
    });
  });

  $(".future").live("click", function() { next(); });
  $(".past").live("click", function() { prev(); });

  $(".run").live("click", function() {
    var id = ($($(this).parentsUntil(".slides")[1]).find(".raphael").attr("id"));
    var n = slide_array[parseInt(id.split("_")[1])]
    n.set_canvas();
    localStorage.setItem('code_for_'+id, $("#code_for_"+id).val());
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
    current.prev().removeClass("reduced past").addClass("current")
    current.next().removeClass("future").addClass("far-future")
    current.addClass("reduced future").removeClass("current")
    current.prev().prev().addClass("past").removeClass("far-past")
  } else if( $(".presentation").hasClass("editing_mode")) {
    
  }
}

function next() {
  var current = $(".current")
  if( current.next().size() == 1)  {
    current.next().removeClass("future reduced").addClass("current")
    current.prev().removeClass("past").addClass("far-past")
    current.next().next().addClass("future reduced").removeClass("far-future")
    current.addClass("reduced past").removeClass("current") 
    //make_raphael_canvas($(".current"));
  } else if ( $(".presentation").hasClass("editing_mode") ) {
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
    var n = Slide();
    slide_array.push(n);
    n.create();
  };
}

function setCurrent() {
  $($(".slide")[0]).addClass("current")
  $($(".slide")[1]).addClass("reduced future")
  for( i = 2; i < $(".slide").length; i++) {
    $($(".slide")[i]).addClass("reduced far-future")
  }
}

function get_code(id) {
  if( localStorage.getItem('code_for_'+id)) {
    return localStorage.getItem("code_for_"+id);
  } else {
    return ('demo1 = paper.circle(320, 240, 60).animate({fill: "#223fa3", stroke: "#000", "stroke-width": 80, "stroke-opacity": 0.5}, 2000);\n'+
                    'demo1.node.onclick = function () {\n'+
                    '    demo1.attr("fill", "red");\n'+
                    '};\n\n'+
                    'var st = paper.set(); \n'+
                    'st.push( \n'+
                    '  paper.rect(800, 300, 50, 50, 10), \n'+
                    '  paper.circle(670, 100, 60) \n'+
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
    I.paper = Raphael(I.raphael_id, 900, 500);
    var paper = I.paper;
    
    $("#"+I.raphael_id).dblclick( function(event) {
      if( $(event.target).hasClass("note") ){
      } else if( $(event.target).parent().attr("id") == I.raphael_id) {
        n = Note();
        n.create(event, I.raphael_id);
        I.notes.push(n);
      }
    });

    I.set_code = function() {
      I.code = get_code(I.raphael_id);
      $("#code_for_"+I.raphael_id).val(I.code);
    }
    
    I.set_canvas = function() {
      paper.clear();
      try {
        (new Function("paper", "window", "document", $("#code_for_"+I.raphael_id).val() ) ).call(paper, paper);
      } catch (e) {
        alert(e.message || e);
      }
    }
    I.create = function() {
      I.set_code();
      I.set_canvas();
    }
    I.notes = [];
    return I;
}

function Note(I) {
  I = I || {}

  I.active = true;
  I.top;// = 0; //event.offsetX;
  I.left;// = 0; //event.offsetY;
  I.width = 200;
  I.height = 100;

  I.content;// = "h1. Example content";
  I.create = function(event, raphael_id) {
     n.top = event.offsetY;
     n.left = event.offsetX;
     n.content = "h1. Placeholder";
     $("#"+raphael_id).append('<div class="note editable" style="'+I.get_style()+'"><div class="preview">'+linen(I.content)+'</div><textarea class="edit_area">'+I.content+'</textarea></div>');
  }
  I.construct = function() {
  }
  I.get_style = function() {
    var style = "position:absolute;width:"+I.width+"px;height:"+I.height+'px;top:'+I.top+'px;left:'+I.left+'px;';
    return style;

  }

  return I;
}

function show_borders_this_red(note) {
  $(".note").css("border-color", "rgba(25, 25, 25, 0.5)");
  $(note).css("border-color", "rgba(255, 25, 25, 0.8)");
}
function clear_borders() {
  $(".note").css("border-color", "rgba(25, 25, 25, 0.0)");
  $(".info").hide();
}
function grey_border(note) {
  $(note).css("border-color", "rgba(55, 25, 25, 0.8)");
}
function prettify() {
  $("pre").addClass("prettyprint");
  prettyPrint();
}

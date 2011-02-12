var db;
var i;
var j;
var uiWidth;
var uiHeight;
var uiTop;
var uiLeft;
var slideWidth; 
var slideHeight;
var cylonOffset;
$(function() {

  db = openDatabase('documents', '1.0', 'Local document storage', 5*1024*1024);
  db.transaction( function (t) {
    t.executeSql('CREATE TABLE IF NOT EXISTS notes '+
                 '(id integer primary key, content, '+
                  'width DEFAULT 200, height DEFAULT 100, '+
                  'top DEFAULT 20, left DEFAULT 20, '+
                  'visible DEFAULT 1, '+
                  'classes DEFAULT "note", slide_id)');
    t.executeSql('CREATE TABLE IF NOT EXISTS slides (id integer primary key, scripts, classes DEFAULT "slide")');

    t.executeSql('SELECT id FROM slides', [], function (tx, group_results) {
      for (i = 0; i < group_results.rows.length; i++) {
        current_slide = group_results.rows.item(i);
        $(".slides").append(
        '<div id="slide_'+current_slide.id+'" class="slide">'+
          '<div class="slide_inner creation_enabled"> </div>'+
        '</div>');
        t.executeSql('SELECT * FROM notes WHERE visible=1 AND slide_id=?', [current_slide.id], function(t, results) { 
          var len = results.rows.length;
          for (j = 0; j < len; j++) {
            create_note(results.rows.item(j));
          }
        clear_borders();
        });
      }
    setCurrent();
    slideWidth = $(".slide_inner").width();
    slideHeight = parseInt($(".slide_inner").css("height"));
    cylonOffset = $("#progressContainer").width() / ($(".slide").length-1);
    });
  });

  $(".note").livequery( function() {
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
        db.transaction( function(t) {
          t.executeSql('UPDATE notes SET top=?, left=? WHERE id=?', [uiTop, uiLeft, parseInt(event.target.id.split("_")[1])]);
        });
        var current = $(this)
        clear_borders();
        grey_border(this);
      }
    });
  });

  $(".note").livequery( function() {
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
        db.transaction( function(t) {
          t.executeSql('UPDATE notes SET width=?, height=?, top=?, left=? WHERE id=?', [uiWidth, uiHeight, uiTop, uiLeft, parseInt(event.target.id.split("_")[1])]);
        });
        prettify();
      }
    });
  });

  $(".future").live("click", function() { next(); });
  $(".past").live("click", function() { prev(); });
  $(".editable").live("mouseenter", function() {
    $(this).find(".info").show();
    grey_border(this);
    //prettify();
  });
  $(".editable").live("mouseleave", function() {
    $(".info").hide();
    clear_borders()
  });
  $(".info").live("click", function() {
    var id = parseInt($(this).attr("id").split("_")[1]);
    db.transaction( function(t) {
      t.executeSql('UPDATE notes SET visible=0 WHERE id=?', [id]);
    });
    $("#note_"+id).hide();
  });

  $(".creation_enabled").live("dblclick", function newNote(event) {
    var id = parseInt($(this).parent().attr("id").split("_")[1]);
    db.transaction( function(t) {
      t.executeSql('INSERT INTO notes (content, top, left, slide_id) VALUES (?, ?, ?, ?)', ["New box", event.layerY, event.layerX, id]);
      t.executeSql('SELECT * FROM notes', [], function(t, results) {
        var last = results.rows.length;
        create_note(results.rows.item(last-1));    
      });
    });
  });

  $(".editable").live("dblclick", function(event) {
    $(this).find(".preview").hide();
    $(this).find(".edit_area").show().focus();
    event.stopPropagation();
  });

  $(".editable").live("focusout", function(event) {
    updateDB($(this));
  });

  $(document).keydown( function(e) {
    if( $(e.srcElement).hasClass("edit_area")) { 
      handleEdit(e);
    } else {
      handleKeys(e); 
    }
  }, false);

});
function updateDB(some_note) {
  var edit_area_content = $(some_note).find(".edit_area").val();
  db.transaction( function(t) {
    t.executeSql('UPDATE notes SET content=? WHERE id=?', [edit_area_content, parseInt($(some_note).attr("id").split("_")[1])]);
  });
  $(some_note).find(".preview").html(linen($(some_note).find(".edit_area").val()));
  $(some_note).find(".preview").show();
  $(some_note).find(".edit_area").hide();
  prettify();
}

function handleEdit(e) {
  switch (e.keyCode) {
    case 27:
      updateDB($(e.srcElement).parent()); break
      //updateDB(); break
  }
}
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
  }
}
function presentationMode() {
    clear_borders();
    $(".presentation").removeClass("editing_mode");
    $(".note").draggable("disable");
    $(".note").resizable("disable");    
    $(".note").removeClass("editable");
    $(".slide_inner").removeClass("creation_enabled");
}
function editingMode() {
    $(".presentation").addClass("editing_mode");
    $(".note").draggable("enable");
    $(".note").resizable("enable");    
    $(".note").addClass("editable");
    $(".slide_inner").addClass("creation_enabled");
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
  } else if ( $(".presentation").hasClass("editing_mode")) {
    // Create Slide and give it two notes
    current.prev().removeClass("past").addClass("far-past")
    current.next().next().addClass("future reduced").removeClass("far-future")
    current.addClass("reduced past").removeClass("current") 
    db.transaction( function(t) {
      t.executeSql('INSERT INTO slides (classes) VALUES ("slide")');
      t.executeSql('SELECT * FROM slides', [], function(t, results) {
        var last = results.rows.length - 1;
        var new_slide = results.rows.item(last);
        console.log(new_slide);
        $(".slides").append(
        '<div id="slide_'+new_slide.id+'" class="slide current">'+
          '<div class="slide_inner creation_enabled"> </div>'+
        '</div>');
        t.executeSql('INSERT INTO notes (content, top, left, width, height, slide_id) VALUES (?, ?, ?, ?, ?, ?)', ["h1. Header here", 0, 0, slideWidth, 100, new_slide.id]);
        t.executeSql('INSERT INTO notes (content, top, left, width, height, slide_id) VALUES (?, ?, ?, ?, ?, ?)', ["Content and @code@ here", 200, 0, slideWidth, slideHeight - 200, new_slide.id]);
        t.executeSql('SELECT * FROM notes', [], function(t, results) {
          var last = results.rows.length;
          create_note(results.rows.item(last-1));    
          create_note(results.rows.item(last-2));    
        });
      });
    });
  }

}
function create_note(item) {
  $("#slide_"+item.slide_id).find(".slide_inner").append(
          '<div id=note_'+item.id+' class='+get_classes(item)+' style='+style_string(item)+'>'+
            '<div  class="preview">'+linen(item.content)+'</div>'+
            '<textarea id="edit_'+item.id+'"class="edit_area">'+item.content+'</textarea>'+ 
            '<a id="info_'+item.id+'" class="info" href="#" style="display: none; "><img alt="Info" src="public/images/info.png"></a>'+
          '</div>');
  $('#note_'+item.id).find(".edit_area").css("width", item.width);
  $('#note_'+item.id).find(".edit_area").css("height", item.height);
  $(".edit_area").css("display", "none");
  prettify();
}
// note is not here explicitly because it is a default value.
// It might be better to remove the default and place it explicity.
// or find a way to always have that column contain at least the 
// word note.
function get_classes(item) {
  return "'note editable'";
}
function style_string(item) {
  return '"width:'+item.width+'px;height:'+item.height+'px;top:'+item.top+'px;left:'+item.left+'px;"'
}
function prettify() {
  $("pre").addClass("prettyprint");
  prettyPrint();
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
function setCurrent() {
  $($(".slide")[0]).addClass("current")
  $($(".slide")[1]).addClass("reduced future")
  for( i = 2; i < $(".slides").children().length; i++) {
    $($(".slide")[i]).addClass("reduced far-future")
  }
}

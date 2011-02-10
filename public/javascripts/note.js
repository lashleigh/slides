var some;
var someui;
var db;
var res;
var i;
var j;
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

    t.executeSql('SELECT slide_id FROM notes GROUP BY slide_id order by slide_id ASC', [], function (tx, group_results) {
      for (i = 0; i < group_results.rows.length; i++) {
        current_slide = group_results.rows.item(i);
        $(".slides").append(
        '<div id="slide_'+current_slide.slide_id+'" class="slide">'+
          '<div id="mask_'+current_slide.slide_id+'" class="creation_mask"></div>'+
          '<div class="slide_inner"> </div>'+
        '</div>');
        t.executeSql('SELECT * FROM notes WHERE visible=1 AND slide_id=?', [current_slide.slide_id], function(t, results) { 
          var len = results.rows.length;
          for (j = 0; j < len; j++) {
            create_note(results.rows.item(j));
          }
        clear_borders();
        });
      }
    setCurrent();
    });
  });

  $(".slide").livequery( function() {
    $(this).droppable({
      accept: ".note",
      tolerance: 'fit',
      drop: function(event, ui) {
      some = event;
      someui = ui;
        console.log(some);
        console.log(someui);
      }
    });
  });

  $(".draggable").livequery( function() {
    $(this).draggable({ 
      snap: ".draggable, .slide_inner",
      opacity: 0.6,
      stack: ".note",
      drag: function(event, ui) {
        show_borders_this_red(this);
      },
      stop: function(event, ui) {
        db.transaction( function(t) {
          t.executeSql('UPDATE notes SET top=?, left=? WHERE id=?', [ui.position.top, ui.position.left, parseInt(event.target.id.split("_")[1])]);
        });
        var current = $(this)
        clear_borders();
        grey_border(this);
      }
    });
  });
  $(".resizable").livequery( function() {
    $(this).resizable({
      //grid: [460, 290], there is no snap tolerance it just makes the resizing space discrete
      resize: function(event, ui) {
        $(this).find('.preview').css("width",(ui.size.width)+"px");
        $(this).find('.preview').css("height",(ui.size.height)+"px");
        $(this).find('.edit_area').css("width",(ui.size.width)+"px");
        $(this).find('.edit_area').css("height",(ui.size.height)+"px");
        show_borders_this_red(this);
      },
      stop: function(event, ui) {
        clear_borders();
        grey_border(this);
        db.transaction( function(t) {
          t.executeSql('UPDATE notes SET width=?, height=? WHERE id=?', [ui.size.width, ui.size.height, parseInt(event.target.id.split("_")[1])]);
        });
        prettify();
      }
    });
  });

  $(".note").live("mouseenter", function() {
    $(this).find(".info").show();
    grey_border(this);
    //prettify();
  });
  $(".note").live("mouseleave", function() {
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

  $(".creation_mask").live("dblclick", function(event) {
    db.transaction( function(t) {
      t.executeSql('INSERT INTO notes (content, top, left, slide_id) VALUES (?, ?, ?, ?)', ["New box", event.layerY, event.layerX, parseInt(event.target.id.split("_")[1])]);
      t.executeSql('SELECT * FROM notes', [], function(t, results) {
        var last = results.rows.length;
        create_note(results.rows.item(last-1));    
      });
    });
  });

  $(".note").live("dblclick", function() {
    $(this).find(".preview").hide();
    $(this).find(".edit_area").show().focus();
  });

  $(".note").live("focusout", function(event) {
    var textarea = $(this).find(".edit_area").val();
    db.transaction( function(t) {
      t.executeSql('UPDATE notes SET content=? WHERE id=?', [textarea, parseInt(event.target.parentElement.id.split("_")[1])]);
    });
    $(this).find(".preview").html(parse_textile($(this).find(".edit_area").val()));
    $(this).find(".preview").show();
    $(this).find(".edit_area").hide();
    prettify();
  });

  $(document).keydown( function(e) { handleKeys(e); }, false);

});
function handleKeys(e) {
   switch (e.keyCode) {
    case 37: // left arrow
        setCurrent(); break;
    case 39: // right arrow
      next(); break;
    case 32: // space
      //this.next(); break;
    case 50: // 2
      //this.showNotes(); break;
    case 51: // 3
      //this.switch3D(); break;
  }
}
function next() {
  $($(".slides").children()[0]).removeClass("current")
  $($(".slides").children()[0]).addClass("past reduced")
  $($(".slides").children()[1]).removeClass("future reduced")
  $($(".slides").children()[1]).addClass("current")
}
function create_note(item) {
  $("#slide_"+item.slide_id).find(".slide_inner").append(
          '<div id=note_'+item.id+' class='+get_classes(item)+' style='+style_string(item)+'>'+
            '<div class="preview">'+parse_textile(item.content)+'</div>'+
            '<textarea class="edit_area">'+item.content+'</textarea>'+ 
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
  return '"resizable draggable '+item.classes+'"';
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
}
function grey_border(note) {
  $(note).css("border-color", "rgba(55, 25, 25, 0.8)");
}
function setCurrent() {
  $($(".slides").children()[0]).addClass("current")
  $($(".slides").children()[0]).removeClass("future past reduced")
  $($(".slides").children()[1]).addClass("future reduced")
}

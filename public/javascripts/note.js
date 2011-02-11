var db;
var i;
var j;
var uiWidth;
var uiHeight;
var uiTop;
var uiLeft;
var slideWidth; 
var slideHeight;
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
    slideWidth = parseInt($(".slide_inner").css("width"));
    slideHeight = parseInt($(".slide_inner").css("height"));
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
        if( ui.position.left < 0) {console.log(ui.position.left);}
        if( ui.position.left+thisWidth >= slideWidth) {
          uiLeft = slideWidth - thisWidth;
        }
        if( uiTop + thisHeight >= slideHeight ) {
          uiTop = slideHeight - thisHeight;
          console.log(uiTop);
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

  $(".slide_inner").live("dblclick", function(event) {
    var id = parseInt($(this).parent().attr("id").split("_")[1]);
    db.transaction( function(t) {
      t.executeSql('INSERT INTO notes (content, top, left, slide_id) VALUES (?, ?, ?, ?)', ["New box", event.layerY, event.layerX, id]);
      t.executeSql('SELECT * FROM notes', [], function(t, results) {
        var last = results.rows.length;
        create_note(results.rows.item(last-1));    
      });
    });
  });

  $(".note").live("dblclick", function(event) {
    $(this).find(".preview").hide();
    $(this).find(".edit_area").show().focus();
    event.stopPropagation();
  });

  $(".note").live("focusout", function(event) {
    var edit_area_content = $(this).find(".edit_area").val();
    db.transaction( function(t) {
      t.executeSql('UPDATE notes SET content=? WHERE id=?', [edit_area_content, parseInt(event.target.parentElement.id.split("_")[1])]);
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
      prev(); break;
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
function prev() {
  var current = $(".current")
  if (current.prev().length != 0) {
    current.prev().removeClass("reduced past").addClass("current")
    current.next().removeClass("future").addClass("far-future")
    current.addClass("reduced future").removeClass("current")
    current.prev().prev().addClass("past").removeClass("far-past")
  }
}
function next() {
  var current = $(".current")
  if( current.next().length != 0)  {
    current.next().removeClass("future reduced").addClass("current")
    current.prev().removeClass("past").addClass("far-past")
    current.next().next().addClass("future reduced").removeClass("far-future")
    current.addClass("reduced past").removeClass("current")
  }
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
  return item.classes;
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
  $($(".slide")[0]).addClass("current")
  $($(".slide")[1]).addClass("reduced future")
  for( i = 2; i < $(".slides").children().length; i++) {
    $($(".slide")[i]).addClass("reduced far-future")
  }
}

var db;
var res;
$(function() {
  db = openDatabase('documents', '1.0', 'Local document storage', 5*1024*1024);
  db.transaction( function (t) {
    t.executeSql('CREATE TABLE IF NOT EXISTS notes (id integer primary key, content, width, height, top, left, classes)', [], function(t, results) {
    });

    t.executeSql('SELECT * FROM notes', [], function (t, results) {
      var len = results.rows.length, i;
      res = results;
      console.log(res);
      for (i = 0; i < len; i++) {
        create_note(results.rows.item(i));
      }
    });
  });

  prettify();
  /*$('.edit_area').editable('', {
    type      : 'textarea',
    cancel    : 'Cancel',
    submit    : 'OK',
    tooltip   : 'Click to edit...',
    event     : "dblclick"
  });*/

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
          console.log(event.target.id);
          t.executeSql('UPDATE notes SET top=?, left=? WHERE id=?', [ui.position.top, ui.position.left, parseInt(event.target.id)]);
        });
        var current = $(this)
        clear_borders();
        grey_border(this);
      }
    });
  });
  $(".resizable").livequery( function() {
    $(this).resizable({
      resize: function(event, ui) {
        $(this).find('.preview').css("width",(ui.size.width)+"px");
        $(this).find('.preview').css("height",(ui.size.height)+"px");
        $(this).find('textarea').css("width",(ui.size.width-10)+"px");
        $(this).find('textarea').css("height",(ui.size.height-10)+"px");
        show_borders_this_red(this);
      },
      stop: function(event, ui) {
        clear_borders();
        grey_border(this);
        db.transaction( function(t) {
          console.log(event.target.id);
          t.executeSql('UPDATE notes SET width=?, height=? WHERE id=?', [ui.size.width, ui.size.height, parseInt(event.target.id)]);
        });
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

  $(".creation_mask").dblclick( function(event) {
    db.transaction( function(t) {
        console.log(event);
      t.executeSql('INSERT INTO notes (content, width, height, top, left) VALUES (?, ?, ?, ?, ?)', ["New box", 200, 100, event.layerY, event.layerX]);
      t.executeSql('SELECT * FROM notes', [], function(t, results) {
        var last = results.rows.length;
        create_note(results.rows.item(last-1));    
      });
    });
  });
  $(".creation_mask").click( function(event) {
    $(".preview").show();
    prettify();
    $("textarea").hide();
  });

  $(".preview").live("dblclick", function() {
    $(this).hide();
    $(this).next().show();
  });

});

function create_note(item) {
  $(".slide_inner").append('<div id='+item.id+' class='+get_classes(item)+' style='+style_string(item)+'><div class="preview">'+parse_textile(item.content)+'</div><textarea class="edit_area">'+item.content+'</textarea> <a id="info_2" class="info" href="#" style="display: none; "><img alt="Info" src="public/images/info.png"></a></div>');
  $("textarea").css("display", "none");
}
function get_classes(item) {
  return '"note '+item.classes+' resizable draggable"';
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

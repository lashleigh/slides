$(function() {
  var db = openDatabase('documents', '1.0', 'Local document storage', 5*1024*1024);
  db.transaction( function (t) {
    t.executeSql('CREATE TABLE IF NOT EXISTS notes (id unique, content, width, height, top, left, classes)');

    t.executeSql('SELECT * FROM notes', [], function (t, results) {
      var len = results.rows.length, i;
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
  });
  $(".creation_mask").click( function(event) {
    $(".preview").show();
    prettify();
    $("textarea").hide();
  });

  $(".preview").dblclick( function() {
    $(this).hide();
    $(this).next().show();
  });
  // use localStorage for persistent storage
  // use sessionStorage for per tab storage
  /*$("textarea").live('keyup', function () {
    window.localStorage.setItem('note', $(this).val());
    window.localStorage.setItem('timestamp', (new Date()).getTime());
  }, false);*/
});

function create_note(item) {
  $(".slide_inner").append('<div class='+get_classes(item)+' style='+style_string(item)+'><div class="preview">'+parse_textile(item.content)+'</div><textarea class="edit_area">'+item.content+'</textarea> <a id="info_2" class="info" href="#" style="display: none; "><img alt="Info" src="public/images/info.png"></a></div>');
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

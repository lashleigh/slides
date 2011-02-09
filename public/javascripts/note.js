$(function() {
  prettify();
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
        $.get("/position", {id: parseInt(current.attr("id").split("_")[1]), ttop: current.position().top, left: current.position().left })
        clear_borders();
        grey_border(this);
      }
    });
  });
  $(".resizable").livequery( function() {
    $(this).resizable({
      resize: function(event, ui) {
        $(this).find('.in_place_editor_field').css("width",(ui.size.width)+"px");
        $(this).find('.in_place_editor_field').css("height",(ui.size.height)+"px");
        $(this).find('.formatted_content').css("width",(ui.size.width-10)+"px");
        $(this).find('.formatted_content').css("height",(ui.size.height-10)+"px");
        show_borders_this_red(this);
      },
      stop: function(event, ui) {
        $.get("/dimension", {id: parseInt($(this).attr("id").split("_")[1]), width: $(this).width(), height: $(this).height() })
        clear_borders();
        grey_border(this);
      }
    });
  });

  $(".note").live("mouseenter", function() {
    $(this).find(".info").show();
    grey_border(this);
    prettify();
  });
  $(".note").live("mouseleave", function() {
    $(".info").hide();
    clear_borders()
  });
  $(".note").live("dblclick", function() {
    $(".edit_note").hide();
    $(".formatted_content").show();
    var outer_height = $(this).height() - 15-22;
    var outer_width = $(this).width() - 15;
    $(this).find(".edit_note").find("textarea").css("height", outer_height+"px");
    $(this).find(".edit_note").find("textarea").css("width", outer_width+"px");
    $(this).find(".edit_note").show();
    $(this).find(".formatted_content").hide();
  });
    
  $(".note").live("blur", function() {
    var self = this;
    $.get("/update", $(this).find(".edit_note").serialize(), function(result, txtstatus) {
      $(self).find('.formatted_content').html(result);
    });
    $('.edit_note').hide();
    $('.edit_note').next().show();
  });

  // This delete code is not going to work correctly
  /*$(".delete").live("click", function(event) {
    var self = $(this).attr("id").split("_")[1];
    $.get("/destroy", {id: self}, function(result, txtstatus) {
      $("#note_"+self).hide();   
    });
  });*/

  $(".creation_mask").dblclick( function(event) {
      console.log(event);
    $.get("notes/new", {
      top: event.clientY, 
      left: event.clientX,
      width: 200, 
      height: 200 }, function(result, txtstatus) {
      $("#content").append(result);
      });
  });
});
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
